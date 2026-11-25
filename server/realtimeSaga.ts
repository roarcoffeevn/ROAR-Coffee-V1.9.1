import type http from 'node:http';
import crypto from 'node:crypto';
import type express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import {
  type AuthedRequest,
  parseCookies,
  requireAdmin,
  requireAuth,
  SESSION_COOKIE_NAME,
  verifyPassword,
  verifySessionToken,
} from './auth.ts';
import { db } from './db.ts';
import {
  buildOtpAuthUri,
  generateBackupCodes,
  generateTotpSecret,
  hashBackupCode,
  verifyTotpCode,
} from './totp.ts';
import {
  SAGA_CHARACTER_SKINS,
  SAGA_WEEKLY_QUESTS,
} from '../src/lib/candySagaData.ts';

function getVietnamDateStr(offsetDays = 0): string {
  const vnTime = new Date(Date.now() + (7 * 3600 + offsetDays * 86400) * 1000);
  return vnTime.toISOString().slice(0, 10);
}

function getCurrentIsoWeekKey(): string {
  const now = new Date(Date.now() + 7 * 3600 * 1000);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function ensureSagaProfile(userId: number) {
  let row = db.prepare('SELECT * FROM saga_profiles WHERE user_id = ?').get(userId) as any;
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO saga_profiles (user_id) VALUES (?)').run(userId);
    row = db.prepare('SELECT * FROM saga_profiles WHERE user_id = ?').get(userId) as any;
  }
  const userRow = db
    .prepare('SELECT id, full_name, member_code, tier FROM users WHERE id = ?')
    .get(userId) as any;
  const guildRow = db
    .prepare(
      `SELECT g.id, g.name, g.tag, g.emblem_color, g.emblem_icon, gm.role as member_role
       FROM guild_members gm JOIN guilds g ON g.id = gm.guild_id
       WHERE gm.user_id = ?`
    )
    .get(userId) as any;

  let unlockedSkins: string[] = ['barista_lion'];
  let stats = { levelsCleared: 0, specialsTriggered: 0, pvpWins: 0, pvpPlayed: 0 };
  try {
    const parsedSkins = JSON.parse(row.unlocked_skins_json || '["barista_lion"]');
    if (Array.isArray(parsedSkins) && parsedSkins.length > 0) unlockedSkins = parsedSkins;
  } catch {
    // default
  }
  try {
    stats = { ...stats, ...JSON.parse(row.stats_json || '{}') };
  } catch {
    // default
  }

  return {
    userId: row.user_id,
    displayName: userRow?.full_name || 'ROAR Player',
    memberCode: userRow?.member_code || 'RC-MEM',
    tier: userRow?.tier || 'ROAR Member',
    avatarBadge: row.avatar_badge || 'lion',
    coins: Number(row.coins || 0),
    currentLevel: Number(row.current_level || 1),
    maxLevel: Number(row.max_level || 1),
    totalScore: Number(row.total_score || 0),
    seasonalScore: Number(row.seasonal_score || 0),
    seasonId: row.season_id || 'SEASON_2026_1',
    activeSkin: row.active_skin || 'barista_lion',
    unlockedSkins,
    boosters: {
      hammer: Number(row.booster_hammer || 0),
      switch8: Number(row.booster_switch8 || 0),
      colorbomb: Number(row.booster_colorbomb || 0),
      moves5: Number(row.booster_moves5 || 0),
    },
    lastDailyGiftDate: row.last_daily_gift_date || '',
    dailyGiftStreak: Number(row.daily_gift_streak || 0),
    stats,
    guild: guildRow || null,
  };
}

function incrementWeeklyQuest(userId: number, questId: string, delta = 1) {
  const def = SAGA_WEEKLY_QUESTS.find((q) => q.id === questId);
  if (!def) return;
  const weekKey = getCurrentIsoWeekKey();
  db.prepare(`
    INSERT INTO saga_weekly_quests (user_id, week_key, quest_id, progress, target, claimed)
    VALUES (?, ?, ?, ?, ?, 0)
    ON CONFLICT(user_id, week_key, quest_id)
    DO UPDATE SET progress = MIN(target, progress + ?), updated_at = datetime('now')
  `).run(userId, weekKey, questId, Math.min(def.target, delta), def.target, delta);
}

function getWeeklyQuestsForUser(userId: number) {
  const weekKey = getCurrentIsoWeekKey();
  const rows = db
    .prepare('SELECT quest_id, progress, claimed FROM saga_weekly_quests WHERE user_id = ? AND week_key = ?')
    .all(userId, weekKey) as Array<{ quest_id: string; progress: number; claimed: number }>;
  const map = new Map(rows.map((r) => [r.quest_id, r]));
  return SAGA_WEEKLY_QUESTS.map((q) => {
    const rec = map.get(q.id);
    return {
      ...q,
      weekKey,
      progress: Number(rec?.progress || 0),
      claimed: Boolean(rec?.claimed),
    };
  });
}

export function createUserBackupSnapshot(userId: number, triggerType: 'auto' | 'manual', summaryLabel: string) {
  const user = db
    .prepare('SELECT id, email, full_name, phone, tier, addresses_json, notification_prefs_json, privacy_prefs_json FROM users WHERE id = ?')
    .get(userId) as any;
  if (!user) return null;

  const gameProgress = db
    .prepare('SELECT game_key, current_level, max_level, best_score, stars_json, state_json FROM user_game_progress WHERE user_id = ?')
    .all(userId);
  const sagaProfile = db.prepare('SELECT * FROM saga_profiles WHERE user_id = ?').get(userId) || null;
  const cubeProfile = db.prepare('SELECT * FROM cubeaway_profiles WHERE user_id = ?').get(userId) || null;

  const snapshot = {
    version: 1,
    capturedAt: new Date().toISOString(),
    user: {
      fullName: user.full_name,
      phone: user.phone,
      addresses: JSON.parse(user.addresses_json || '[]'),
      notificationPrefs: JSON.parse(user.notification_prefs_json || '{}'),
      privacyPrefs: JSON.parse(user.privacy_prefs_json || '{}'),
    },
    gameProgress,
    sagaProfile,
    cubeProfile,
  };

  const res = db
    .prepare(
      'INSERT INTO user_data_backups (user_id, trigger_type, summary_label, snapshot_json) VALUES (?, ?, ?, ?)'
    )
    .run(userId, triggerType, summaryLabel, JSON.stringify(snapshot));

  // Keep latest 10 backups per user
  db.prepare(`
    DELETE FROM user_data_backups
    WHERE user_id = ? AND id NOT IN (
      SELECT id FROM user_data_backups WHERE user_id = ? ORDER BY id DESC LIMIT 10
    )
  `).run(userId, userId);

  return Number(res.lastInsertRowid);
}

// ---------- REAL-TIME WEBSOCKET HUB STATE ----------
interface SocketMeta {
  userId: number;
  displayName: string;
  avatarBadge: string;
  guildId: number | null;
  guildTag: string;
  role: string;
}

interface PvpRoomState {
  roomCode: string;
  player1Id: number;
  player1Name: string;
  player1Badge: string;
  player2Id: number | null;
  player2Name: string;
  player2Badge: string;
  player1Score: number;
  player2Score: number;
  stakeCoins: number;
  status: 'waiting' | 'active' | 'finished';
  endsAtMs: number;
  seed: number;
  timerHandle?: ReturnType<typeof setTimeout>;
}

