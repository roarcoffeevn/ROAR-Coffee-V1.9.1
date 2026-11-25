import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Gift,
  Layers,
  Music,
  RotateCcw,
  Shuffle,
  Sparkles,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { FireworksOverlay } from './FireworksOverlay';
import { gameSound } from './RoarGamesSound';

interface TripleTileGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  savedProgress?: { current_level: number; max_level: number; best_score: number; state_json?: any };
  onSaveProgress?: (payload: { currentLevel: number; maxLevel: number; bestScore: number; stateJson?: any }) => void;
  onPlayReal: (useExtraPoints: boolean, score: number) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

interface TileSymbol {
  id: string;
  icon: string;
  labelVi: string;
  labelEn: string;
  bg: string;
  border: string;
}

const TILE_SYMBOLS: TileSymbol[] = [
  { id: 'bean', icon: '🫘', labelVi: 'Hạt Robusta', labelEn: 'Bean', bg: 'from-amber-50 to-amber-100', border: 'border-amber-400' },
  { id: 'espresso', icon: '☕', labelVi: 'Espresso', labelEn: 'Espresso', bg: 'from-stone-100 to-stone-200', border: 'border-stone-500' },
  { id: 'matcha', icon: '🍵', labelVi: 'Matcha', labelEn: 'Matcha', bg: 'from-emerald-50 to-emerald-100', border: 'border-emerald-400' },
  { id: 'milk', icon: '🥛', labelVi: 'Sữa Tươi', labelEn: 'Milk', bg: 'from-sky-50 to-sky-100', border: 'border-sky-400' },
  { id: 'caramel', icon: '🍯', labelVi: 'Caramel', labelEn: 'Caramel', bg: 'from-orange-50 to-orange-100', border: 'border-orange-400' },
  { id: 'ice', icon: '🧊', labelVi: 'Đá Lạnh', labelEn: 'Ice', bg: 'from-cyan-50 to-cyan-100', border: 'border-cyan-400' },
  { id: 'croissant', icon: '🥐', labelVi: 'Bánh Sừng', labelEn: 'Pastry', bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-400' },
  { id: 'cream', icon: '🧁', labelVi: 'Kem Muối', labelEn: 'Salted Cream', bg: 'from-pink-50 to-pink-100', border: 'border-pink-400' },
  { id: 'citrus', icon: '🍊', labelVi: 'Cam Sả', labelEn: 'Citrus', bg: 'from-rose-50 to-orange-100', border: 'border-rose-400' },
  { id: 'cocoa', icon: '🍫', labelVi: 'Cacao Đen', labelEn: 'Cocoa', bg: 'from-amber-100 to-orange-200', border: 'border-amber-600' },
  { id: 'star', icon: '⭐', labelVi: 'Reserve', labelEn: 'Reserve', bg: 'from-yellow-100 to-amber-200', border: 'border-yellow-500' },
  { id: 'leaf', icon: '🌿', labelVi: 'Cầu Đất', labelEn: 'Highland', bg: 'from-teal-50 to-teal-100', border: 'border-teal-500' },
];

interface BoardTile {
  uid: number;
  symbolId: string;
  x: number; // grid units (0..6, step 0.5 allowed)
  y: number; // grid units (0..5, step 0.5 allowed)
  layer: number;
}

const TRAY_CAPACITY = 7;
const GUEST_STORAGE_KEY = 'roar_tripletile_progress_v1';

function buildStageBoard(level: number): BoardTile[] {
  const numTypes = Math.min(TILE_SYMBOLS.length, level === 1 ? 6 : level === 2 ? 9 : 10 + Math.min(2, level - 3));
  const triplesPerType = level === 1 ? 2 : level === 2 ? 2 : 3;
  const totalTriples = numTypes * triplesPerType;

  // Build pool of symbols in multiples of 3
  const pool: string[] = [];
  for (let t = 0; t < totalTriples; t++) {
    const sym = TILE_SYMBOLS[t % numTypes].id;
    pool.push(sym, sym, sym);
  }
  // Shuffle pool
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Generate layered coordinates
  const coords: Array<{ x: number; y: number; layer: number }> = [];
  if (level === 1) {
    // Gentle 3-layer pyramid (36 tiles)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) coords.push({ x: c, y: r + 0.4, layer: 0 });
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) coords.push({ x: c + 1, y: r + 0.9, layer: 1 });
    }
    for (let c = 0; c < 6; c++) coords.push({ x: c, y: 3.6, layer: 2 });
  } else {
    // Multi-tier overlapping Sheep-a-Sheep stack
    const layerCount = Math.min(7, 3 + level);
    let idx = 0;
    while (coords.length < pool.length) {
      const layer = idx % layerCount;
      const offsetX = layer % 2 === 0 ? 0 : 0.5;
      const offsetY = layer % 2 === 0 ? 0 : 0.5;
      const cols = layer % 2 === 0 ? 6 : 5;
      const rows = layer % 2 === 0 ? 5 : 4;
      const posInLayer = Math.floor(idx / layerCount) % (cols * rows);
      const gx = (posInLayer % cols) + offsetX;
      const gy = Math.floor(posInLayer / cols) + offsetY;
      // Avoid exact duplicate (x,y,layer)
      let realLayer = layer;
      while (coords.some((p) => Math.abs(p.x - gx) < 0.05 && Math.abs(p.y - gy) < 0.05 && p.layer === realLayer)) {
        realLayer += 1;
      }
      coords.push({ x: gx, y: gy, layer: realLayer });
      idx++;
    }
  }

  // Sort coords by layer ascending so rendering stacks naturally
  const selected = coords.slice(0, pool.length).sort((a, b) => a.layer - b.layer || a.y - b.y || a.x - b.x);
  return selected.map((c, i) => ({
    uid: i + 1,
    symbolId: pool[i],
    x: c.x,
    y: c.y,
    layer: c.layer,
  }));
}

