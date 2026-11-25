import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Box,
  Calendar,
  Check,
  Clock,
  Coffee,
  Coins,
  Compass,
  Copy,
  Crown,
  Eye,
  EyeOff,
  Flame,
  Gift,
  Hammer,
  Layers,
  Lock,
  Music,
  Palette,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Shield,
  Shuffle,
  Sparkles,
  Star,
  Sun,
  Trophy,
  Undo2,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Zap,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import {
  ARENA_BACKDROPS,
  CHARACTER_UPGRADES,
  CUBE_SKINS,
  CUBE_STREAK_REWARDS,
  LIGHTING_MOODS,
  TOOL_SHOP_ITEMS,
  computeXpForNextLevel,
  findBlockingDistance,
  generateSolvableCubeLevel,
  getActiveSpecialEvent,
  isDirectionClear,
  reshuffleCubeArrows,
  type ArenaBackdropId,
  type CharacterUpgradeId,
  type CubeAwayProfile,
  type CubeBlock,
  type CubeLevelSpec,
  type CubeSkinId,
  type LightingMoodId,
  type SpecialEventSpec,
} from '../../lib/cubeAwayData';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { CubeAway3DCanvas, type CubeAnimEvent, type CubeAway3DHandle } from './CubeAway3DCanvas';
import { gameSound } from './RoarGamesSound';

interface CubeAway3DGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  onSaveProgress?: (payload: { currentLevel: number; maxLevel: number; bestScore: number }) => void;
  onPlayReal: (useExtraPoints: boolean, score: number) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

type HubTab = 'levels' | 'character' | 'customize' | 'leaderboard' | 'friends';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  displayName: string;
  memberCode: string;
  tier: string;
  avatarBadge: string;
  charLevel: number;
  maxLevel?: number;
  score: number;
  timeMs?: number;
  streakDays?: number;
  isMe?: boolean;
}

interface FriendPlayerCard {
  friendshipId?: number;
  userId: number;
  displayName: string;
  memberCode: string;
  tier: string;
  avatarBadge: string;
  charLevel: number;
  maxLevel: number;
  totalScore: number;
  giftedToday?: boolean;
}

const GUEST_STORAGE_KEY = 'roar_cubeaway_guest_v1';

const AVATAR_BADGES: Array<{ id: string; emoji: string; labelVi: string; labelEn: string }> = [
  { id: 'lion', emoji: '🦁', labelVi: 'Sư Tử', labelEn: 'Lion' },
  { id: 'eagle', emoji: '🦅', labelVi: 'Đại Bàng', labelEn: 'Eagle' },
  { id: 'panther', emoji: '🐆', labelVi: 'Báo Đen', labelEn: 'Panther' },
  { id: 'tiger', emoji: '🐯', labelVi: 'Mãnh Hổ', labelEn: 'Tiger' },
  { id: 'fox', emoji: '🦊', labelVi: 'Cáo Lửa', labelEn: 'Fox' },
  { id: 'wolf', emoji: '🐺', labelVi: 'Sói Bạc', labelEn: 'Wolf' },
  { id: 'owl', emoji: '🦉', labelVi: 'Cú Đêm', labelEn: 'Owl' },
];

function getAvatarEmoji(badgeId: string): string {
  return AVATAR_BADGES.find((b) => b.id === badgeId)?.emoji || '🦁';
}

function getDefaultGuestProfile(): CubeAwayProfile {
  return {
    user_id: 0,
    display_name: 'Khách Trải Nghiệm',
    member_code: 'GUEST-ROAR',
    tier: 'ROAR Guest',
    avatar_badge: 'lion',
    xp: 0,
    level: 1,
    coins: 150,
    current_level: 1,
    max_level: 1,
    total_score: 0,
    levels_cleared: 0,
    daily_cleared_count: 0,
    last_daily_date: '',
    active_skin: 'arcade',
    unlocked_skins: ['arcade'],
    active_backdrop: 'indigo_studio',
    unlocked_backdrops: ['indigo_studio'],
    upgrades: { radar: 0, thruster: 0, shield: 0, arsenal: 0 },
    tool_hammer: 2,
    tool_shuffle: 2,
    tool_hint: 3,
    streak_days: 0,
    last_login_date: '',
    streak_claimed_days: [],
    event_cleared_stages: [],
  };
}