const clientsByUser = new Map<number, Set<WebSocket>>();
const socketMetaMap = new WeakMap<WebSocket, SocketMeta>();
const pvpRooms = new Map<string, PvpRoomState>();
let waitingMatchRoomCode: string | null = null;

function sendWs(ws: WebSocket, payload: Record<string, any>) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function sendToUser(userId: number, payload: Record<string, any>) {
  const sockets = clientsByUser.get(userId);
  if (!sockets) return;
  for (const ws of sockets) {
    sendWs(ws, payload);
  }
}

function broadcastAll(payload: Record<string, any>) {
  const msg = JSON.stringify(payload);
  for (const sockets of clientsByUser.values()) {
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(msg);
      }
    }
  }
}

function broadcastChannel(channel: string, payload: Record<string, any>) {
  const msg = JSON.stringify(payload);
  if (channel === 'global') {
    for (const sockets of clientsByUser.values()) {
      for (const ws of sockets) {
        if (ws.readyState === WebSocket.OPEN) ws.send(msg);
      }
    }
    return;
  }
  if (channel.startsWith('guild:')) {
    const guildId = Number(channel.slice(6));
    for (const sockets of clientsByUser.values()) {
      for (const ws of sockets) {
        const meta = socketMetaMap.get(ws);
        if (meta && meta.guildId === guildId && ws.readyState === WebSocket.OPEN) {
          ws.send(msg);
        }
      }
    }
  }
}

function serializePvpRoom(room: PvpRoomState) {
  return {
    roomCode: room.roomCode,
    player1Id: room.player1Id,
    player1Name: room.player1Name,
    player1Badge: room.player1Badge,
    player2Id: room.player2Id,
    player2Name: room.player2Name,
    player2Badge: room.player2Badge,
    player1Score: room.player1Score,
    player2Score: room.player2Score,
    stakeCoins: room.stakeCoins,
    status: room.status,
    endsAtMs: room.endsAtMs,
    seed: room.seed,
  };
}

function finalizePvpRoom(roomCode: string) {
  const room = pvpRooms.get(roomCode);
  if (!room || room.status === 'finished') return;
  room.status = 'finished';
  if (room.timerHandle) {
    clearTimeout(room.timerHandle);
    room.timerHandle = undefined;
  }
  if (waitingMatchRoomCode === roomCode) {
    waitingMatchRoomCode = null;
  }

  let winnerId: number | null = null;
  if (room.player2Id) {
    if (room.player1Score > room.player2Score) winnerId = room.player1Id;
    else if (room.player2Score > room.player1Score) winnerId = room.player2Id;
  }

  try {
    db.transaction(() => {
      db.prepare(
        `UPDATE pvp_matches
         SET player1_score = ?, player2_score = ?, winner_id = ?, status = 'finished', finished_at = datetime('now')
         WHERE room_code = ?`
      ).run(room.player1Score, room.player2Score, winnerId, room.roomCode);

      if (winnerId && room.player2Id) {
        db.prepare('UPDATE saga_profiles SET coins = coins + ?, seasonal_score = seasonal_score + 180 WHERE user_id = ?').run(
          room.stakeCoins * 2,
          winnerId
        );
      } else if (room.player2Id) {
        // Tie refund
        db.prepare('UPDATE saga_profiles SET coins = coins + ?, seasonal_score = seasonal_score + 80 WHERE user_id IN (?, ?)').run(
          room.stakeCoins,
          room.player1Id,
          room.player2Id
        );
      } else {
        // Opponent never joined -> refund stake
        db.prepare('UPDATE saga_profiles SET coins = coins + ? WHERE user_id = ?').run(room.stakeCoins, room.player1Id);
      }

      if (room.player2Id) {
        incrementWeeklyQuest(room.player1Id, 'play_pvp', 1);
        incrementWeeklyQuest(room.player2Id, 'play_pvp', 1);
      }
    })();
  } catch {
    // ignore DB errors on shutdown
  }

  const endPayload = {
    type: 'pvp:finished',
    room: serializePvpRoom(room),
    winnerId,
  };
  sendToUser(room.player1Id, endPayload);
  if (room.player2Id) sendToUser(room.player2Id, endPayload);
}

