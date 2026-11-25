import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Bell,
  BellRing,
  Check,
  Cloud,
  Coins,
  Crown,
  Flame,
  Gavel,
  Gift,
  Hammer,
  Headphones,
  Lightbulb,
  Lock,
  MessageCircle,
  Music,
  Newspaper,
  Plus,
  RefreshCw,
  Send,
  Shield,
  Shuffle,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import {
  CANDY_CATALOG,
  CANDY_COLOR_IDS,
  SAGA_CHARACTER_SKINS,
  SEASONAL_HONOR_TIERS,
  getSagaLevelSpec,
  resolveSeasonalHonorTier,
  type CandyColorId,
  type CandySpecialType,
  type SagaLevelSpec,
} from '../../lib/candySagaData';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { FireworksOverlay } from './FireworksOverlay';
import { gameSound } from './RoarGamesSound';

const BOARD_SIZE = 8;
const GUEST_STORAGE_KEY = 'roar_candysaga_guest_v1';

interface CandyCell {
  uid: number;
  color: CandyColorId;
  special: CandySpecialType;
}

interface CandyShard {
  id: string;
  leftPct: number;
  topPct: number;
  tx: number;
  ty: number;
  rot: number;
  colorHex: string;
  size: number;
}

interface ExplosionRing {
  id: string;
  leftPct: number;
  topPct: number;
  colorHex: string;
  large?: boolean;
}

interface FloatingCandyScore {
  id: string;
  leftPct: number;
  topPct: number;
  points: number;
  isEpic?: boolean;
}

interface LightningBoltFx {
  id: string;
  points: string;
  branchPoints?: string;
  colorHex: string;
}

interface BeamSweepFx {
  id: string;
  axis: 'h' | 'v';
  posPct: number;
  colorHex: string;
}

function buildJaggedBoltPoints(x1: number, y1: number, x2: number, y2: number, jitter = 5.5): { main: string; branch?: string } {
  const segs = 6;
  const pts: string[] = [`${x1.toFixed(1)},${y1.toFixed(1)}`];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;

  let branch: string | undefined;
  for (let i = 1; i < segs; i++) {
    const t = i / segs;
    const offset = (Math.random() - 0.5) * 2 * jitter;
    const px = x1 + dx * t + nx * offset;
    const py = y1 + dy * t + ny * offset;
    pts.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    if (i === 3 && Math.random() < 0.72) {
      const bOff = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 5);
      const bx1 = px + dx * 0.14 + nx * bOff;
      const by1 = py + dy * 0.14 + ny * bOff;
      const bx2 = bx1 + dx * 0.1 + nx * bOff * 0.8;
      const by2 = by1 + dy * 0.1 + ny * bOff * 0.8;
      branch = `${px.toFixed(1)},${py.toFixed(1)} ${bx1.toFixed(1)},${by1.toFixed(1)} ${bx2.toFixed(1)},${by2.toFixed(1)}`;
    }
  }
  pts.push(`${x2.toFixed(1)},${y2.toFixed(1)}`);
  return { main: pts.join(' '), branch };
}

interface CandySagaProfile {
  userId: number;
  displayName: string;
  memberCode: string;
  tier: string;
  avatarBadge: string;
  coins: number;
  currentLevel: number;
  maxLevel: number;
  totalScore: number;
  seasonalScore: number;
  seasonId: string;
  activeSkin: string;
  unlockedSkins: string[];
  boosters: {
    hammer: number;
    switch8: number;
    colorbomb: number;
    moves5: number;
  };
  lastDailyGiftDate: string;
  dailyGiftStreak: number;
  stats: {
    levelsCleared: number;
    specialsTriggered: number;
    pvpWins: number;
    pvpPlayed: number;
  };
  guild: {
    id: number;
    name: string;
    tag: string;
    emblem_color: string;
    emblem_icon: string;
    member_role: string;
  } | null;
}

interface CandySagaGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  savedProgress?: { current_level: number; max_level: number; best_score: number };
  onSaveProgress?: (payload: { currentLevel: number; maxLevel: number; bestScore: number }) => void;
  onPlayReal: (useExtraPoints: boolean, score: number) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

type SagaHubTab = 'play' | 'pvp' | 'character' | 'guild' | 'auction' | 'social' | 'support';

const AVATAR_BADGES = [
  { id: 'lion', emoji: '🦁', labelVi: 'Sư Tử', labelEn: 'Lion' },
  { id: 'panther', emoji: '🐆', labelVi: 'Báo Đen', labelEn: 'Panther' },
  { id: 'fox', emoji: '🦊', labelVi: 'Cáo Lửa', labelEn: 'Fox' },
  { id: 'eagle', emoji: '🦅', labelVi: 'Đại Bàng', labelEn: 'Eagle' },
  { id: 'tiger', emoji: '🐯', labelVi: 'Mãnh Hổ', labelEn: 'Tiger' },
  { id: 'wolf', emoji: '🐺', labelVi: 'Sói Bạc', labelEn: 'Wolf' },
];

function getBadgeEmoji(id: string): string {
  return AVATAR_BADGES.find((b) => b.id === id)?.emoji || '🦁';
}

function defaultGuestProfile(): CandySagaProfile {
  return {
    userId: 0,
    displayName: 'Khách Trải Nghiệm',
    memberCode: 'GUEST-ROAR',
    tier: 'ROAR Guest',
    avatarBadge: 'lion',
    coins: 200,
    currentLevel: 1,
    maxLevel: 1,
    totalScore: 0,
    seasonalScore: 0,
    seasonId: 'SEASON_2026_1',
    activeSkin: 'barista_lion',
    unlockedSkins: ['barista_lion'],
    boosters: { hammer: 2, switch8: 2, colorbomb: 1, moves5: 2 },
    lastDailyGiftDate: '',
    dailyGiftStreak: 0,
    stats: { levelsCleared: 0, specialsTriggered: 0, pvpWins: 0, pvpPlayed: 0 },
    guild: null,
  };
}

function readGuestProfile(): CandySagaProfile {
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) return { ...defaultGuestProfile(), ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultGuestProfile();
}

function writeGuestProfile(p: CandySagaProfile) {
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(p));
  } catch {
    // ignore
  }
}

let uidCounter = 1;
const nextUid = () => ++uidCounter;

function pickRandomColor(colorCount: number, exclude: CandyColorId[] = []): CandyColorId {
  const pool = CANDY_COLOR_IDS.slice(0, colorCount).filter((c) => !exclude.includes(c));
  const finalPool = pool.length > 0 ? pool : CANDY_COLOR_IDS.slice(0, colorCount);
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function createJellyGrid(jellyCount: number): boolean[][] {
  const grid = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  if (jellyCount <= 0) return grid;
  const coords: Array<[number, number]> = [];
  for (let r = 1; r < BOARD_SIZE - 1; r++) {
    for (let c = 1; c < BOARD_SIZE - 1; c++) {
      coords.push([r, c]);
    }
  }
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }
  for (let i = 0; i < Math.min(jellyCount, coords.length); i++) {
    const [r, c] = coords[i];
    grid[r][c] = true;
  }
  return grid;
}

interface MatchGroup {
  cells: Array<[number, number]>;
  isHoriz: boolean;
  isVert: boolean;
  color: CandyColorId;
}

function findMatchGroups(board: (CandyCell | null)[][]): MatchGroup[] {
  const horizRuns: Array<{ cells: Array<[number, number]>; color: CandyColorId }> = [];
  const vertRuns: Array<{ cells: Array<[number, number]>; color: CandyColorId }> = [];

  for (let r = 0; r < BOARD_SIZE; r++) {
    let c = 0;
    while (c < BOARD_SIZE) {
      const cell = board[r][c];
      if (!cell || cell.special === 'color_bomb') {
        c += 1;
        continue;
      }
      let end = c + 1;
      while (
        end < BOARD_SIZE &&
        board[r][end] &&
        board[r][end]!.special !== 'color_bomb' &&
        board[r][end]!.color === cell.color
      ) {
        end += 1;
      }
      if (end - c >= 3) {
        const list: Array<[number, number]> = [];
        for (let k = c; k < end; k++) list.push([r, k]);
        horizRuns.push({ cells: list, color: cell.color });
      }
      c = end;
    }
  }

  for (let c = 0; c < BOARD_SIZE; c++) {
    let r = 0;
    while (r < BOARD_SIZE) {
      const cell = board[r][c];
      if (!cell || cell.special === 'color_bomb') {
        r += 1;
        continue;
      }
      let end = r + 1;
      while (
        end < BOARD_SIZE &&
        board[end][c] &&
        board[end][c]!.special !== 'color_bomb' &&
        board[end][c]!.color === cell.color
      ) {
        end += 1;
      }
      if (end - r >= 3) {
        const list: Array<[number, number]> = [];
        for (let k = r; k < end; k++) list.push([k, c]);
        vertRuns.push({ cells: list, color: cell.color });
      }
      r = end;
    }
  }

  // Merge overlapping same-color runs (detects T / L shapes cleanly)
  const allRuns = [
    ...horizRuns.map((x) => ({ ...x, isHoriz: true, isVert: false })),
    ...vertRuns.map((x) => ({ ...x, isHoriz: false, isVert: true })),
  ];
  const merged: MatchGroup[] = [];
  const used = new Array(allRuns.length).fill(false);

  for (let i = 0; i < allRuns.length; i++) {
    if (used[i]) continue;
    used[i] = true;
    const cellSet = new Set(allRuns[i].cells.map(([r, c]) => `${r},${c}`));
    let isHoriz = allRuns[i].isHoriz;
    let isVert = allRuns[i].isVert;
    const color = allRuns[i].color;

    let changed = true;
    while (changed) {
      changed = false;
      for (let j = 0; j < allRuns.length; j++) {
        if (used[j] || allRuns[j].color !== color) continue;
        if (allRuns[j].cells.some(([r, c]) => cellSet.has(`${r},${c}`))) {
          used[j] = true;
          allRuns[j].cells.forEach(([r, c]) => cellSet.add(`${r},${c}`));
          if (allRuns[j].isHoriz) isHoriz = true;
          if (allRuns[j].isVert) isVert = true;
          changed = true;
        }
      }
    }

    merged.push({
      cells: Array.from(cellSet).map((s) => {
        const [r, c] = s.split(',').map(Number);
        return [r, c];
      }),
      isHoriz,
      isVert,
      color,
    });
  }
  return merged;
}

function are8WayAdjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  const dr = Math.abs(r1 - r2);
  const dc = Math.abs(c1 - c2);
  return dr <= 1 && dc <= 1 && (dr !== 0 || dc !== 0);
}

interface ValidMoveCandidate {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  score: number;
}

const EIGHT_DIRS: Array<[number, number]> = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
  [0, -1],
  [-1, 0],
];

function findAllValidMoves(board: (CandyCell | null)[][]): ValidMoveCandidate[] {
  const results: ValidMoveCandidate[] = [];
  const seen = new Set<string>();

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const a = board[r][c];
      if (!a) continue;
      for (const [dr, dc] of EIGHT_DIRS) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue;
        const b = board[nr][nc];
        if (!b) continue;
        const key = r * 100 + c < nr * 100 + nc ? `${r},${c}-${nr},${nc}` : `${nr},${nc}-${r},${c}`;
        if (seen.has(key)) continue;
        seen.add(key);

        if (a.special === 'color_bomb' || b.special === 'color_bomb') {
          results.push({ r1: r, c1: c, r2: nr, c2: nc, score: 50 });
          continue;
        }
        if (a.special !== 'none' && b.special !== 'none') {
          results.push({ r1: r, c1: c, r2: nr, c2: nc, score: 40 });
          continue;
        }

        // Simulate swap
        board[r][c] = b;
        board[nr][nc] = a;
        const groups = findMatchGroups(board);
        board[r][c] = a;
        board[nr][nc] = b;

        if (groups.length > 0) {
          const totalMatched = groups.reduce((acc, g) => acc + g.cells.length, 0);
          results.push({ r1: r, c1: c, r2: nr, c2: nc, score: totalMatched });
        }
      }
    }
  }
  results.sort((x, y) => y.score - x.score);
  return results;
}

function createInitialBoard(colorCount: number): CandyCell[][] {
  for (let attempt = 0; attempt < 18; attempt++) {
    const grid: CandyCell[][] = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      const row: CandyCell[] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        const exclude: CandyColorId[] = [];
        if (c >= 2 && row[c - 1].color === row[c - 2].color) exclude.push(row[c - 1].color);
        if (r >= 2 && grid[r - 1][c].color === grid[r - 2][c].color) exclude.push(grid[r - 1][c].color);
        row.push({ uid: nextUid(), color: pickRandomColor(colorCount, exclude), special: 'none' });
      }
      grid.push(row);
    }
    if (findAllValidMoves(grid).length > 0) {
      return grid;
    }
  }
  // Fallback guaranteed board
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => ({
      uid: nextUid(),
      color: pickRandomColor(colorCount),
      special: 'none' as CandySpecialType,
    }))
  );
}