function isTileBlocked(tile: BoardTile, allTiles: BoardTile[]): boolean {
  return allTiles.some(
    (other) =>
      other.uid !== tile.uid &&
      other.layer > tile.layer &&
      Math.abs(other.x - tile.x) < 0.92 &&
      Math.abs(other.y - tile.y) < 0.92
  );
}

export const TripleTileGame: React.FC<TripleTileGameProps> = ({
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
  const isEn = lang === 'en';
  const minScore = Number(config?.min_score_to_win || 200);
  const extraCost = Number(config?.extra_play_cost_points || 20);

  const [level, setLevel] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
      if (raw) return Math.max(1, Number(JSON.parse(raw).level || 1));
    } catch {
      // ignore
    }
    return Math.max(1, Number(savedProgress?.current_level || 1));
  });
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(GUEST_STORAGE_KEY);
      const localBest = raw ? Number(JSON.parse(raw).bestScore || 0) : 0;
      return Math.max(localBest, Number(savedProgress?.best_score || 0));
    } catch {
      return Number(savedProgress?.best_score || 0);
    }
  });

  const [boardTiles, setBoardTiles] = useState<BoardTile[]>(() => buildStageBoard(level));
  const [tray, setTray] = useState<BoardTile[]>([]);
  const [reserveShelf, setReserveShelf] = useState<BoardTile[]>([]);
  const [history, setHistory] = useState<Array<{ board: BoardTile[]; tray: BoardTile[]; score: number }>>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [clearingIds, setClearingIds] = useState<number[]>([]);
  const [undoLeft, setUndoLeft] = useState(3);
  const [moveOutLeft, setMoveOutLeft] = useState(2);
  const [shuffleLeft, setShuffleLeft] = useState(2);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [muted, setMuted] = useState(gameSound.muted);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [submitting, setSubmitting] = useState(false);
  const [claimedThisRun, setClaimedThisRun] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const symbolMap = useMemo(() => new Map(TILE_SYMBOLS.map((s) => [s.id, s])), []);

  const startStage = useCallback((targetLevel: number, keepScore = false) => {
    setLevel(targetLevel);
    setBoardTiles(buildStageBoard(targetLevel));
    setTray([]);
    setReserveShelf([]);
    setHistory([]);
    if (!keepScore) {
      setScore(0);
      setClaimedThisRun(false);
    }
    setCombo(0);
    setClearingIds([]);
    setUndoLeft(3);
    setMoveOutLeft(2);
    setShuffleLeft(2);
    setStatus('playing');
    setShowFireworks(false);
  }, []);

  const persistProgress = useCallback(
    (newLevel: number, newScore: number) => {
      setBestScore((prev) => {
        const nb = Math.max(prev, newScore);
        try {
          window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ level: newLevel, bestScore: nb }));
        } catch {
          // ignore
        }
        return nb;
      });
      onSaveProgress?.({
        currentLevel: newLevel,
        maxLevel: newLevel,
        bestScore: newScore,
      });
    },
    [onSaveProgress]
  );

  const processPickTile = useCallback(
    (picked: BoardTile, fromReserve = false) => {
      if (status !== 'playing' || clearingIds.length > 0) return;
      if (!fromReserve && isTileBlocked(picked, boardTiles)) return;
      if (tray.length >= TRAY_CAPACITY) return;

      gameSound.tileTap();

      const nextBoard = fromReserve ? boardTiles : boardTiles.filter((t) => t.uid !== picked.uid);
      if (fromReserve) {
        setReserveShelf((prev) => prev.filter((t) => t.uid !== picked.uid));
      } else {
        setHistory((prev) => [...prev.slice(-14), { board: boardTiles, tray, score }]);
        setBoardTiles(nextBoard);
      }

      // Insert next to matching symbol if present
      const newTray = [...tray];
      const matchIdx = newTray.findIndex((t) => t.symbolId === picked.symbolId);
      if (matchIdx >= 0) {
        newTray.splice(matchIdx + 1, 0, picked);
      } else {
        newTray.push(picked);
      }
      setTray(newTray);

      // Check for triplet
      const counts = new Map<string, BoardTile[]>();
      for (const t of newTray) {
        const arr = counts.get(t.symbolId) || [];
        arr.push(t);
        counts.set(t.symbolId, arr);
      }

      let matchedGroup: BoardTile[] | null = null;
      for (const [, arr] of counts.entries()) {
        if (arr.length >= 3) {
          matchedGroup = arr.slice(0, 3);
          break;
        }
      }

      if (matchedGroup) {
        const idsToClear = matchedGroup.map((m) => m.uid);
        setClearingIds(idsToClear);
        const nextCombo = combo + 1;
        setCombo(nextCombo);
        gameSound.tileTripleClear(nextCombo);
        const ptsGain = 30 + Math.min(nextCombo, 6) * 8;
        const nextScore = score + ptsGain;
        setScore(nextScore);

        window.setTimeout(() => {
          const clearedTray = newTray.filter((t) => !idsToClear.includes(t.uid));
          setTray(clearedTray);
          setClearingIds([]);

          if (nextBoard.length === 0 && clearedTray.length === 0 && (fromReserve ? reserveShelf.length <= 1 : reserveShelf.length === 0)) {
            const winBonus = level * 60;
            const totalWinScore = nextScore + winBonus;
            setScore(totalWinScore);
            setStatus('won');
            setShowFireworks(true);
            gameSound.win();
            persistProgress(level + 1, totalWinScore);
          }
        }, 220);
      } else {
        setCombo(0);
        if (newTray.length >= TRAY_CAPACITY) {
          setStatus('lost');
          gameSound.gameOver();
          persistProgress(level, score);
        }
      }
    },
    [boardTiles, clearingIds.length, combo, level, persistProgress, reserveShelf.length, score, status, tray]
  );

  const handleUndo = () => {
    if (status !== 'playing' || undoLeft <= 0 || history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBoardTiles(prev.board);
    setTray(prev.tray);
    setScore(prev.score);
    setUndoLeft((u) => u - 1);
    gameSound.flip();
  };

  const handleMoveOut3 = () => {
    if (status !== 'playing' || moveOutLeft <= 0 || tray.length === 0) return;
    const takeCount = Math.min(3, tray.length);
    const moved = tray.slice(0, takeCount);
    setTray((prev) => prev.slice(takeCount));
    setReserveShelf((prev) => [...prev, ...moved]);
    setMoveOutLeft((m) => m - 1);
    gameSound.cubeShuffle();
  };

  const handleShuffleBoard = () => {
    if (status !== 'playing' || shuffleLeft <= 0 || boardTiles.length < 2) return;
    const symbols = boardTiles.map((t) => t.symbolId);
    for (let i = symbols.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
    }
    setBoardTiles((prev) => prev.map((t, idx) => ({ ...t, symbolId: symbols[idx] })));
    setShuffleLeft((s) => s - 1);
    gameSound.cubeShuffle();
  };

  const handleClaimReward = async (useExtra: boolean) => {
    if (!isSignedIn) {
      onRequireLogin();
      return;
    }
    if (score < minScore) return;
    setSubmitting(true);
    try {
      const res = await onPlayReal(useExtra, score);
      if (res?.won) {
        setClaimedThisRun(true);
        setShowFireworks(true);
        gameSound.win();
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoPlay = () => {
    const activeRewards = rewards.filter((r) => r.active);
    const chosen = activeRewards[Math.floor(Math.random() * activeRewards.length)] || rewards[0];
    if (chosen) onDemoResult(chosen);
  };

  const blockedMap = useMemo(() => {
    const m = new Map<number, boolean>();
    for (const t of boardTiles) {
      m.set(t.uid, isTileBlocked(t, boardTiles));
    }
    return m;
  }, [boardTiles]);

  const reachedTarget = score >= minScore;

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#0E2B1E] via-[#133324] to-[#0B1C14] border border-[#C6A667]/30 p-3 sm:p-4 text-[#F8F5EF] overflow-hidden shadow-lg">
      {showFireworks && <FireworksOverlay active={showFireworks} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
          <span className="text-xs font-extrabold text-[#FDE68A]">
            TRIPLE TILE · {isEn ? `Stage ${level}` : `Màn ${level}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-[#C6A667]/30 text-center">
            <div className="text-[10px] uppercase text-white/60">{isEn ? 'Score' : 'Điểm'}</div>
            <div className="text-sm font-black text-[#FDE68A] tabular-nums">{score}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-white/15 text-center">
            <div className="text-[10px] uppercase text-white/60">{isEn ? 'Left' : 'Còn'}</div>
            <div className="text-sm font-black text-emerald-300 tabular-nums">{boardTiles.length + reserveShelf.length}</div>
          </div>
          <button
            type="button"
            onClick={() => setLofiOn(gameSound.toggleLofi())}
            aria-label="Toggle Music"
            className={`w-9 h-9 rounded-lg border flex items-center justify-center cursor-pointer ${
              lofiOn ? 'bg-[#C6A667] text-[#111111] border-[#FDE68A]' : 'bg-white/10 text-white border-white/15'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              gameSound.muted = !muted;
              setMuted(gameSound.muted);
            }}
            aria-label="Toggle Sound"
            className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 text-white flex items-center justify-center cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => startStage(level, false)}
            aria-label="Restart"
            className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 text-white flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress / Level Selector Strip */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => startStage(lv, false)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border cursor-pointer transition-colors ${
                level === lv
                  ? 'bg-[#C6A667] text-[#111111] border-[#FDE68A]'
                  : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
              }`}
            >
              {isEn ? `Lv.${lv}` : `Màn ${lv}`}
            </button>
          ))}
        </div>
        <div className="text-[11px] text-white/75">
          {isEn ? `Need ${minScore} pts for ROAR gift` : `Đạt ${minScore} điểm mở quà ROAR`} ·{' '}
          <span className={reachedTarget ? 'text-emerald-300 font-bold' : 'text-[#FDE68A] font-bold'}>
            {reachedTarget ? (isEn ? 'Unlocked!' : 'Đã mở khóa!') : `${Math.min(100, Math.round((score / minScore) * 100))}%`}
          </span>
        </div>
      </div>

      {/* Layered Board Canvas */}
      <div className="mt-3 relative mx-auto w-full max-w-[440px] h-[335px] sm:h-[365px] rounded-2xl bg-[#091D14] border border-[#C6A667]/25 shadow-inner overflow-hidden select-none">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_35%,#22C55E_0%,transparent_65%)]" />

        {boardTiles.map((tile) => {
          const blocked = blockedMap.get(tile.uid) ?? false;
          const sym = symbolMap.get(tile.symbolId) || TILE_SYMBOLS[0];
          const leftPct = 8 + tile.x * 14.4;
          const topPct = 6 + tile.y * 16.5 - tile.layer * 1.1;
          return (
            <button
              key={tile.uid}
              type="button"
              disabled={blocked || status !== 'playing'}
              onClick={() => processPickTile(tile, false)}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                zIndex: tile.layer * 10 + Math.round(tile.y * 2),
              }}
              aria-label={isEn ? sym.labelEn : sym.labelVi}
              className={`absolute w-[13.5%] aspect-square rounded-xl border-2 border-b-4 transition-transform duration-150 flex flex-col items-center justify-center shadow-md ${
                blocked
                  ? 'bg-stone-800/90 border-stone-900 brightness-[0.46] cursor-not-allowed'
                  : `bg-gradient-to-b ${sym.bg} ${sym.border} hover:-translate-y-1 active:scale-95 cursor-pointer`
              }`}
            >
              <span className="text-xl sm:text-2xl leading-none drop-shadow-xs">{sym.icon}</span>
              {!blocked && (
                <span className="hidden sm:block text-[8px] font-extrabold text-stone-700 mt-0.5 truncate max-w-[90%]">
                  {isEn ? sym.labelEn : sym.labelVi}
                </span>
              )}
            </button>
          );
        })}

        {/* Status Overlay */}
        {(status === 'won' || status === 'lost') && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center space-y-3">
            <Trophy className={`w-10 h-10 ${status === 'won' ? 'text-[#FDE047]' : 'text-rose-400'}`} />
            <div>
              <h4 className="text-lg font-black text-white">
                {status === 'won'
                  ? isEn
                    ? `Stage ${level} Cleared!`
                    : `Qua Màn ${level} Xuất Sắc!`
                  : isEn
                    ? 'Tray Full!'
                    : 'Khay 7 Ô Đã Đầy!'}
              </h4>
              <p className="text-xs text-white/75 mt-1">
                {isEn ? 'Score:' : 'Điểm đạt được:'}{' '}
                <span className="font-bold text-[#FDE68A] tabular-nums">{score}</span> ·{' '}
                {isEn ? 'Best:' : 'Cao nhất:'}{' '}
                <span className="font-bold text-emerald-300 tabular-nums">{Math.max(bestScore, score)}</span>
              </p>
            </div>

            <div className="w-full max-w-[260px] space-y-2">
              {reachedTarget && !claimedThisRun && (
                <>
                  {isSignedIn ? (
                    remainingFreeToday > 0 ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleClaimReward(false)}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0B1F14] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Gift className="w-4 h-4" />
                        <span>{submitting ? (isEn ? 'Claiming...' : 'Đang nhận...') : (isEn ? `Claim Free Gift (${remainingFreeToday})` : `Nhận Quà Miễn Phí (${remainingFreeToday})`)}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={submitting || userPoints < extraCost}
                        onClick={() => handleClaimReward(true)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#C6A667] text-[#111111] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Coins className="w-4 h-4" />
                        <span>{isEn ? `Use ${extraCost} pts to Claim` : `Đổi ${extraCost} điểm Nhận Quà`}</span>
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#C6A667] text-[#111111] font-extrabold text-xs cursor-pointer"
                    >
                      {isEn ? 'Sign In to Claim Gift' : 'Đăng Nhập Nhận Quà'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleDemoPlay}
                    className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer"
                  >
                    {isEn ? 'Preview Reward' : 'Xem Thử Quà'}
                  </button>
                </>
              )}

              <div className="flex items-center gap-2">
                {status === 'won' && (
                  <button
                    type="button"
                    onClick={() => startStage(level + 1, true)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] font-extrabold text-xs cursor-pointer"
                  >
                    {isEn ? `Next Stage (${level + 1})` : `Màn Tiếp (${level + 1})`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => startStage(level, false)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-white text-[#111111] font-extrabold text-xs cursor-pointer"
                >
                  {isEn ? 'Retry' : 'Chơi Lại'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reserve Shelf (Moved Out Tiles) */}
      {reserveShelf.length > 0 && (
        <div className="mt-2.5 max-w-[440px] mx-auto px-3 py-2 rounded-xl bg-black/30 border border-amber-400/30 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] font-bold uppercase text-amber-300 shrink-0">
            {isEn ? 'Reserve:' : 'Khu dự phòng:'}
          </span>
          {reserveShelf.map((t) => {
            const sym = symbolMap.get(t.symbolId) || TILE_SYMBOLS[0];
            return (
              <button
                key={t.uid}
                type="button"
                onClick={() => processPickTile(t, true)}
                className={`w-10 h-10 rounded-lg bg-gradient-to-b ${sym.bg} border-2 ${sym.border} flex items-center justify-center text-lg shrink-0 cursor-pointer hover:scale-105 transition-transform`}
              >
                {sym.icon}
              </button>
            );
          })}
        </div>
      )}

      {/* 7-Slot Holding Tray */}
      <div className="mt-3 max-w-[440px] mx-auto p-2 rounded-2xl bg-[#2A1B12] border-2 border-[#C6A667]/50 shadow-inner">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: TRAY_CAPACITY }).map((_, slotIdx) => {
            const tile = tray[slotIdx];
            const sym = tile ? symbolMap.get(tile.symbolId) : null;
            const isClearing = tile ? clearingIds.includes(tile.uid) : false;
            return (
              <div
                key={slotIdx}
                className={`aspect-square rounded-xl border flex items-center justify-center transition-all duration-200 ${
                  tile && sym
                    ? isClearing
                      ? 'scale-110 bg-yellow-300 border-yellow-100 shadow-[0_0_16px_rgba(253,224,71,0.85)]'
                      : `bg-gradient-to-b ${sym.bg} ${sym.border} border-b-4`
                    : 'bg-black/35 border-white/10'
                }`}
              >
                {sym && <span className="text-xl sm:text-2xl leading-none">{sym.icon}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Classic Boosters + Early Claim */}
      <div className="mt-3 max-w-[440px] mx-auto grid grid-cols-3 gap-2">
        <button
          type="button"
          disabled={status !== 'playing' || undoLeft <= 0 || history.length === 0}
          onClick={handleUndo}
          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Undo2 className="w-3.5 h-3.5 text-sky-300" />
          <span>{isEn ? 'Undo' : 'Hoàn tác'}</span>
          <span className="text-[10px] font-mono text-white/70">({undoLeft})</span>
        </button>

        <button
          type="button"
          disabled={status !== 'playing' || moveOutLeft <= 0 || tray.length === 0}
          onClick={handleMoveOut3}
          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Layers className="w-3.5 h-3.5 text-amber-300" />
          <span>{isEn ? 'Shift 3' : 'Đẩy 3 ô'}</span>
          <span className="text-[10px] font-mono text-white/70">({moveOutLeft})</span>
        </button>

        <button
          type="button"
          disabled={status !== 'playing' || shuffleLeft <= 0}
          onClick={handleShuffleBoard}
          className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Shuffle className="w-3.5 h-3.5 text-emerald-300" />
          <span>{isEn ? 'Shuffle' : 'Xáo thẻ'}</span>
          <span className="text-[10px] font-mono text-white/70">({shuffleLeft})</span>
        </button>
      </div>

      {reachedTarget && !claimedThisRun && status === 'playing' && (
        <div className="mt-3 max-w-[440px] mx-auto">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleClaimReward(remainingFreeToday <= 0)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00552B] to-emerald-600 border border-emerald-300/40 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FDE68A]" />
            <span>{isEn ? 'Target Reached! Claim ROAR Reward' : 'Đạt mốc điểm! Bấm Nhận Quà ROAR Ngay'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