export function attachRealtimeWebSocketServer(httpServer: http.Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const cookies = parseCookies(req.headers.cookie);
    const reqUrl = new URL(req.url || '/ws', 'http://localhost');
    const queryToken = reqUrl.searchParams.get('token') || undefined;
    const token = cookies[SESSION_COOKIE_NAME] || queryToken;
    const auth = verifySessionToken(token);

    if (!auth) {
      sendWs(ws, { type: 'ws:error', error: 'Authentication required' });
      ws.close(1008, 'Unauthorized');
      return;
    }

    const userRow = db.prepare('SELECT id, full_name, role FROM users WHERE id = ?').get(auth.userId) as any;
    if (!userRow) {
      ws.close(1008, 'User not found');
      return;
    }

    const profile = ensureSagaProfile(auth.userId);
    const meta: SocketMeta = {
      userId: auth.userId,
      displayName: userRow.full_name || 'ROAR Member',
      avatarBadge: profile.avatarBadge || 'lion',
      guildId: profile.guild?.id ? Number(profile.guild.id) : null,
      guildTag: profile.guild?.tag || '',
      role: userRow.role || 'customer',
    };
    socketMetaMap.set(ws, meta);

    let set = clientsByUser.get(auth.userId);
    if (!set) {
      set = new Set();
      clientsByUser.set(auth.userId, set);
    }
    set.add(ws);

    sendWs(ws, {
      type: 'ws:connected',
      userId: meta.userId,
      onlineCount: clientsByUser.size,
    });

    ws.on('message', (rawBuf) => {
      let msg: any;
      try {
        msg = JSON.parse(rawBuf.toString('utf8'));
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== 'string') return;

      // Refresh guild meta when needed
      const currentMeta = socketMetaMap.get(ws) || meta;

      if (msg.type === 'chat:send') {
        const channel = String(msg.channel || 'global');
        const text = String(msg.message || '').trim().slice(0, 320);
        if (!text) return;
        if (channel !== 'global' && !channel.startsWith('guild:')) return;
        if (channel.startsWith('guild:')) {
          const gRow = db.prepare('SELECT guild_id FROM guild_members WHERE user_id = ?').get(currentMeta.userId) as any;
          if (!gRow || `guild:${gRow.guild_id}` !== channel) {
            sendWs(ws, { type: 'ws:error', error: 'Bạn chưa gia nhập Bang hội này.' });
            return;
          }
          currentMeta.guildId = Number(gRow.guild_id);
        }

        const freshProfile = ensureSagaProfile(currentMeta.userId);
        const saved = db
          .prepare(
            `INSERT INTO realtime_chat_messages (channel, user_id, display_name, avatar_badge, guild_tag, message)
             VALUES (?, ?, ?, ?, ?, ?)`
          )
          .run(
            channel,
            currentMeta.userId,
            freshProfile.displayName,
            freshProfile.avatarBadge,
            freshProfile.guild?.tag || '',
            text
          );
        incrementWeeklyQuest(currentMeta.userId, 'guild_chat', 1);

        const record = db
          .prepare('SELECT * FROM realtime_chat_messages WHERE id = ?')
          .get(Number(saved.lastInsertRowid));
        broadcastChannel(channel, { type: 'chat:message', channel, item: record });
      } else if (msg.type === 'pvp:queue') {
        const stake = 25;
        const p = ensureSagaProfile(currentMeta.userId);
        if (p.coins < stake) {
          sendWs(ws, { type: 'pvp:error', error: `Cần ít nhất ${stake} Xu để đấu PvP.` });
          return;
        }

        // Clean stale waiting room if same user or expired
        if (waitingMatchRoomCode) {
          const waiting = pvpRooms.get(waitingMatchRoomCode);
          if (!waiting || waiting.status !== 'waiting' || waiting.player1Id === currentMeta.userId) {
            if (waiting && waiting.player1Id === currentMeta.userId) {
              sendWs(ws, { type: 'pvp:waiting', room: serializePvpRoom(waiting) });
              return;
            }
            waitingMatchRoomCode = null;
          } else {
            // Join existing room!
            const joined = db.transaction(() => {
              const upd = db.prepare('UPDATE saga_profiles SET coins = coins - ? WHERE user_id = ? AND coins >= ?').run(stake, currentMeta.userId, stake);
              if (upd.changes !== 1) return false;
              waiting.player2Id = currentMeta.userId;
              waiting.player2Name = p.displayName;
              waiting.player2Badge = p.avatarBadge;
              waiting.status = 'active';
              waiting.endsAtMs = Date.now() + 75_000;
              db.prepare(
                `UPDATE pvp_matches SET player2_id = ?, status = 'active' WHERE room_code = ?`
              ).run(currentMeta.userId, waiting.roomCode);
              return true;
            })();
            if (!joined) {
              sendWs(ws, { type: 'pvp:error', error: 'Không đủ Xu để vào trận PvP.' });
              return;
            }
            waitingMatchRoomCode = null;
            waiting.timerHandle = setTimeout(() => finalizePvpRoom(waiting.roomCode), 75_500);
            const startPayload = { type: 'pvp:started', room: serializePvpRoom(waiting) };
            sendToUser(waiting.player1Id, startPayload);
            sendToUser(waiting.player2Id!, startPayload);
            return;
          }
        }

        // Create new waiting room
        const deducted = db.prepare('UPDATE saga_profiles SET coins = coins - ? WHERE user_id = ? AND coins >= ?').run(stake, currentMeta.userId, stake);
        if (deducted.changes !== 1) {
          sendWs(ws, { type: 'pvp:error', error: 'Không đủ Xu để mở phòng PvP.' });
          return;
        }
        const roomCode = `PVP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        const room: PvpRoomState = {
          roomCode,
          player1Id: currentMeta.userId,
          player1Name: p.displayName,
          player1Badge: p.avatarBadge,
          player2Id: null,
          player2Name: '',
          player2Badge: '',
          player1Score: 0,
          player2Score: 0,
          stakeCoins: stake,
          status: 'waiting',
          endsAtMs: 0,
          seed: Math.floor(Math.random() * 1_000_000),
        };
        pvpRooms.set(roomCode, room);
        waitingMatchRoomCode = roomCode;
        db.prepare(
          `INSERT INTO pvp_matches (room_code, player1_id, stake_coins, status) VALUES (?, ?, ?, 'waiting')`
        ).run(roomCode, currentMeta.userId, stake);
        sendWs(ws, { type: 'pvp:waiting', room: serializePvpRoom(room) });
      } else if (msg.type === 'pvp:cancel') {
        const roomCode = String(msg.roomCode || '');
        const room = pvpRooms.get(roomCode);
        if (room && room.status === 'waiting' && room.player1Id === currentMeta.userId) {
          pvpRooms.delete(roomCode);
          if (waitingMatchRoomCode === roomCode) waitingMatchRoomCode = null;
          db.prepare('UPDATE saga_profiles SET coins = coins + ? WHERE user_id = ?').run(room.stakeCoins, room.player1Id);
          db.prepare("DELETE FROM pvp_matches WHERE room_code = ? AND status = 'waiting'").run(roomCode);
          sendWs(ws, { type: 'pvp:cancelled', roomCode });
        }
      } else if (msg.type === 'pvp:score') {
        const roomCode = String(msg.roomCode || '');
        const nextScore = Math.max(0, Math.min(200_000, Math.floor(Number(msg.score || 0))));
        const room = pvpRooms.get(roomCode);
        if (!room || room.status !== 'active') return;
        if (room.player1Id === currentMeta.userId) {
          room.player1Score = Math.max(room.player1Score, nextScore);
        } else if (room.player2Id === currentMeta.userId) {
          room.player2Score = Math.max(room.player2Score, nextScore);
        } else {
          return;
        }
        const updatePayload = { type: 'pvp:update', room: serializePvpRoom(room) };
        sendToUser(room.player1Id, updatePayload);
        if (room.player2Id) sendToUser(room.player2Id, updatePayload);
      } else if (msg.type === 'pvp:finish') {
        const roomCode = String(msg.roomCode || '');
        const room = pvpRooms.get(roomCode);
        if (room && room.status === 'active' && (room.player1Id === currentMeta.userId || room.player2Id === currentMeta.userId)) {
          finalizePvpRoom(roomCode);
        }
      }
    });

    ws.on('close', () => {
      const userSet = clientsByUser.get(auth.userId);
      if (userSet) {
        userSet.delete(ws);
        if (userSet.size === 0) clientsByUser.delete(auth.userId);
      }
    });
  });

  // Periodic automatic cloud backup every 6 hours for active players
  const AUTO_BACKUP_INTERVAL_MS = 6 * 60 * 60 * 1000;
  setInterval(() => {
    try {
      const activeUsers = db
        .prepare("SELECT DISTINCT user_id FROM user_game_progress WHERE updated_at >= datetime('now', '-24 hours')")
        .all() as Array<{ user_id: number }>;
      for (const u of activeUsers) {
        createUserBackupSnapshot(u.user_id, 'auto', 'Sao lưu định kỳ tự động (Cloud Auto-Backup)');
      }
    } catch {
      // ignore scheduled backup errors
    }
  }, AUTO_BACKUP_INTERVAL_MS);
}

export function registerRealtimeSagaRoutes(app: express.Express) {
  // ---------- CROSS-GAME LEVEL PROGRESS ----------
  app.get('/api/games/progress', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const rows = db
      .prepare('SELECT game_key, current_level, max_level, best_score, stars_json, state_json, updated_at FROM user_game_progress WHERE user_id = ?')
      .all(userId) as any[];
    const progressByGame: Record<string, any> = {};
    for (const r of rows) {
      progressByGame[r.game_key] = {
        game_key: r.game_key,
        current_level: Number(r.current_level || 1),
        max_level: Number(r.max_level || 1),
        best_score: Number(r.best_score || 0),
        stars: JSON.parse(r.stars_json || '{}'),
        state: JSON.parse(r.state_json || '{}'),
        updated_at: r.updated_at,
      };
    }
    res.json({ progressByGame });
  });

  app.put('/api/games/progress', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const gameKey = String(req.body?.gameKey || '').trim();
    const allowed = ['blockblast', 'cubeaway', 'candysaga', 'memory', 'harvest'];
    if (!allowed.includes(gameKey)) {
      res.status(400).json({ error: 'Invalid gameKey' });
      return;
    }
    const currentLevel = Math.max(1, Math.floor(Number(req.body?.currentLevel || 1)));
    const maxLevel = Math.max(currentLevel, Math.floor(Number(req.body?.maxLevel || currentLevel)));
    const bestScore = Math.max(0, Math.floor(Number(req.body?.bestScore || 0)));
    const starsJson = JSON.stringify(req.body?.stars && typeof req.body.stars === 'object' ? req.body.stars : {});
    const stateJson = JSON.stringify(req.body?.state && typeof req.body.state === 'object' ? req.body.state : {});

    db.prepare(`
      INSERT INTO user_game_progress (user_id, game_key, current_level, max_level, best_score, stars_json, state_json, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, game_key) DO UPDATE SET
        current_level = excluded.current_level,
        max_level = MAX(user_game_progress.max_level, excluded.max_level),
        best_score = MAX(user_game_progress.best_score, excluded.best_score),
        stars_json = excluded.stars_json,
        state_json = excluded.state_json,
        updated_at = datetime('now')
    `).run(userId, gameKey, currentLevel, maxLevel, bestScore, starsJson, stateJson);

    res.json({ ok: true, gameKey, currentLevel, maxLevel, bestScore });
  });

  // ---------- TWO-FACTOR AUTHENTICATION (2FA TOTP) ----------
  app.post('/api/auth/2fa/setup', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const user = db.prepare('SELECT id, email, totp_enabled FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    if (user.totp_enabled) {
      res.status(400).json({ error: '2FA đã được kích hoạt trên tài khoản này.' });
      return;
    }
    const secret = generateTotpSecret();
    const backupCodes = generateBackupCodes(8);
    const hashedCodes = backupCodes.map((c) => hashBackupCode(c));

    db.prepare('UPDATE users SET totp_secret = ?, totp_backup_codes_json = ? WHERE id = ?').run(
      secret,
      JSON.stringify(hashedCodes),
      userId
    );

    const otpauthUri = buildOtpAuthUri(user.email, 'ROAR COFFEE', secret);
    res.json({
      ok: true,
      manualKey: secret,
      otpauthUri,
      backupCodes,
    });
  });

  app.post('/api/auth/2fa/enable', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const code = String(req.body?.code || '').trim();
    const user = db.prepare('SELECT id, totp_secret, totp_enabled FROM users WHERE id = ?').get(userId) as any;
    if (!user || !user.totp_secret) {
      res.status(400).json({ error: 'Vui lòng tạo mã thiết lập 2FA trước.' });
      return;
    }
    if (!verifyTotpCode(user.totp_secret, code)) {
      res.status(400).json({ error: 'Mã xác thực 6 số không đúng hoặc đã hết hạn.' });
      return;
    }
    db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(userId);
    res.json({ ok: true, totpEnabled: true });
  });

  app.post('/api/auth/2fa/disable', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const { password, code } = req.body || {};
    const user = db.prepare('SELECT id, password_hash, totp_secret, totp_enabled FROM users WHERE id = ?').get(userId) as any;
    if (!user || !user.totp_enabled) {
      res.status(400).json({ error: '2FA chưa được bật.' });
      return;
    }
    if (!password || !verifyPassword(String(password), user.password_hash)) {
      res.status(401).json({ error: 'Mật khẩu hiện tại không chính xác.' });
      return;
    }
    if (!verifyTotpCode(user.totp_secret, String(code || ''))) {
      res.status(400).json({ error: 'Mã 2FA 6 số không hợp lệ.' });
      return;
    }
    db.prepare("UPDATE users SET totp_enabled = 0, totp_secret = '', totp_backup_codes_json = '[]' WHERE id = ?").run(userId);
    res.json({ ok: true, totpEnabled: false });
  });

  // ---------- ROAR CANDY SAGA STATE & PROGRESSION ----------
  app.get('/api/saga/state', (req: AuthedRequest, res) => {
    const todayDate = getVietnamDateStr(0);
    if (!req.authUser) {
      res.json({ todayDate, profile: null, weeklyQuests: [] });
      return;
    }
    const profile = ensureSagaProfile(req.authUser.userId);
    const weeklyQuests = getWeeklyQuestsForUser(req.authUser.userId);
    res.json({ todayDate, profile, weeklyQuests });
  });

  app.post('/api/saga/complete-level', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const levelNumber = Math.max(1, Math.floor(Number(req.body?.levelNumber || 1)));
    const score = Math.max(0, Math.floor(Number(req.body?.score || 0)));
    const coinReward = Math.max(10, Math.min(400, Math.floor(Number(req.body?.coinReward || 45))));
    const specialsTriggered = Math.max(0, Math.min(80, Math.floor(Number(req.body?.specialsTriggered || 0))));
    const stars = Math.max(1, Math.min(3, Math.floor(Number(req.body?.stars || 3))));

    const result = db.transaction(() => {
      const p = ensureSagaProfile(userId);
      const nextCurrent = Math.max(p.currentLevel, levelNumber + 1);
      const nextMax = Math.max(p.maxLevel, levelNumber + 1);
      const nextStats = {
        ...p.stats,
        levelsCleared: (p.stats.levelsCleared || 0) + 1,
        specialsTriggered: (p.stats.specialsTriggered || 0) + specialsTriggered,
      };

      db.prepare(`
        UPDATE saga_profiles
        SET coins = coins + ?,
            current_level = ?,
            max_level = ?,
            total_score = total_score + ?,
            seasonal_score = seasonal_score + ?,
            stats_json = ?,
            updated_at = datetime('now')
        WHERE user_id = ?
      `).run(coinReward, nextCurrent, nextMax, score, score, JSON.stringify(nextStats), userId);

      // Update unified user_game_progress as well
      db.prepare(`
        INSERT INTO user_game_progress (user_id, game_key, current_level, max_level, best_score, stars_json, updated_at)
        VALUES (?, 'candysaga', ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, game_key) DO UPDATE SET
          current_level = excluded.current_level,
          max_level = MAX(user_game_progress.max_level, excluded.max_level),
          best_score = MAX(user_game_progress.best_score, excluded.best_score),
          updated_at = datetime('now')
      `).run(userId, nextCurrent, nextMax, score, JSON.stringify({ [levelNumber]: stars }));

      // Guild contribution
      if (p.guild?.id) {
        db.prepare('UPDATE guilds SET total_score = total_score + ? WHERE id = ?').run(score, p.guild.id);
        db.prepare('UPDATE guild_members SET contribution_score = contribution_score + ? WHERE user_id = ?').run(score, userId);
      }

      incrementWeeklyQuest(userId, 'clear_levels', 1);
      if (specialsTriggered > 0) incrementWeeklyQuest(userId, 'trigger_specials', specialsTriggered);

      // Periodic auto-snapshot every 3 levels cleared
      if ((nextStats.levelsCleared || 0) % 3 === 0) {
        createUserBackupSnapshot(userId, 'auto', `Tự động lưu sau Màn ${levelNumber} Candy Saga`);
      }

      return { profile: ensureSagaProfile(userId), weeklyQuests: getWeeklyQuestsForUser(userId) };
    })();

    res.json({ ok: true, ...result });
  });

  app.post('/api/saga/daily-gift', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const today = getVietnamDateStr(0);
    const yesterday = getVietnamDateStr(-1);
    const p = ensureSagaProfile(userId);
    if (p.lastDailyGiftDate === today) {
      res.status(400).json({ error: 'Bạn đã nhận Quà Tặng Hàng Ngày Candy Saga hôm nay rồi.' });
      return;
    }
    const nextStreak = p.lastDailyGiftDate === yesterday ? (p.dailyGiftStreak % 7) + 1 : 1;
    const coinGift = 40 + nextStreak * 15;
    const addHammer = nextStreak % 2 === 1 ? 1 : 0;
    const addSwitch8 = nextStreak >= 3 ? 1 : 0;
    const addColorBomb = nextStreak === 7 ? 2 : nextStreak % 3 === 0 ? 1 : 0;

    db.prepare(`
      UPDATE saga_profiles
      SET coins = coins + ?,
          booster_hammer = booster_hammer + ?,
          booster_switch8 = booster_switch8 + ?,
          booster_colorbomb = booster_colorbomb + ?,
          booster_moves5 = booster_moves5 + 1,
          last_daily_gift_date = ?,
          daily_gift_streak = ?,
          updated_at = datetime('now')
      WHERE user_id = ?
    `).run(coinGift, addHammer, addSwitch8, addColorBomb, today, nextStreak, userId);

    res.json({
      ok: true,
      coinGift,
      nextStreak,
      addHammer,
      addSwitch8,
      addColorBomb,
      profile: ensureSagaProfile(userId),
    });
  });

  app.post('/api/saga/weekly-quests/claim', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const questId = String(req.body?.questId || '').trim();
    const def = SAGA_WEEKLY_QUESTS.find((q) => q.id === questId);
    if (!def) {
      res.status(400).json({ error: 'Nhiệm vụ tuần không hợp lệ.' });
      return;
    }
    const weekKey = getCurrentIsoWeekKey();
    const outcome = db.transaction(() => {
      const row = db
        .prepare('SELECT progress, claimed FROM saga_weekly_quests WHERE user_id = ? AND week_key = ? AND quest_id = ?')
        .get(userId, weekKey, questId) as any;
      if (!row || Number(row.progress) < def.target) {
        throw Object.assign(new Error('Chưa hoàn thành tiến độ nhiệm vụ này.'), { status: 400 });
      }
      if (row.claimed) {
        throw Object.assign(new Error('Bạn đã nhận thưởng nhiệm vụ này tuần này rồi.'), { status: 400 });
      }
      db.prepare('UPDATE saga_weekly_quests SET claimed = 1 WHERE user_id = ? AND week_key = ? AND quest_id = ?').run(
        userId,
        weekKey,
        questId
      );
      db.prepare('UPDATE saga_profiles SET coins = coins + ?, seasonal_score = seasonal_score + 120 WHERE user_id = ?').run(
        def.rewardCoins,
        userId
      );
      db.prepare(`
        INSERT INTO points_ledger (user_id, entry_type, points, description_vi, description_en)
        VALUES (?, 'earn_available', ?, ?, ?)
      `).run(userId, def.rewardRoarPts, `Nhiệm vụ tuần Candy Saga: ${def.titleVi}`, `Weekly Quest: ${def.titleEn}`);
      return { profile: ensureSagaProfile(userId), weeklyQuests: getWeeklyQuestsForUser(userId) };
    })();

    res.json({ ok: true, ...outcome });
  });

  app.post('/api/saga/customize', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const { action, skinId, avatarBadge, boosterKey } = req.body || {};
    const p = ensureSagaProfile(userId);

    if (action === 'avatar' && avatarBadge) {
      db.prepare('UPDATE saga_profiles SET avatar_badge = ? WHERE user_id = ?').run(String(avatarBadge).slice(0, 20), userId);
    } else if (action === 'skin' && skinId) {
      const skin = SAGA_CHARACTER_SKINS.find((s) => s.id === skinId);
      if (!skin) {
        res.status(400).json({ error: 'Trang phục không tồn tại.' });
        return;
      }
      if (p.unlockedSkins.includes(skinId)) {
        db.prepare('UPDATE saga_profiles SET active_skin = ? WHERE user_id = ?').run(skinId, userId);
      } else {
        if (p.coins < skin.costCoins) {
          res.status(400).json({ error: `Cần ${skin.costCoins} Xu để mở khóa trang phục này.` });
          return;
        }
        const nextUnlocked = [...p.unlockedSkins, skinId];
        db.prepare('UPDATE saga_profiles SET coins = coins - ?, active_skin = ?, unlocked_skins_json = ? WHERE user_id = ?').run(
          skin.costCoins,
          skinId,
          JSON.stringify(nextUnlocked),
          userId
        );
      }
    } else if (action === 'buy_booster' && boosterKey) {
      const prices: Record<string, { col: string; cost: number }> = {
        hammer: { col: 'booster_hammer', cost: 40 },
        switch8: { col: 'booster_switch8', cost: 45 },
        colorbomb: { col: 'booster_colorbomb', cost: 75 },
        moves5: { col: 'booster_moves5', cost: 50 },
      };
      const item = prices[String(boosterKey)];
      if (!item) {
        res.status(400).json({ error: 'Vật phẩm không hợp lệ.' });
        return;
      }
      const upd = db
        .prepare(`UPDATE saga_profiles SET coins = coins - ?, ${item.col} = ${item.col} + 1 WHERE user_id = ? AND coins >= ?`)
        .run(item.cost, userId, item.cost);
      if (upd.changes !== 1) {
        res.status(400).json({ error: `Không đủ Xu (cần ${item.cost} Xu).` });
        return;
      }
    }

    res.json({ ok: true, profile: ensureSagaProfile(userId) });
  });

  app.post('/api/saga/use-booster', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const boosterKey = String(req.body?.boosterKey || '');
    const colMap: Record<string, string> = {
      hammer: 'booster_hammer',
      switch8: 'booster_switch8',
      colorbomb: 'booster_colorbomb',
      moves5: 'booster_moves5',
    };
    const col = colMap[boosterKey];
    if (!col) {
      res.status(400).json({ error: 'Invalid booster' });
      return;
    }
    const upd = db.prepare(`UPDATE saga_profiles SET ${col} = ${col} - 1 WHERE user_id = ? AND ${col} > 0`).run(userId);
    if (upd.changes !== 1) {
      res.status(400).json({ error: 'Bạn đã hết vật phẩm hỗ trợ này.' });
      return;
    }
    res.json({ ok: true, profile: ensureSagaProfile(userId) });
  });

  app.get('/api/saga/leaderboard', (_req, res) => {
    const seasonalRows = db
      .prepare(
        `SELECT sp.user_id, sp.avatar_badge, sp.max_level, sp.seasonal_score, sp.total_score, sp.active_skin,
                u.full_name, u.tier, g.tag as guild_tag
         FROM saga_profiles sp
         JOIN users u ON u.id = sp.user_id
         LEFT JOIN guild_members gm ON gm.user_id = sp.user_id
         LEFT JOIN guilds g ON g.id = gm.guild_id
         ORDER BY sp.seasonal_score DESC, sp.max_level DESC
         LIMIT 25`
      )
      .all() as any[];

    const guildRows = db
      .prepare('SELECT id, name, tag, emblem_color, emblem_icon, total_score, member_count FROM guilds ORDER BY total_score DESC LIMIT 20')
      .all();

    res.json({
      players: seasonalRows.map((r, idx) => ({
        rank: idx + 1,
        userId: r.user_id,
        displayName: r.full_name,
        avatarBadge: r.avatar_badge,
        maxLevel: r.max_level,
        seasonalScore: r.seasonal_score,
        totalScore: r.total_score,
        activeSkin: r.active_skin,
        tier: r.tier,
        guildTag: r.guild_tag || '',
      })),
      guilds: guildRows,
    });
  });

  // ---------- GUILDS (BANG HỘI) ----------
  app.get('/api/guilds', (req: AuthedRequest, res) => {
    const guilds = db
      .prepare('SELECT id, name, tag, description, emblem_color, emblem_icon, total_score, member_count, created_at FROM guilds ORDER BY total_score DESC')
      .all();
    let myGuild: any = null;
    let members: any[] = [];
    if (req.authUser) {
      const gm = db.prepare('SELECT guild_id, role, contribution_score FROM guild_members WHERE user_id = ?').get(req.authUser.userId) as any;
      if (gm) {
        myGuild = guilds.find((g: any) => g.id === gm.guild_id) || null;
        members = db
          .prepare(
            `SELECT gm.user_id, gm.role, gm.contribution_score, u.full_name, sp.avatar_badge, sp.max_level
             FROM guild_members gm
             JOIN users u ON u.id = gm.user_id
             LEFT JOIN saga_profiles sp ON sp.user_id = gm.user_id
             WHERE gm.guild_id = ?
             ORDER BY gm.contribution_score DESC`
          )
          .all(gm.guild_id);
      }
    }
    res.json({ guilds, myGuild, members });
  });

  app.post('/api/guilds', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const name = String(req.body?.name || '').trim().slice(0, 36);
    const tag = String(req.body?.tag || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    const description = String(req.body?.description || '').trim().slice(0, 140);
    const emblemIcon = String(req.body?.emblemIcon || '🦁').slice(0, 6);
    if (name.length < 3 || tag.length < 2) {
      res.status(400).json({ error: 'Tên Bang hội (>=3 ký tự) và Tag (2-5 ký tự) là bắt buộc.' });
      return;
    }
    try {
      const createdId = db.transaction(() => {
        const existing = db.prepare('SELECT guild_id FROM guild_members WHERE user_id = ?').get(userId);
        if (existing) throw new Error('Bạn đang thuộc một Bang hội khác. Vui lòng rời bang cũ trước.');
        const p = ensureSagaProfile(userId);
        const ins = db
          .prepare(
            `INSERT INTO guilds (name, tag, description, emblem_icon, leader_id, total_score, member_count)
             VALUES (?, ?, ?, ?, ?, ?, 1)`
          )
          .run(name, tag, description, emblemIcon, userId, p.seasonalScore);
        const gId = Number(ins.lastInsertRowid);
        db.prepare("INSERT INTO guild_members (guild_id, user_id, role, contribution_score) VALUES (?, ?, 'leader', ?)").run(
          gId,
          userId,
          p.seasonalScore
        );
        return gId;
      })();
      res.json({ ok: true, guildId: createdId, profile: ensureSagaProfile(userId) });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Tên hoặc Tag Bang hội đã tồn tại.' });
    }
  });

  app.post('/api/guilds/join', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const guildId = Number(req.body?.guildId || 0);
    if (!guildId) {
      res.status(400).json({ error: 'Invalid guildId' });
      return;
    }
    try {
      db.transaction(() => {
        const existing = db.prepare('SELECT guild_id FROM guild_members WHERE user_id = ?').get(userId);
        if (existing) throw new Error('Bạn đã có Bang hội. Hãy rời bang cũ trước.');
        const g = db.prepare('SELECT id FROM guilds WHERE id = ?').get(guildId);
        if (!g) throw new Error('Bang hội không tồn tại.');
        const p = ensureSagaProfile(userId);
        db.prepare("INSERT INTO guild_members (guild_id, user_id, role, contribution_score) VALUES (?, ?, 'member', ?)").run(
          guildId,
          userId,
          p.seasonalScore
        );
        db.prepare('UPDATE guilds SET member_count = member_count + 1, total_score = total_score + ? WHERE id = ?').run(
          p.seasonalScore,
          guildId
        );
      })();
      res.json({ ok: true, profile: ensureSagaProfile(userId) });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Không thể gia nhập Bang hội.' });
    }
  });

  app.post('/api/guilds/leave', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    db.transaction(() => {
      const gm = db.prepare('SELECT guild_id, contribution_score FROM guild_members WHERE user_id = ?').get(userId) as any;
      if (!gm) return;
      db.prepare('DELETE FROM guild_members WHERE user_id = ?').run(userId);
      db.prepare('UPDATE guilds SET member_count = MAX(0, member_count - 1), total_score = MAX(0, total_score - ?) WHERE id = ?').run(
        Number(gm.contribution_score || 0),
        gm.guild_id
      );
    })();
    res.json({ ok: true, profile: ensureSagaProfile(userId) });
  });

  // ---------- TRANSPARENT REAL-TIME AUCTIONS (ĐẤU GIÁ MINH BẠCH) ----------
  app.get('/api/auctions', (_req, res) => {
    const listings = db
      .prepare(
        `SELECT al.*, u.full_name as highest_bidder_name, s.full_name as seller_name
         FROM auction_listings al
         LEFT JOIN users u ON u.id = al.highest_bidder_id
         LEFT JOIN users s ON s.id = al.seller_id
         WHERE al.status = 'active'
         ORDER BY al.id DESC`
      )
      .all() as any[];

    const bidsStmt = db.prepare(
      `SELECT ab.id, ab.bid_amount, ab.created_at, u.full_name as bidder_name
       FROM auction_bids ab JOIN users u ON u.id = ab.bidder_id
       WHERE ab.listing_id = ? ORDER BY ab.id DESC LIMIT 5`
    );

    res.json({
      listings: listings.map((l) => ({
        ...l,
        recentBids: bidsStmt.all(l.id),
      })),
    });
  });

  app.post('/api/auctions', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const { boosterKey, startingPrice } = req.body || {};
    const catalog: Record<string, { col: string; titleVi: string; titleEn: string }> = {
      hammer: { col: 'booster_hammer', titleVi: '1x Búa Phá Kẹo (Người chơi đăng bán)', titleEn: '1x Candy Hammer (Player Listing)' },
      switch8: { col: 'booster_switch8', titleVi: '1x Đổi Chéo 8 Hướng (Người chơi đăng bán)', titleEn: '1x 8-Way Switcher (Player Listing)' },
      colorbomb: { col: 'booster_colorbomb', titleVi: '1x Bom Cầu Vồng (Người chơi đăng bán)', titleEn: '1x Color Bomb (Player Listing)' },
      moves5: { col: 'booster_moves5', titleVi: '1x Vé +5 Lượt Đi (Người chơi đăng bán)', titleEn: '1x +5 Moves Ticket (Player Listing)' },
    };
    const item = catalog[String(boosterKey || '')];
    const startBid = Math.max(20, Math.min(500, Math.floor(Number(startingPrice || 40))));
    if (!item) {
      res.status(400).json({ error: 'Vật phẩm đấu giá không hợp lệ.' });
      return;
    }

    try {
      const newId = db.transaction(() => {
        ensureSagaProfile(userId);
        const upd = db.prepare(`UPDATE saga_profiles SET ${item.col} = ${item.col} - 1 WHERE user_id = ? AND ${item.col} > 0`).run(userId);
        if (upd.changes !== 1) throw new Error('Bạn không có vật phẩm này để đưa lên sàn đấu giá.');
        const endsAt = new Date(Date.now() + 48 * 3600000).toISOString().slice(0, 19).replace('T', ' ');
        const ins = db
          .prepare(
            `INSERT INTO auction_listings (seller_id, item_type, item_key, title_vi, title_en, starting_price, current_bid, bid_count, status, ends_at)
             VALUES (?, 'booster_pack', ?, ?, ?, ?, ?, 0, 'active', ?)`
          )
          .run(userId, boosterKey, item.titleVi, item.titleEn, startBid, startBid, endsAt);
        return Number(ins.lastInsertRowid);
      })();

      broadcastAll({ type: 'auction:update', listingId: newId });
      res.json({ ok: true, listingId: newId, profile: ensureSagaProfile(userId) });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Không thể tạo phiên đấu giá.' });
    }
  });

  app.post('/api/auctions/bid', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const listingId = Number(req.body?.listingId || 0);
    const bidAmount = Math.floor(Number(req.body?.bidAmount || 0));
    if (!listingId || !Number.isFinite(bidAmount) || bidAmount <= 0) {
      res.status(400).json({ error: 'Số Xu đấu giá không hợp lệ.' });
      return;
    }

    try {
      const outcome = db.transaction(() => {
        const listing = db.prepare("SELECT * FROM auction_listings WHERE id = ? AND status = 'active'").get(listingId) as any;
        if (!listing) throw new Error('Phiên đấu giá đã kết thúc hoặc không tồn tại.');
        if (listing.seller_id === userId) throw new Error('Không thể tự đấu giá vật phẩm của chính mình.');
        const minNext = listing.bid_count === 0 ? listing.starting_price : listing.current_bid + 10;
        if (bidAmount < minNext) throw new Error(`Giá đặt tối thiểu tiếp theo là ${minNext} Xu.`);
        if (listing.highest_bidder_id === userId) throw new Error('Bạn đang giữ mức giá cao nhất!');

        ensureSagaProfile(userId);
        const deduct = db
          .prepare('UPDATE saga_profiles SET coins = coins - ? WHERE user_id = ? AND coins >= ?')
          .run(bidAmount, userId, bidAmount);
        if (deduct.changes !== 1) throw new Error('Số dư Xu không đủ để đặt giá này.');

        // Transparent atomic refund to previous highest bidder
        const prevBidderId = listing.highest_bidder_id ? Number(listing.highest_bidder_id) : null;
        if (prevBidderId) {
          db.prepare('UPDATE saga_profiles SET coins = coins + ? WHERE user_id = ?').run(listing.current_bid, prevBidderId);
        }

        db.prepare(
          'UPDATE auction_listings SET current_bid = ?, highest_bidder_id = ?, bid_count = bid_count + 1 WHERE id = ?'
        ).run(bidAmount, userId, listingId);
        db.prepare('INSERT INTO auction_bids (listing_id, bidder_id, bid_amount) VALUES (?, ?, ?)').run(
          listingId,
          userId,
          bidAmount
        );

        return { prevBidderId, listingTitle: listing.title_vi };
      })();

      broadcastAll({ type: 'auction:update', listingId, bidAmount });
      if (outcome.prevBidderId) {
        sendToUser(outcome.prevBidderId, {
          type: 'push:notify',
          titleVi: 'Bạn đã bị trả giá cao hơn trên Sàn Đấu Giá!',
          titleEn: 'You have been outbid on the ROAR Auction!',
          messageVi: `Phiên "${outcome.listingTitle}" vừa lên ${bidAmount} Xu. Xu cũ của bạn đã được hoàn lại ví ngay lập tức.`,
          messageEn: `"${outcome.listingTitle}" reached ${bidAmount} Coins. Your previous Coins were refunded immediately.`,
        });
      }

      res.json({ ok: true, profile: ensureSagaProfile(userId) });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Đặt giá thất bại.' });
    }
  });

  // ---------- LIVE CHAT HISTORY & GAME NEWS FEED ----------
  app.get('/api/chat/history', (req: AuthedRequest, res) => {
    const channel = String(req.query.channel || 'global');
    if (channel.startsWith('guild:')) {
      if (!req.authUser) {
        res.json({ messages: [] });
        return;
      }
      const gm = db.prepare('SELECT guild_id FROM guild_members WHERE user_id = ?').get(req.authUser.userId) as any;
      if (!gm || `guild:${gm.guild_id}` !== channel) {
        res.json({ messages: [] });
        return;
      }
    }
    const rows = db
      .prepare('SELECT * FROM realtime_chat_messages WHERE channel = ? ORDER BY id DESC LIMIT 40')
      .all(channel);
    res.json({ messages: rows.reverse() });
  });

  app.get('/api/game-news', (_req, res) => {
    const posts = db
      .prepare('SELECT * FROM game_news_posts ORDER BY pinned DESC, id DESC LIMIT 20')
      .all();
    res.json({ posts });
  });

  app.post('/api/game-news', requireAdmin, (req: AuthedRequest, res) => {
    const { titleVi, titleEn, summaryVi, summaryEn, bodyVi, bodyEn, tag, pinned } = req.body || {};
    if (!titleVi || !summaryVi) {
      res.status(400).json({ error: 'Tiêu đề và tóm tắt tin tức là bắt buộc.' });
      return;
    }
    const ins = db
      .prepare(
        `INSERT INTO game_news_posts (title_vi, title_en, summary_vi, summary_en, body_vi, body_en, tag, pinned)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        String(titleVi).trim(),
        String(titleEn || titleVi).trim(),
        String(summaryVi).trim(),
        String(summaryEn || summaryVi).trim(),
        String(bodyVi || summaryVi).trim(),
        String(bodyEn || summaryEn || summaryVi).trim(),
        String(tag || 'event'),
        pinned ? 1 : 0
      );
    broadcastAll({ type: 'news:update', id: Number(ins.lastInsertRowid) });
    res.json({ ok: true, id: Number(ins.lastInsertRowid) });
  });

  // ---------- MULTI-CHANNEL LIVE CUSTOMER SUPPORT ----------
  app.get('/api/support/tickets', requireAuth, (req: AuthedRequest, res) => {
    const isAdmin = req.authUser!.role === 'admin' && req.query.scope === 'all';
    const tickets = isAdmin
      ? (db
          .prepare(
            `SELECT st.*, u.full_name as customer_name, u.email as customer_email
             FROM support_tickets st JOIN users u ON u.id = st.user_id
             ORDER BY st.updated_at DESC LIMIT 50`
          )
          .all() as any[])
      : (db
          .prepare('SELECT * FROM support_tickets WHERE user_id = ? ORDER BY updated_at DESC LIMIT 25')
          .all(req.authUser!.userId) as any[]);

    const msgStmt = db.prepare('SELECT * FROM support_messages WHERE ticket_id = ? ORDER BY id ASC');
    res.json({
      tickets: tickets.map((t) => ({
        ...t,
        messages: msgStmt.all(t.id),
      })),
    });
  });

  app.post('/api/support/tickets', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const channel = ['web', 'zalo', 'email', 'hotline'].includes(String(req.body?.channel))
      ? String(req.body.channel)
      : 'web';
    const subject = String(req.body?.subject || '').trim().slice(0, 120);
    const message = String(req.body?.message || '').trim().slice(0, 1200);
    if (!subject || !message) {
      res.status(400).json({ error: 'Vui lòng nhập tiêu đề và nội dung yêu cầu hỗ trợ.' });
      return;
    }

    const userRow = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId) as any;
    const senderName = userRow?.full_name || 'ROAR Member';

    const ticketId = db.transaction(() => {
      const ins = db
        .prepare("INSERT INTO support_tickets (user_id, channel, subject, status) VALUES (?, ?, ?, 'open')")
        .run(userId, channel, subject);
      const tId = Number(ins.lastInsertRowid);
      db.prepare(
        "INSERT INTO support_messages (ticket_id, sender_id, sender_role, sender_name, message) VALUES (?, ?, 'customer', ?, ?)"
      ).run(tId, userId, senderName, message);
      return tId;
    })();

    // Notify online admins in real time
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as Array<{ id: number }>;
    for (const adm of admins) {
      sendToUser(adm.id, {
        type: 'support:update',
        ticketId,
        subject,
        channel,
      });
    }

    res.json({ ok: true, ticketId });
  });

  app.post('/api/support/tickets/:id/reply', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const ticketId = Number(req.params.id || 0);
    const message = String(req.body?.message || '').trim().slice(0, 1200);
    if (!ticketId || !message) {
      res.status(400).json({ error: 'Nội dung phản hồi không được để trống.' });
      return;
    }

    const ticket = db.prepare('SELECT * FROM support_tickets WHERE id = ?').get(ticketId) as any;
    if (!ticket) {
      res.status(404).json({ error: 'Không tìm thấy phiếu hỗ trợ.' });
      return;
    }
    const isAdmin = req.authUser!.role === 'admin';
    if (!isAdmin && ticket.user_id !== userId) {
      res.status(403).json({ error: 'Không có quyền phản hồi phiếu hỗ trợ này.' });
      return;
    }

    const senderRow = db.prepare('SELECT full_name FROM users WHERE id = ?').get(userId) as any;
    const senderRole = isAdmin ? 'agent' : 'customer';
    const senderName = isAdmin ? `${senderRow?.full_name || 'Admin'} (ROAR Care)` : senderRow?.full_name || 'Khách hàng';

    db.prepare(
      'INSERT INTO support_messages (ticket_id, sender_id, sender_role, sender_name, message) VALUES (?, ?, ?, ?, ?)'
    ).run(ticketId, userId, senderRole, senderName, message);
    db.prepare(
      `UPDATE support_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(isAdmin ? 'in_progress' : ticket.status, ticketId);

    // Real-time push to the other party
    if (isAdmin) {
      sendToUser(ticket.user_id, { type: 'support:update', ticketId });
      sendToUser(ticket.user_id, {
        type: 'push:notify',
        titleVi: `Phản hồi hỗ trợ #${ticketId}`,
        titleEn: `Support Reply #${ticketId}`,
        messageVi: `${senderName}: ${message.slice(0, 90)}`,
        messageEn: `${senderName}: ${message.slice(0, 90)}`,
      });
    } else {
      const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as Array<{ id: number }>;
      for (const adm of admins) {
        sendToUser(adm.id, { type: 'support:update', ticketId });
      }
    }

    res.json({ ok: true });
  });

  app.patch('/api/support/tickets/:id/status', requireAdmin, (req: AuthedRequest, res) => {
    const ticketId = Number(req.params.id || 0);
    const status = String(req.body?.status || 'resolved');
    if (!['open', 'in_progress', 'resolved'].includes(status)) {
      res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
      return;
    }
    db.prepare("UPDATE support_tickets SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, ticketId);
    const ticket = db.prepare('SELECT user_id FROM support_tickets WHERE id = ?').get(ticketId) as any;
    if (ticket) sendToUser(ticket.user_id, { type: 'support:update', ticketId });
    res.json({ ok: true });
  });

  // ---------- CLOUD DATA BACKUP & RESTORE ----------
  app.get('/api/account/backups', requireAuth, (req: AuthedRequest, res) => {
    const rows = db
      .prepare('SELECT id, trigger_type, summary_label, created_at, length(snapshot_json) as size_bytes FROM user_data_backups WHERE user_id = ? ORDER BY id DESC LIMIT 12')
      .all(req.authUser!.userId);
    res.json({ backups: rows });
  });

  app.post('/api/account/backups', requireAuth, (req: AuthedRequest, res) => {
    const label = String(req.body?.label || 'Sao lưu thủ công từ tài khoản').trim().slice(0, 80);
    const id = createUserBackupSnapshot(req.authUser!.userId, 'manual', label);
    res.json({ ok: true, id });
  });

  app.post('/api/account/backups/restore', requireAuth, (req: AuthedRequest, res) => {
    const userId = req.authUser!.userId;
    const backupId = Number(req.body?.backupId || 0);
    const row = db
      .prepare('SELECT * FROM user_data_backups WHERE id = ? AND user_id = ?')
      .get(backupId, userId) as any;
    if (!row) {
      res.status(404).json({ error: 'Không tìm thấy bản sao lưu.' });
      return;
    }
    try {
      const snap = JSON.parse(row.snapshot_json);
      db.transaction(() => {
        if (Array.isArray(snap.gameProgress)) {
          const upsert = db.prepare(`
            INSERT INTO user_game_progress (user_id, game_key, current_level, max_level, best_score, stars_json, state_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(user_id, game_key) DO UPDATE SET
              current_level = excluded.current_level,
              max_level = excluded.max_level,
              best_score = excluded.best_score,
              stars_json = excluded.stars_json,
              state_json = excluded.state_json,
              updated_at = datetime('now')
          `);
          for (const gp of snap.gameProgress) {
            upsert.run(
              userId,
              gp.game_key,
              gp.current_level || 1,
              gp.max_level || 1,
              gp.best_score || 0,
              gp.stars_json || '{}',
              gp.state_json || '{}'
            );
          }
        }
        if (snap.sagaProfile) {
          const sp = snap.sagaProfile;
          db.prepare(`
            UPDATE saga_profiles
            SET coins = ?, current_level = ?, max_level = ?, total_score = ?, seasonal_score = ?,
                active_skin = ?, unlocked_skins_json = ?, booster_hammer = ?, booster_switch8 = ?,
                booster_colorbomb = ?, booster_moves5 = ?, updated_at = datetime('now')
            WHERE user_id = ?
          `).run(
            sp.coins ?? 180,
            sp.current_level ?? 1,
            sp.max_level ?? 1,
            sp.total_score ?? 0,
            sp.seasonal_score ?? 0,
            sp.active_skin || 'barista_lion',
            sp.unlocked_skins_json || '["barista_lion"]',
            sp.booster_hammer ?? 2,
            sp.booster_switch8 ?? 2,
            sp.booster_colorbomb ?? 1,
            sp.booster_moves5 ?? 2,
            userId
          );
        }
      })();
      res.json({ ok: true });
    } catch {
      res.status(400).json({ error: 'Dữ liệu bản sao lưu bị hỏng.' });
    }
  });
}