const CandyGemVisual: React.FC<{ color: CandyColorId; special: CandySpecialType; uid: number }> = React.memo(
  ({ color, special, uid }) => {
    const gid = `cg-${color}-${uid}`;

    if (special === 'color_bomb') {
      return (
        <svg viewBox="0 0 64 64" className="w-[88%] h-[88%] drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
          <defs>
            <radialGradient id={`${gid}-cb`} cx="35%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#FFF7ED" />
              <stop offset="32%" stopColor="#6D28D9" />
              <stop offset="72%" stopColor="#3B0764" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="25" fill={`url(#${gid}-cb)`} stroke="#FDE047" strokeWidth="2.4" />
          <g className="origin-center animate-spin-slow">
            <circle cx="32" cy="12" r="3.6" fill="#FB7185" />
            <circle cx="49" cy="22" r="3.6" fill="#FACC15" />
            <circle cx="49" cy="42" r="3.6" fill="#34D399" />
            <circle cx="32" cy="52" r="3.6" fill="#38BDF8" />
            <circle cx="15" cy="42" r="3.6" fill="#C084FC" />
            <circle cx="15" cy="22" r="3.6" fill="#FB923C" />
          </g>
          <circle cx="32" cy="32" r="9.5" fill="#FDE047" opacity="0.92" />
          <path d="M32 23 L34.5 29.5 L41 32 L34.5 34.5 L32 41 L29.5 34.5 L23 32 L29.5 29.5 Z" fill="#FFFFFF" />
        </svg>
      );
    }

    const palette: Record<CandyColorId, { light: string; mid: string; dark: string; stroke: string }> = {
      strawberry: { light: '#FF8FA3', mid: '#F43F5E', dark: '#9F1239', stroke: '#FECDD3' },
      lemon: { light: '#FEF9C3', mid: '#FACC15', dark: '#B45309', stroke: '#FEF08A' },
      emerald: { light: '#A7F3D0', mid: '#10B981', dark: '#065F46', stroke: '#D1FAE5' },
      blueberry: { light: '#BAE6FD', mid: '#0EA5E9', dark: '#1E3A8A', stroke: '#E0F2FE' },
      grape: { light: '#E9D5FF', mid: '#A855F7', dark: '#581C87', stroke: '#F3E8FF' },
      caramel: { light: '#FED7AA', mid: '#EA580C', dark: '#7C2D12', stroke: '#FFEDD5' },
    };
    const p = palette[color];

    return (
      <svg viewBox="0 0 64 64" className="w-[88%] h-[88%] drop-shadow-[0_4px_7px_rgba(0,0,0,0.42)]">
        <defs>
          <radialGradient id={gid} cx="32%" cy="28%" r="72%">
            <stop offset="0%" stopColor={p.light} />
            <stop offset="52%" stopColor={p.mid} />
            <stop offset="100%" stopColor={p.dark} />
          </radialGradient>
        </defs>

        {color === 'strawberry' && (
          <g>
            <path
              d="M32 56 C18 48 10 34 11 23 C12 14 20 12 28 15 C30 16 34 16 36 15 C44 12 52 14 53 23 C54 34 46 48 32 56 Z"
              fill={`url(#${gid})`}
              stroke={p.stroke}
              strokeWidth="2.2"
            />
            <path d="M23 13 Q32 6 41 13 Q32 18 23 13 Z" fill="#22C55E" stroke="#BBF7D0" strokeWidth="1.2" />
            <circle cx="24" cy="29" r="1.5" fill="#FEF08A" opacity="0.85" />
            <circle cx="38" cy="31" r="1.5" fill="#FEF08A" opacity="0.85" />
            <circle cx="31" cy="40" r="1.5" fill="#FEF08A" opacity="0.85" />
          </g>
        )}

        {color === 'lemon' && (
          <g>
            <path
              d="M32 9 C46 15 54 27 52 39 C50 50 41 56 32 56 C23 56 14 50 12 39 C10 27 18 15 32 9 Z"
              fill={`url(#${gid})`}
              stroke={p.stroke}
              strokeWidth="2.2"
            />
            <ellipse cx="25" cy="24" rx="5.5" ry="9" transform="rotate(-24 25 24)" fill="#FFFFFF" opacity="0.42" />
          </g>
        )}

        {color === 'emerald' && (
          <g>
            <polygon
              points="21,10 43,10 54,21 54,43 43,54 21,54 10,43 10,21"
              fill={`url(#${gid})`}
              stroke={p.stroke}
              strokeWidth="2.2"
            />
            <polygon
              points="24,18 40,18 46,24 46,40 40,46 24,46 18,40 18,24"
              fill="none"
              stroke="#FFFFFF"
              strokeOpacity="0.38"
              strokeWidth="1.5"
            />
          </g>
        )}

        {color === 'blueberry' && (
          <g>
            <circle cx="32" cy="33" r="22.5" fill={`url(#${gid})`} stroke={p.stroke} strokeWidth="2.2" />
            <path d="M22 14 L26 11 L32 14 L38 11 L42 14 L37 18 L27 18 Z" fill="#93C5FD" opacity="0.88" />
            <circle cx="24" cy="25" r="5" fill="#FFFFFF" opacity="0.4" />
          </g>
        )}

        {color === 'grape' && (
          <g>
            <polygon
              points="32,8 53,22 48,47 32,56 16,47 11,22"
              fill={`url(#${gid})`}
              stroke={p.stroke}
              strokeWidth="2.2"
            />
            <polygon points="32,16 44,25 40,42 32,47 24,42 20,25" fill="#FFFFFF" fillOpacity="0.16" />
          </g>
        )}

        {color === 'caramel' && (
          <g>
            <rect x="10" y="10" width="44" height="44" rx="14" fill={`url(#${gid})`} stroke={p.stroke} strokeWidth="2.2" />
            <path
              d="M20 34 C20 24 38 22 40 31 C42 39 27 42 26 33 C25 27 33 26 34 31"
              fill="none"
              stroke="#FFF7ED"
              strokeWidth="2.6"
              strokeLinecap="round"
              opacity="0.88"
            />
          </g>
        )}

        {/* Specular Candy Glaze */}
        <ellipse cx="23" cy="20" rx="7" ry="3.2" transform="rotate(-30 23 20)" fill="#FFFFFF" opacity="0.58" />

        {/* Special Candy Frosted Stripes / Wrapped Bomb Glow */}
        {special === 'striped_h' && (
          <g opacity="0.92">
            <rect x="11" y="22" width="42" height="4.5" rx="2.2" fill="#FFFFFF" />
            <rect x="11" y="31" width="42" height="4.5" rx="2.2" fill="#FFFFFF" />
            <rect x="11" y="40" width="42" height="4.5" rx="2.2" fill="#FFFFFF" />
          </g>
        )}
        {special === 'striped_v' && (
          <g opacity="0.92">
            <rect x="22" y="11" width="4.5" height="42" rx="2.2" fill="#FFFFFF" />
            <rect x="31" y="11" width="4.5" height="42" rx="2.2" fill="#FFFFFF" />
            <rect x="40" y="11" width="4.5" height="42" rx="2.2" fill="#FFFFFF" />
          </g>
        )}
        {special === 'wrapped' && (
          <g>
            <rect
              x="7"
              y="7"
              width="50"
              height="50"
              rx="14"
              fill="none"
              stroke="#FDE047"
              strokeWidth="2.6"
              strokeDasharray="6 4"
            />
            <polygon points="32,20 36,28 44,32 36,36 32,44 28,36 20,32 28,28" fill="#FEF08A" opacity="0.95" />
          </g>
        )}
      </svg>
    );
  }
);