function readGuestProfile(): CubeAwayProfile {
  try {
    const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
    if (raw) {
      return { ...getDefaultGuestProfile(), ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return getDefaultGuestProfile();
}

function writeGuestProfile(profile: CubeAwayProfile) {
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

function getLocalTodayIso(): string {
  return new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10);
}

function formatCountdown(endsAtIso: string, lang: string): string {
  const diff = Math.max(0, new Date(endsAtIso).getTime() - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return lang === 'en' ? `${days}d ${hours}h ${mins}m left` : `Còn ${days} ngày ${hours}g ${mins}p`;
}

export const CubeAway3DGame: React.FC<CubeAway3DGameProps> = ({
  lang,
  config,
  rewards,
  remainingFreeToday,
  isSignedIn,
  userPoints,
  onSaveProgress,
  onPlayReal,
  onRequireLogin,
  onDemoResult,
}) => {
  const { apiFetch, showToast, refreshUser } = useStore();
  const tr = (vi: string, en: string) => (lang === 'en' ? en : vi);

  const canvasRef = useRef<CubeAway3DHandle | null>(null);
  const animNonceRef = useRef(0);
  const stageStartRef = useRef<number>(Date.now());

  const [todayDate, setTodayDate] = useState<string>(getLocalTodayIso());
  const [activeEvent, setActiveEvent] = useState<SpecialEventSpec>(() => getActiveSpecialEvent());
  const [profile, setProfile] = useState<CubeAwayProfile>(() =>
    isSignedIn ? getDefaultGuestProfile() : readGuestProfile()
  );
  const [loadingState, setLoadingState] = useState<boolean>(isSignedIn);

  // Active 3D Puzzle Session State
  const [levelSpec, setLevelSpec] = useState<CubeLevelSpec>(() =>
    generateSolvableCubeLevel({ mode: 'campaign', levelNumber: 1 })
  );
  const [blocks, setBlocks] = useState<CubeBlock[]>(() => levelSpec.blocks);
  const [movesUsed, setMovesUsed] = useState(0);
  const [mistakesMade, setMistakesMade] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hintBlockId, setHintBlockId] = useState<string | null>(null);
  const [hammerMode, setHammerMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);
  const [animEvent, setAnimEvent] = useState<CubeAnimEvent | null>(null);

  // Chill Lounge & Zen Features
  const [chillMode, setChillMode] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [moodId, setMoodId] = useState<LightingMoodId>(() => {
    try {
      const saved = window.localStorage.getItem('roar_cubeaway_mood_v1') as LightingMoodId | null;
      return saved && LIGHTING_MOODS.some((m) => m.id === saved) ? saved : 'default';
    } catch {
      return 'default';
    }
  });
  const [undoStack, setUndoStack] = useState<
    Array<{
      blocks: CubeBlock[];
      movesUsed: number;
      sessionScore: number;
      combo: number;
      mistakesMade: number;
    }>
  >([]);
  const [timerMinutes, setTimerMinutes] = useState<15 | 25>(15);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(15 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  const [stageResult, setStageResult] = useState<{
    status: 'won' | 'lost';
    stars: number;
    score: number;
    earnedCoins: number;
    earnedXp: number;
    leveledUp?: boolean;
    newCharLevel?: number;
    isFirstDailyToday?: boolean;
    dailyRoarPoints?: number;
    eventCompletedNow?: boolean;
    eventBonusRoarPts?: number;
  } | null>(null);
  const [claimingRoarReward, setClaimingRoarReward] = useState(false);
  const [claimedRewardSession, setClaimedRewardSession] = useState(false);

  // Hub Sub-Tabs State
  const [hubTab, setHubTab] = useState<HubTab>('levels');
  const [levelChapter, setLevelChapter] = useState<number>(0);
  const [lbTab, setLbTab] = useState<'global' | 'daily' | 'friends'>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  const [friendSearch, setFriendSearch] = useState('');
  const [addCodeInput, setAddCodeInput] = useState('');
  const [friendsData, setFriendsData] = useState<{
    friends: FriendPlayerCard[];
    incomingRequests: FriendPlayerCard[];
    outgoingRequests: FriendPlayerCard[];
    directory: FriendPlayerCard[];
  }>({ friends: [], incomingRequests: [], outgoingRequests: [], directory: [] });
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [busyAction, setBusyAction] = useState(false);

  const minScoreToWin = Number(config?.min_score_to_win || 150);
  const extraCost = Number(config?.extra_play_cost_points || 20);
  const canPlayWithPoints = userPoints >= extraCost;

  const mistakeAllowance = useMemo(() => {
    return 5 + (profile.upgrades?.shield || 0) * 2;
  }, [profile.upgrades?.shield]);
  const mistakesRemaining = Math.max(0, mistakeAllowance - mistakesMade);

  const startStage = useCallback(
    (spec: CubeLevelSpec, currentProfile: CubeAwayProfile) => {
      setLevelSpec(spec);
      setBlocks(spec.blocks);
      setMovesUsed(0);
      setMistakesMade(0);
      setSessionScore(0);
      setCombo(0);
      setUndoStack([]);
      setHammerMode(false);
      setStageResult(null);
      setClaimedRewardSession(false);
      stageStartRef.current = Date.now();

      // Tactical Vision (Radar) Lv >= 2 automatically spotlights an opening block at stage start
      if ((currentProfile.upgrades?.radar || 0) >= 2 && spec.blocks.length > 0) {
        const opening = spec.blocks.find((b) => isDirectionClear(b, spec.blocks));
        setHintBlockId(opening?.id || null);
      } else {
        setHintBlockId(null);
      }
      window.setTimeout(() => canvasRef.current?.resetView(), 60);
    },
    []
  );

  // Stop Lo-Fi audio cleanly if player leaves Cube Away
  useEffect(() => {
    return () => {
      gameSound.stopLofi();
    };
  }, []);

  // Coffee Break Pomodoro countdown
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setTimerRunning(false);
          gameSound.chillBell();
          showToast(
            lang === 'en'
              ? '☕ Coffee Break complete! Take a calm sip of ROAR Coffee.'
              : '☕ Hết phiên Chill! Nhâm nhi ngụm cà phê ROAR thư giãn nhé.'
          );
          return timerMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, timerMinutes, lang, showToast]);

  // Sync Backend State
  const fetchBackendState = useCallback(
    async (initStage = false) => {
      try {
        if (isSignedIn) setLoadingState(true);
        const res = await apiFetch('/api/cubeaway/state');
        if (res.ok) {
          const d = await res.json();
          if (d.todayDate) setTodayDate(d.todayDate);
          if (d.activeEvent) setActiveEvent(d.activeEvent);
          if (d.profile) {
            setProfile(d.profile);
            if (initStage) {
              const targetLvl = Math.max(1, d.profile.current_level || 1);
              startStage(generateSolvableCubeLevel({ mode: 'campaign', levelNumber: targetLvl }), d.profile);
            }
          }
        }
      } catch {
        // Fallback already initialized
      } finally {
        setLoadingState(false);
      }
    },
    [apiFetch, isSignedIn, startStage]
  );

  useEffect(() => {
    if (isSignedIn) {
      fetchBackendState(true);
    } else {
      const gp = readGuestProfile();
      setProfile(gp);
      setLoadingState(false);
      startStage(generateSolvableCubeLevel({ mode: 'campaign', levelNumber: gp.current_level || 1 }), gp);
    }
  }, [isSignedIn, fetchBackendState, startStage]);

  const loadLeaderboard = useCallback(
    async (tab: 'global' | 'daily' | 'friends') => {
      setLbLoading(true);
      try {
        const res = await apiFetch(`/api/cubeaway/leaderboard?tab=${tab}`);
        if (res.ok) {
          const d = await res.json();
          setLeaderboard(Array.isArray(d.entries) ? d.entries : []);
        }
      } catch {
        setLeaderboard([]);
      } finally {
        setLbLoading(false);
      }
    },
    [apiFetch]
  );

  const loadFriends = useCallback(
    async (q = '') => {
      if (!isSignedIn) return;
      setFriendsLoading(true);
      try {
        const res = await apiFetch(`/api/cubeaway/friends?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const d = await res.json();
          setFriendsData({
            friends: d.friends || [],
            incomingRequests: d.incomingRequests || [],
            outgoingRequests: d.outgoingRequests || [],
            directory: d.directory || [],
          });
        }
      } catch {
        // ignore
      } finally {
        setFriendsLoading(false);
      }
    },
    [apiFetch, isSignedIn]
  );

  useEffect(() => {
    if (hubTab === 'leaderboard') {
      loadLeaderboard(lbTab);
    } else if (hubTab === 'friends' && isSignedIn) {
      loadFriends(friendSearch);
    }
  }, [hubTab, lbTab, isSignedIn, loadLeaderboard, loadFriends, friendSearch]);

  const updateGuestProfile = (updater: (prev: CubeAwayProfile) => CubeAwayProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      writeGuestProfile(next);
      return next;
    });
  };

  // Handle stage completion persistence (Backend or Guest local)
  const finishStageWin = useCallback(
    async (finalScore: number, totalMoves: number, mistakesCount: number) => {
      gameSound.win();
      const stars = mistakesCount === 0 ? 3 : mistakesCount <= 2 ? 2 : 1;
      const elapsedMs = Math.max(1000, Date.now() - stageStartRef.current);

      if (isSignedIn) {
        try {
          const res = await apiFetch('/api/cubeaway/complete-stage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: levelSpec.mode,
              stageKey: levelSpec.stageKey,
              levelNumber: levelSpec.levelNumber,
              score: finalScore,
              movesUsed: totalMoves,
              timeMs: elapsedMs,
              stars,
              coinReward: levelSpec.coinReward,
              xpReward: levelSpec.xpReward,
            }),
          });
          if (res.ok) {
            const d = await res.json();
            if (d.profile) {
              setProfile(d.profile);
              onSaveProgress?.({
                currentLevel: Math.max(1, d.profile.current_level || 1),
                maxLevel: Math.max(1, d.profile.max_level || 1),
                bestScore: Math.max(finalScore, d.profile.total_score || finalScore),
              });
            }
            if (d.dailyRoarPoints > 0 || d.eventBonusRoarPts > 0) {
              refreshUser().catch(() => {});
            }
            setStageResult({
              status: 'won',
              stars,
              score: finalScore,
              earnedCoins: Number(d.earnedCoins || levelSpec.coinReward),
              earnedXp: Number(d.earnedXp || levelSpec.xpReward),
              leveledUp: Boolean(d.leveledUp),
              newCharLevel: d.newCharLevel,
              isFirstDailyToday: Boolean(d.isFirstDailyToday),
              dailyRoarPoints: Number(d.dailyRoarPoints || 0),
              eventCompletedNow: Boolean(d.eventCompletedNow),
              eventBonusRoarPts: Number(d.eventBonusRoarPts || 0),
            });
            return;
          }
        } catch {
          // fallback below
        }
      }

      // Guest local progression
      const arsenalMult = 1 + (profile.upgrades?.arsenal || 0) * 0.2;
      const isDailyFirst = levelSpec.mode === 'daily' && profile.last_daily_date !== todayDate;
      const mult = isDailyFirst ? 2 : 1;
      const earnedCoins = Math.round(levelSpec.coinReward * arsenalMult * mult);
      const earnedXp = Math.round(levelSpec.xpReward * mult);
      let leveledUp = false;
      let nextLevel = profile.level;

      updateGuestProfile((prev) => {
        let xp = prev.xp + earnedXp;
        let lvl = prev.level;
        let bonusHammer = 0;
        while (xp >= computeXpForNextLevel(lvl)) {
          xp -= computeXpForNextLevel(lvl);
          lvl += 1;
          leveledUp = true;
          bonusHammer += prev.upgrades.arsenal > 0 ? 1 : 0;
        }
        nextLevel = lvl;
        const nextEventStages =
          levelSpec.mode === 'event'
            ? Array.from(new Set([...prev.event_cleared_stages, levelSpec.stageKey]))
            : prev.event_cleared_stages;
        return {
          ...prev,
          xp,
          level: lvl,
          coins: prev.coins + earnedCoins,
          current_level: levelSpec.mode === 'campaign' ? levelSpec.levelNumber + 1 : prev.current_level,
          max_level:
            levelSpec.mode === 'campaign'
              ? Math.max(prev.max_level, levelSpec.levelNumber + 1)
              : prev.max_level,
          total_score: prev.total_score + finalScore,
          levels_cleared: prev.levels_cleared + 1,
          daily_cleared_count: isDailyFirst ? prev.daily_cleared_count + 1 : prev.daily_cleared_count,
          last_daily_date: levelSpec.mode === 'daily' ? todayDate : prev.last_daily_date,
          tool_hammer: prev.tool_hammer + bonusHammer,
          event_cleared_stages: nextEventStages,
        };
      });

      setStageResult({
        status: 'won',
        stars,
        score: finalScore,
        earnedCoins,
        earnedXp,
        leveledUp,
        newCharLevel: nextLevel,
        isFirstDailyToday: isDailyFirst,
      });
    },
    [apiFetch, isSignedIn, levelSpec, profile, refreshUser, todayDate]
  );

  // Handle 3D Cube Tap
  const handleTapBlock = useCallback(
    async (blockId: string) => {
      if (stageResult) return;
      const target = blocks.find((b) => b.id === blockId);
      if (!target) return;

      // Hammer smash mode!
      if (hammerMode) {
        if (profile.tool_hammer <= 0) {
          setHammerMode(false);
          showToast(tr('Bạn đã hết Búa Phá Khối! Hãy mua thêm bằng Xu.', 'Out of Smash Hammers! Buy more with Coins.'));
          return;
        }
        if (isSignedIn) {
          const res = await apiFetch('/api/cubeaway/use-tool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: 'hammer' }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            showToast(d.error || tr('Không thể dùng Búa.', 'Cannot use Hammer.'));
            setHammerMode(false);
            return;
          }
          const d = await res.json();
          if (d.profile) setProfile(d.profile);
        } else {
          updateGuestProfile((p) => ({ ...p, tool_hammer: Math.max(0, p.tool_hammer - 1) }));
        }

        gameSound.cubeSmash();
        setUndoStack((prev) => [
          ...prev.slice(-29),
          { blocks, movesUsed, sessionScore, combo, mistakesMade },
        ]);
        setHammerMode(false);
        setHintBlockId(null);
        animNonceRef.current += 1;
        setAnimEvent({ nonce: animNonceRef.current, type: 'smash', blockId: target.id, block: target });

        const nextBlocks = blocks.filter((b) => b.id !== target.id);
        const nextMoves = movesUsed + 1;
        const nextScore = sessionScore + 25;
        setBlocks(nextBlocks);
        setMovesUsed(nextMoves);
        setSessionScore(nextScore);

        if (nextBlocks.length === 0) {
          finishStageWin(nextScore + Math.max(0, mistakesRemaining) * 15, nextMoves, mistakesMade);
        }
        return;
      }

      // Normal directional tap check
      if (isDirectionClear(target, blocks)) {
        const nextCombo = combo + 1;
        const thrusterMult = 1 + (profile.upgrades?.thruster || 0) * 0.18;
        const hintMult = hintBlockId === target.id ? 1 + (profile.upgrades?.radar || 0) * 0.15 : 1;
        const pts = Math.round((15 + Math.min(nextCombo, 10) * 4) * thrusterMult * hintMult);

        if (chillMode) {
          gameSound.cubeWhooshChill(nextCombo);
        } else {
          gameSound.cubeWhoosh(nextCombo);
        }
        setUndoStack((prev) => [
          ...prev.slice(-29),
          { blocks, movesUsed, sessionScore, combo, mistakesMade },
        ]);
        animNonceRef.current += 1;
        setAnimEvent({ nonce: animNonceRef.current, type: 'fly', blockId: target.id, block: target });

        const nextBlocks = blocks.filter((b) => b.id !== target.id);
        const nextMoves = movesUsed + 1;
        const nextScore = sessionScore + pts;

        setHintBlockId(null);
        setCombo(nextCombo);
        setBlocks(nextBlocks);
        setMovesUsed(nextMoves);
        setSessionScore(nextScore);

        if (nextBlocks.length === 0) {
          const shieldBonus = Math.max(0, mistakesRemaining) * 18;
          finishStageWin(nextScore + shieldBonus, nextMoves, mistakesMade);
        }
      } else {
        // Blocked! Bounce animation; in Chill Mode no mistake penalty
        const dist = findBlockingDistance(target, blocks) || 1;
        if (chillMode) {
          gameSound.flip();
        } else {
          gameSound.cubeBlocked();
        }
        animNonceRef.current += 1;
        setAnimEvent({ nonce: animNonceRef.current, type: 'blocked', blockId: target.id, blockingSteps: dist });

        setCombo(0);
        setMovesUsed((m) => m + 1);

        if (!chillMode) {
          const nextMistakes = mistakesMade + 1;
          setMistakesMade(nextMistakes);
          if (nextMistakes >= mistakeAllowance) {
            gameSound.gameOver();
            setStageResult({
              status: 'lost',
              stars: 0,
              score: sessionScore,
              earnedCoins: 0,
              earnedXp: 0,
            });
          }
        }
      }
    },
    [
      apiFetch,
      blocks,
      chillMode,
      combo,
      finishStageWin,
      hammerMode,
      hintBlockId,
      isSignedIn,
      mistakeAllowance,
      mistakesMade,
      mistakesRemaining,
      movesUsed,
      profile.tool_hammer,
      profile.upgrades?.radar,
      profile.upgrades?.thruster,
      sessionScore,
      showToast,
      stageResult,
    ]
  );

  const handleUndoMove = () => {
    if (stageResult || undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setBlocks(prev.blocks);
    setMovesUsed(prev.movesUsed);
    setSessionScore(prev.sessionScore);
    setCombo(prev.combo);
    setMistakesMade(prev.mistakesMade);
    setHintBlockId(null);
    setHammerMode(false);
    gameSound.flip();
  };

  // Tool: Smart Hint
  const handleUseHint = async () => {
    if (stageResult || blocks.length === 0) return;
    if (profile.tool_hint <= 0) {
      showToast(tr('Đã hết Gợi Ý! Bạn có thể mua thêm ở tab Nhân Vật.', 'No Hints left! Buy more in the Character tab.'));
      setHubTab('character');
      return;
    }
    const clearBlock = blocks.find((b) => isDirectionClear(b, blocks));
    if (!clearBlock) {
      showToast(tr('Không tìm thấy hướng thoát mở — hãy dùng Đảo Hướng 3D!', 'No open ray found — use Arrow Shuffle!'));
      return;
    }
    if (isSignedIn) {
      const res = await apiFetch('/api/cubeaway/use-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'hint' }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || tr('Không thể dùng Gợi Ý.', 'Cannot use Hint.'));
        return;
      }
      const d = await res.json();
      if (d.profile) setProfile(d.profile);
    } else {
      updateGuestProfile((p) => ({ ...p, tool_hint: Math.max(0, p.tool_hint - 1) }));
    }

    gameSound.flip();
    setHintBlockId(clearBlock.id);
    canvasRef.current?.focusBlock(clearBlock.id);
  };

  // Tool: Shuffle Arrows
  const handleUseShuffle = async () => {
    if (stageResult || blocks.length === 0) return;
    if (profile.tool_shuffle <= 0) {
      showToast(tr('Đã hết lượt Đảo Hướng! Mua thêm ở tab Nhân Vật.', 'No Shuffles left! Buy more in Character tab.'));
      setHubTab('character');
      return;
    }
    if (isSignedIn) {
      const res = await apiFetch('/api/cubeaway/use-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'shuffle' }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || tr('Không thể Đảo Hướng.', 'Cannot use Shuffle.'));
        return;
      }
      const d = await res.json();
      if (d.profile) setProfile(d.profile);
    } else {
      updateGuestProfile((p) => ({ ...p, tool_shuffle: Math.max(0, p.tool_shuffle - 1) }));
    }

    gameSound.cubeShuffle();
    setHintBlockId(null);
    setBlocks((prev) => reshuffleCubeArrows(prev, `${Date.now()}-${prev.length}`));
    showToast(tr('Đã đảo hướng toàn bộ mũi tên theo lộ trình mới!', 'Re-oriented remaining cubes with a fresh solution!'));
  };

  // Claim Real ROAR Reward Integration
  const handleClaimRoarReward = async (useExtraPoints: boolean) => {
    const activeScore = stageResult?.score || sessionScore;
    if (!isSignedIn) {
      const activePool = rewards.filter((r) => r.active && (r.stock_total < 0 || r.stock_remaining > 0));
      if (activePool.length > 0) {
        const sample = activePool[Math.floor(Math.random() * activePool.length)];
        onDemoResult(sample);
      } else {
        onRequireLogin();
      }
      return;
    }
    setClaimingRoarReward(true);
    try {
      const res = await onPlayReal(useExtraPoints, activeScore);
      if (res && res.won) {
        setClaimedRewardSession(true);
      }
    } finally {
      setClaimingRoarReward(false);
    }
  };

  // Character Upgrade
  const handleUpgradePerk = async (upgradeId: CharacterUpgradeId) => {
    const spec = CHARACTER_UPGRADES.find((u) => u.id === upgradeId);
    if (!spec || busyAction) return;
    const currentLvl = profile.upgrades?.[upgradeId] || 0;
    if (currentLvl >= spec.maxLevel) return;
    const cost = spec.baseCost + currentLvl * spec.costStep;

    if (!isSignedIn) {
      if (profile.coins < cost) {
        showToast(tr(`Cần ${cost} Cube Coins để nâng cấp!`, `Need ${cost} Cube Coins to upgrade!`));
        return;
      }
      gameSound.coinClink();
      updateGuestProfile((prev) => ({
        ...prev,
        coins: prev.coins - cost,
        upgrades: { ...prev.upgrades, [upgradeId]: currentLvl + 1 },
        tool_hammer: prev.tool_hammer + (upgradeId === 'arsenal' ? 1 : 0),
        tool_hint: prev.tool_hint + (upgradeId === 'radar' ? 1 : 0),
      }));
      showToast(tr(`Đã nâng cấp ${spec.nameVi} lên Cấp ${currentLvl + 1}!`, `Upgraded ${spec.nameEn} to Lv.${currentLvl + 1}!`));
      return;
    }

    setBusyAction(true);
    try {
      const res = await apiFetch('/api/cubeaway/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || tr('Không thể nâng cấp.', 'Upgrade failed.'));
        return;
      }
      if (d.profile) setProfile(d.profile);
      gameSound.coinClink();
      showToast(tr(`Đã nâng cấp ${spec.nameVi}!`, `Upgraded ${spec.nameEn}!`));
    } finally {
      setBusyAction(false);
    }
  };

  // Buy Tool
  const handleBuyTool = async (tool: 'hammer' | 'shuffle' | 'hint', costCoins: number) => {
    if (busyAction) return;
    if (!isSignedIn) {
      if (profile.coins < costCoins) {
        showToast(tr(`Cần ${costCoins} Cube Coins!`, `Need ${costCoins} Cube Coins!`));
        return;
      }
      gameSound.coinClink();
      updateGuestProfile((p) => ({
        ...p,
        coins: p.coins - costCoins,
        tool_hammer: p.tool_hammer + (tool === 'hammer' ? 1 : 0),
        tool_shuffle: p.tool_shuffle + (tool === 'shuffle' ? 1 : 0),
        tool_hint: p.tool_hint + (tool === 'hint' ? 1 : 0),
      }));
      showToast(tr('Đã mua vật phẩm!', 'Item purchased!'));
      return;
    }

    setBusyAction(true);
    try {
      const res = await apiFetch('/api/cubeaway/buy-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || tr('Không đủ Xu.', 'Not enough Coins.'));
        return;
      }
      if (d.profile) setProfile(d.profile);
      gameSound.coinClink();
      showToast(tr('Mua vật phẩm thành công!', 'Tool added to inventory!'));
    } finally {
      setBusyAction(false);
    }
  };

  // Customize Skin / Backdrop / Avatar
  const handleCustomize = async (kind: 'skin' | 'backdrop' | 'avatar', itemId: string) => {
    if (busyAction) return;

    if (!isSignedIn) {
      if (kind === 'avatar') {
        updateGuestProfile((p) => ({ ...p, avatar_badge: itemId }));
        return;
      }
      if (kind === 'skin') {
        const skin = CUBE_SKINS.find((s) => s.id === (itemId as CubeSkinId));
        if (!skin) return;
        const unlocked = profile.unlocked_skins.includes(skin.id);
        if (!unlocked && profile.coins < skin.costCoins) {
          showToast(tr(`Cần ${skin.costCoins} Cube Coins để mở khóa!`, `Need ${skin.costCoins} Coins to unlock!`));
          return;
        }
        gameSound.coinClink();
        updateGuestProfile((p) => ({
          ...p,
          coins: unlocked ? p.coins : p.coins - skin.costCoins,
          active_skin: skin.id,
          unlocked_skins: unlocked ? p.unlocked_skins : [...p.unlocked_skins, skin.id],
        }));
      } else {
        const bd = ARENA_BACKDROPS.find((b) => b.id === (itemId as ArenaBackdropId));
        if (!bd) return;
        const unlocked = profile.unlocked_backdrops.includes(bd.id);
        if (!unlocked && profile.coins < bd.costCoins) {
          showToast(tr(`Cần ${bd.costCoins} Cube Coins để mở khóa!`, `Need ${bd.costCoins} Coins to unlock!`));
          return;
        }
        gameSound.coinClink();
        updateGuestProfile((p) => ({
          ...p,
          coins: unlocked ? p.coins : p.coins - bd.costCoins,
          active_backdrop: bd.id,
          unlocked_backdrops: unlocked ? p.unlocked_backdrops : [...p.unlocked_backdrops, bd.id],
        }));
      }
      return;
    }

    setBusyAction(true);
    try {
      const res = await apiFetch('/api/cubeaway/customize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kind === 'avatar' ? { kind, avatarBadge: itemId } : { kind, itemId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || tr('Không thể cập nhật giao diện.', 'Could not customize theme.'));
        return;
      }
      if (d.profile) setProfile(d.profile);
      gameSound.coinClink();
    } finally {
      setBusyAction(false);
    }
  };

  // Claim 7-Day Login Streak Reward
  const handleClaimStreak = async () => {
    if (busyAction) return;
    if (profile.last_login_date === todayDate) {
      showToast(tr('Bạn đã nhận thưởng điểm danh hôm nay rồi!', 'Already claimed today!'));
      return;
    }

    if (!isSignedIn) {
      const nextStreak = profile.streak_days + 1;
      const cycleDay = ((nextStreak - 1) % 7) + 1;
      const spec = CUBE_STREAK_REWARDS[cycleDay - 1] || CUBE_STREAK_REWARDS[0];
      gameSound.win();
      updateGuestProfile((p) => ({
        ...p,
        coins: p.coins + spec.coins,
        xp: p.xp + spec.xp,
        streak_days: nextStreak,
        last_login_date: todayDate,
        streak_claimed_days: cycleDay === 1 ? [1] : Array.from(new Set([...p.streak_claimed_days, cycleDay])),
        tool_hammer: p.tool_hammer + (spec.toolGift?.tool === 'hammer' ? spec.toolGift.qty : 0),
        tool_shuffle: p.tool_shuffle + (spec.toolGift?.tool === 'shuffle' ? spec.toolGift.qty : 0),
        tool_hint: p.tool_hint + (spec.toolGift?.tool === 'hint' ? spec.toolGift.qty : 0),
        unlocked_skins: spec.skinUnlock ? Array.from(new Set([...p.unlocked_skins, spec.skinUnlock])) : p.unlocked_skins,
      }));
      showToast(tr(`Đã nhận quà Ngày ${cycleDay}: ${spec.labelVi}!`, `Claimed Day ${cycleDay}: ${spec.labelEn}!`));
      return;
    }

    setBusyAction(true);
    try {
      const res = await apiFetch('/api/cubeaway/claim-streak', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || tr('Không thể nhận quà.', 'Claim failed.'));
        return;
      }
      if (d.profile) setProfile(d.profile);
      gameSound.win();
      showToast(
        tr(
          `Nhận quà Ngày ${d.claimedDay}: ${d.reward?.labelVi || '+Xu'}!`,
          `Claimed Day ${d.claimedDay}: ${d.reward?.labelEn || '+Coins'}!`
        )
      );
    } finally {
      setBusyAction(false);
    }
  };

  // Friend Actions
  const handleSendFriendRequest = async (opts: { targetUserId?: number; memberCode?: string }) => {
    if (!isSignedIn || busyAction) return;
    setBusyAction(true);
    try {
      const res = await apiFetch('/api/cubeaway/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || tr('Không thể gửi kết bạn.', 'Could not send request.'));
        return;
      }
      gameSound.coinClink();
      showToast(
        d.status === 'accepted'
          ? tr('Hai bạn đã trở thành bạn bè!', 'You are now friends!')
          : tr('Đã gửi lời mời kết bạn!', 'Friend request sent!')
      );
      setAddCodeInput('');
      await loadFriends(friendSearch);
    } finally {
      setBusyAction(false);
    }
  };

  const handleRespondFriend = async (friendshipId: number, action: 'accept' | 'decline') => {
    if (!isSignedIn || busyAction) return;
    setBusyAction(true);
    try {
      const res = await apiFetch('/api/cubeaway/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action }),
      });
      if (res.ok) {
        if (action === 'accept') gameSound.win();
        await loadFriends(friendSearch);
      }
    } finally {
      setBusyAction(false);
    }
  };

  const handleGiftFriend = async (friendId: number) => {
    if (!isSignedIn || busyAction) return;
    setBusyAction(true);
    try {
      const res = await apiFetch('/api/cubeaway/friends/gift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || tr('Không thể gửi quà.', 'Gift failed.'));
        return;
      }
      if (d.profile) setProfile(d.profile);
      gameSound.coinClink();
      showToast(tr('Đã tặng bạn bè +15 Xu & bạn nhận +5 Xu cảm ơn!', 'Sent +15 Coins & received +5 Coins bonus!'));
      await loadFriends(friendSearch);
    } finally {
      setBusyAction(false);
    }
  };

  const xpNext = computeXpForNextLevel(profile.level);
  const xpPct = Math.min(100, Math.round((profile.xp / Math.max(1, xpNext)) * 100));
  const campaignLevelsCount = Math.max(36, Math.ceil((profile.max_level + 5) / 18) * 18);
  const totalChapters = Math.ceil(campaignLevelsCount / 18);
  const activeChapter = Math.min(levelChapter, totalChapters - 1);
  const chapterStartLvl = activeChapter * 18 + 1;
  const chapterEndLvl = Math.min(campaignLevelsCount, (activeChapter + 1) * 18);
  const dailyDoneToday = profile.last_daily_date === todayDate;
  const eventAllCleared = activeEvent.stages.every((s) => profile.event_cleared_stages.includes(s.stageKey));
  const nextStreakDay = profile.last_login_date === todayDate
    ? Math.max(1, ((profile.streak_days - 1) % 7) + 1)
    : (profile.streak_days % 7) + 1;

  const currentModeBadge =
    levelSpec.mode === 'daily'
      ? tr('Thử Thách Ngày', 'Daily 2×')
      : levelSpec.mode === 'event'
        ? tr(`Sự Kiện · Màn ${levelSpec.levelNumber}`, `Event · Stage ${levelSpec.levelNumber}`)
        : tr(`Cấp ${levelSpec.levelNumber}`, `Level ${levelSpec.levelNumber}`);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* Mobile 1-Line Compact Summary Strip */}
      <div className="sm:hidden flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 text-[11px] font-bold tabular-nums">
        <span className="inline-flex items-center gap-1 min-w-0">
          <span className="w-6 h-6 rounded-md bg-[#00552B] text-white inline-flex items-center justify-center text-xs shrink-0">
            {getAvatarEmoji(profile.avatar_badge)}
          </span>
          <span className="text-[#111111] dark:text-[#F8F5EF] whitespace-nowrap">Lv.{profile.level}</span>
        </span>
        <span className="text-[#B45309] dark:text-[#FBBF24] whitespace-nowrap">🪙 {profile.coins.toLocaleString()}</span>
        <span className="text-[#00552B] dark:text-[#4ADE80] whitespace-nowrap">🔥 {profile.streak_days}d</span>
        <span className="text-[#111111] dark:text-[#F8F5EF] whitespace-nowrap">🏆 {profile.total_score.toLocaleString()}</span>
      </div>

      {/* Desktop/Tablet Character & Wallet Summary Strip */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-2">
        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#00552B] text-white flex items-center justify-center text-sm shrink-0 shadow-sm">
            {getAvatarEmoji(profile.avatar_badge)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold text-[#111111] dark:text-[#F8F5EF] truncate">
              Lv.{profile.level} {tr('Bậc Thầy', 'Master')}
            </div>
            <div className="h-1.5 w-full rounded bg-black/10 dark:bg-white/10 mt-0.5 overflow-hidden">
              <div className="h-full bg-[#C6A667] transition-all" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#202020]/60 dark:text-[#F1EFEA]/60 font-bold">
              {tr('Cube Coins', 'Cube Coins')}
            </div>
            <div className="text-sm font-extrabold text-[#B45309] dark:text-[#FBBF24] tabular-nums">
              {profile.coins.toLocaleString()}
            </div>
          </div>
          <Coins className="w-4 h-4 text-[#F59E0B] shrink-0" />
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#202020]/60 dark:text-[#F1EFEA]/60 font-bold">
              {tr('Chuỗi Ngày', 'Streak')}
            </div>
            <div className="text-sm font-extrabold text-[#00552B] dark:text-[#4ADE80] tabular-nums">
              {profile.streak_days} {tr('ngày', 'days')}
            </div>
          </div>
          <Flame className="w-4 h-4 text-[#EF4444] shrink-0" />
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#202020]/60 dark:text-[#F1EFEA]/60 font-bold">
              {tr('Tổng Điểm 3D', '3D Score')}
            </div>
            <div className="text-sm font-extrabold text-[#111111] dark:text-[#F8F5EF] tabular-nums">
              {profile.total_score.toLocaleString()}
            </div>
          </div>
          <Trophy className="w-4 h-4 text-[#C6A667] shrink-0" />
        </div>
      </div>

      {/* 3D Interactive Studio Viewport (Zero backdrop-blur overlays over WebGL canvas) */}
      <div className="relative h-[340px] sm:h-[440px] w-full rounded-2xl overflow-hidden border border-[#C6A667]/35 bg-[#0F172A] shadow-lg select-none">
        <CubeAway3DCanvas
          ref={canvasRef}
          blocks={blocks}
          skinId={profile.active_skin}
          backdropId={profile.active_backdrop}
          moodId={moodId}
          chillMode={chillMode}
          hintBlockId={hintBlockId}
          hammerMode={hammerMode}
          autoRotate={autoRotate}
          animEvent={animEvent}
          onTapBlock={handleTapBlock}
        />

        {/* Cinema Mode Expand-HUD Button (only visible when cinemaMode is on) */}
        {cinemaMode && (
          <button
            type="button"
            onClick={() => setCinemaMode(false)}
            className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1.5 rounded-lg bg-[#090D16]/85 border border-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#1E293B]"
          >
            <Eye className="w-3.5 h-3.5 text-[#C6A667]" />
            <span>{tr('Hiện HUD', 'Show HUD')}</span>
          </button>
        )}

        {/* Top Studio HUD Strip */}
        {!cinemaMode && (
          <div className="absolute top-2 left-2 right-2 sm:top-2.5 sm:left-2.5 sm:right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
            <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto flex-wrap min-w-0">
              <div className="hidden sm:flex px-2 py-1 rounded-lg bg-[#090D16]/85 border border-[#C6A667]/35 items-center">
                <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
              </div>
              <div className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#090D16]/85 border border-white/15 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                <Box className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#C6A667]" />
                <span>{currentModeBadge}</span>
              </div>
              <div className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#090D16]/85 border border-white/15 text-white text-[11px] sm:text-xs font-bold tabular-nums whitespace-nowrap">
                {blocks.length} <span className="hidden sm:inline">{tr('khối', 'cubes')}</span>
              </div>
              <div
                className={`px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border text-[11px] sm:text-xs font-bold flex items-center gap-1 tabular-nums whitespace-nowrap ${
                  chillMode
                    ? 'bg-[#00552B]/90 border-emerald-400/50 text-emerald-100'
                    : mistakesRemaining <= 2
                      ? 'bg-[#7F1D1D]/90 border-red-400/50 text-red-100'
                      : 'bg-[#090D16]/85 border-white/15 text-emerald-300'
                }`}
                title={chillMode ? tr('Chế độ Chill: Không giới hạn lỗi', 'Chill Mode: Unlimited mistakes') : tr('Lượt chạm nhầm còn lại', 'Remaining mistake shield')}
              >
                {chillMode ? <Coffee className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                <span>{chillMode ? '∞' : mistakesRemaining}</span>
              </div>
              <div className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#090D16]/85 border border-[#C6A667]/40 text-[#FDE047] text-[11px] sm:text-xs font-extrabold tabular-nums whitespace-nowrap">
                {sessionScore} {combo >= 2 ? `· x${combo}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-1 pointer-events-auto shrink-0">
              <button
                type="button"
                onClick={() => setAutoRotate((v) => !v)}
                className={`p-1.5 sm:p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                  autoRotate
                    ? 'bg-[#C6A667] border-[#C6A667] text-[#111111]'
                    : 'bg-[#090D16]/85 border-white/15 text-white/90 hover:bg-[#1E293B]'
                }`}
                title={tr('Tự xoay 3D', 'Auto-rotate 3D')}
              >
                <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                className="p-1.5 sm:p-2 rounded-lg bg-[#090D16]/85 border border-white/15 text-white/90 hover:bg-[#1E293B] cursor-pointer"
                title={tr('Bật/tắt âm thanh', 'Toggle sound')}
              >
                {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const regenerated =
                    levelSpec.mode === 'daily'
                      ? generateSolvableCubeLevel({ mode: 'daily', dateStr: todayDate })
                      : levelSpec.mode === 'event'
                        ? generateSolvableCubeLevel({
                            mode: 'event',
                            eventStage: activeEvent.stages.find((s) => s.stageKey === levelSpec.stageKey) || activeEvent.stages[0],
                          })
                        : generateSolvableCubeLevel({ mode: 'campaign', levelNumber: levelSpec.levelNumber });
                  startStage(regenerated, profile);
                }}
                className="p-1.5 sm:p-2 rounded-lg bg-[#090D16]/85 border border-white/15 text-white/90 hover:bg-[#1E293B] cursor-pointer"
                title={tr('Chơi lại màn này', 'Restart stage')}
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCinemaMode(true)}
                className="p-1.5 sm:p-2 rounded-lg bg-[#090D16]/85 border border-white/15 text-white/90 hover:bg-[#1E293B] cursor-pointer"
                title={tr('Ẩn HUD để ngắm khối 3D', 'Cinema / Zen view')}
              >
                <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Hammer Active Helper Notice */}
        {hammerMode && !stageResult && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1 rounded-lg bg-[#D97706] text-white text-xs font-bold shadow-lg pointer-events-none">
            {tr('Chạm vào BẤT KỲ khối nào để phá vỡ ngay!', 'Tap ANY cube to smash it!')}
          </div>
        )}

        {/* Bottom Power-Ups & Camera Dock */}
        {!cinemaMode && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                disabled={undoStack.length === 0}
                onClick={handleUndoMove}
                className="px-2.5 py-1.5 rounded-lg bg-[#090D16]/90 hover:bg-[#1E293B] border border-white/25 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={tr('Hoàn tác bước vừa rồi', 'Undo last move')}
              >
                <Undo2 className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">{tr('Hoàn tác', 'Undo')}</span>
              </button>

              <button
                type="button"
                onClick={handleUseHint}
                className="px-2.5 py-1.5 rounded-lg bg-[#090D16]/90 hover:bg-[#1E293B] border border-[#FACC15]/40 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                title={tr('Gợi ý khối thoát sẵn', 'Spotlight clear cube')}
              >
                <Zap className="w-3.5 h-3.5 text-[#FACC15]" />
                <span className="hidden sm:inline">{tr('Gợi Ý', 'Hint')}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] tabular-nums">{profile.tool_hint}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!hammerMode && profile.tool_hammer <= 0) {
                    showToast(tr('Đã hết Búa! Mua thêm trong Nhân Vật.', 'Out of Hammers! Buy in Character tab.'));
                    setHubTab('character');
                    return;
                  }
                  setHammerMode((v) => !v);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1 cursor-pointer ${
                  hammerMode
                    ? 'bg-[#D97706] border-[#FBBF24] text-white'
                    : 'bg-[#090D16]/90 hover:bg-[#1E293B] border-[#FB923C]/40 text-white'
                }`}
                title={tr('Phá ngay 1 khối đang kẹt', 'Smash any blocked cube')}
              >
                <Hammer className="w-3.5 h-3.5 text-[#FB923C]" />
                <span className="hidden sm:inline">{tr('Búa', 'Smash')}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] tabular-nums">{profile.tool_hammer}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUndoStack((prev) => [
                    ...prev.slice(-29),
                    { blocks, movesUsed, sessionScore, combo, mistakesMade },
                  ]);
                  handleUseShuffle();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-[#090D16]/90 hover:bg-[#1E293B] border border-[#38BDF8]/40 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                title={tr('Đảo toàn bộ hướng mũi tên 3D', 'Shuffle cube directions')}
              >
                <Shuffle className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span className="hidden sm:inline">{tr('Đảo', 'Flip')}</span>
                <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] tabular-nums">{profile.tool_shuffle}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                type="button"
                onClick={() => canvasRef.current?.zoomIn()}
                className="p-2 rounded-lg bg-[#090D16]/85 border border-white/15 text-white/90 hover:bg-[#1E293B] cursor-pointer"
                aria-label="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => canvasRef.current?.zoomOut()}
                className="p-2 rounded-lg bg-[#090D16]/85 border border-white/15 text-white/90 hover:bg-[#1E293B] cursor-pointer"
                aria-label="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => canvasRef.current?.resetView()}
                className="p-2 rounded-lg bg-[#090D16]/85 border border-white/15 text-white/90 hover:bg-[#1E293B] cursor-pointer"
                title={tr('Đưa góc nhìn về giữa', 'Reset camera')}
              >
                <Compass className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stage Win / Out-of-Shield Overlay (Solid dark rgba, NO backdrop-blur) */}
        {stageResult && (
          <div className="absolute inset-0 bg-[#090D16]/90 flex items-center justify-center p-4 z-20">
            <div className="w-full max-w-sm rounded-2xl bg-[#111827] border border-[#C6A667]/50 p-5 text-center text-white space-y-3.5 shadow-2xl">
              <div className="flex justify-center">
                <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
              </div>
              {stageResult.status === 'won' ? (
                <>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-7 h-7 ${
                          s <= stageResult.stars ? 'text-[#FACC15] fill-[#FACC15]' : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#C6A667]">
                      {levelSpec.mode === 'daily'
                        ? tr('HOÀN THÀNH THỬ THÁCH NGÀY', 'DAILY CHALLENGE CLEARED')
                        : levelSpec.mode === 'event'
                          ? tr('CHINH PHỤC MÀN SỰ KIỆN', 'EVENT STAGE CLEARED')
                          : tr(`HOÀN THÀNH CẤP ${levelSpec.levelNumber}`, `LEVEL ${levelSpec.levelNumber} CLEARED`)}
                    </div>
                    <h3 className="text-xl font-bold mt-0.5">
                      {stageResult.score.toLocaleString()} {tr('điểm', 'pts')}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-white/10 font-bold text-[#FBBF24]">
                      +{stageResult.earnedCoins} Cube Coins
                    </div>
                    <div className="p-2 rounded-xl bg-white/10 font-bold text-emerald-300">
                      +{stageResult.earnedXp} XP
                    </div>
                  </div>

                  {stageResult.leveledUp && (
                    <div className="px-3 py-1.5 rounded-lg bg-[#00552B] border border-[#C6A667]/60 text-xs font-bold text-[#FDE047]">
                      🎉 {tr(`Nhân vật thăng Cấp ${stageResult.newCharLevel}!`, `Character Level Up -> Lv.${stageResult.newCharLevel}!`)}
                    </div>
                  )}

                  {stageResult.isFirstDailyToday && stageResult.dailyRoarPoints && stageResult.dailyRoarPoints > 0 && (
                    <div className="px-3 py-1.5 rounded-lg bg-[#C6A667]/20 text-xs font-bold text-[#FDE047]">
                      ✨ +{stageResult.dailyRoarPoints} {tr('Điểm ROAR CLUB Thử Thách Ngày!', 'Daily ROAR CLUB Points!')}
                    </div>
                  )}

                  {stageResult.eventCompletedNow && (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-400/50 text-xs font-bold text-emerald-200">
                      🏆 {tr(`Hoàn tất trọn bộ Sự Kiện! +${stageResult.eventBonusRoarPts} Điểm ROAR`, `Event Completed! +${stageResult.eventBonusRoarPts} ROAR Pts`)}
                    </div>
                  )}

                  {stageResult.score >= minScoreToWin && !claimedRewardSession && (
                    <div className="pt-1">
                      {!isSignedIn ? (
                        <button
                          type="button"
                          onClick={() => handleClaimRoarReward(false)}
                          className="w-full py-2.5 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Gift className="w-4 h-4" />
                          <span>{tr('Mở Quà Demo / Đăng nhập Nhận Quà Thật', 'Preview Prize / Sign In to Claim')}</span>
                        </button>
                      ) : remainingFreeToday > 0 ? (
                        <button
                          type="button"
                          disabled={claimingRoarReward}
                          onClick={() => handleClaimRoarReward(false)}
                          className="w-full py-2.5 rounded-xl bg-[#00552B] hover:bg-[#006b36] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <Gift className="w-4 h-4 text-[#C6A667]" />
                          <span>
                            {tr(`Rút Quà ROAR (${remainingFreeToday} lượt miễn phí)`, `Claim ROAR Prize (${remainingFreeToday} free)`)}
                          </span>
                        </button>
                      ) : canPlayWithPoints ? (
                        <button
                          type="button"
                          disabled={claimingRoarReward}
                          onClick={() => handleClaimRoarReward(true)}
                          className="w-full py-2.5 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          <Coins className="w-4 h-4" />
                          <span>{tr(`Đổi ${extraCost} Điểm Rút Quà ROAR`, `Use ${extraCost} Pts to Claim Prize`)}</span>
                        </button>
                      ) : null}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (levelSpec.mode === 'campaign') {
                          const nextLvl = levelSpec.levelNumber + 1;
                          startStage(generateSolvableCubeLevel({ mode: 'campaign', levelNumber: nextLvl }), profile);
                        } else if (levelSpec.mode === 'event') {
                          const idx = activeEvent.stages.findIndex((s) => s.stageKey === levelSpec.stageKey);
                          const nextStage = activeEvent.stages[(idx + 1) % activeEvent.stages.length];
                          startStage(generateSolvableCubeLevel({ mode: 'event', eventStage: nextStage }), profile);
                        } else {
                          startStage(
                            generateSolvableCubeLevel({ mode: 'campaign', levelNumber: Math.max(1, profile.current_level) }),
                            profile
                          );
                        }
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-[#00552B] hover:bg-[#006b36] text-white text-xs font-extrabold cursor-pointer"
                    >
                      {levelSpec.mode === 'campaign'
                        ? tr(`Màn Tiếp (Cấp ${levelSpec.levelNumber + 1}) →`, `Next (Lv.${levelSpec.levelNumber + 1}) →`)
                        : tr('Chơi Tiếp →', 'Continue →')}
                    </button>
                    <button
                      type="button"
                      onClick={() => startStage(generateSolvableCubeLevel({ mode: 'campaign', levelNumber: Math.max(1, levelSpec.levelNumber) }), profile)}
                      className="px-3.5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-xs font-bold cursor-pointer"
                    >
                      {tr('Chơi Lại', 'Replay')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                    <Shield className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold">{tr('Hết Khiên Bảo Vệ!', 'Out of Shield Charges!')}</h3>
                  <p className="text-xs text-white/75">
                    {tr(
                      'Mẹo: Xoay 360° tìm khối có đường bay thoáng, hoặc nâng cấp Khiên Kiên Cường để tăng lượt chạm nhầm.',
                      'Tip: Orbit 360° to spot open rays, or upgrade Resilience Shield in the Character tab.'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const retrySpec =
                        levelSpec.mode === 'daily'
                          ? generateSolvableCubeLevel({ mode: 'daily', dateStr: todayDate })
                          : levelSpec.mode === 'event'
                            ? generateSolvableCubeLevel({
                                mode: 'event',
                                eventStage: activeEvent.stages.find((s) => s.stageKey === levelSpec.stageKey) || activeEvent.stages[0],
                              })
                            : generateSolvableCubeLevel({ mode: 'campaign', levelNumber: levelSpec.levelNumber });
                      startStage(retrySpec, profile);
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#C6A667] text-[#111111] text-xs font-extrabold cursor-pointer"
                  >
                    {tr('Thử Lại Màn Này', 'Retry Stage')}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Hint Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 px-1">
        <span>
          {tr(
            'Kéo xoay 360° mọi góc nhìn · Chạm khối có mũi tên thoáng đường để bắn bay · Đạt ',
            'Drag to orbit 360° · Tap unobstructed arrow cubes to clear · Score '
          )}
          <strong className="text-[#00552B] dark:text-[#C6A667]">{minScoreToWin}+</strong>{' '}
          {tr('điểm để mở Quà ROAR.', 'pts to unlock ROAR Prize.')}
        </span>
        {loadingState && <span className="text-[#00552B] dark:text-[#C6A667]">{tr('Đang đồng bộ...', 'Syncing...')}</span>}
      </div>

      {/* ROAR Chill Lounge Bar (Lo-Fi + Zen Mode + Lighting Mood + Coffee Break Timer) */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              const next = gameSound.toggleLofi();
              setLofiOn(next);
              if (next && gameSound.muted !== muted) {
                setMuted(gameSound.muted);
              }
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
              lofiOn
                ? 'bg-[#00552B] border-[#C6A667]/60 text-white shadow-sm'
                : 'bg-white dark:bg-[#141E19] border-[#202020]/15 dark:border-white/15 text-[#202020]/85 dark:text-[#F1EFEA]/85 hover:border-[#00552B]/40'
            }`}
            title={tr('Bật/tắt nhạc Lo-Fi Jazz & tiếng mưa quán cà phê', 'Toggle Lo-Fi Cafe Beat & Rain ASMR')}
          >
            <Music className={`w-3.5 h-3.5 ${lofiOn ? 'text-[#FDE047]' : 'text-[#00552B] dark:text-[#C6A667]'}`} />
            <span>{lofiOn ? tr('Lo-Fi: Đang Bật', 'Lo-Fi: On') : tr('Lo-Fi Quán', 'Cafe Lo-Fi')}</span>
          </button>

          <button
            type="button"
            onClick={() => setChillMode((v) => !v)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
              chillMode
                ? 'bg-[#C6A667] border-[#b59454] text-[#111111] shadow-sm'
                : 'bg-white dark:bg-[#141E19] border-[#202020]/15 dark:border-white/15 text-[#202020]/85 dark:text-[#F1EFEA]/85 hover:border-[#C6A667]/50'
            }`}
            title={tr(
              'Chế độ Chill/Zen: Không giới hạn chạm nhầm, âm gõ gỗ trầm & khối bay êm dịu',
              'Zen Mode: Unlimited mistakes, warm marimba ASMR & dreamy fly-out'
            )}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{chillMode ? tr('Chill Zen: Bật', 'Zen Mode: On') : tr('Chế độ Chill', 'Zen Mode')}</span>
          </button>

          <div className="flex items-center gap-1 pl-1 sm:border-l border-[#202020]/10 dark:border-white/10">
            <Sun className="w-3.5 h-3.5 text-[#C6A667] shrink-0 mr-0.5" />
            <span className="text-[11px] font-semibold text-[#202020]/70 dark:text-[#F1EFEA]/70 hidden sm:inline mr-1">
              {tr('Ánh sáng:', 'Mood:')}
            </span>
            {LIGHTING_MOODS.map((m) => {
              const active = moodId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMoodId(m.id);
                    try {
                      window.localStorage.setItem('roar_cubeaway_mood_v1', m.id);
                    } catch {
                      // ignore storage error
                    }
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 border transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#202020] dark:bg-white text-white dark:text-[#111111] border-transparent'
                      : 'bg-white dark:bg-[#141E19] border-[#202020]/10 dark:border-white/10 text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:border-[#C6A667]/50'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/15"
                    style={{ backgroundColor: m.swatchHex }}
                  />
                  <span>{lang === 'en' ? m.nameEn : m.nameVi}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Coffee Break Timer (15m / 25m) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#202020]/10 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
            <span className="text-[11px] font-semibold text-[#202020]/75 dark:text-[#F1EFEA]/75">
              {tr('Nghỉ Cà Phê', 'Coffee Break')}
            </span>
            <div className="inline-flex rounded-lg bg-black/5 dark:bg-white/10 p-0.5">
              {([15, 25] as const).map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setTimerRunning(false);
                    setTimerMinutes(mins);
                    setTimerSecondsLeft(mins * 60);
                  }}
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold cursor-pointer transition-colors ${
                    timerMinutes === mins
                      ? 'bg-white dark:bg-[#1E293B] text-[#00552B] dark:text-[#C6A667] shadow-xs'
                      : 'text-[#202020]/65 dark:text-[#F1EFEA]/65'
                  }`}
                >
                  {mins}p
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-1 rounded-lg bg-white dark:bg-[#141E19] border border-[#202020]/10 dark:border-white/10 text-xs font-extrabold tabular-nums text-[#00552B] dark:text-[#FDE047]">
              {String(Math.floor(timerSecondsLeft / 60)).padStart(2, '0')}:
              {String(timerSecondsLeft % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => {
                if (timerSecondsLeft <= 0) {
                  setTimerSecondsLeft(timerMinutes * 60);
                }
                setTimerRunning((v) => !v);
              }}
              className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                timerRunning
                  ? 'bg-[#D97706] border-[#FBBF24] text-white'
                  : 'bg-[#00552B] border-[#00552B] text-white hover:bg-[#006b36]'
              }`}
              aria-label={timerRunning ? 'Pause Coffee Break Timer' : 'Start Coffee Break Timer'}
              title={timerRunning ? tr('Tạm dừng đồng hồ', 'Pause timer') : tr('Bắt đầu hẹn giờ thư giãn', 'Start chill timer')}
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerSecondsLeft(timerMinutes * 60);
              }}
              className="p-1.5 rounded-lg bg-white dark:bg-[#141E19] border border-[#202020]/15 dark:border-white/15 text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:text-[#00552B] cursor-pointer"
              aria-label="Reset Coffee Break Timer"
              title={tr('Đặt lại đồng hồ', 'Reset timer')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5 Hub Sub-Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#202020]/10 dark:border-white/10">
        {(
          [
            { id: 'levels', icon: <Layers className="w-3.5 h-3.5" />, vi: 'Cấp Độ & Sự Kiện', en: 'Levels & Events' },
            { id: 'character', icon: <Zap className="w-3.5 h-3.5" />, vi: 'Nhân Vật & Nâng Cấp', en: 'Character & Shop' },
            { id: 'customize', icon: <Palette className="w-3.5 h-3.5" />, vi: 'Giao Diện & Chuỗi Ngày', en: 'Skins & Streak' },
            { id: 'leaderboard', icon: <Trophy className="w-3.5 h-3.5" />, vi: 'Bảng Xếp Hạng', en: 'Leaderboard' },
            { id: 'friends', icon: <Users className="w-3.5 h-3.5" />, vi: 'Bạn Bè', en: 'Friends' },
          ] as Array<{ id: HubTab; icon: React.ReactNode; vi: string; en: string }>
        ).map((tab) => {
          const active = hubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHubTab(tab.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                active
                  ? 'bg-[#00552B] text-white shadow-sm'
                  : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/80 dark:text-[#F1EFEA]/80 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {tab.icon}
              <span>{lang === 'en' ? tab.en : tab.vi}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LEVELS, DAILY CHALLENGE & RECURRING SPECIAL EVENTS */}
      {hubTab === 'levels' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Daily Challenge Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#003D25] to-[#00552B] text-white border border-[#C6A667]/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#C6A667] text-[#111111] text-[10px] font-extrabold uppercase">
                  <Calendar className="w-3 h-3" />
                  <span>{tr('Thử Thách Hàng Ngày', 'Daily Challenge')}</span>
                </span>
                <span className="text-[11px] font-mono text-white/80">{todayDate}</span>
              </div>
              <div>
                <h4 className="font-bold text-sm">{tr('Khối Kiến Trúc Bí Ẩn Hôm Nay', 'Today’s Seeded 3D Puzzle')}</h4>
                <p className="text-xs text-white/80 mt-0.5">
                  {tr('Thưởng 2× Cube Coins + 25 Điểm ROAR CLUB khi vượt màn lần đầu mỗi ngày.', '2× Cube Coins + 25 ROAR CLUB Points on first clear today.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => startStage(generateSolvableCubeLevel({ mode: 'daily', dateStr: todayDate }), profile)}
                className="w-full py-2 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-extrabold cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {dailyDoneToday ? <Check className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{dailyDoneToday ? tr('Đã Vượt Hôm Nay · Chơi Lại', 'Cleared Today · Replay') : tr('Chơi Thử Thách Ngày', 'Play Daily Challenge')}</span>
              </button>
            </div>

            {/* Recurring Special Event Card */}
            <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#C6A667]/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[#111111] text-[10px] font-extrabold uppercase"
                  style={{ backgroundColor: activeEvent.accentHex }}
                >
                  <Crown className="w-3 h-3" />
                  <span>{lang === 'en' ? activeEvent.badgeEn : activeEvent.badgeVi}</span>
                </span>
                <span className="text-[11px] font-semibold text-[#8C6D32] dark:text-[#C6A667] inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatCountdown(activeEvent.endsAtIso, lang)}</span>
                </span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#111111] dark:text-[#F8F5EF]">
                  {lang === 'en' ? activeEvent.titleEn : activeEvent.titleVi}
                </h4>
                <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 mt-0.5">
                  {lang === 'en' ? activeEvent.subtitleEn : activeEvent.subtitleVi}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {activeEvent.stages.map((st) => {
                  const done = profile.event_cleared_stages.includes(st.stageKey);
                  const activeNow = levelSpec.stageKey === st.stageKey;
                  return (
                    <button
                      key={st.stageKey}
                      type="button"
                      onClick={() => startStage(generateSolvableCubeLevel({ mode: 'event', eventStage: st }), profile)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-colors ${
                        activeNow
                          ? 'bg-[#00552B] text-white border-[#00552B]'
                          : done
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-[#00552B] dark:text-emerald-300'
                            : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10 hover:border-[#C6A667]'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold flex items-center justify-between">
                        <span>{tr(`Màn ${st.stageIndex}`, `Stage ${st.stageIndex}`)}</span>
                        {done && <Check className="w-3 h-3" />}
                      </div>
                      <div className="text-[10px] opacity-80 truncate mt-0.5">{st.shape.replace('_', ' ')}</div>
                    </button>
                  );
                })}
              </div>
              {eventAllCleared && (
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  ✓ {tr('Đã hoàn tất bộ Sự Kiện tuần này!', 'Weekly Event completed!')}
                </div>
              )}
            </div>
          </div>

          {/* Campaign Levels Map */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                  {tr('Hành Trình Chinh Phục 3D (36+ Cấp Độ)', 'Campaign Level Map (36+ Levels)')}
                </h4>
                <span className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
                  {tr(`Đã mở khóa tới Cấp ${profile.max_level}`, `Unlocked up to Lv.${profile.max_level}`)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {Array.from({ length: totalChapters }, (_, cIdx) => {
                  const start = cIdx * 18 + 1;
                  const end = Math.min(campaignLevelsCount, (cIdx + 1) * 18);
                  const selected = activeChapter === cIdx;
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => setLevelChapter(cIdx)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                        selected
                          ? 'bg-[#00552B] text-white'
                          : 'bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:border-[#C6A667]'
                      }`}
                    >
                      {tr(`Cấp ${start}–${end}`, `Lv.${start}–${end}`)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
              {Array.from({ length: chapterEndLvl - chapterStartLvl + 1 }, (_, idx) => {
                const lvlNum = chapterStartLvl + idx;
                const unlocked = lvlNum <= profile.max_level;
                const cleared = lvlNum < profile.max_level;
                const isPlaying = levelSpec.mode === 'campaign' && levelSpec.levelNumber === lvlNum;
                return (
                  <button
                    key={lvlNum}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => startStage(generateSolvableCubeLevel({ mode: 'campaign', levelNumber: lvlNum }), profile)}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                      isPlaying
                        ? 'bg-[#C6A667] text-[#111111] border-[#C6A667] font-extrabold shadow-sm cursor-pointer'
                        : unlocked
                          ? 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/15 hover:border-[#00552B] cursor-pointer'
                          : 'bg-black/5 dark:bg-white/5 border-transparent text-[#202020]/35 dark:text-white/25 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xs font-extrabold tabular-nums">{lvlNum}</div>
                    <div className="text-[10px] mt-0.5 flex justify-center">
                      {!unlocked ? (
                        <Lock className="w-3 h-3" />
                      ) : cleared ? (
                        <Check className="w-3 h-3 text-[#00552B] dark:text-[#4ADE80]" />
                      ) : (
                        <Sparkles className="w-3 h-3 text-[#C6A667]" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHARACTER, UPGRADES & TOOL SHOP */}
      {hubTab === 'character' && (
        <div className="space-y-4">
          {/* Avatar Badge Selector */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                {tr('Linh Vật Đại Diện ROAR', 'Roast Master Mascot')}
              </div>
              <div className="text-xs font-bold text-[#202020]/70 dark:text-[#F1EFEA]/70 tabular-nums">
                XP: {profile.xp} / {xpNext}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVATAR_BADGES.map((badge) => {
                const selected = profile.avatar_badge === badge.id;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() => handleCustomize('avatar', badge.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-[#00552B] text-white border-[#00552B]'
                        : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/15'
                    }`}
                  >
                    <span>{badge.emoji}</span>
                    <span>{lang === 'en' ? badge.labelEn : badge.labelVi}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Character Upgrade Perks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CHARACTER_UPGRADES.map((up) => {
              const cur = profile.upgrades?.[up.id] || 0;
              const isMax = cur >= up.maxLevel;
              const cost = up.baseCost + cur * up.costStep;
              return (
                <div
                  key={up.id}
                  className="p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-[#111111] dark:text-[#F8F5EF]">
                        {lang === 'en' ? up.nameEn : up.nameVi}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#00552B]/15 text-[#00552B] dark:text-[#C6A667] text-[10px] font-extrabold tabular-nums">
                        Lv.{cur}/{up.maxLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 mt-1">
                      {lang === 'en' ? up.descEn : up.descVi}
                    </p>
                    <div className="text-[11px] font-semibold text-[#00552B] dark:text-[#4ADE80] mt-1">
                      {lang === 'en' ? up.bonusPerLevelEn : up.bonusPerLevelVi}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isMax || busyAction}
                    onClick={() => handleUpgradePerk(up.id)}
                    className={`w-full py-2 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 ${
                      isMax
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-default'
                        : 'bg-[#C6A667] hover:bg-[#b59454] text-[#111111] cursor-pointer disabled:opacity-60'
                    }`}
                  >
                    {isMax ? (
                      <span>{tr('Đã Tối Đa', 'Max Level')}</span>
                    ) : (
                      <>
                        <Coins className="w-3.5 h-3.5" />
                        <span>{tr(`Nâng Cấp · ${cost} Xu`, `Upgrade · ${cost} Coins`)}</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Power-Up Tool Shop */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              {tr('Cửa Hàng Dụng Cụ Hỗ Trợ', 'Power-Up Shop')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {TOOL_SHOP_ITEMS.map((it) => {
                const owned =
                  it.tool === 'hammer'
                    ? profile.tool_hammer
                    : it.tool === 'shuffle'
                      ? profile.tool_shuffle
                      : profile.tool_hint;
                return (
                  <div
                    key={it.tool}
                    className="p-3 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold">{lang === 'en' ? it.nameEn : it.nameVi}</span>
                        <span className="text-[11px] font-extrabold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                          ×{owned}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-1">
                        {lang === 'en' ? it.descEn : it.descVi}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busyAction}
                      onClick={() => handleBuyTool(it.tool, it.costCoins)}
                      className="w-full py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-60"
                    >
                      <Coins className="w-3.5 h-3.5 text-[#C6A667]" />
                      <span>{tr(`Mua +1 (${it.costCoins} Xu)`, `Buy +1 (${it.costCoins} Coins)`)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMIZE SKINS, BACKDROPS & 7-DAY STREAK REWARDS */}
      {hubTab === 'customize' && (
        <div className="space-y-4">
          {/* 7-Day Consecutive Login Streak */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#16221C] to-[#003D25] text-white border border-[#C6A667]/40 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#C6A667]">
                  {tr('CHUỖI ĐĂNG NHẬP LIÊN TỤC 7 NGÀY', '7-DAY LOGIN STREAK REWARDS')}
                </div>
                <div className="text-sm font-bold mt-0.5">
                  {tr(`Chuỗi hiện tại: ${profile.streak_days} ngày`, `Current Streak: ${profile.streak_days} days`)}
                </div>
              </div>
              <button
                type="button"
                disabled={busyAction || profile.last_login_date === todayDate}
                onClick={handleClaimStreak}
                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors ${
                  profile.last_login_date === todayDate
                    ? 'bg-white/15 text-white/75 cursor-default'
                    : 'bg-[#C6A667] hover:bg-[#b59454] text-[#111111]'
                }`}
              >
                {profile.last_login_date === todayDate
                  ? tr('✓ Đã Điểm Danh Hôm Nay', '✓ Claimed Today')
                  : tr(`Nhận Quà Ngày ${nextStreakDay}`, `Claim Day ${nextStreakDay}`)}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
              {CUBE_STREAK_REWARDS.map((r) => {
                const claimed = profile.streak_claimed_days.includes(r.day);
                const isTodayTarget = profile.last_login_date !== todayDate && nextStreakDay === r.day;
                return (
                  <div
                    key={r.day}
                    className={`p-2 rounded-xl border text-center space-y-1 ${
                      claimed
                        ? 'bg-emerald-500/25 border-emerald-400/60'
                        : isTodayTarget
                          ? 'bg-[#C6A667]/25 border-[#C6A667]'
                          : 'bg-white/10 border-white/15 opacity-80'
                    }`}
                  >
                    <div className="text-[10px] font-extrabold text-[#C6A667]">{tr(`Ngày ${r.day}`, `Day ${r.day}`)}</div>
                    <div className="text-[10px] font-semibold leading-tight">{lang === 'en' ? r.labelEn : r.labelVi}</div>
                    {claimed && <Check className="w-3.5 h-3.5 mx-auto text-emerald-300" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Cube Skins */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              {tr('Chất Liệu & Màu Khối 3D', '3D Cube Skins')}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CUBE_SKINS.map((sk) => {
                const unlocked = profile.unlocked_skins.includes(sk.id);
                const equipped = profile.active_skin === sk.id;
                return (
                  <div
                    key={sk.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between gap-2.5 ${
                      equipped
                        ? 'bg-white dark:bg-[#16221C] border-[#00552B] dark:border-[#C6A667]'
                        : 'bg-white/80 dark:bg-[#16221C]/70 border-[#202020]/10 dark:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold">{lang === 'en' ? sk.nameEn : sk.nameVi}</span>
                        <div className="flex items-center gap-1">
                          {sk.palette.map((hex, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-sm border border-black/15"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-1">
                        {lang === 'en' ? sk.descEn : sk.descVi}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={equipped || busyAction}
                      onClick={() => handleCustomize('skin', sk.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        equipped
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 cursor-default'
                          : unlocked
                            ? 'bg-[#00552B] text-white'
                            : 'bg-[#C6A667] text-[#111111]'
                      }`}
                    >
                      {equipped
                        ? tr('Đang Trang Bị', 'Equipped')
                        : unlocked
                          ? tr('Trang Bị Ngay', 'Equip')
                          : tr(`Mở Khóa · ${sk.costCoins} Xu`, `Unlock · ${sk.costCoins} Coins`)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Arena Backdrops */}
          <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              {tr('Không Gian Studio 3D', '3D Arena Backdrops')}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ARENA_BACKDROPS.map((bd) => {
                const unlocked = profile.unlocked_backdrops.includes(bd.id);
                const equipped = profile.active_backdrop === bd.id;
                return (
                  <div
                    key={bd.id}
                    className={`p-2.5 rounded-xl border space-y-2 ${
                      equipped
                        ? 'border-[#00552B] dark:border-[#C6A667] bg-white dark:bg-[#16221C]'
                        : 'border-[#202020]/10 dark:border-white/10 bg-white/80 dark:bg-[#16221C]/70'
                    }`}
                  >
                    <div
                      className="h-12 rounded-lg flex items-center justify-center border border-white/10"
                      style={{ backgroundColor: bd.bgHex }}
                    >
                      <span
                        className="w-7 h-7 rounded-full border-2"
                        style={{ backgroundColor: bd.pedestalHex, borderColor: bd.ringHex }}
                      />
                    </div>
                    <div className="text-[11px] font-bold truncate">{lang === 'en' ? bd.nameEn : bd.nameVi}</div>
                    <button
                      type="button"
                      disabled={equipped || busyAction}
                      onClick={() => handleCustomize('backdrop', bd.id)}
                      className={`w-full py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                        equipped
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : unlocked
                            ? 'bg-[#00552B] text-white'
                            : 'bg-[#C6A667] text-[#111111]'
                      }`}
                    >
                      {equipped
                        ? tr('Đang Dùng', 'Active')
                        : unlocked
                          ? tr('Chọn', 'Select')
                          : `${bd.costCoins} Xu`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ONLINE LEADERBOARD */}
      {hubTab === 'leaderboard' && (
        <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>{tr('Bảng Xếp Hạng Trực Tuyến', 'Live Online Leaderboard')}</span>
            </div>
            <div className="flex items-center gap-1">
              {(
                [
                  { id: 'global', vi: 'Toàn Server', en: 'Global' },
                  { id: 'daily', vi: 'Thử Thách Ngày', en: 'Daily' },
                  { id: 'friends', vi: 'Bạn Bè', en: 'Friends' },
                ] as const
              ).map((tItem) => (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => setLbTab(tItem.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    lbTab === tItem.id
                      ? 'bg-[#00552B] text-white'
                      : 'bg-white dark:bg-[#16221C] text-[#202020]/75 dark:text-white/75'
                  }`}
                >
                  {lang === 'en' ? tItem.en : tItem.vi}
                </button>
              ))}
            </div>
          </div>

          {lbTab === 'friends' && !isSignedIn ? (
            <div className="py-6 text-center space-y-2">
              <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {tr('Đăng nhập để so tài điểm số cùng danh sách bạn bè ROAR.', 'Sign in to view your Friends leaderboard.')}
              </p>
              <button
                type="button"
                onClick={onRequireLogin}
                className="px-4 py-2 rounded-xl bg-[#00552B] text-white text-xs font-bold cursor-pointer"
              >
                {tr('Đăng Nhập Ngay', 'Sign In')}
              </button>
            </div>
          ) : lbLoading ? (
            <div className="py-6 text-center text-xs text-[#202020]/60 dark:text-white/60">
              {tr('Đang tải bảng xếp hạng...', 'Loading leaderboard...')}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="py-6 text-center text-xs text-[#202020]/60 dark:text-white/60">
              {tr('Chưa có dữ liệu xếp hạng trong mục này.', 'No rankings recorded here yet.')}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {leaderboard.map((row) => (
                <div
                  key={`${row.userId}-${row.rank}`}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                    row.isMe
                      ? 'bg-[#00552B]/12 border-[#00552B] dark:bg-[#C6A667]/15 dark:border-[#C6A667]'
                      : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-md text-xs font-extrabold flex items-center justify-center shrink-0 tabular-nums ${
                        row.rank === 1
                          ? 'bg-[#FACC15] text-[#111111]'
                          : row.rank === 2
                            ? 'bg-slate-300 text-[#111111]'
                            : row.rank === 3
                              ? 'bg-amber-600 text-white'
                              : 'bg-black/5 dark:bg-white/10'
                      }`}
                    >
                      {row.rank}
                    </span>
                    <span className="text-lg shrink-0">{getAvatarEmoji(row.avatarBadge)}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">
                        {row.displayName} {row.isMe && <span className="text-[#00552B] dark:text-[#C6A667]">({tr('Bạn', 'You')})</span>}
                      </div>
                      <div className="text-[10px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                        Lv.{row.charLevel} · {row.tier}
                        {row.maxLevel ? ` · Max ${row.maxLevel}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <div className="text-xs font-extrabold text-[#00552B] dark:text-[#C6A667]">
                      {row.score.toLocaleString()} {tr('đ', 'pts')}
                    </div>
                    {row.timeMs ? (
                      <div className="text-[10px] text-[#202020]/55 dark:text-white/55">
                        {(row.timeMs / 1000).toFixed(1)}s
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: FRIENDS & COMMUNITY */}
      {hubTab === 'friends' && (
        <div className="p-4 rounded-2xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-4">
          {!isSignedIn ? (
            <div className="py-6 text-center space-y-3">
              <Users className="w-8 h-8 mx-auto text-[#00552B] dark:text-[#C6A667]" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold">{tr('Cộng Đồng Bạn Bè Cube Away 3D', 'ROAR Cube Away Friends Community')}</h4>
                <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 max-w-md mx-auto">
                  {tr(
                    'Đăng nhập tài khoản thành viên để kết bạn qua mã ROAR, tặng nhau +15 Cube Coins mỗi ngày và đua top bảng xếp hạng bạn bè.',
                    'Sign in to connect with players by member code, send +15 Coin daily gifts, and race on the Friends leaderboard.'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onRequireLogin}
                className="px-5 py-2.5 rounded-xl bg-[#00552B] text-white text-xs font-bold cursor-pointer"
              >
                {tr('Đăng Nhập Để Kết Bạn', 'Sign In to Connect')}
              </button>
            </div>
          ) : (
            <>
              {/* My Member Code + Add by Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-[#202020]/60 dark:text-white/60">
                      {tr('Mã Kết Bạn Của Bạn', 'Your Friend Code')}
                    </div>
                    <code className="text-xs font-extrabold text-[#00552B] dark:text-[#C6A667]">
                      {profile.member_code}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(profile.member_code).catch(() => {});
                      showToast(tr(`Đã sao chép mã: ${profile.member_code}`, `Copied: ${profile.member_code}`));
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{tr('Chép', 'Copy')}</span>
                  </button>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={addCodeInput}
                    onChange={(e) => setAddCodeInput(e.target.value)}
                    placeholder={tr('Nhập mã RC-MEM-... để kết bạn', 'Enter RC-MEM-... code')}
                    className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 text-xs outline-none"
                  />
                  <button
                    type="button"
                    disabled={!addCodeInput.trim() || busyAction}
                    onClick={() => handleSendFriendRequest({ memberCode: addCodeInput.trim() })}
                    className="px-3 py-2 rounded-xl bg-[#00552B] text-white text-xs font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{tr('Kết Bạn', 'Add')}</span>
                  </button>
                </div>
              </div>

              {/* Incoming Friend Requests */}
              {friendsData.incomingRequests.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-extrabold uppercase text-[#B45309] dark:text-[#FBBF24]">
                    {tr('Lời Mời Kết Bạn Chờ Duyệt', 'Incoming Friend Requests')} ({friendsData.incomingRequests.length})
                  </div>
                  {friendsData.incomingRequests.map((reqItem) => (
                    <div
                      key={reqItem.userId}
                      className="p-2.5 rounded-xl bg-white dark:bg-[#16221C] border border-[#C6A667]/40 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-lg">{getAvatarEmoji(reqItem.avatarBadge)}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">{reqItem.displayName}</div>
                          <div className="text-[10px] text-[#202020]/60 dark:text-white/60">
                            Lv.{reqItem.charLevel} · {reqItem.memberCode}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => reqItem.friendshipId && handleRespondFriend(reqItem.friendshipId, 'accept')}
                          className="px-2.5 py-1 rounded-lg bg-[#00552B] text-white text-[11px] font-bold cursor-pointer"
                        >
                          {tr('Đồng Ý', 'Accept')}
                        </button>
                        <button
                          type="button"
                          onClick={() => reqItem.friendshipId && handleRespondFriend(reqItem.friendshipId, 'decline')}
                          className="px-2.5 py-1 rounded-lg border border-[#202020]/15 dark:border-white/15 text-[11px] font-bold cursor-pointer"
                        >
                          {tr('Từ Chối', 'Decline')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Connected Friends List */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase text-[#00552B] dark:text-[#C6A667]">
                  {tr('Danh Sách Bạn Bè', 'Your Friends')} ({friendsData.friends.length})
                </div>
                {friendsData.friends.length === 0 ? (
                  <p className="text-xs text-[#202020]/65 dark:text-white/65 py-2">
                    {tr('Chưa có bạn bè. Hãy gửi lời mời cho người chơi bên dưới!', 'No friends yet. Connect with community players below!')}
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {friendsData.friends.map((fr) => (
                      <div
                        key={fr.userId}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{getAvatarEmoji(fr.avatarBadge)}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{fr.displayName}</div>
                            <div className="text-[10px] text-[#202020]/60 dark:text-white/60 tabular-nums">
                              Lv.{fr.charLevel} · {fr.totalScore.toLocaleString()} {tr('đ', 'pts')}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={fr.giftedToday || busyAction}
                          onClick={() => handleGiftFriend(fr.userId)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shrink-0 ${
                            fr.giftedToday
                              ? 'bg-black/5 dark:bg-white/10 text-[#202020]/45 dark:text-white/45 cursor-default'
                              : 'bg-[#C6A667] hover:bg-[#b59454] text-[#111111] cursor-pointer'
                          }`}
                        >
                          <Gift className="w-3 h-3" />
                          <span>{fr.giftedToday ? tr('Đã Tặng', 'Gifted') : '+15 Xu'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested Community Directory */}
              <div className="space-y-2 pt-2 border-t border-[#202020]/10 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[11px] font-extrabold uppercase text-[#00552B] dark:text-[#C6A667]">
                    {tr('Gợi Ý Người Chơi Cộng Đồng', 'Discover Players')}
                  </div>
                  <div className="relative w-44">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#202020]/45 dark:text-white/45" />
                    <input
                      type="text"
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      placeholder={tr('Tìm tên / mã...', 'Search name/code...')}
                      className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 text-[11px] outline-none"
                    />
                  </div>
                </div>
                {friendsLoading ? (
                  <div className="text-xs text-[#202020]/60 dark:text-white/60 py-2">{tr('Đang tìm...', 'Searching...')}</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {friendsData.directory.map((pl) => (
                      <div
                        key={pl.userId}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">{getAvatarEmoji(pl.avatarBadge)}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">{pl.displayName}</div>
                            <div className="text-[10px] text-[#202020]/60 dark:text-white/60 tabular-nums">
                              Lv.{pl.charLevel} · {pl.memberCode}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => handleSendFriendRequest({ targetUserId: pl.userId })}
                          className="px-2.5 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <UserPlus className="w-3 h-3" />
                          <span>{tr('Kết Bạn', 'Add')}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