export const CandySagaGame: React.FC<CandySagaGameProps> = ({
  lang,
  config,
  rewards,
  remainingFreeToday,
  isSignedIn,
  userPoints,
  savedProgress,
  onSaveProgress,
  onPlayReal,
  onRequireLogin,
  onDemoResult,
}) => {
  const { authToken, apiFetch, showToast, refreshUser, themeMode, setThemeMode } = useStore();
  const tr = (vi: string, en: string) => (lang === 'en' ? en : vi);

  const [hubTab, setHubTab] = useState<SagaHubTab>('play');
  const [profile, setProfile] = useState<CandySagaProfile>(() =>
    isSignedIn ? defaultGuestProfile() : readGuestProfile()
  );
  const [weeklyQuests, setWeeklyQuests] = useState<any[]>([]);
  const [activeLevelNum, setActiveLevelNum] = useState<number>(() =>
    Math.max(1, savedProgress?.current_level || readGuestProfile().currentLevel || 1)
  );
  const levelSpec: SagaLevelSpec = useMemo(() => getSagaLevelSpec(activeLevelNum), [activeLevelNum]);
  const activeSkinObj = useMemo(
    () => SAGA_CHARACTER_SKINS.find((s) => s.id === profile.activeSkin) || SAGA_CHARACTER_SKINS[0],
    [profile.activeSkin]
  );

  // Board State
  const [board, setBoard] = useState<(CandyCell | null)[][]>(() => createInitialBoard(levelSpec.colorCount));
  const [jellyGrid, setJellyGrid] = useState<boolean[][]>(() => createJellyGrid(levelSpec.jellyCount));
  const [movesLeft, setMovesLeft] = useState<number>(() => levelSpec.movesLimit + activeSkinObj.startMovesBonus);
  const [score, setScore] = useState(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [specialsDetonated, setSpecialsDetonated] = useState(0);
  const [combo, setCombo] = useState(0);
  const [busyBoard, setBusyBoard] = useState(false);
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [activeBooster, setActiveBooster] = useState<'hammer' | 'switch8' | 'colorbomb' | null>(null);
  const [hintPair, setHintPair] = useState<[[number, number], [number, number]] | null>(null);
  const [wigglingKeys, setWigglingKeys] = useState<Set<string>>(new Set());
  const [burstingKeys, setBurstingKeys] = useState<Set<string>>(new Set());
  const [dropRowsByUid, setDropRowsByUid] = useState<Record<number, number>>({});
  const [shakeTier, setShakeTier] = useState<'none' | 'light' | 'heavy' | 'epic'>('none');
  const [lightningFlash, setLightningFlash] = useState(false);
  const [shards, setShards] = useState<CandyShard[]>([]);
  const [rings, setRings] = useState<ExplosionRing[]>([]);
  const [scorePops, setScorePops] = useState<FloatingCandyScore[]>([]);
  const [bolts, setBolts] = useState<LightningBoltFx[]>([]);
  const [beamSweeps, setBeamSweeps] = useState<BeamSweepFx[]>([]);
  const [comboPraise, setComboPraise] = useState<string>('');
  const [muted, setMuted] = useState(gameSound.muted);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [stageOutcome, setStageOutcome] = useState<'won' | 'lost' | null>(null);
  const [claimingRoar, setClaimingRoar] = useState(false);
  const [claimedRoarThisStage, setClaimedRoarThisStage] = useState(false);

  // Real-Time WebSocket & Social/Community States
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [pushBanner, setPushBanner] = useState<{ title: string; message: string } | null>(null);
  const [pushPerm, setPushPerm] = useState<NotificationPermission | 'unsupported'>(() =>
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  // PvP Real-Time Duel State
  const [pvpRoom, setPvpRoom] = useState<any | null>(null);
  const [pvpSecondsLeft, setPvpSecondsLeft] = useState(0);
  const [pvpFinishedResult, setPvpFinishedResult] = useState<{ winnerId: number | null; room: any } | null>(null);

  // Leaderboard, Guilds, Auctions, Chat, News, Support, Backups
  const [leaderboardPlayers, setLeaderboardPlayers] = useState<any[]>([]);
  const [leaderboardGuilds, setLeaderboardGuilds] = useState<any[]>([]);
  const [guildsData, setGuildsData] = useState<{ guilds: any[]; myGuild: any | null; members: any[] }>({
    guilds: [],
    myGuild: null,
    members: [],
  });
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildTag, setNewGuildTag] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');

  const [auctionListings, setAuctionListings] = useState<any[]>([]);
  const [sellBoosterKey, setSellBoosterKey] = useState<'hammer' | 'switch8' | 'colorbomb' | 'moves5'>('hammer');
  const [sellStartPrice, setSellStartPrice] = useState('45');

  const [chatChannel, setChatChannel] = useState<string>('global');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');

  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportChannel, setSupportChannel] = useState<'web' | 'zalo' | 'email' | 'hotline'>('web');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [replyByTicket, setReplyByTicket] = useState<Record<number, string>>({});
  const [backups, setBackups] = useState<any[]>([]);

  const dragStartRef = useRef<{ row: number; col: number; x: number; y: number } | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const minScoreToWin = Number(config?.min_score_to_win || 900);
  const extraCost = Number(config?.extra_play_cost_points || 20);
  const jelliesLeft = useMemo(() => jellyGrid.flat().filter(Boolean).length, [jellyGrid]);
  const collectRemaining = useMemo(
    () => (levelSpec.collectTarget ? Math.max(0, levelSpec.collectTarget - collectedCount) : 0),
    [levelSpec.collectTarget, collectedCount]
  );

  // Sync Backend Saga State
  const loadSagaState = useCallback(
    async (syncLevelOnFirst = false) => {
      if (!isSignedIn) {
        const gp = readGuestProfile();
        setProfile(gp);
        if (syncLevelOnFirst) {
          setActiveLevelNum(Math.max(1, savedProgress?.current_level || gp.currentLevel || 1));
        }
        return;
      }
      try {
        const res = await apiFetch('/api/saga/state');
        if (res.ok) {
          const d = await res.json();
          if (d.profile) {
            setProfile(d.profile);
            if (syncLevelOnFirst) {
              setActiveLevelNum(Math.max(1, savedProgress?.current_level || d.profile.currentLevel || 1));
            }
          }
          if (Array.isArray(d.weeklyQuests)) setWeeklyQuests(d.weeklyQuests);
        }
      } catch {
        // ignore
      }
    },
    [apiFetch, isSignedIn, savedProgress?.current_level]
  );

  useEffect(() => {
    loadSagaState(true);
  }, [isSignedIn]);

  // Start / Reset a level
  const initStage = useCallback(
    (lvlNum: number, skinId?: string) => {
      const spec = getSagaLevelSpec(lvlNum);
      const skin = SAGA_CHARACTER_SKINS.find((s) => s.id === (skinId || profile.activeSkin)) || SAGA_CHARACTER_SKINS[0];
      setActiveLevelNum(spec.level);
      setBoard(createInitialBoard(spec.colorCount));
      setJellyGrid(createJellyGrid(spec.jellyCount));
      setMovesLeft(spec.movesLimit + skin.startMovesBonus);
      setScore(0);
      setCollectedCount(0);
      setSpecialsDetonated(0);
      setCombo(0);
      setSelectedCell(null);
      setActiveBooster(null);
      setHintPair(null);
      setStageOutcome(null);
      setClaimedRoarThisStage(false);
      setBusyBoard(false);
      setBurstingKeys(new Set());
      setWigglingKeys(new Set());
      setDropRowsByUid({});
      setShakeTier('none');
      setLightningFlash(false);
      setScorePops([]);
      setShards([]);
      setRings([]);
      setBolts([]);
      setBeamSweeps([]);
    },
    [profile.activeSkin]
  );

  // Real WebSocket Connection (/ws)
  const triggerPushBanner = useCallback(
    (title: string, message: string) => {
      setPushBanner({ title, message });
      window.setTimeout(() => setPushBanner((curr) => (curr?.title === title ? null : curr)), 4500);
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, { body: message, icon: '/pwa-192x192.png' });
        } catch {
          // ignore browser notification failures
        }
      }
    },
    []
  );

  const loadAuctions = useCallback(async () => {
    const res = await apiFetch('/api/auctions');
    if (res.ok) {
      const d = await res.json();
      setAuctionListings(d.listings || []);
    }
  }, [apiFetch]);

  const loadSupportTickets = useCallback(async () => {
    if (!isSignedIn) return;
    const res = await apiFetch('/api/support/tickets');
    if (res.ok) {
      const d = await res.json();
      setSupportTickets(d.tickets || []);
    }
  }, [apiFetch, isSignedIn]);

  const loadNews = useCallback(async () => {
    const res = await apiFetch('/api/game-news');
    if (res.ok) {
      const d = await res.json();
      setNewsPosts(d.posts || []);
    }
  }, [apiFetch]);

  const loadLeaderboardAndGuilds = useCallback(async () => {
    const [lbRes, gRes] = await Promise.all([apiFetch('/api/saga/leaderboard'), apiFetch('/api/guilds')]);
    if (lbRes.ok) {
      const d = await lbRes.json();
      setLeaderboardPlayers(d.players || []);
      setLeaderboardGuilds(d.guilds || []);
    }
    if (gRes.ok) {
      const d = await gRes.json();
      setGuildsData({ guilds: d.guilds || [], myGuild: d.myGuild || null, members: d.members || [] });
    }
  }, [apiFetch]);

  const loadChatHistory = useCallback(
    async (channel: string) => {
      const res = await apiFetch(`/api/chat/history?channel=${encodeURIComponent(channel)}`);
      if (res.ok) {
        const d = await res.json();
        setChatMessages(d.messages || []);
      }
    },
    [apiFetch]
  );

  const loadBackups = useCallback(async () => {
    if (!isSignedIn) return;
    const res = await apiFetch('/api/account/backups');
    if (res.ok) {
      const d = await res.json();
      setBackups(d.backups || []);
    }
  }, [apiFetch, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    let closed = false;
    let ws: WebSocket | null = null;
    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const tokenQuery = authToken ? `?token=${encodeURIComponent(authToken)}` : '';
      ws = new WebSocket(`${proto}//${window.location.host}/ws${tokenQuery}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!closed) setWsConnected(true);
      };
      ws.onclose = () => {
        if (!closed) setWsConnected(false);
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'ws:connected') {
            setOnlineCount(Number(msg.onlineCount || 1));
          } else if (msg.type === 'chat:message') {
            setChatMessages((prev) => [...prev.slice(-49), msg.item]);
          } else if (msg.type === 'pvp:waiting') {
            setPvpRoom(msg.room);
            setPvpFinishedResult(null);
          } else if (msg.type === 'pvp:started') {
            setPvpRoom(msg.room);
            setPvpFinishedResult(null);
            initStage(Math.max(1, activeLevelNum));
            setHubTab('play');
            showToast(tr('Đã ghép cặp PvP thành công! Trận đấu 75 giây bắt đầu!', 'PvP Match Started! 75s live duel!'));
            gameSound.victoryFanfare();
          } else if (msg.type === 'pvp:update') {
            setPvpRoom(msg.room);
          } else if (msg.type === 'pvp:cancelled') {
            setPvpRoom(null);
            loadSagaState(false);
          } else if (msg.type === 'pvp:finished') {
            setPvpRoom(null);
            setPvpFinishedResult({ winnerId: msg.winnerId, room: msg.room });
            loadSagaState(false);
            if (msg.winnerId === profile.userId) {
              gameSound.victoryFanfare();
              triggerPushBanner(tr('Chiến thắng PvP!', 'PvP Victory!'), tr('Bạn đã thắng trận đấu Candy Saga!', 'You won the live PvP duel!'));
            }
          } else if (msg.type === 'auction:update') {
            loadAuctions();
          } else if (msg.type === 'news:update') {
            loadNews();
          } else if (msg.type === 'support:update') {
            loadSupportTickets();
          } else if (msg.type === 'push:notify') {
            triggerPushBanner(lang === 'en' ? msg.titleEn : msg.titleVi, lang === 'en' ? msg.messageEn : msg.messageVi);
          } else if (msg.type === 'pvp:error' || msg.type === 'ws:error') {
            showToast(msg.error || 'Error');
          }
        } catch {
          // ignore malformed ws frame
        }
      };
    } catch {
      // ignore ws init failure
    }
    return () => {
      closed = true;
      ws?.close();
      wsRef.current = null;
    };
  }, [isSignedIn, authToken]);

  // PvP live countdown timer + score sync
  useEffect(() => {
    if (!pvpRoom || pvpRoom.status !== 'active') {
      setPvpSecondsLeft(0);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((pvpRoom.endsAtMs - Date.now()) / 1000));
      setPvpSecondsLeft(rem);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [pvpRoom]);

  useEffect(() => {
    if (pvpRoom && pvpRoom.status === 'active' && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'pvp:score', roomCode: pvpRoom.roomCode, score }));
    }
  }, [score, pvpRoom]);

  // Tab data loading
  useEffect(() => {
    if (hubTab === 'guild' || hubTab === 'social') loadLeaderboardAndGuilds();
    if (hubTab === 'auction') loadAuctions();
    if (hubTab === 'social') {
      loadNews();
      loadChatHistory(chatChannel);
    }
    if (hubTab === 'guild' && guildsData.myGuild) {
      loadChatHistory(`guild:${guildsData.myGuild.id}`);
    }
    if (hubTab === 'support') {
      loadSupportTickets();
      loadBackups();
    }
  }, [hubTab, chatChannel]);

  // Visual Effects Helpers
  const spawnExplosionFx = useCallback(
    (
      cellsToBurst: Array<[number, number]>,
      lightningLines: LightningBoltFx[],
      opts: {
        shake: 'none' | 'light' | 'heavy' | 'epic';
        hasThunder: boolean;
        hasWrapped?: boolean;
        beams?: BeamSweepFx[];
        stepPts: number;
        gridSnapshot?: (CandyCell | null)[][];
        jellySnapshot?: boolean[][];
      }
    ) => {
      const refGrid = opts.gridSnapshot || board;
      const refJelly = opts.jellySnapshot || jellyGrid;
      const newShards: CandyShard[] = [];
      const newRings: ExplosionRing[] = [];
      const wrappedCenters: Array<{ leftPct: number; topPct: number; colorHex: string }> = [];
      const wiggleSet = new Set<string>();
      const burstSet = new Set<string>();

      let sumLeft = 0;
      let sumTop = 0;
      const sample = cellsToBurst.slice(0, 36);

      sample.forEach(([r, c], idx) => {
        const key = `${r},${c}`;
        wiggleSet.add(key);
        burstSet.add(key);
        const cell = refGrid[r]?.[c];
        const hasJelly = Boolean(refJelly[r]?.[c]);
        const hex = cell ? CANDY_CATALOG[cell.color].glowHex : '#FACC15';
        const leftPct = ((c + 0.5) / BOARD_SIZE) * 100;
        const topPct = ((r + 0.5) / BOARD_SIZE) * 100;
        sumLeft += leftPct;
        sumTop += topPct;

        if (cell?.special === 'wrapped') {
          wrappedCenters.push({ leftPct, topPct, colorHex: hex });
        }

        if (idx % 2 === 0 || (cell && cell.special !== 'none')) {
          newRings.push({
            id: `ring-${Date.now()}-${r}-${c}-${idx}`,
            leftPct,
            topPct,
            colorHex: hex,
            large: Boolean(cell && cell.special !== 'none'),
          });
        }
        const shardCount = cell && cell.special !== 'none' ? 4 : 3;
        for (let s = 0; s < shardCount; s++) {
          const ang = Math.random() * Math.PI * 2;
          const dist = 28 + Math.random() * 60;
          newShards.push({
            id: `sh-${Date.now()}-${r}-${c}-${s}-${idx}`,
            leftPct,
            topPct,
            tx: Math.cos(ang) * dist,
            ty: Math.sin(ang) * dist,
            rot: Math.round((Math.random() - 0.5) * 380),
            colorHex: hasJelly && s === 0 ? '#7DD3FC' : hex,
            size: 6 + Math.random() * 6,
          });
        }
      });

      if (sample.length > 0 && opts.stepPts > 0) {
        setScorePops((prev) => [
          ...prev.slice(-6),
          {
            id: `pop-${Date.now()}-${Math.random()}`,
            leftPct: sumLeft / sample.length,
            topPct: sumTop / sample.length,
            points: opts.stepPts,
            isEpic: opts.shake === 'epic' || opts.shake === 'heavy',
          },
        ]);
      }

      setWigglingKeys(wiggleSet);
      setBurstingKeys(burstSet);
      setShards((prev) => [...prev.slice(-40), ...newShards]);
      setRings((prev) => [...prev.slice(-16), ...newRings]);
      if (opts.beams && opts.beams.length > 0) {
        setBeamSweeps((prev) => [...prev.slice(-10), ...opts.beams!]);
      }

      // Wrapped Candy Signature Double-Shockwave Echo (Candy Crush style!)
      if (opts.hasWrapped && wrappedCenters.length > 0) {
        window.setTimeout(() => {
          if (!mountedRef.current) return;
          const echoRings: ExplosionRing[] = wrappedCenters.map((wc, idx) => ({
            id: `w-echo-${Date.now()}-${idx}`,
            leftPct: wc.leftPct,
            topPct: wc.topPct,
            colorHex: wc.colorHex,
            large: true,
          }));
          setRings((prev) => [...prev.slice(-14), ...echoRings]);
        }, 175);
      }

      if (lightningLines.length > 0 || opts.hasThunder) {
        setBolts((prev) => [...prev.slice(-10), ...lightningLines]);
        setLightningFlash(true);
        window.setTimeout(() => {
          if (mountedRef.current) setLightningFlash(false);
        }, 420);
      }
      if (opts.shake !== 'none') {
        setShakeTier(opts.shake);
        window.setTimeout(() => {
          if (mountedRef.current) setShakeTier('none');
        }, 430);
      }
      window.setTimeout(() => {
        if (!mountedRef.current) return;
        setWigglingKeys(new Set());
        setBurstingKeys(new Set());
        setShards([]);
        setRings([]);
        setBolts([]);
        setBeamSweeps([]);
        setScorePops([]);
      }, 690);
    },
    [board, jellyGrid]
  );

  // Trigger Victory / Level Persistence
  const handleStageVictory = useCallback(
    async (finalScore: number, specialsCount: number, movesLeftNow: number) => {
      setStageOutcome('won');
      gameSound.victoryFanfare();
      const stars = movesLeftNow >= 8 ? 3 : movesLeftNow >= 3 ? 2 : 1;
      const nextLvl = activeLevelNum + 1;

      if (isSignedIn) {
        try {
          const res = await apiFetch('/api/saga/complete-level', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              levelNumber: activeLevelNum,
              score: finalScore,
              coinReward: levelSpec.coinReward,
              specialsTriggered: specialsCount,
              stars,
            }),
          });
          if (res.ok) {
            const d = await res.json();
            if (d.profile) setProfile(d.profile);
            if (Array.isArray(d.weeklyQuests)) setWeeklyQuests(d.weeklyQuests);
          }
        } catch {
          // ignore
        }
      } else {
        setProfile((prev) => {
          const updated: CandySagaProfile = {
            ...prev,
            coins: prev.coins + levelSpec.coinReward,
            currentLevel: Math.max(prev.currentLevel, nextLvl),
            maxLevel: Math.max(prev.maxLevel, nextLvl),
            totalScore: prev.totalScore + finalScore,
            seasonalScore: prev.seasonalScore + finalScore,
          };
          writeGuestProfile(updated);
          return updated;
        });
      }

      onSaveProgress?.({
        currentLevel: nextLvl,
        maxLevel: Math.max(savedProgress?.max_level || 1, profile.maxLevel, nextLvl),
        bestScore: Math.max(savedProgress?.best_score || 0, finalScore),
      });
    },
    [activeLevelNum, apiFetch, isSignedIn, levelSpec.coinReward, onSaveProgress, profile.maxLevel, savedProgress]
  );

  // Core Cascade Resolution Engine (with Special Candies, Lightning & Jelly)
  const resolveBoardCascades = useCallback(
    async (
      startGrid: (CandyCell | null)[][],
      startJelly: boolean[][],
      initialBurstCells: Array<[number, number]>,
      initialSpecialTransform: Map<string, { color: CandyColorId; special: CandySpecialType }>,
      movesAfterSwap: number
    ) => {
      setBusyBoard(true);
      let curGrid: (CandyCell | null)[][] = startGrid.map((r) => r.map((c) => (c ? { ...c } : null)));
      const curJelly: boolean[][] = startJelly.map((r) => [...r]);
      let totalScoreGained = 0;
      let totalCollected = 0;
      let totalSpecials = 0;
      let cascadeStep = 0;

      const expandSpecialClear = (
        seedCells: Array<[number, number]>,
        grid: (CandyCell | null)[][]
      ): {
        allCells: Set<string>;
        boltsFx: LightningBoltFx[];
        beamsFx: BeamSweepFx[];
        triggeredSpecialCount: number;
        hasExplosion: boolean;
        hasWrapped: boolean;
        hasStriped: boolean;
        hasThunder: boolean;
      } => {
        const toClear = new Set<string>(seedCells.map(([r, c]) => `${r},${c}`));
        const queue: Array<[number, number]> = [...seedCells];
        const processed = new Set<string>();
        const boltsFx: LightningBoltFx[] = [];
        const beamsFx: BeamSweepFx[] = [];
        let triggeredSpecialCount = 0;
        let hasExplosion = false;
        let hasWrapped = false;
        let hasStriped = false;
        let hasThunder = false;

        while (queue.length > 0) {
          const [r, c] = queue.shift()!;
          const key = `${r},${c}`;
          if (processed.has(key)) continue;
          processed.add(key);

          const cell = grid[r]?.[c];
          if (!cell) continue;
          if (cell.special !== 'none') triggeredSpecialCount += 1;

          const pctX = ((c + 0.5) / BOARD_SIZE) * 100;
          const pctY = ((r + 0.5) / BOARD_SIZE) * 100;
          const colorHex = CANDY_CATALOG[cell.color].glowHex;

          if (cell.special === 'striped_h') {
            hasThunder = true;
            hasStriped = true;
            const bolt = buildJaggedBoltPoints(2, pctY, 98, pctY, 4.5);
            boltsFx.push({ id: `bh-${Date.now()}-${r}-${c}`, points: bolt.main, branchPoints: bolt.branch, colorHex });
            beamsFx.push({ id: `bmh-${Date.now()}-${r}-${c}`, axis: 'h', posPct: pctY, colorHex });
            for (let cc = 0; cc < BOARD_SIZE; cc++) {
              const k = `${r},${cc}`;
              if (!toClear.has(k)) {
                toClear.add(k);
                queue.push([r, cc]);
              }
            }
          } else if (cell.special === 'striped_v') {
            hasThunder = true;
            hasStriped = true;
            const bolt = buildJaggedBoltPoints(pctX, 2, pctX, 98, 4.5);
            boltsFx.push({ id: `bv-${Date.now()}-${r}-${c}`, points: bolt.main, branchPoints: bolt.branch, colorHex });
            beamsFx.push({ id: `bmv-${Date.now()}-${r}-${c}`, axis: 'v', posPct: pctX, colorHex });
            for (let rr = 0; rr < BOARD_SIZE; rr++) {
              const k = `${rr},${c}`;
              if (!toClear.has(k)) {
                toClear.add(k);
                queue.push([rr, c]);
              }
            }
          } else if (cell.special === 'wrapped') {
            hasExplosion = true;
            hasWrapped = true;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const rr = r + dr;
                const cc = c + dc;
                if (rr >= 0 && rr < BOARD_SIZE && cc >= 0 && cc < BOARD_SIZE) {
                  const k = `${rr},${cc}`;
                  if (!toClear.has(k)) {
                    toClear.add(k);
                    queue.push([rr, cc]);
                  }
                }
              }
            }
          } else if (cell.special === 'color_bomb') {
            hasThunder = true;
            hasExplosion = true;
            const targetColor = cell.color;
            for (let rr = 0; rr < BOARD_SIZE; rr++) {
              for (let cc = 0; cc < BOARD_SIZE; cc++) {
                if (grid[rr][cc]?.color === targetColor) {
                  const k = `${rr},${cc}`;
                  const bolt = buildJaggedBoltPoints(
                    pctX,
                    pctY,
                    ((cc + 0.5) / BOARD_SIZE) * 100,
                    ((rr + 0.5) / BOARD_SIZE) * 100,
                    5.2
                  );
                  boltsFx.push({
                    id: `bc-${Date.now()}-${rr}-${cc}`,
                    points: bolt.main,
                    branchPoints: bolt.branch,
                    colorHex: CANDY_CATALOG[targetColor].glowHex,
                  });
                  if (!toClear.has(k)) {
                    toClear.add(k);
                    queue.push([rr, cc]);
                  }
                }
              }
            }
          }
        }
        return { allCells: toClear, boltsFx, beamsFx, triggeredSpecialCount, hasExplosion, hasWrapped, hasStriped, hasThunder };
      };

      let pendingDirectCells = initialBurstCells;
      let pendingTransforms = initialSpecialTransform;

      while (true) {
        const groups = findMatchGroups(curGrid);
        if (groups.length === 0 && pendingDirectCells.length === 0) break;

        cascadeStep += 1;
        const seedCoords: Array<[number, number]> = [...pendingDirectCells];
        const spawnMap = new Map<string, { color: CandyColorId; special: CandySpecialType }>(pendingTransforms);

        for (const g of groups) {
          for (const coord of g.cells) seedCoords.push(coord);
          const anchor = g.cells[Math.floor(g.cells.length / 2)];
          if (g.cells.length >= 5 && (g.isHoriz !== g.isVert || g.cells.length >= 6)) {
            spawnMap.set(`${anchor[0]},${anchor[1]}`, { color: g.color, special: 'color_bomb' });
          } else if (g.isHoriz && g.isVert) {
            spawnMap.set(`${anchor[0]},${anchor[1]}`, { color: g.color, special: 'wrapped' });
          } else if (g.cells.length === 4) {
            spawnMap.set(`${anchor[0]},${anchor[1]}`, {
              color: g.color,
              special: g.isHoriz ? 'striped_v' : 'striped_h',
            });
          }
        }
        pendingDirectCells = [];
        pendingTransforms = new Map();

        const expanded = expandSpecialClear(seedCoords, curGrid);
        const clearedCoords = Array.from(expanded.allCells).map((s) => s.split(',').map(Number) as [number, number]);

        // Character Skill: Thunder proc!
        if (
          expanded.triggeredSpecialCount > 0 &&
          Math.random() * 100 < activeSkinObj.thunderChancePct &&
          clearedCoords.length > 0
        ) {
          const strikeRow = Math.floor(Math.random() * BOARD_SIZE);
          expanded.hasThunder = true;
          const rowY = ((strikeRow + 0.5) / BOARD_SIZE) * 100;
          const skillBolt = buildJaggedBoltPoints(2, rowY, 98, rowY, 6.5);
          expanded.boltsFx.push({
            id: `skill-bolt-${Date.now()}`,
            points: skillBolt.main,
            branchPoints: skillBolt.branch,
            colorHex: '#C084FC',
          });
          expanded.beamsFx.push({
            id: `skill-beam-${Date.now()}`,
            axis: 'h',
            posPct: rowY,
            colorHex: '#C084FC',
          });
          for (let cc = 0; cc < BOARD_SIZE; cc++) {
            const k = `${strikeRow},${cc}`;
            if (!expanded.allCells.has(k)) {
              expanded.allCells.add(k);
              clearedCoords.push([strikeRow, cc]);
            }
          }
        }

        // Calculate points for floating score & audio tier
        let previewPts = 0;
        for (const [r, c] of clearedCoords) {
          previewPts += curJelly[r][c] ? 65 : 35;
        }
        const skillBonus = 1 + activeSkinObj.scoreBonusPct / 100;
        const stepScoreTotal = Math.round(
          (previewPts + spawnMap.size * 55) * (1 + (cascadeStep - 1) * 0.35) * skillBonus
        );

        const nextShakeTier: 'none' | 'light' | 'heavy' | 'epic' =
          expanded.triggeredSpecialCount >= 2 || clearedCoords.length >= 12 || cascadeStep >= 3
            ? 'epic'
            : expanded.hasExplosion || expanded.hasThunder || clearedCoords.length >= 6
              ? 'heavy'
              : cascadeStep >= 2 || clearedCoords.length >= 4
                ? 'light'
                : 'none';

        // Authentic Candy Crush Saga Tiered Sound + Visual FX
        if (expanded.hasThunder && expanded.hasExplosion) {
          gameSound.colorBombBlast();
        } else if (expanded.hasWrapped) {
          gameSound.wrappedDoubleBoom();
        } else if (expanded.hasStriped) {
          gameSound.stripedLaser();
        } else if (expanded.hasThunder) {
          gameSound.thunderZap();
        } else if (expanded.hasExplosion) {
          gameSound.candyBoom();
        }
        gameSound.candyMatch(cascadeStep);
        spawnExplosionFx(clearedCoords, expanded.boltsFx, {
          shake: nextShakeTier,
          hasThunder: expanded.hasThunder,
          hasWrapped: expanded.hasWrapped,
          beams: expanded.beamsFx,
          stepPts: stepScoreTotal,
          gridSnapshot: curGrid,
          jellySnapshot: curJelly,
        });

        // Show bursting frame smoothly BEFORE cells drop away
        setBoard(curGrid.map((r) => r.map((c) => (c ? { ...c } : null))));
        setCombo(cascadeStep);
        if (cascadeStep >= 2 || expanded.triggeredSpecialCount > 0 || clearedCoords.length >= 5) {
          const words = ['SWEET!', 'TASTY!', 'DELICIOUS!', 'DIVINE!', 'SUGAR CRUSH!'];
          const wordIdx = expanded.triggeredSpecialCount >= 2 || clearedCoords.length >= 14
            ? 4
            : Math.min(words.length - 1, Math.max(0, cascadeStep - 2));
          setComboPraise(words[wordIdx] + (cascadeStep >= 3 ? ` x${cascadeStep}` : ''));
        }

        await new Promise((res) => window.setTimeout(res, 220));
        if (!mountedRef.current) return;

        // Remove cells & clear jelly & spawn new special candies
        for (const [r, c] of clearedCoords) {
          const cell = curGrid[r][c];
          if (cell && levelSpec.collectColor && cell.color === levelSpec.collectColor) {
            totalCollected += 1;
          }
          if (curJelly[r][c]) {
            curJelly[r][c] = false;
          }
          const spawnKey = `${r},${c}`;
          const spawnInfo = spawnMap.get(spawnKey);
          if (spawnInfo) {
            curGrid[r][c] = { uid: nextUid(), color: spawnInfo.color, special: spawnInfo.special };
          } else {
            curGrid[r][c] = null;
          }
        }

        totalScoreGained += stepScoreTotal;
        totalSpecials += expanded.triggeredSpecialCount + spawnMap.size;
        setJellyGrid(curJelly.map((r) => [...r]));

        // Gravity collapse + Refill with smooth row drop offsets!
        const nextDropOffsets: Record<number, number> = {};
        for (let c = 0; c < BOARD_SIZE; c++) {
          const colItems: Array<{ cell: CandyCell; fromRow: number }> = [];
          for (let r = BOARD_SIZE - 1; r >= 0; r--) {
            if (curGrid[r][c]) colItems.push({ cell: curGrid[r][c]!, fromRow: r });
          }
          const missingCount = BOARD_SIZE - colItems.length;
          for (let r = BOARD_SIZE - 1; r >= 0; r--) {
            const idx = BOARD_SIZE - 1 - r;
            if (idx < colItems.length) {
              const item = colItems[idx];
              curGrid[r][c] = item.cell;
              const delta = r - item.fromRow;
              if (delta > 0) nextDropOffsets[item.cell.uid] = delta;
            } else {
              const spawned: CandyCell = {
                uid: nextUid(),
                color: pickRandomColor(levelSpec.colorCount),
                special: 'none',
              };
              curGrid[r][c] = spawned;
              nextDropOffsets[spawned.uid] = Math.max(1, missingCount);
            }
          }
        }

        setDropRowsByUid(nextDropOffsets);
        setBurstingKeys(new Set());
        setBoard(curGrid.map((r) => [...r]));
        await new Promise((res) => window.setTimeout(res, 290));
        if (!mountedRef.current) return;
        setDropRowsByUid({});
      }

      // Check valid moves & auto-reshuffle if deadlocked!
      let finalGrid: (CandyCell | null)[][] = curGrid;
      if (findAllValidMoves(finalGrid).length === 0) {
        finalGrid = createInitialBoard(levelSpec.colorCount);
        setBoard(finalGrid);
        showToast(tr('Không còn nước đi — hệ thống tự động xáo trộn bảng kẹo!', 'No valid moves left — board auto-shuffled!'));
      }

      const nextScore = score + totalScoreGained;
      const nextCollected = collectedCount + totalCollected;
      const nextSpecials = specialsDetonated + totalSpecials;

      setScore(nextScore);
      setCollectedCount(nextCollected);
      setSpecialsDetonated(nextSpecials);

      // Evaluate level objective completion
      const jLeft = curJelly.flat().filter(Boolean).length;
      const colGoalMet = !levelSpec.collectTarget || nextCollected >= levelSpec.collectTarget;
      const wonNow = nextScore >= levelSpec.targetScore && jLeft === 0 && colGoalMet;

      if (wonNow) {
        // Signature Candy Crush SUGAR CRUSH Finish Bonus!
        if (movesAfterSwap > 0) {
          const crushBonus = movesAfterSwap * 60;
          const finalCrushScore = nextScore + crushBonus;
          setComboPraise('SUGAR CRUSH!');
          gameSound.sugarCrushFanfare();
          const randSpots: Array<[number, number]> = Array.from({ length: Math.min(10, movesAfterSwap * 2) }, () => [
            Math.floor(Math.random() * BOARD_SIZE),
            Math.floor(Math.random() * BOARD_SIZE),
          ]);
          spawnExplosionFx(randSpots, [], {
            shake: 'heavy',
            hasThunder: false,
            stepPts: crushBonus,
            gridSnapshot: curGrid,
          });
          setScore(finalCrushScore);
          await new Promise((res) => window.setTimeout(res, 650));
          if (!mountedRef.current) return;
          setComboPraise('');
          setBusyBoard(false);
          handleStageVictory(finalCrushScore, nextSpecials + movesAfterSwap, movesAfterSwap);
        } else {
          setComboPraise('');
          setBusyBoard(false);
          handleStageVictory(nextScore, nextSpecials, movesAfterSwap);
        }
      } else {
        setComboPraise('');
        setBusyBoard(false);
        if (movesAfterSwap <= 0) {
          gameSound.gameOver();
          setStageOutcome('lost');
        }
      }
    },
    [
      activeSkinObj.scoreBonusPct,
      activeSkinObj.thunderChancePct,
      collectedCount,
      handleStageVictory,
      levelSpec.collectColor,
      levelSpec.collectTarget,
      levelSpec.colorCount,
      levelSpec.targetScore,
      score,
      showToast,
      spawnExplosionFx,
      specialsDetonated,
    ]
  );

  // Consume Booster on backend or guest
  const consumeBooster = async (key: 'hammer' | 'switch8' | 'colorbomb' | 'moves5'): Promise<boolean> => {
    if (profile.boosters[key] <= 0) {
      showToast(tr('Bạn đã hết vật phẩm hỗ trợ này! Mua thêm ở tab Nhân Vật.', 'Out of this booster! Buy more in Character tab.'));
      return false;
    }
    if (isSignedIn) {
      const res = await apiFetch('/api/saga/use-booster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boosterKey: key }),
      });
      if (!res.ok) return false;
      const d = await res.json();
      if (d.profile) setProfile(d.profile);
      return true;
    }
    setProfile((prev) => {
      const next = {
        ...prev,
        boosters: { ...prev.boosters, [key]: Math.max(0, prev.boosters[key] - 1) },
      };
      writeGuestProfile(next);
      return next;
    });
    return true;
  };

  // Attempt Swap (8-Directional: Orthogonal & Diagonal!)
  const attemptSwap = useCallback(
    async (r1: number, c1: number, r2: number, c2: number) => {
      if (busyBoard || stageOutcome) return;
      if (!are8WayAdjacent(r1, c1, r2, c2)) return;
      const cellA = board[r1]?.[c1];
      const cellB = board[r2]?.[c2];
      if (!cellA || !cellB) return;

      setHintPair(null);
      setSelectedCell(null);

      // Free 8-Way Switcher booster active?
      const isFreeSwitch = activeBooster === 'switch8';
      if (isFreeSwitch) {
        const ok = await consumeBooster('switch8');
        setActiveBooster(null);
        if (!ok) return;
      }

      const nextGrid: (CandyCell | null)[][] = board.map((r) => [...r]);
      nextGrid[r1][c1] = cellB;
      nextGrid[r2][c2] = cellA;

      // Authentic Candy Crush Saga Special Combo Pairs!
      if (cellA.special === 'color_bomb' && cellB.special === 'color_bomb') {
        // Double Color Bomb clears entire board!
        gameSound.colorBombBlast();
        const allCoords: Array<[number, number]> = [];
        for (let rr = 0; rr < BOARD_SIZE; rr++) {
          for (let cc = 0; cc < BOARD_SIZE; cc++) allCoords.push([rr, cc]);
        }
        const nextMoves = Math.max(0, movesLeft - (isFreeSwitch ? 0 : 1));
        setMovesLeft(nextMoves);
        setBoard(nextGrid);
        await resolveBoardCascades(nextGrid, jellyGrid, allCoords, new Map(), nextMoves);
        return;
      }

      if (cellA.special === 'color_bomb' || cellB.special === 'color_bomb') {
        const bombCell = cellA.special === 'color_bomb' ? cellA : cellB;
        const otherCell = cellA.special === 'color_bomb' ? cellB : cellA;
        const [br, bc] = cellA.special === 'color_bomb' ? [r2, c2] : [r1, c1];
        nextGrid[br][bc] = { ...bombCell, color: otherCell.color };

        // Color Bomb + Striped or Color Bomb + Wrapped mega transformation!
        if (otherCell.special === 'striped_h' || otherCell.special === 'striped_v' || otherCell.special === 'wrapped') {
          gameSound.colorBombBlast();
          for (let rr = 0; rr < BOARD_SIZE; rr++) {
            for (let cc = 0; cc < BOARD_SIZE; cc++) {
              const target = nextGrid[rr][cc];
              if (target && target.color === otherCell.color && !(rr === br && cc === bc)) {
                nextGrid[rr][cc] = {
                  ...target,
                  special:
                    otherCell.special === 'wrapped'
                      ? 'wrapped'
                      : (rr + cc) % 2 === 0
                        ? 'striped_h'
                        : 'striped_v',
                };
              }
            }
          }
        }

        const nextMoves = Math.max(0, movesLeft - (isFreeSwitch ? 0 : 1));
        setMovesLeft(nextMoves);
        setBoard(nextGrid);
        await resolveBoardCascades(nextGrid, jellyGrid, [[br, bc]], new Map(), nextMoves);
        return;
      }

      if (cellA.special !== 'none' && cellB.special !== 'none') {
        const nextMoves = Math.max(0, movesLeft - (isFreeSwitch ? 0 : 1));
        setMovesLeft(nextMoves);
        setBoard(nextGrid);

        const hasStripedPair =
          cellA.special === 'striped_h' ||
          cellA.special === 'striped_v' ||
          cellB.special === 'striped_h' ||
          cellB.special === 'striped_v';
        const hasWrappedPair = cellA.special === 'wrapped' || cellB.special === 'wrapped';

        // Striped + Wrapped = GIANT 3-Row + 3-Column Cross Laser!
        if (hasStripedPair && hasWrappedPair) {
          const megaCoords: Array<[number, number]> = [];
          for (let dr = -1; dr <= 1; dr++) {
            const rr = r2 + dr;
            if (rr >= 0 && rr < BOARD_SIZE) {
              for (let cc = 0; cc < BOARD_SIZE; cc++) megaCoords.push([rr, cc]);
            }
          }
          for (let dc = -1; dc <= 1; dc++) {
            const cc = c2 + dc;
            if (cc >= 0 && cc < BOARD_SIZE) {
              for (let rr = 0; rr < BOARD_SIZE; rr++) megaCoords.push([rr, cc]);
            }
          }
          await resolveBoardCascades(nextGrid, jellyGrid, megaCoords, new Map(), nextMoves);
          return;
        }

        // Wrapped + Wrapped = Giant 5x5 Crater Blast!
        if (cellA.special === 'wrapped' && cellB.special === 'wrapped') {
          const craterCoords: Array<[number, number]> = [];
          for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
              const rr = r2 + dr;
              const cc = c2 + dc;
              if (rr >= 0 && rr < BOARD_SIZE && cc >= 0 && cc < BOARD_SIZE) {
                craterCoords.push([rr, cc]);
              }
            }
          }
          await resolveBoardCascades(nextGrid, jellyGrid, craterCoords, new Map(), nextMoves);
          return;
        }

        // Striped + Striped = Twin Cross Sweep at destination
        nextGrid[r1][c1] = { ...cellB, special: 'striped_h' };
        nextGrid[r2][c2] = { ...cellA, special: 'striped_v' };
        await resolveBoardCascades(
          nextGrid,
          jellyGrid,
          [
            [r1, c1],
            [r2, c2],
          ],
          new Map(),
          nextMoves
        );
        return;
      }

      const matches = findMatchGroups(nextGrid);
      if (matches.length === 0 && !isFreeSwitch) {
        // Invalid swap -> playful wiggle shake back!
        gameSound.cubeBlocked();
        setWigglingKeys(new Set([`${r1},${c1}`, `${r2},${c2}`]));
        window.setTimeout(() => setWigglingKeys(new Set()), 360);
        return;
      }

      gameSound.candySwap();
      const nextMoves = Math.max(0, movesLeft - (isFreeSwitch ? 0 : 1));
      setMovesLeft(nextMoves);
      setBoard(nextGrid);
      await resolveBoardCascades(nextGrid, jellyGrid, [], new Map(), nextMoves);
    },
    [activeBooster, board, busyBoard, jellyGrid, movesLeft, resolveBoardCascades, stageOutcome]
  );

  // Cell Click / Tap Handler (Supports Boosters & 8-way tap-to-swap)
  const handleCellClick = async (r: number, c: number) => {
    if (busyBoard || stageOutcome) return;

    if (activeBooster === 'hammer') {
      if (!board[r]?.[c]) return;
      const ok = await consumeBooster('hammer');
      setActiveBooster(null);
      if (!ok) return;
      gameSound.candyBoom();
      await resolveBoardCascades(board, jellyGrid, [[r, c]], new Map(), movesLeft);
      return;
    }

    if (activeBooster === 'colorbomb') {
      const targetCell = board[r]?.[c];
      if (!targetCell) return;
      const ok = await consumeBooster('colorbomb');
      setActiveBooster(null);
      if (!ok) return;
      gameSound.thunderZap();
      const nextGrid = board.map((row) => [...row]);
      nextGrid[r][c] = { ...targetCell, special: 'color_bomb' };
      setBoard(nextGrid);
      return;
    }

    if (!selectedCell) {
      gameSound.flip();
      setSelectedCell([r, c]);
      return;
    }

    const [sr, sc] = selectedCell;
    if (sr === r && sc === c) {
      setSelectedCell(null);
      return;
    }
    if (are8WayAdjacent(sr, sc, r, c)) {
      await attemptSwap(sr, sc, r, c);
    } else {
      gameSound.flip();
      setSelectedCell([r, c]);
    }
  };

  // Pointer 8-Directional Swipe Support (45-deg sectors)
  const handlePointerDownCell = (r: number, c: number, e: React.PointerEvent) => {
    if (busyBoard || stageOutcome) return;
    dragStartRef.current = { row: r, col: c, x: e.clientX, y: e.clientY };
  };

  const handlePointerMoveBoard = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!start || busyBoard || stageOutcome) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 22) return;

    dragStartRef.current = null;
    // Quantize angle to nearest of 8 compass directions
    const angle = Math.atan2(dy, dx);
    const octant = Math.round(angle / (Math.PI / 4));
    const dirMap: Record<number, [number, number]> = {
      0: [0, 1],
      1: [1, 1],
      2: [1, 0],
      3: [1, -1],
      4: [0, -1],
      [-4]: [0, -1],
      [-3]: [-1, -1],
      [-2]: [-1, 0],
      [-1]: [-1, 1],
    };
    const [dr, dc] = dirMap[octant] || [0, 0];
    const nr = start.row + dr;
    const nc = start.col + dc;
    if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
      attemptSwap(start.row, start.col, nr, nc);
    }
  };

  const handleShowHint = () => {
    if (busyBoard || stageOutcome) return;
    const candidates = findAllValidMoves(board.map((r) => [...r]));
    if (candidates.length === 0) {
      setBoard(createInitialBoard(levelSpec.colorCount));
      showToast(tr('Đã xáo trộn lại bảng kẹo để mở nước đi mới!', 'Shuffled board for fresh valid moves!'));
      return;
    }
    const best = candidates[0];
    gameSound.hintChime();
    setHintPair([
      [best.r1, best.c1],
      [best.r2, best.c2],
    ]);
    window.setTimeout(() => setHintPair(null), 2600);
  };

  const handleCheckBoardMoves = () => {
    const candidates = findAllValidMoves(board.map((r) => [...r]));
    if (candidates.length === 0) {
      setBoard(createInitialBoard(levelSpec.colorCount));
      showToast(tr('Không còn nước hợp lệ — đã tự động xáo trộn bảng!', 'No valid moves left — board reshuffled!'));
    } else {
      gameSound.hintChime();
      showToast(
        tr(
          `Kiểm tra hoàn tất: Còn ${candidates.length} nước đi hợp lệ (hỗ trợ đổi chéo 8 hướng)!`,
          `Board check: ${candidates.length} valid 8-direction moves available!`
        )
      );
    }
  };

  const handleClaimDailyGift = async () => {
    if (!isSignedIn) {
      onRequireLogin();
      return;
    }
    const res = await apiFetch('/api/saga/daily-gift', { method: 'POST' });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(d.error || tr('Không thể nhận quà hôm nay.', 'Could not claim daily gift.'));
      return;
    }
    if (d.profile) setProfile(d.profile);
    gameSound.victoryFanfare();
    showToast(
      tr(
        `Nhận Quà Ngày ${d.nextStreak}: +${d.coinGift} Xu & vật phẩm hỗ trợ!`,
        `Day ${d.nextStreak} Gift: +${d.coinGift} Coins & Boosters!`
      )
    );
  };

  const handleClaimRoarPrize = async (useExtraPoints: boolean) => {
    if (!isSignedIn) {
      const pool = rewards.filter((r) => r.active && (r.stock_total < 0 || r.stock_remaining > 0));
      if (pool.length > 0) onDemoResult(pool[Math.floor(Math.random() * pool.length)]);
      else onRequireLogin();
      return;
    }
    setClaimingRoar(true);
    try {
      const res = await onPlayReal(useExtraPoints, score);
      if (res && res.won) setClaimedRoarThisStage(true);
    } finally {
      setClaimingRoar(false);
    }
  };

  const handleEnablePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(tr('Trình duyệt hiện tại không hỗ trợ Web Push.', 'Push notifications are not supported here.'));
      return;
    }
    const perm = await Notification.requestPermission();
    setPushPerm(perm);
    if (perm === 'granted') {
      triggerPushBanner(
        tr('Đã bật Thông báo đẩy ROAR!', 'ROAR Push Notifications Active!'),
        tr('Bạn sẽ nhận cảnh báo đấu giá, PvP và tin tức game theo thời gian thực.', 'You will receive live auction, PvP & event alerts.')
      );
    }
  };

  const honorTier = resolveSeasonalHonorTier(profile.seasonalScore);
  const scorePct = Math.min(100, Math.round((score / Math.max(1, levelSpec.targetScore)) * 100));

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Live In-App Push Toast */}
      {pushBanner && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#00552B] to-[#0E7490] text-white flex items-center justify-between gap-3 shadow-lg border border-[#C6A667]/50">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="w-4 h-4 text-[#FDE047] shrink-0 animate-bounce" />
            <div className="min-w-0">
              <div className="text-xs font-extrabold truncate">{pushBanner.title}</div>
              <div className="text-[11px] text-white/85 truncate">{pushBanner.message}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPushBanner(null)}
            className="text-[11px] font-bold px-2 py-1 rounded bg-white/15 cursor-pointer shrink-0"
          >
            {tr('Đóng', 'Close')}
          </button>
        </div>
      )}

      {/* Mobile 1-Line Summary Bar */}
      <div className="sm:hidden flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 text-[11px] font-bold">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${activeSkinObj.accentGradient} text-white inline-flex items-center justify-center text-xs shrink-0`}>
            {activeSkinObj.avatarEmoji}
          </span>
          <span className="text-[#00552B] dark:text-[#4ADE80] tabular-nums whitespace-nowrap">
            Lv.{activeLevelNum}
          </span>
        </div>
        <span className="text-[#B45309] dark:text-[#FBBF24] tabular-nums whitespace-nowrap">
          🪙 {profile.coins.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1 text-[#111111] dark:text-[#F8F5EF] whitespace-nowrap">
          <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
          <span>{wsConnected ? `${onlineCount}` : tr('Khách', 'Guest')}</span>
        </span>
        <button
          type="button"
          onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
          className="px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[11px] cursor-pointer shrink-0"
          title={tr('Chuyển Chế độ Tối/Sáng dịu mắt', 'Toggle Dark/Light Mode')}
        >
          {themeMode === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Desktop/Tablet Compact Summary Strip */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-2">
        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center gap-2 min-w-0">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${activeSkinObj.accentGradient} text-white flex items-center justify-center text-sm shrink-0 shadow-sm`}>
            {activeSkinObj.avatarEmoji}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-[#111111] dark:text-[#F8F5EF] truncate">
              {getBadgeEmoji(profile.avatarBadge)} {lang === 'en' ? activeSkinObj.nameEn : activeSkinObj.nameVi}
            </div>
            <div className="text-[10px] font-semibold text-[#00552B] dark:text-[#C6A667] truncate">
              {honorTier.badgeEmoji} {lang === 'en' ? honorTier.nameEn : honorTier.nameVi}
            </div>
          </div>
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60">Saga Coins</div>
            <div className="text-sm font-extrabold text-[#B45309] dark:text-[#FBBF24] tabular-nums">
              {profile.coins.toLocaleString()}
            </div>
          </div>
          <Coins className="w-4 h-4 text-[#F59E0B]" />
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60">
              {tr('Cấp Đã Lưu', 'Saved Stage')}
            </div>
            <div className="text-sm font-extrabold text-[#00552B] dark:text-[#4ADE80] tabular-nums">
              {tr(`Màn ${activeLevelNum}`, `Lv.${activeLevelNum}`)} <span className="text-[10px] opacity-65">/ Max {profile.maxLevel}</span>
            </div>
          </div>
          <Trophy className="w-4 h-4 text-[#C6A667]" />
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60">
              {tr('Kênh Live WS', 'Live WS')}
            </div>
            <div className="text-[11px] font-extrabold text-[#111111] dark:text-[#F8F5EF] flex items-center gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${wsConnected ? 'bg-emerald-500' : 'bg-slate-400'}`} />
              <span className="truncate">{wsConnected ? tr(`${onlineCount} online`, `${onlineCount} online`) : tr('Khách', 'Guest')}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            className="px-2 py-1 rounded-lg bg-black/5 dark:bg-white/10 text-[10px] font-bold cursor-pointer shrink-0"
            title={tr('Chuyển Chế độ Tối/Sáng dịu mắt', 'Toggle Dark/Light Mode')}
          >
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      {/* Minimal Responsive Hub Sub-Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {(
          [
            { id: 'play', icon: <Sparkles className="w-3.5 h-3.5" />, vi: 'Chơi Kẹo 8 Hướng', en: 'Play Match-3' },
            { id: 'pvp', icon: <Swords className="w-3.5 h-3.5" />, vi: 'Đấu PvP Trực Tiếp', en: 'Live PvP' },
            { id: 'character', icon: <Crown className="w-3.5 h-3.5" />, vi: 'Nhân Vật & Kỹ Năng', en: 'Hero & Skills' },
            { id: 'guild', icon: <Users className="w-3.5 h-3.5" />, vi: 'Bang Hội', en: 'Guilds' },
            { id: 'auction', icon: <Gavel className="w-3.5 h-3.5" />, vi: 'Đấu Giá Minh Bạch', en: 'Auction' },
            { id: 'social', icon: <Newspaper className="w-3.5 h-3.5" />, vi: 'Nhiệm Vụ · BXH · Tin', en: 'Quests & News' },
            { id: 'support', icon: <Headphones className="w-3.5 h-3.5" />, vi: 'Hỗ Trợ & Cloud', en: 'Support & Cloud' },
          ] as const
        ).map((tItem) => (
          <button
            key={tItem.id}
            type="button"
            onClick={() => setHubTab(tItem.id)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer border transition-colors ${
              hubTab === tItem.id
                ? 'bg-[#00552B] text-white border-[#00552B] shadow-sm'
                : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/80 dark:text-[#F1EFEA]/80 border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40'
            }`}
          >
            {tItem.icon}
            <span>{lang === 'en' ? tItem.en : tItem.vi}</span>
          </button>
        ))}
      </div>

      {/* ================= TAB 1: MATCH-3 GAME ARENA ================= */}
      {hubTab === 'play' && (
        <div className="space-y-3">
          {/* Active Live PvP Duel Banner */}
          {pvpRoom && pvpRoom.status === 'active' && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#312E81] via-[#6D28D9] to-[#BE185D] text-white space-y-2 shadow-md">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span>
                  ⚔️ {tr('ĐẤU TRƯỜNG PVP TRỰC TIẾP', 'LIVE PVP DUEL')} · {pvpRoom.roomCode}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/30 font-mono tabular-nums">{pvpSecondsLeft}s</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-black/25 flex items-center justify-between">
                  <span className="truncate font-bold">
                    {getBadgeEmoji(pvpRoom.player1Badge)} {pvpRoom.player1Name}
                  </span>
                  <span className="font-mono font-extrabold text-[#FDE047] tabular-nums">{pvpRoom.player1Score}</span>
                </div>
                <div className="p-2 rounded-lg bg-black/25 flex items-center justify-between">
                  <span className="truncate font-bold">
                    {getBadgeEmoji(pvpRoom.player2Badge)} {pvpRoom.player2Name}
                  </span>
                  <span className="font-mono font-extrabold text-[#38BDF8] tabular-nums">{pvpRoom.player2Score}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stage HUD & Objectives (Single-line compact on Mobile) */}
          <div className="p-2.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#12261C] via-[#1B1328] to-[#0D1A14] text-white border border-[#C6A667]/35 space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between gap-1.5 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" className="hidden sm:inline-flex shrink-0" />
                <button
                  type="button"
                  onClick={() => setShowLevelPicker((v) => !v)}
                  className="px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] sm:text-xs font-extrabold cursor-pointer whitespace-nowrap truncate max-w-[140px] sm:max-w-none"
                >
                  <span className="sm:hidden">{tr(`Màn ${activeLevelNum}`, `Lv.${activeLevelNum}`)} ▾</span>
                  <span className="hidden sm:inline">{lang === 'en' ? levelSpec.titleEn : levelSpec.titleVi} ▾</span>
                </button>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase shrink-0 ${
                    levelSpec.difficulty === 'boss'
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                      : 'bg-emerald-500/20 text-emerald-200'
                  }`}
                >
                  {levelSpec.difficulty.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const next = gameSound.toggleLofi();
                    setLofiOn(next);
                    if (next && gameSound.muted !== muted) setMuted(gameSound.muted);
                  }}
                  className={`w-7 h-7 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    lofiOn
                      ? 'bg-[#10B981] text-[#052E16]'
                      : 'bg-white/10 hover:bg-white/15 text-white/90'
                  }`}
                  title={tr('Bật nhạc Lo-Fi chill thư giãn', 'Toggle Lo-Fi Chill Music')}
                  aria-label="Lo-Fi Music"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lo-Fi</span>
                </button>
                <button
                  type="button"
                  onClick={handleClaimDailyGift}
                  className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#C6A667] text-[#111111] text-[10px] sm:text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="sm:hidden">{tr('Quà', 'Gift')}</span>
                  <span className="hidden sm:inline">{tr('Quà Ngày', 'Daily Gift')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    gameSound.muted = !muted;
                    setMuted(gameSound.muted);
                    if (gameSound.muted && lofiOn) {
                      gameSound.stopLofi();
                      setLofiOn(false);
                    }
                  }}
                  className="w-7 h-7 sm:w-auto sm:h-auto sm:p-1.5 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer"
                  aria-label="Sound"
                >
                  {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => initStage(activeLevelNum)}
                  className="w-7 h-7 sm:w-auto sm:h-auto sm:p-1.5 inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/15 cursor-pointer"
                  title={tr('Chơi lại màn này', 'Restart level')}
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {showLevelPicker && (
              <div className="p-2 rounded-xl bg-black/40 border border-white/15 grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto">
                {Array.from({ length: Math.max(20, profile.maxLevel + 2) }, (_, idx) => idx + 1).map((lvl) => {
                  const unlocked = lvl <= profile.maxLevel;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => {
                        setShowLevelPicker(false);
                        initStage(lvl);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-extrabold cursor-pointer ${
                        lvl === activeLevelNum
                          ? 'bg-[#C6A667] text-[#111111]'
                          : unlocked
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'bg-white/5 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {unlocked ? lvl : `🔒`}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Score + Moves + Jelly/Collect Targets (1-Line Compact on Mobile) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs">
              <div className="px-2 py-1 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-between sm:block gap-1">
                <div className="text-[10px] text-white/65 uppercase font-bold whitespace-nowrap">{tr('Điểm', 'Score')}</div>
                <div className="font-mono font-extrabold text-xs sm:text-sm text-[#FDE047] tabular-nums whitespace-nowrap">
                  {score.toLocaleString()}<span className="text-[10px] text-white/60">/{levelSpec.targetScore}</span>
                </div>
              </div>
              <div className="px-2 py-1 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-between sm:block gap-1">
                <div className="text-[10px] text-white/65 uppercase font-bold whitespace-nowrap">{tr('Lượt', 'Moves')}</div>
                <div className={`font-mono font-extrabold text-xs sm:text-sm tabular-nums whitespace-nowrap ${movesLeft <= 5 ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {movesLeft}
                </div>
              </div>
              {levelSpec.jellyCount > 0 && (
                <div className="px-2 py-1 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-between sm:block gap-1">
                  <div className="text-[10px] text-white/65 uppercase font-bold whitespace-nowrap">{tr('Thạch', 'Jelly')}</div>
                  <div className="font-mono font-extrabold text-xs sm:text-sm text-sky-300 tabular-nums whitespace-nowrap">{jelliesLeft}</div>
                </div>
              )}
              {levelSpec.collectColor && levelSpec.collectTarget && (
                <div className="px-2 py-1 sm:p-2 rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-between sm:block gap-1">
                  <div className="text-[10px] text-white/65 uppercase font-bold whitespace-nowrap">
                    {CANDY_CATALOG[levelSpec.collectColor].emoji} {tr('Thu', 'Goal')}
                  </div>
                  <div className="font-mono font-extrabold text-xs sm:text-sm text-amber-300 tabular-nums whitespace-nowrap">
                    {Math.min(collectedCount, levelSpec.collectTarget)}/{levelSpec.collectTarget}
                  </div>
                </div>
              )}
            </div>

            <div className="h-1.5 sm:h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#10B981] via-[#FACC15] to-[#F43F5E] transition-all duration-300"
                style={{ width: `${scorePct}%` }}
              />
            </div>

            {/* 8x8 Interactive Match-3 Board (Supports 8-Directional Swaps & Diagonal Moves!) */}
            <div className="relative max-w-[440px] mx-auto w-full select-none touch-none">
              <div
                onPointerMove={handlePointerMoveBoard}
                onPointerUp={() => {
                  dragStartRef.current = null;
                }}
                onPointerLeave={() => {
                  dragStartRef.current = null;
                }}
                className={`relative aspect-square w-full grid grid-cols-8 gap-1 p-2 rounded-2xl bg-[radial-gradient(circle_at_50%_30%,#1B2738_0%,#0A1019_100%)] border-2 border-[#C6A667]/50 shadow-[0_14px_40px_rgba(0,0,0,0.55)] overflow-hidden ${
                  shakeTier === 'epic'
                    ? 'animate-candy-shake-epic'
                    : shakeTier === 'heavy'
                      ? 'animate-bb-shake-heavy'
                      : shakeTier === 'light'
                        ? 'animate-bb-shake-light'
                        : ''
                }`}
              >
                {/* Soft Chill Ambient Aurora Glow */}
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.09),transparent_55%),radial-gradient(circle_at_80%_80%,rgba(198,166,103,0.09),transparent_55%)]" />
                {/* Subtle Official ROAR COFFEE Crest Watermark inside Board */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.07]">
                  <AdaptiveLogo variant="vertical" surface="dark" darkTone="gold" size="lg" />
                </div>
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const hasJelly = jellyGrid[r]?.[c];
                    const coordKey = `${r},${c}`;
                    if (!cell) {
                      return (
                        <div
                          key={`empty-${r}-${c}`}
                          className={`relative rounded-xl ${
                            hasJelly ? 'bg-sky-400/25 ring-1 ring-inset ring-sky-300/60' : 'bg-white/[0.04]'
                          }`}
                        />
                      );
                    }
                    const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                    const isHinted =
                      hintPair &&
                      ((hintPair[0][0] === r && hintPair[0][1] === c) || (hintPair[1][0] === r && hintPair[1][1] === c));
                    const isWiggling = wigglingKeys.has(coordKey);
                    const isBursting = burstingKeys.has(coordKey);
                    const dropRows = dropRowsByUid[cell.uid] || 0;

                    return (
                      <button
                        key={cell.uid}
                        type="button"
                        onPointerDown={(e) => handlePointerDownCell(r, c, e)}
                        onClick={() => handleCellClick(r, c)}
                        style={
                          dropRows > 0
                            ? ({ '--drop-rows': dropRows } as React.CSSProperties)
                            : undefined
                        }
                        className={`relative rounded-xl flex items-center justify-center cursor-pointer transition-transform duration-150 hover:scale-[1.08] hover:animate-candy-wiggle ${
                          hasJelly
                            ? 'bg-gradient-to-br from-sky-300/35 via-cyan-400/20 to-sky-500/30 ring-1 ring-inset ring-sky-200/75 shadow-[inset_0_0_12px_rgba(125,211,252,0.45)]'
                            : 'bg-white/[0.045] hover:bg-white/[0.08]'
                        } ${isSelected ? 'ring-2 ring-[#FDE047] scale-110 z-10 shadow-[0_0_16px_rgba(253,224,71,0.55)]' : ''} ${
                          isHinted ? 'animate-candy-hint ring-2 ring-cyan-300 z-10' : ''
                        } ${isBursting ? 'animate-candy-burst z-20' : dropRows > 0 ? 'animate-candy-drop' : isWiggling ? 'animate-candy-wiggle' : ''}`}
                      >
                        {hasJelly && (
                          <span className="pointer-events-none absolute top-0.5 left-1 right-1 h-1.5 rounded-full bg-white/30 blur-[0.5px]" />
                        )}
                        <CandyGemVisual color={cell.color} special={cell.special} uid={cell.uid} />
                      </button>
                    );
                  })
                )}

                {/* Striped Candy Laser Beam Sweeps */}
                {beamSweeps.map((bm) =>
                  bm.axis === 'h' ? (
                    <div
                      key={bm.id}
                      className="pointer-events-none absolute left-0 right-0 h-5 rounded-full animate-candy-beam-h z-20"
                      style={{
                        top: `${bm.posPct}%`,
                        background: `linear-gradient(90deg, transparent, ${bm.colorHex}, #FFFFFF, ${bm.colorHex}, transparent)`,
                        boxShadow: `0 0 22px ${bm.colorHex}`,
                      }}
                    />
                  ) : (
                    <div
                      key={bm.id}
                      className="pointer-events-none absolute top-0 bottom-0 w-5 rounded-full animate-candy-beam-v z-20"
                      style={{
                        left: `${bm.posPct}%`,
                        background: `linear-gradient(180deg, transparent, ${bm.colorHex}, #FFFFFF, ${bm.colorHex}, transparent)`,
                        boxShadow: `0 0 22px ${bm.colorHex}`,
                      }}
                    />
                  )
                )}

                {/* Electric Thunder Board Flash */}
                {lightningFlash && (
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6),rgba(192,132,252,0.32),transparent)] animate-lightning-flash z-20" />
                )}

                {/* Explosion Rings & Glowing Shards */}
                {rings.map((ring) => (
                  <div
                    key={ring.id}
                    className={`absolute rounded-full pointer-events-none animate-candy-ring z-20 ${
                      ring.large ? 'w-14 h-14 -ml-7 -mt-7 border-[5px]' : 'w-10 h-10 -ml-5 -mt-5 border-4'
                    }`}
                    style={{
                      left: `${ring.leftPct}%`,
                      top: `${ring.topPct}%`,
                      borderColor: ring.colorHex,
                      boxShadow: `0 0 18px ${ring.colorHex}`,
                    }}
                  />
                ))}
                {shards.map((sh) => (
                  <div
                    key={sh.id}
                    className="absolute rounded-sm pointer-events-none animate-bb-shard z-20"
                    style={
                      {
                        left: `${sh.leftPct}%`,
                        top: `${sh.topPct}%`,
                        width: `${sh.size}px`,
                        height: `${sh.size}px`,
                        backgroundColor: sh.colorHex,
                        boxShadow: `0 0 10px ${sh.colorHex}`,
                        '--tx': `${sh.tx}px`,
                        '--ty': `${sh.ty}px`,
                        '--rot': `${sh.rot}deg`,
                      } as React.CSSProperties
                    }
                  />
                ))}

                {/* Floating +Score Popups */}
                {scorePops.map((pop) => (
                  <div
                    key={pop.id}
                    className={`pointer-events-none absolute z-30 font-extrabold tabular-nums drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] animate-bb-float-score ${
                      pop.isEpic ? 'text-base sm:text-xl text-[#FDE047]' : 'text-xs sm:text-sm text-white'
                    }`}
                    style={{
                      left: `${Math.max(15, Math.min(85, pop.leftPct))}%`,
                      top: `${Math.max(16, Math.min(84, pop.topPct))}%`,
                    }}
                  >
                    +{pop.points}
                  </div>
                ))}

                {/* Forked Jagged Lightning Bolts SVG Overlay */}
                {bolts.length > 0 && (
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none z-30 animate-lightning-strike">
                    {bolts.map((b) => (
                      <g key={b.id}>
                        <polyline
                          points={b.points}
                          fill="none"
                          stroke={b.colorHex}
                          strokeWidth="4.4"
                          strokeOpacity="0.65"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polyline
                          points={b.points}
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {b.branchPoints && (
                          <>
                            <polyline
                              points={b.branchPoints}
                              fill="none"
                              stroke={b.colorHex}
                              strokeWidth="2.8"
                              strokeOpacity="0.6"
                              strokeLinecap="round"
                            />
                            <polyline
                              points={b.branchPoints}
                              fill="none"
                              stroke="#FFFFFF"
                              strokeWidth="1"
                              strokeLinecap="round"
                            />
                          </>
                        )}
                      </g>
                    ))}
                  </svg>
                )}

                {/* King Candy Crush Saga Center-Board Comic Praise Ribbon */}
                {comboPraise && (
                  <div
                    key={comboPraise}
                    className="pointer-events-none absolute top-1/2 left-1/2 z-30 animate-candy-praise"
                  >
                    <div className="px-5 py-2 rounded-2xl bg-gradient-to-b from-[#FEF08A] via-[#F59E0B] to-[#E11D48] text-white border-2 border-white shadow-[0_10px_30px_rgba(0,0,0,0.65)] text-center whitespace-nowrap">
                      <span className="font-serif text-lg sm:text-2xl font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]">
                        {comboPraise}
                      </span>
                    </div>
                  </div>
                )}

                {/* Victory / Out-of-Moves Overlay with Fireworks */}
                {stageOutcome && (
                  <div className="absolute inset-0 bg-[#070B12]/90 flex items-center justify-center p-4 z-40">
                    {stageOutcome === 'won' && <FireworksOverlay active />}
                    <div className="relative z-10 w-full max-w-xs rounded-2xl bg-[#111827] border border-[#C6A667]/60 p-5 text-center space-y-3 shadow-2xl">
                      <div className="flex justify-center">
                        <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
                      </div>
                      {stageOutcome === 'won' ? (
                        <>
                          <div className="flex items-center justify-center gap-1.5">
                            {[1, 2, 3].map((st) => (
                              <Star
                                key={st}
                                className={`w-7 h-7 ${
                                  st <= (movesLeft >= 8 ? 3 : movesLeft >= 3 ? 2 : 1)
                                    ? 'text-[#FACC15] fill-[#FACC15]'
                                    : 'text-white/20'
                                }`}
                              />
                            ))}
                          </div>
                          <div className="text-xs font-extrabold uppercase tracking-wider text-[#FDE047]">
                            🎆 {tr(`HOÀN THÀNH MÀN ${activeLevelNum}!`, `STAGE ${activeLevelNum} CLEARED!`)}
                          </div>
                          <div className="text-2xl font-extrabold font-mono text-white">{score.toLocaleString()} pts</div>
                          <div className="text-xs font-bold text-emerald-300">
                            +{levelSpec.coinReward} Saga Coins · +{levelSpec.xpReward} XP
                          </div>

                          {score >= minScoreToWin && !claimedRoarThisStage && (
                            <button
                              type="button"
                              disabled={claimingRoar}
                              onClick={() => handleClaimRoarPrize(remainingFreeToday <= 0)}
                              className="w-full py-2.5 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Gift className="w-4 h-4" />
                              <span>
                                {!isSignedIn
                                  ? tr('Mở Quà Demo ROAR', 'Preview ROAR Prize')
                                  : remainingFreeToday > 0
                                    ? tr(`Nhận Quà ROAR (${remainingFreeToday} miễn phí)`, `Claim ROAR Gift (${remainingFreeToday} free)`)
                                    : tr(`Đổi ${extraCost} Điểm Rút Quà`, `Spend ${extraCost} Pts for Gift`)}
                              </span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => initStage(activeLevelNum + 1)}
                            className="w-full py-2.5 rounded-xl bg-[#00552B] hover:bg-[#006b36] text-white text-xs font-extrabold cursor-pointer"
                          >
                            {tr(`Chơi Màn Tiếp Theo (Màn ${activeLevelNum + 1}) →`, `Next Stage (Lv.${activeLevelNum + 1}) →`)}
                          </button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-lg font-bold text-rose-300">{tr('Hết Lượt Đi!', 'Out of Moves!')}</h3>
                          <p className="text-xs text-white/75">
                            {tr('Dùng vé +5 Lượt để cứu ván hoặc thử lại màn này.', 'Use +5 Moves ticket or replay stage.')}
                          </p>
                          <div className="flex gap-2">
                            {profile.boosters.moves5 > 0 && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await consumeBooster('moves5');
                                  if (ok) {
                                    setMovesLeft(5);
                                    setStageOutcome(null);
                                  }
                                }}
                                className="flex-1 py-2.5 rounded-xl bg-[#C6A667] text-[#111111] text-xs font-extrabold cursor-pointer"
                              >
                                +5 {tr('Lượt', 'Moves')} ({profile.boosters.moves5})
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => initStage(activeLevelNum)}
                              className="flex-1 py-2.5 rounded-xl bg-[#00552B] text-white text-xs font-extrabold cursor-pointer"
                            >
                              {tr('Chơi Lại', 'Retry')}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boosters, Hint & 8-Direction Controls Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleShowHint}
                className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>{tr('Gợi Ý', 'Hint')}</span>
              </button>
              <button
                type="button"
                onClick={handleCheckBoardMoves}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-300" />
                <span>{tr('Kiểm Tra Nước Đi', 'Check Moves')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveBooster((b) => (b === 'hammer' ? null : 'hammer'))}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                  activeBooster === 'hammer'
                    ? 'bg-amber-500 text-[#111111] border-amber-300'
                    : 'bg-white/10 border-white/15 text-white'
                }`}
              >
                <Hammer className="w-3.5 h-3.5" />
                <span>{tr('Búa', 'Hammer')} ({profile.boosters.hammer})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveBooster((b) => (b === 'switch8' ? null : 'switch8'))}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                  activeBooster === 'switch8'
                    ? 'bg-sky-500 text-white border-sky-300'
                    : 'bg-white/10 border-white/15 text-white'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>{tr('Đổi Chéo Tự Do', '8-Way Free')} ({profile.boosters.switch8})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveBooster((b) => (b === 'colorbomb' ? null : 'colorbomb'))}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                  activeBooster === 'colorbomb'
                    ? 'bg-purple-500 text-white border-purple-300'
                    : 'bg-white/10 border-white/15 text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{tr('Bom Cầu Vồng', 'Color Bomb')} ({profile.boosters.colorbomb})</span>
              </button>
            </div>
            <p className="text-center text-[11px] text-white/65">
              {tr(
                'Vuốt hoặc chạm 8 hướng (Ngang, Dọc & Đổi Chéo 45°) để tạo kẹo Sọc Sấm Sét, Kẹo Bom 💥 & Cầu Vồng 🌈!',
                'Swipe or tap any of 8 directions (including Diagonals!) to match candies and trigger Lightning & Bomb combos!'
              )}
            </p>
          </div>
        </div>
      )}

      {/* ================= TAB 2: REAL-TIME 1V1 PVP DUELS ================= */}
      {hubTab === 'pvp' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold">{tr('Đấu Trường PvP Thời Gian Thực 1v1', 'Real-Time 1v1 PvP Arena')}</h3>
              <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {tr('Cược 25 Xu · Đấu trực tiếp 75 giây qua WebSocket · Thắng nhận trọn 50 Xu & +180 điểm Mùa!', 'Stake 25 Coins · Live 75s WebSocket duel · Winner takes 50 Coins & +180 Season Pts!')}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#00552B]/10 text-[#00552B] dark:text-[#C6A667] text-xs font-bold">
              {onlineCount} {tr('người đang online', 'players online')}
            </span>
          </div>

          {!isSignedIn ? (
            <button type="button" onClick={onRequireLogin} className="px-4 py-2.5 rounded-xl bg-[#00552B] text-white text-xs font-bold cursor-pointer">
              {tr('Đăng nhập để ghép cặp PvP thật', 'Sign In to Join Live PvP')}
            </button>
          ) : pvpRoom && pvpRoom.status === 'waiting' ? (
            <div className="p-5 rounded-xl bg-white dark:bg-[#16221C] border border-[#C6A667]/40 text-center space-y-3">
              <div className="text-sm font-bold text-[#00552B] dark:text-[#C6A667]">
                ⏳ {tr(`Đang chờ đối thủ thật vào phòng ${pvpRoom.roomCode}...`, `Waiting for real opponent in room ${pvpRoom.roomCode}...`)}
              </div>
              <button
                type="button"
                onClick={() => wsRef.current?.send(JSON.stringify({ type: 'pvp:cancel', roomCode: pvpRoom.roomCode }))}
                className="px-4 py-2 rounded-lg border border-red-400/50 text-red-600 dark:text-red-300 text-xs font-bold cursor-pointer"
              >
                {tr('Hủy tìm trận & Hoàn lại 25 Xu', 'Cancel Queue & Refund 25 Coins')}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                  showToast(tr('Đang kết nối máy chủ WebSocket...', 'Connecting to live server...'));
                  return;
                }
                wsRef.current.send(JSON.stringify({ type: 'pvp:queue' }));
              }}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#6D28D9] to-[#BE185D] text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>{tr('Ghép Cặp PvP Ngay (25 Xu)', 'Find Live Opponent (25 Coins)')}</span>
            </button>
          )}

          {pvpFinishedResult && (
            <div className="p-4 rounded-xl bg-white dark:bg-[#16221C] border border-[#C6A667] text-xs space-y-1">
              <div className="font-extrabold text-sm">
                {pvpFinishedResult.winnerId === profile.userId
                  ? tr('🏆 Bạn đã chiến thắng trận PvP!', '🏆 You won the PvP match!')
                  : pvpFinishedResult.winnerId
                    ? tr('Kết thúc trận PvP!', 'PvP Match Ended!')
                    : tr('Trận PvP Hòa — Hoàn Xu!', 'PvP Draw — Stake Refunded!')}
              </div>
              <div>
                {pvpFinishedResult.room.player1Name}: <strong>{pvpFinishedResult.room.player1Score}</strong> vs{' '}
                {pvpFinishedResult.room.player2Name}: <strong>{pvpFinishedResult.room.player2Score}</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: CHARACTER SKINS, SKILLS & BOOSTER SHOP ================= */}
      {hubTab === 'character' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold">{tr('Biểu Tượng Hồ Sơ', 'Profile Badge')}</h3>
            <div className="flex flex-wrap gap-2">
              {AVATAR_BADGES.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={async () => {
                    if (isSignedIn) {
                      const res = await apiFetch('/api/saga/customize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'avatar', avatarBadge: b.id }),
                      });
                      if (res.ok) setProfile((await res.json()).profile);
                    } else {
                      setProfile((p) => {
                        const nx = { ...p, avatarBadge: b.id };
                        writeGuestProfile(nx);
                        return nx;
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    profile.avatarBadge === b.id
                      ? 'bg-[#00552B] text-white border-[#00552B]'
                      : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10'
                  }`}
                >
                  {b.emoji} {lang === 'en' ? b.labelEn : b.labelVi}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SAGA_CHARACTER_SKINS.map((skin) => {
              const unlocked = profile.unlockedSkins.includes(skin.id);
              const isActive = profile.activeSkin === skin.id;
              return (
                <div
                  key={skin.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isActive
                      ? 'bg-[#00552B]/10 border-[#00552B] dark:border-[#C6A667]'
                      : 'bg-[#F8F5EF] dark:bg-[#0E1512] border-[#202020]/10 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${skin.accentGradient} flex items-center justify-center text-xl`}>
                        {skin.avatarEmoji}
                      </span>
                      <div>
                        <div className="text-sm font-bold">{lang === 'en' ? skin.nameEn : skin.nameVi}</div>
                        <div className="text-[11px] text-[#00552B] dark:text-[#C6A667] font-semibold">
                          {lang === 'en' ? skin.outfitTitleEn : skin.outfitTitleVi}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isActive}
                      onClick={async () => {
                        if (isSignedIn) {
                          const res = await apiFetch('/api/saga/customize', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'skin', skinId: skin.id }),
                          });
                          const d = await res.json().catch(() => ({}));
                          if (!res.ok) return showToast(d.error || 'Error');
                          if (d.profile) setProfile(d.profile);
                        } else {
                          if (!unlocked && profile.coins < skin.costCoins) {
                            showToast(tr(`Cần ${skin.costCoins} Xu`, `Need ${skin.costCoins} Coins`));
                            return;
                          }
                          setProfile((p) => {
                            const nx = {
                              ...p,
                              coins: unlocked ? p.coins : p.coins - skin.costCoins,
                              activeSkin: skin.id,
                              unlockedSkins: unlocked ? p.unlockedSkins : [...p.unlockedSkins, skin.id],
                            };
                            writeGuestProfile(nx);
                            return nx;
                          });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        isActive
                          ? 'bg-[#00552B] text-white'
                          : unlocked
                            ? 'bg-white dark:bg-[#16221C] border border-[#00552B] text-[#00552B] dark:text-[#C6A667]'
                            : 'bg-[#C6A667] text-[#111111]'
                      }`}
                    >
                      {isActive ? tr('Đang mặc', 'Equipped') : unlocked ? tr('Trang bị', 'Equip') : `${skin.costCoins} Xu`}
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    ✨ {lang === 'en' ? skin.skillNameEn : skin.skillNameVi}:{' '}
                    <span className="font-normal text-[#202020]/75 dark:text-[#F1EFEA]/75">
                      {lang === 'en' ? skin.skillDescEn : skin.skillDescVi}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold">{tr('Cửa Hàng Vật Phẩm Hỗ Trợ', 'Booster Shop')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {(
                [
                  { key: 'hammer', nameVi: 'Búa Phá Kẹo', nameEn: 'Hammer', cost: 40, qty: profile.boosters.hammer },
                  { key: 'switch8', nameVi: 'Đổi Chéo Tự Do', nameEn: '8-Way Swap', cost: 45, qty: profile.boosters.switch8 },
                  { key: 'colorbomb', nameVi: 'Bom Cầu Vồng', nameEn: 'Color Bomb', cost: 75, qty: profile.boosters.colorbomb },
                  { key: 'moves5', nameVi: 'Vé +5 Lượt', nameEn: '+5 Moves', cost: 50, qty: profile.boosters.moves5 },
                ] as const
              ).map((item) => (
                <div key={item.key} className="p-3 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-2">
                  <div className="font-bold">{lang === 'en' ? item.nameEn : item.nameVi}</div>
                  <div className="text-[11px] opacity-70">{tr('Đang có:', 'Owned:')} {item.qty}</div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isSignedIn) return onRequireLogin();
                      const res = await apiFetch('/api/saga/customize', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'buy_booster', boosterKey: item.key }),
                      });
                      const d = await res.json().catch(() => ({}));
                      if (!res.ok) return showToast(d.error || 'Error');
                      setProfile(d.profile);
                      gameSound.coinClink();
                    }}
                    className="w-full py-1.5 rounded-lg bg-[#00552B] text-white font-bold cursor-pointer"
                  >
                    {item.cost} Xu
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: GUILDS (BANG HỘI) ================= */}
      {hubTab === 'guild' && (
        <div className="space-y-4">
          {guildsData.myGuild ? (
            <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#C6A667]/40 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-base font-bold">
                    {guildsData.myGuild.emblem_icon} [{guildsData.myGuild.tag}] {guildsData.myGuild.name}
                  </div>
                  <div className="text-xs opacity-75">{guildsData.myGuild.description}</div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await apiFetch('/api/guilds/leave', { method: 'POST' });
                    if (res.ok) {
                      await Promise.all([loadSagaState(false), loadLeaderboardAndGuilds()]);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg border border-red-400/50 text-red-600 dark:text-red-300 text-xs font-bold cursor-pointer"
                >
                  {tr('Rời Bang', 'Leave Guild')}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {guildsData.members.map((m) => (
                  <div key={m.user_id} className="p-2.5 rounded-lg bg-white dark:bg-[#16221C] flex items-center justify-between">
                    <span>
                      {getBadgeEmoji(m.avatar_badge)} <strong>{m.full_name}</strong> ({m.role})
                    </span>
                    <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667]">
                      {Number(m.contribution_score || 0).toLocaleString()} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-3">
              <h3 className="text-sm font-bold">{tr('Tạo Bang Hội Mới', 'Create a New Guild')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  value={newGuildName}
                  onChange={(e) => setNewGuildName(e.target.value)}
                  placeholder={tr('Tên Bang hội', 'Guild Name')}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
                />
                <input
                  type="text"
                  maxLength={5}
                  value={newGuildTag}
                  onChange={(e) => setNewGuildTag(e.target.value.toUpperCase())}
                  placeholder="TAG (vd: ROAR)"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 uppercase font-mono"
                />
                <input
                  type="text"
                  value={newGuildDesc}
                  onChange={(e) => setNewGuildDesc(e.target.value)}
                  placeholder={tr('Khẩu hiệu Bang', 'Guild Motto')}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!isSignedIn) return onRequireLogin();
                  const res = await apiFetch('/api/guilds', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: newGuildName, tag: newGuildTag, description: newGuildDesc }),
                  });
                  const d = await res.json().catch(() => ({}));
                  if (!res.ok) return showToast(d.error || 'Error');
                  setNewGuildName('');
                  setNewGuildTag('');
                  setNewGuildDesc('');
                  await Promise.all([loadSagaState(false), loadLeaderboardAndGuilds()]);
                }}
                className="px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr('Thành Lập Bang Hội', 'Create Guild')}</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            {guildsData.guilds.map((g) => (
              <div key={g.id} className="p-3 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-sm">
                    {g.emblem_icon} [{g.tag}] {g.name}
                  </div>
                  <div className="opacity-70">{g.member_count} {tr('thành viên', 'members')} · {Number(g.total_score || 0).toLocaleString()} pts</div>
                </div>
                {!guildsData.myGuild && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!isSignedIn) return onRequireLogin();
                      const res = await apiFetch('/api/guilds/join', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ guildId: g.id }),
                      });
                      const d = await res.json().catch(() => ({}));
                      if (!res.ok) return showToast(d.error || 'Error');
                      await Promise.all([loadSagaState(false), loadLeaderboardAndGuilds()]);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#00552B] text-white font-bold cursor-pointer"
                  >
                    {tr('Gia Nhập', 'Join')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: TRANSPARENT AUCTION HOUSE ================= */}
      {hubTab === 'auction' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold">{tr('Đăng Bán Vật Phẩm Lên Sàn Đấu Giá', 'List Item for Transparent Auction')}</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <select
                value={sellBoosterKey}
                onChange={(e) => setSellBoosterKey(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
              >
                <option value="hammer">Búa Phá Kẹo ({profile.boosters.hammer})</option>
                <option value="switch8">Đổi Chéo 8 Hướng ({profile.boosters.switch8})</option>
                <option value="colorbomb">Bom Cầu Vồng ({profile.boosters.colorbomb})</option>
                <option value="moves5">Vé +5 Lượt ({profile.boosters.moves5})</option>
              </select>
              <input
                type="number"
                min={20}
                max={500}
                value={sellStartPrice}
                onChange={(e) => setSellStartPrice(e.target.value)}
                className="w-28 px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 font-mono"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!isSignedIn) return onRequireLogin();
                  const res = await apiFetch('/api/auctions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ boosterKey: sellBoosterKey, startingPrice: Number(sellStartPrice) }),
                  });
                  const d = await res.json().catch(() => ({}));
                  if (!res.ok) return showToast(d.error || 'Error');
                  if (d.profile) setProfile(d.profile);
                  loadAuctions();
                }}
                className="px-4 py-2 rounded-lg bg-[#00552B] text-white font-bold cursor-pointer"
              >
                {tr('Mở Phiên Đấu Giá', 'Create Auction')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {auctionListings.map((l) => {
              const nextMin = l.bid_count === 0 ? l.starting_price : l.current_bid + 10;
              return (
                <div key={l.id} className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#C6A667]/35 space-y-2.5 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm">{lang === 'en' ? l.title_en : l.title_vi}</div>
                      <div className="text-[11px] opacity-70">
                        {tr('Người bán:', 'Seller:')} {l.seller_name || 'ROAR Vault'} · {l.bid_count} {tr('lượt trả giá', 'bids')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-sm text-[#B45309] dark:text-[#FBBF24]">
                        {l.current_bid} Xu
                      </div>
                      {l.highest_bidder_name && (
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-300">
                          {tr('Dẫn đầu:', 'Top:')} {l.highest_bidder_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {Array.isArray(l.recentBids) && l.recentBids.length > 0 && (
                    <div className="p-2 rounded-lg bg-white/70 dark:bg-black/25 space-y-1 text-[11px]">
                      {l.recentBids.map((b: any) => (
                        <div key={b.id} className="flex justify-between">
                          <span>{b.bidder_name}</span>
                          <span className="font-mono font-bold">{b.bid_amount} Xu</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={async () => {
                      if (!isSignedIn) return onRequireLogin();
                      const res = await apiFetch('/api/auctions/bid', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ listingId: l.id, bidAmount: nextMin }),
                      });
                      const d = await res.json().catch(() => ({}));
                      if (!res.ok) return showToast(d.error || 'Error');
                      if (d.profile) setProfile(d.profile);
                      gameSound.coinClink();
                      loadAuctions();
                    }}
                    className="w-full py-2 rounded-lg bg-[#C6A667] hover:bg-[#b59454] text-[#111111] font-extrabold cursor-pointer"
                  >
                    {tr(`Đấu Giá Minh Bạch (${nextMin} Xu)`, `Place Transparent Bid (${nextMin} Coins)`)}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 6: QUESTS, SEASONAL LEADERBOARD, LIVE CHAT & NEWS ================= */}
      {hubTab === 'social' && (
        <div className="space-y-4">
          {/* Weekly Quests */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5">
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C6A667]" /> {tr('Nhiệm Vụ Tuần Candy Saga', 'Weekly Quests')}
            </h3>
            {weeklyQuests.length === 0 ? (
              <p className="text-xs opacity-70">{tr('Đăng nhập để theo dõi và nhận thưởng nhiệm vụ tuần.', 'Sign in to track weekly quests.')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {weeklyQuests.map((q) => {
                  const done = q.progress >= q.target;
                  return (
                    <div key={q.id} className="p-3 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-1.5">
                      <div className="font-bold">{lang === 'en' ? q.titleEn : q.titleVi}</div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span>
                          {q.progress}/{q.target} · +{q.rewardCoins} Xu & +{q.rewardRoarPts} ROAR pts
                        </span>
                        {q.claimed ? (
                          <span className="text-emerald-500 font-bold inline-flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> {tr('Đã nhận', 'Claimed')}
                          </span>
                        ) : done ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await apiFetch('/api/saga/weekly-quests/claim', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ questId: q.id }),
                              });
                              if (res.ok) {
                                const d = await res.json();
                                setProfile(d.profile);
                                setWeeklyQuests(d.weeklyQuests);
                                refreshUser().catch(() => {});
                                gameSound.victoryFanfare();
                              }
                            }}
                            className="px-2.5 py-1 rounded bg-[#00552B] text-white font-bold cursor-pointer"
                          >
                            {tr('Nhận Quà', 'Claim')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seasonal Honor Leaderboard + Tiers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5">
              <h3 className="text-sm font-bold">{tr('Bảng Xếp Hạng Mùa & Vinh Danh', 'Seasonal Honor Leaderboard')}</h3>
              <div className="flex flex-wrap gap-1.5">
                {SEASONAL_HONOR_TIERS.map((tier) => (
                  <span key={tier.id} className="px-2 py-1 rounded-md bg-white dark:bg-[#16221C] text-[10px] font-bold">
                    {tier.badgeEmoji} {lang === 'en' ? tier.nameEn : tier.nameVi} ({tier.minScore}+)
                  </span>
                ))}
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs">
                {leaderboardPlayers.map((p) => (
                  <div key={p.userId} className="p-2 rounded-lg bg-white dark:bg-[#16221C] flex items-center justify-between">
                    <span>
                      <strong>#{p.rank}</strong> {getBadgeEmoji(p.avatarBadge)} {p.guildTag ? `[${p.guildTag}] ` : ''}
                      {p.displayName} (Màn {p.maxLevel})
                    </span>
                    <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667]">
                      {Number(p.seasonalScore || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-Time Chat */}
            <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" /> {tr('Chat Thời Gian Thực', 'Live Chat')}
                </h3>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setChatChannel('global')}
                    className={`px-2 py-1 rounded font-bold cursor-pointer ${chatChannel === 'global' ? 'bg-[#00552B] text-white' : 'bg-white dark:bg-[#16221C]'}`}
                  >
                    {tr('Thế Giới', 'Global')}
                  </button>
                  {profile.guild && (
                    <button
                      type="button"
                      onClick={() => setChatChannel(`guild:${profile.guild!.id}`)}
                      className={`px-2 py-1 rounded font-bold cursor-pointer ${chatChannel.startsWith('guild:') ? 'bg-[#00552B] text-white' : 'bg-white dark:bg-[#16221C]'}`}
                    >
                      [{profile.guild.tag}]
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1 h-44 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-white dark:bg-[#16221C] text-xs">
                {chatMessages.map((m) => (
                  <div key={m.id}>
                    <span className="font-bold text-[#00552B] dark:text-[#C6A667]">
                      {getBadgeEmoji(m.avatar_badge)} {m.guild_tag ? `[${m.guild_tag}] ` : ''}
                      {m.display_name}:{' '}
                    </span>
                    <span>{m.message}</span>
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!chatInput.trim()) return;
                  if (!isSignedIn) return onRequireLogin();
                  if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                    showToast(tr('WebSocket chưa sẵn sàng.', 'WebSocket reconnecting...'));
                    return;
                  }
                  wsRef.current.send(JSON.stringify({ type: 'chat:send', channel: chatChannel, message: chatInput.trim() }));
                  setChatInput('');
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={tr('Nhắn tin giao lưu...', 'Type live chat message...')}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 text-xs"
                />
                <button type="submit" className="px-3 py-1.5 rounded-lg bg-[#00552B] text-white cursor-pointer">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Game News Feed */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5">
            <h3 className="text-sm font-bold">{tr('Bảng Tin Sự Kiện Game ROAR', 'ROAR Game News & Events')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
              {newsPosts.map((n) => (
                <div key={n.id} className="p-3 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-1">
                  <div className="font-bold text-[#00552B] dark:text-[#C6A667]">
                    {n.pinned ? '📌 ' : ''}
                    {lang === 'en' ? n.title_en : n.title_vi}
                  </div>
                  <p className="opacity-80">{lang === 'en' ? n.summary_en : n.summary_vi}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 7: MULTI-CHANNEL LIVE SUPPORT, CLOUD BACKUPS & PUSH ================= */}
      {hubTab === 'support' && (
        <div className="space-y-4">
          {/* Push Notification Control */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-sm flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" /> {tr('Thông Báo Đẩy Thời Gian Thực', 'Real-Time Push Alerts')}
              </div>
              <div className="opacity-75">
                {tr('Nhận thông báo khi bị vượt giá đấu giá, ghép trận PvP hoặc nhận phản hồi CSKH.', 'Get instant alerts for auctions, PvP duels & live support replies.')}
              </div>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              className="px-4 py-2 rounded-xl bg-[#00552B] text-white text-xs font-bold cursor-pointer"
            >
              {pushPerm === 'granted' ? tr('Đã bật Push ✓', 'Push Enabled ✓') : tr('Bật Thông Báo Đẩy', 'Enable Push')}
            </button>
          </div>

          {/* Multi-Channel Customer Support */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold">{tr('Hỗ Trợ Khách Hàng Đa Kênh Trực Tiếp', 'Multi-Channel Live Support')}</h3>
            {!isSignedIn ? (
              <button type="button" onClick={onRequireLogin} className="px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-bold cursor-pointer">
                {tr('Đăng nhập để gửi khiếu nại / hỗ trợ trực tiếp', 'Sign In for Live Support')}
              </button>
            ) : (
              <>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await apiFetch('/api/support/tickets', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ channel: supportChannel, subject: supportSubject, message: supportMessage }),
                    });
                    if (res.ok) {
                      setSupportSubject('');
                      setSupportMessage('');
                      showToast(tr('Đã gửi yêu cầu hỗ trợ tới đội ngũ ROAR Care!', 'Support ticket sent live to ROAR Care!'));
                      loadSupportTickets();
                    }
                  }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs"
                >
                  <select
                    value={supportChannel}
                    onChange={(e) => setSupportChannel(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
                  >
                    <option value="web">Live Chat Web</option>
                    <option value="zalo">Zalo OA ROAR</option>
                    <option value="email">Email Care</option>
                    <option value="hotline">Hotline CSKH</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder={tr('Tiêu đề vấn đề / khiếu nại', 'Subject')}
                    className="sm:col-span-2 px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
                  />
                  <textarea
                    required
                    rows={2}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder={tr('Mô tả chi tiết để Admin hỗ trợ ngay...', 'Describe your issue...')}
                    className="sm:col-span-3 px-3 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15"
                  />
                  <button type="submit" className="px-4 py-2 rounded-lg bg-[#00552B] text-white font-bold cursor-pointer">
                    {tr('Gửi Yêu Cầu Ngay', 'Send Ticket')}
                  </button>
                </form>

                <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                  {supportTickets.map((t) => (
                    <div key={t.id} className="p-3 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span>
                          [{String(t.channel).toUpperCase()}] #{t.id} · {t.subject}
                        </span>
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-[#00552B]/15 text-[#00552B] dark:text-[#C6A667]">
                          {t.status}
                        </span>
                      </div>
                      <div className="space-y-1 pl-2 border-l-2 border-[#C6A667]/40">
                        {(t.messages || []).map((m: any) => (
                          <div key={m.id}>
                            <strong>{m.sender_name}:</strong> {m.message}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyByTicket[t.id] || ''}
                          onChange={(e) => setReplyByTicket((prev) => ({ ...prev, [t.id]: e.target.value }))}
                          placeholder={tr('Nhắn thêm phản hồi...', 'Reply...')}
                          className="flex-1 px-2.5 py-1.5 rounded bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            const msg = (replyByTicket[t.id] || '').trim();
                            if (!msg) return;
                            const res = await apiFetch(`/api/support/tickets/${t.id}/reply`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ message: msg }),
                            });
                            if (res.ok) {
                              setReplyByTicket((prev) => ({ ...prev, [t.id]: '' }));
                              loadSupportTickets();
                            }
                          }}
                          className="px-3 py-1.5 rounded bg-[#00552B] text-white font-bold cursor-pointer"
                        >
                          {tr('Gửi', 'Send')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Cloud Auto-Backup */}
          {isSignedIn && (
            <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" /> {tr('Sao Lưu Đám Mây Định Kỳ (Auto-Backup)', 'Cloud Auto-Backup')}
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await apiFetch('/api/account/backups', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ label: `Sao lưu Candy Saga Màn ${activeLevelNum}` }),
                    });
                    if (res.ok) {
                      showToast(tr('Đã tạo bản sao lưu Cloud an toàn!', 'Cloud snapshot saved!'));
                      loadBackups();
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#00552B] text-white font-bold cursor-pointer"
                >
                  {tr('Sao Lưu Ngay', 'Backup Now')}
                </button>
              </div>
              <div className="space-y-1.5">
                {backups.slice(0, 4).map((b) => (
                  <div key={b.id} className="p-2 rounded-lg bg-white dark:bg-[#16221C] flex items-center justify-between gap-2">
                    <span className="truncate">
                      [{b.trigger_type === 'auto' ? tr('Tự động', 'Auto') : tr('Thủ công', 'Manual')}] {b.summary_label} · {String(b.created_at).slice(0, 16)}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await apiFetch('/api/account/backups/restore', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ backupId: b.id }),
                        });
                        if (res.ok) {
                          showToast(tr('Đã khôi phục dữ liệu từ bản sao lưu!', 'Restored from backup!'));
                          loadSagaState(true);
                        }
                      }}
                      className="px-2.5 py-1 rounded border border-[#00552B] text-[#00552B] dark:text-[#C6A667] font-bold cursor-pointer shrink-0"
                    >
                      {tr('Khôi Phục', 'Restore')}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
