import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Coins, Flame, Gift, RotateCcw, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { FireworksOverlay } from './FireworksOverlay';
import { gameSound } from './RoarGamesSound';

type BlockColor = 'cyan' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple' | 'pink';

interface PieceDef {
  id: string;
  cells: number[][];
  color: BlockColor;
}

interface TrayPiece extends PieceDef {
  uid: number;
}

interface ShatterShard {
  id: string;
  leftPct: number;
  topPct: number;
  tx: number;
  ty: number;
  rot: number;
  hex: string;
  size: number;
}

interface FloatingScorePop {
  id: number;
  leftPct: number;
  topPct: number;
  points: number;
  isClear: boolean;
}

interface PraiseBanner {
  id: number;
  headline: string;
  subline?: string;
  tone: 'gold' | 'cyan' | 'fire' | 'rainbow';
}

interface BlockBlastGameProps {
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

const GRID_SIZE = 8;
const BEST_SCORE_STORAGE_KEY = 'roar_block_blast_best';
const LEVEL_STORAGE_KEY = 'roar_block_blast_progress_v1';
const COMBO_GRACE_MAX = 3;

function readLocalBlockBlastProgress(): { level: number; maxLevel: number; bestScore: number } {
  try {
    const raw = window.localStorage.getItem(LEVEL_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        level: Math.max(1, Number(p.level || 1)),
        maxLevel: Math.max(1, Number(p.maxLevel || p.level || 1)),
        bestScore: Math.max(0, Number(p.bestScore || window.localStorage.getItem(BEST_SCORE_STORAGE_KEY) || 0)),
      };
    }
  } catch {
    // ignore
  }
  return { level: 1, maxLevel: 1, bestScore: 0 };
}

const COLOR_STYLES: Record<
  BlockColor,
  { face: string; bevel: string; glow: string; hex: string }
> = {
  cyan: {
    face: 'bg-gradient-to-br from-[#38BDF8] via-[#06B6D4] to-[#0284C7]',
    bevel: 'border-t-[#BAE6FD] border-l-[#7DD3FC] border-b-[#0E7490] border-r-[#0369A1]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
    hex: '#22D3EE',
  },
  blue: {
    face: 'bg-gradient-to-br from-[#60A5FA] via-[#2563EB] to-[#1D4ED8]',
    bevel: 'border-t-[#BFDBFE] border-l-[#93C5FD] border-b-[#1E3A8A] border-r-[#1E40AF]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
    hex: '#3B82F6',
  },
  green: {
    face: 'bg-gradient-to-br from-[#4ADE80] via-[#22C55E] to-[#16A34A]',
    bevel: 'border-t-[#BBF7D0] border-l-[#86EFAC] border-b-[#15803D] border-r-[#166534]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
    hex: '#4ADE80',
  },
  yellow: {
    face: 'bg-gradient-to-br from-[#FDE047] via-[#FACC15] to-[#EAB308]',
    bevel: 'border-t-[#FEF9C3] border-l-[#FEF08A] border-b-[#A16207] border-r-[#CA8A04]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]',
    hex: '#FACC15',
  },
  orange: {
    face: 'bg-gradient-to-br from-[#FB923C] via-[#F97316] to-[#EA580C]',
    bevel: 'border-t-[#FED7AA] border-l-[#FDBA74] border-b-[#9A3412] border-r-[#C2410C]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
    hex: '#FB923C',
  },
  red: {
    face: 'bg-gradient-to-br from-[#F87171] via-[#EF4444] to-[#DC2626]',
    bevel: 'border-t-[#FECACA] border-l-[#FCA5A5] border-b-[#991B1B] border-r-[#B91C1C]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
    hex: '#F87171',
  },
  purple: {
    face: 'bg-gradient-to-br from-[#C084FC] via-[#A855F7] to-[#7E22CE]',
    bevel: 'border-t-[#E9D5FF] border-l-[#D8B4FE] border-b-[#581C87] border-r-[#6B21A8]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
    hex: '#C084FC',
  },
  pink: {
    face: 'bg-gradient-to-br from-[#F472B6] via-[#EC4899] to-[#DB2777]',
    bevel: 'border-t-[#FBCFE8] border-l-[#F9A8D4] border-b-[#9D174D] border-r-[#BE185D]',
    glow: 'shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
    hex: '#F472B6',
  },
};

const BLOCK_COLORS: BlockColor[] = ['cyan', 'blue', 'green', 'yellow', 'orange', 'red', 'purple', 'pink'];

const SHAPE_TEMPLATES: Array<{ id: string; cells: number[][] }> = [
  { id: 'dot', cells: [[1]] },
  { id: 'h2', cells: [[1, 1]] },
  { id: 'v2', cells: [[1], [1]] },
  { id: 'h3', cells: [[1, 1, 1]] },
  { id: 'v3', cells: [[1], [1], [1]] },
  { id: 'h4', cells: [[1, 1, 1, 1]] },
  { id: 'v4', cells: [[1], [1], [1], [1]] },
  { id: 'h5', cells: [[1, 1, 1, 1, 1]] },
  { id: 'v5', cells: [[1], [1], [1], [1], [1]] },
  { id: 'sq2', cells: [[1, 1], [1, 1]] },
  { id: 'sq3', cells: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  { id: 'rect23', cells: [[1, 1, 1], [1, 1, 1]] },
  { id: 'rect32', cells: [[1, 1], [1, 1], [1, 1]] },
  { id: 'sl1', cells: [[1, 0], [1, 1]] },
  { id: 'sl2', cells: [[0, 1], [1, 1]] },
  { id: 'sl3', cells: [[1, 1], [1, 0]] },
  { id: 'sl4', cells: [[1, 1], [0, 1]] },
  { id: 'bl1', cells: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { id: 'bl2', cells: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  { id: 'bl3', cells: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { id: 'bl4', cells: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
  { id: 't1', cells: [[1, 1, 1], [0, 1, 0]] },
  { id: 't2', cells: [[0, 1, 0], [1, 1, 1]] },
  { id: 's1', cells: [[0, 1, 1], [1, 1, 0]] },
  { id: 'z1', cells: [[1, 1, 0], [0, 1, 1]] },
];

function createEmptyGrid(): (BlockColor | null)[][] {
  return Array.from({ length: GRID_SIZE }, () => Array<BlockColor | null>(GRID_SIZE).fill(null));
}

function cloneGrid(grid: (BlockColor | null)[][]): (BlockColor | null)[][] {
  return grid.map((row) => [...row]);
}

function canPlacePiece(grid: (BlockColor | null)[][], cells: number[][], row: number, col: number): boolean {
  const h = cells.length;
  const w = cells[0].length;
  if (row < 0 || col < 0 || row + h > GRID_SIZE || col + w > GRID_SIZE) return false;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (cells[r][c] && grid[row + r][col + c] !== null) return false;
    }
  }
  return true;
}

function canPieceFitAnywhere(grid: (BlockColor | null)[][], cells: number[][]): boolean {
  const h = cells.length;
  const w = cells[0].length;
  for (let r = 0; r <= GRID_SIZE - h; r++) {
    for (let c = 0; c <= GRID_SIZE - w; c++) {
      if (canPlacePiece(grid, cells, r, c)) return true;
    }
  }
  return false;
}

function pickDistinctColors(count: number): BlockColor[] {
  const pool = [...BLOCK_COLORS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, count);
}

function dealTray(grid: (BlockColor | null)[][], uidCounter: React.MutableRefObject<number>): (TrayPiece | null)[] {
  const colors = pickDistinctColors(3);
  const makeRandomPiece = (color: BlockColor): TrayPiece => {
    const tpl = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];
    uidCounter.current += 1;
    return { ...tpl, color, uid: uidCounter.current };
  };

  const hand: TrayPiece[] = [
    makeRandomPiece(colors[0]),
    makeRandomPiece(colors[1]),
    makeRandomPiece(colors[2]),
  ];
  if (hand.some((p) => canPieceFitAnywhere(grid, p.cells))) {
    return hand;
  }
  const fitting = SHAPE_TEMPLATES.filter((t) => canPieceFitAnywhere(grid, t.cells));
  if (fitting.length > 0) {
    const chosen = fitting[Math.floor(Math.random() * fitting.length)];
    uidCounter.current += 1;
    hand[1] = { ...chosen, color: colors[1], uid: uidCounter.current };
  }
  return hand;
}

function findLinesToClear(grid: (BlockColor | null)[][]) {
  const fullRows: number[] = [];
  const fullCols: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    if (grid[r].every((cell) => cell !== null)) fullRows.push(r);
  }
  for (let c = 0; c < GRID_SIZE; c++) {
    let colFull = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (grid[r][c] === null) {
        colFull = false;
        break;
      }
    }
    if (colFull) fullCols.push(c);
  }
  return { fullRows, fullCols };
}

function getPraiseCallout(lineCount: number, combo: number): { headline: string; tone: PraiseBanner['tone'] } {
  if (lineCount >= 4 || combo >= 5) return { headline: 'UNBELIEVABLE!', tone: 'rainbow' };
  if (lineCount === 3 || combo === 4) return { headline: 'AMAZING!', tone: 'fire' };
  if (lineCount === 2 || combo === 3) return { headline: 'EXCELLENT!', tone: 'gold' };
  if (combo === 2) return { headline: 'GREAT!', tone: 'cyan' };
  return { headline: 'GOOD!', tone: 'gold' };
}

export const BlockBlastGame: React.FC<BlockBlastGameProps> = ({
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
  const baseGoal = config?.min_score_to_win || 300;
  const costPts = config?.extra_play_cost_points || 20;

  const pieceSeqRef = useRef(1);
  const fxIdRef = useRef(1);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const placeTimerRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<number | null>(null);
  const shakeTimerRef = useRef<number | null>(null);
  const shardTimerRef = useRef<number | null>(null);

  const initialLocal = readLocalBlockBlastProgress();
  const [level, setLevel] = useState<number>(() => Math.max(1, savedProgress?.current_level || initialLocal.level));
  const [maxLevel, setMaxLevel] = useState<number>(() => Math.max(1, savedProgress?.max_level || initialLocal.maxLevel));
  const [stageScore, setStageScore] = useState(0);
  const [stageCleared, setStageCleared] = useState(false);

  const targetScore = baseGoal + (level - 1) * 180;

  const [grid, setGrid] = useState<(BlockColor | null)[][]>(() => createEmptyGrid());
  const [tray, setTray] = useState<(TrayPiece | null)[]>(() => dealTray(createEmptyGrid(), pieceSeqRef));
  const [trayDealKey, setTrayDealKey] = useState(1);
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      return Math.max(
        Number(savedProgress?.best_score || 0),
        Number(window.localStorage.getItem(BEST_SCORE_STORAGE_KEY) || 0),
        initialLocal.bestScore
      );
    } catch {
      return Number(savedProgress?.best_score || 0);
    }
  });
  const [newBestFlash, setNewBestFlash] = useState(false);
  const [combo, setCombo] = useState(0);
  const [comboGrace, setComboGrace] = useState(0);
  const [phase, setPhase] = useState<'playing' | 'ended'>('playing');
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [placedFlashSet, setPlacedFlashSet] = useState<Set<string>>(() => new Set());
  const [clearingSet, setClearingSet] = useState<Set<string>>(() => new Set());
  const [clearingLines, setClearingLines] = useState<{ rows: number[]; cols: number[]; hex: string } | null>(null);
  const [shatterShards, setShatterShards] = useState<ShatterShard[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScorePop[]>([]);
  const [praiseBanner, setPraiseBanner] = useState<PraiseBanner | null>(null);
  const [boardShake, setBoardShake] = useState<'light' | 'heavy' | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);

  useEffect(() => {
    if (savedProgress && savedProgress.current_level > level) {
      setLevel(savedProgress.current_level);
      setMaxLevel(Math.max(savedProgress.max_level || 1, savedProgress.current_level));
    }
    if (savedProgress && savedProgress.best_score > bestScore) {
      setBestScore(savedProgress.best_score);
    }
  }, [savedProgress]);

  const persistProgress = useCallback(
    (nextLevel: number, nextMaxLevel: number, nextBest: number) => {
      try {
        window.localStorage.setItem(
          LEVEL_STORAGE_KEY,
          JSON.stringify({ level: nextLevel, maxLevel: nextMaxLevel, bestScore: nextBest })
        );
        window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(nextBest));
      } catch {
        // ignore
      }
      onSaveProgress?.({ currentLevel: nextLevel, maxLevel: nextMaxLevel, bestScore: nextBest });
    },
    [onSaveProgress]
  );

  const [dragState, setDragState] = useState<{
    slotIndex: number;
    piece: TrayPiece;
    pointerId: number;
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
    isTouch: boolean;
    activeDrag: boolean;
    cellSize: number;
  } | null>(null);

  const [hoverPlacement, setHoverPlacement] = useState<{
    row: number;
    col: number;
    valid: boolean;
  } | null>(null);

  // Smooth Block Blast-style rolling score counter
  useEffect(() => {
    if (displayScore === score) return;
    let raf = 0;
    const startVal = displayScore;
    const diff = score - startVal;
    const duration = Math.min(340, Math.max(140, Math.abs(diff) * 4));
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(startVal + diff * eased));
      if (progress < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [score, displayScore]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      if (placeTimerRef.current) window.clearTimeout(placeTimerRef.current);
      if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
      if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
      if (shardTimerRef.current) window.clearTimeout(shardTimerRef.current);
    };
  }, []);

  const updateBestScore = useCallback((nextScore: number) => {
    setBestScore((prev) => {
      if (nextScore > prev) {
        if (prev > 0) setNewBestFlash(true);
        try {
          window.localStorage.setItem(BEST_SCORE_STORAGE_KEY, String(nextScore));
        } catch {
          // ignore storage errors
        }
        return nextScore;
      }
      return prev;
    });
  }, []);

  const spawnFloatingScore = useCallback((leftPct: number, topPct: number, points: number, isClear: boolean) => {
    fxIdRef.current += 1;
    const id = fxIdRef.current;
    setFloatingScores((prev) => [...prev.slice(-4), { id, leftPct, topPct, points, isClear }]);
    window.setTimeout(() => {
      setFloatingScores((prev) => prev.filter((item) => item.id !== id));
    }, 900);
  }, []);

  const resetGame = useCallback(() => {
    if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    if (placeTimerRef.current) window.clearTimeout(placeTimerRef.current);
    if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
    if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
    if (shardTimerRef.current) window.clearTimeout(shardTimerRef.current);

    const freshGrid = createEmptyGrid();
    setGrid(freshGrid);
    setTray(dealTray(freshGrid, pieceSeqRef));
    setTrayDealKey((k) => k + 1);
    setScore(0);
    setStageScore(0);
    setStageCleared(false);
    setDisplayScore(0);
    setNewBestFlash(false);
    setCombo(0);
    setComboGrace(0);
    setPhase('playing');
    setSelectedSlot(null);
    setPlacedFlashSet(new Set());
    setClearingSet(new Set());
    setClearingLines(null);
    setShatterShards([]);
    setFloatingScores([]);
    setPraiseBanner(null);
    setBoardShake(null);
    setClaimed(false);
    setDragState(null);
    setHoverPlacement(null);
  }, []);

  const advanceToNextLevel = useCallback(() => {
    const nextLvl = level + 1;
    const nextMax = Math.max(maxLevel, nextLvl);
    setLevel(nextLvl);
    setMaxLevel(nextMax);
    setStageScore(0);
    setStageCleared(false);
    const freshGrid = createEmptyGrid();
    setGrid(freshGrid);
    setTray(dealTray(freshGrid, pieceSeqRef));
    setTrayDealKey((k) => k + 1);
    setPhase('playing');
    setSelectedSlot(null);
    setClaimed(false);
    persistProgress(nextLvl, nextMax, bestScore);
  }, [bestScore, level, maxLevel, persistProgress]);

  const commitPlacePiece = useCallback(
    (slotIndex: number, targetRow: number, targetCol: number) => {
      if (phase !== 'playing' || clearingSet.size > 0) return false;
      const piece = tray[slotIndex];
      if (!piece || !canPlacePiece(grid, piece.cells, targetRow, targetCol)) return false;

      const nextGrid = cloneGrid(grid);
      const justPlaced = new Set<string>();
      let placedCellCount = 0;
      let sumR = 0;
      let sumC = 0;

      for (let r = 0; r < piece.cells.length; r++) {
        for (let c = 0; c < piece.cells[0].length; c++) {
          if (piece.cells[r][c]) {
            const gr = targetRow + r;
            const gc = targetCol + c;
            nextGrid[gr][gc] = piece.color;
            justPlaced.add(`${gr}-${gc}`);
            sumR += gr;
            sumC += gc;
            placedCellCount += 1;
          }
        }
      }

      const centroidLeftPct = ((sumC / Math.max(1, placedCellCount) + 0.5) / GRID_SIZE) * 100;
      const centroidTopPct = ((sumR / Math.max(1, placedCellCount) + 0.5) / GRID_SIZE) * 100;

      setPlacedFlashSet(justPlaced);
      if (placeTimerRef.current) window.clearTimeout(placeTimerRef.current);
      placeTimerRef.current = window.setTimeout(() => setPlacedFlashSet(new Set()), 220);

      const { fullRows, fullCols } = findLinesToClear(nextGrid);
      const lineCount = fullRows.length + fullCols.length;

      // Official Block Blast 3-move combo streak window
      let nextCombo = combo;
      let nextGrace = comboGrace;
      if (lineCount > 0) {
        nextCombo = combo + 1;
        nextGrace = COMBO_GRACE_MAX;
      } else if (comboGrace > 0) {
        nextGrace = comboGrace - 1;
        if (nextGrace === 0) nextCombo = 0;
      } else {
        nextCombo = 0;
      }

      const basePts = placedCellCount * 5;
      const clearPts =
        lineCount > 0
          ? Math.round(lineCount * 40 * (1 + (nextCombo - 1) * 0.5) + (lineCount >= 2 ? (lineCount - 1) * 30 : 0))
          : 0;
      const gainedPts = basePts + clearPts;
      const nextScore = score + gainedPts;
      const nextStageScore = stageScore + gainedPts;

      setScore(nextScore);
      setStageScore(nextStageScore);
      setCombo(nextCombo);
      setComboGrace(nextGrace);
      updateBestScore(nextScore);
      const nextBest = Math.max(bestScore, nextScore);
      if (nextScore > bestScore) {
        persistProgress(level, maxLevel, nextBest);
      }
      setSelectedSlot(null);
      setHoverPlacement(null);

      spawnFloatingScore(centroidLeftPct, centroidTopPct, gainedPts, lineCount > 0);

      let nextTray = tray.map((item, idx) => (idx === slotIndex ? null : item));
      const allPlaced = nextTray.every((item) => item === null);

      if (lineCount > 0) {
        gameSound.clearLine(nextCombo, lineCount);
        const toFlash = new Set<string>();
        const newShards: ShatterShard[] = [];

        const pushCellShards = (r: number, c: number, cellHex: string) => {
          const leftPct = ((c + 0.5) / GRID_SIZE) * 100;
          const topPct = ((r + 0.5) / GRID_SIZE) * 100;
          const angles = [-135, -45, 45, 135];
          for (let i = 0; i < 4; i++) {
            const deg = angles[i] + (Math.random() * 34 - 17);
            const rad = (deg * Math.PI) / 180;
            const dist = 26 + Math.random() * 28;
            fxIdRef.current += 1;
            newShards.push({
              id: `sh-${fxIdRef.current}`,
              leftPct,
              topPct,
              tx: Math.round(Math.cos(rad) * dist),
              ty: Math.round(Math.sin(rad) * dist + 14),
              rot: Math.round((Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 140)),
              hex: cellHex,
              size: 6 + Math.round(Math.random() * 4),
            });
          }
        };

        for (const r of fullRows) {
          for (let c = 0; c < GRID_SIZE; c++) {
            const key = `${r}-${c}`;
            if (!toFlash.has(key)) {
              toFlash.add(key);
              const color = nextGrid[r][c] || piece.color;
              pushCellShards(r, c, COLOR_STYLES[color].hex);
            }
          }
        }
        for (const c of fullCols) {
          for (let r = 0; r < GRID_SIZE; r++) {
            const key = `${r}-${c}`;
            if (!toFlash.has(key)) {
              toFlash.add(key);
              const color = nextGrid[r][c] || piece.color;
              pushCellShards(r, c, COLOR_STYLES[color].hex);
            }
          }
        }

        setGrid(nextGrid);
        setClearingSet(toFlash);
        setClearingLines({ rows: fullRows, cols: fullCols, hex: COLOR_STYLES[piece.color].hex });
        setShatterShards(newShards);

        if (shardTimerRef.current) window.clearTimeout(shardTimerRef.current);
        shardTimerRef.current = window.setTimeout(() => setShatterShards([]), 520);

        const heavy = lineCount >= 2 || nextCombo >= 3;
        setBoardShake(heavy ? 'heavy' : 'light');
        if (shakeTimerRef.current) window.clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = window.setTimeout(() => setBoardShake(null), heavy ? 320 : 230);

        const praise = getPraiseCallout(lineCount, nextCombo);
        fxIdRef.current += 1;
        setPraiseBanner({
          id: fxIdRef.current,
          headline: praise.headline,
          subline:
            nextCombo > 1
              ? `COMBO x${nextCombo} · +${gainedPts}`
              : lineCount >= 2
                ? `${lineCount} LINES · +${gainedPts}`
                : `+${gainedPts} PTS`,
          tone: praise.tone,
        });
        if (bannerTimerRef.current) window.clearTimeout(bannerTimerRef.current);
        bannerTimerRef.current = window.setTimeout(() => setPraiseBanner(null), 1150);

        const clearedGrid = cloneGrid(nextGrid);
        for (const r of fullRows) {
          for (let c = 0; c < GRID_SIZE; c++) clearedGrid[r][c] = null;
        }
        for (const c of fullCols) {
          for (let r = 0; r < GRID_SIZE; r++) clearedGrid[r][c] = null;
        }
        if (allPlaced) {
          nextTray = dealTray(clearedGrid, pieceSeqRef);
          setTrayDealKey((k) => k + 1);
        }
        setTray(nextTray);

        if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = window.setTimeout(() => {
          setGrid(clearedGrid);
          setClearingSet(new Set());
          setClearingLines(null);
          const canContinue = nextTray.some((p) => p !== null && canPieceFitAnywhere(clearedGrid, p.cells));
          if (!canContinue) {
            gameSound.gameOver();
            setPhase('ended');
          }
        }, 250);
      } else {
        gameSound.placeBlock();
        setGrid(nextGrid);
        if (allPlaced) {
          nextTray = dealTray(nextGrid, pieceSeqRef);
          setTrayDealKey((k) => k + 1);
        }
        setTray(nextTray);
        const canContinue = nextTray.some((p) => p !== null && canPieceFitAnywhere(nextGrid, p.cells));
        if (!canContinue) {
          gameSound.gameOver();
          setPhase('ended');
        }
      }

      if (!stageCleared && nextStageScore >= targetScore) {
        setStageCleared(true);
        gameSound.victoryFanfare();
        const unlockedMax = Math.max(maxLevel, level + 1);
        setMaxLevel(unlockedMax);
        persistProgress(level + 1, unlockedMax, Math.max(bestScore, nextScore));
      }
      return true;
    },
    [bestScore, clearingSet.size, combo, comboGrace, grid, level, maxLevel, persistProgress, phase, score, spawnFloatingScore, stageCleared, stageScore, targetScore, tray, updateBestScore]
  );

  const computeGridTargetFromPointer = useCallback(
    (clientX: number, clientY: number, isTouch: boolean, piece: TrayPiece) => {
      const boardEl = boardRef.current;
      if (!boardEl) return null;
      const rect = boardEl.getBoundingClientRect();
      const cellSize = rect.width / GRID_SIZE;
      const liftY = isTouch ? 56 : 0;
      const centerX = clientX;
      const centerY = clientY - liftY;
      const pieceW = piece.cells[0].length * cellSize;
      const pieceH = piece.cells.length * cellSize;
      const topLeftX = centerX - pieceW / 2;
      const topLeftY = centerY - pieceH / 2;

      const col = Math.round((topLeftX - rect.left) / cellSize);
      const row = Math.round((topLeftY - rect.top) / cellSize);
      const nearBoard =
        centerX >= rect.left - cellSize &&
        centerX <= rect.right + cellSize &&
        centerY >= rect.top - cellSize &&
        centerY <= rect.bottom + cellSize;

      if (!nearBoard) return null;
      return {
        row,
        col,
        valid: canPlacePiece(grid, piece.cells, row, col),
      };
    },
    [grid]
  );

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      const becameActive = !dragState.activeDrag && dist > 6;
      const activeDrag = dragState.activeDrag || dist > 6;
      if (becameActive) {
        gameSound.pickupBlock();
      }
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              clientX: e.clientX,
              clientY: e.clientY,
              activeDrag,
            }
          : null
      );
      if (activeDrag) {
        const target = computeGridTargetFromPointer(e.clientX, e.clientY, dragState.isTouch, dragState.piece);
        setHoverPlacement(target);
      }
    };

    const handleUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      if (dragState.activeDrag) {
        const target = computeGridTargetFromPointer(e.clientX, e.clientY, dragState.isTouch, dragState.piece);
        if (target?.valid) {
          commitPlacePiece(dragState.slotIndex, target.row, target.col);
        } else {
          setHoverPlacement(null);
        }
      } else {
        gameSound.pickupBlock();
        setSelectedSlot((prev) => (prev === dragState.slotIndex ? null : dragState.slotIndex));
        setHoverPlacement(null);
      }
      setDragState(null);
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [commitPlacePiece, computeGridTargetFromPointer, dragState]);

  const handleBoardCellTap = (r: number, c: number) => {
    if (phase !== 'playing' || selectedSlot === null) return;
    const piece = tray[selectedSlot];
    if (!piece) return;
    const h = piece.cells.length;
    const w = piece.cells[0].length;
    const centerR = r - Math.floor(h / 2);
    const centerC = c - Math.floor(w / 2);
    const candidates: Array<[number, number]> = [
      [centerR, centerC],
      [r, c],
      [centerR, Math.max(0, Math.min(GRID_SIZE - w, centerC))],
      [Math.max(0, Math.min(GRID_SIZE - h, centerR)), Math.max(0, Math.min(GRID_SIZE - w, centerC))],
    ];
    for (const [cr, cc] of candidates) {
      if (canPlacePiece(grid, piece.cells, cr, cc)) {
        commitPlacePiece(selectedSlot, cr, cc);
        return;
      }
    }
  };

  const activeDraggedPiece = dragState?.activeDrag ? dragState.piece : null;
  const previewMeta = useMemo(() => {
    const ghostKeys = new Set<string>();
    const clearHighlightKeys = new Set<string>();
    const previewRows: number[] = [];
    const previewCols: number[] = [];
    if (!activeDraggedPiece || !hoverPlacement) {
      return { ghostKeys, clearHighlightKeys, previewRows, previewCols, valid: false, color: null as BlockColor | null };
    }
    const { row, col, valid } = hoverPlacement;
    for (let pr = 0; pr < activeDraggedPiece.cells.length; pr++) {
      for (let pc = 0; pc < activeDraggedPiece.cells[0].length; pc++) {
        if (!activeDraggedPiece.cells[pr][pc]) continue;
        const gr = row + pr;
        const gc = col + pc;
        if (gr >= 0 && gr < GRID_SIZE && gc >= 0 && gc < GRID_SIZE) {
          ghostKeys.add(`${gr}-${gc}`);
        }
      }
    }
    if (valid) {
      const sim = cloneGrid(grid);
      for (let pr = 0; pr < activeDraggedPiece.cells.length; pr++) {
        for (let pc = 0; pc < activeDraggedPiece.cells[0].length; pc++) {
          if (activeDraggedPiece.cells[pr][pc]) {
            sim[row + pr][col + pc] = activeDraggedPiece.color;
          }
        }
      }
      const { fullRows, fullCols } = findLinesToClear(sim);
      previewRows.push(...fullRows);
      previewCols.push(...fullCols);
      for (const fr of fullRows) {
        for (let cc = 0; cc < GRID_SIZE; cc++) clearHighlightKeys.add(`${fr}-${cc}`);
      }
      for (const fc of fullCols) {
        for (let rr = 0; rr < GRID_SIZE; rr++) clearHighlightKeys.add(`${rr}-${fc}`);
      }
    }
    return { ghostKeys, clearHighlightKeys, previewRows, previewCols, valid, color: activeDraggedPiece.color };
  }, [activeDraggedPiece, grid, hoverPlacement]);

  const handleClaim = async (useExtraPoints = false) => {
    if (claimed || claiming || score < targetScore) return;
    if (!isSignedIn) {
      const pool = rewards.filter((r) => r.active);
      if (pool.length > 0) {
        onDemoResult(pool[Math.floor(Math.random() * pool.length)]);
        setClaimed(true);
      }
      return;
    }
    setClaiming(true);
    try {
      const res = await onPlayReal(useExtraPoints, score);
      if (res?.won) {
        gameSound.win();
        setClaimed(true);
      }
    } finally {
      setClaiming(false);
    }
  };

  const canFree = remainingFreeToday > 0;
  const reachedGoal = stageScore >= targetScore || score >= targetScore;
  const progressPct = Math.min(100, Math.round((stageScore / Math.max(1, targetScore)) * 100));

  const bannerColors: Record<PraiseBanner['tone'], string> = {
    gold: 'from-[#FDE047] via-[#FACC15] to-[#F97316] text-[#111111]',
    cyan: 'from-[#38BDF8] via-[#22D3EE] to-[#818CF8] text-[#081226]',
    fire: 'from-[#FB923C] via-[#F43F5E] to-[#EC4899] text-white',
    rainbow: 'from-[#FDE047] via-[#34D399] to-[#38BDF8] text-[#0B1020]',
  };

  return (
    <div className="space-y-2.5 sm:space-y-3.5 w-full min-w-0 select-none">
      {/* Compact Score & Controls HUD */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10">
        <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] sm:text-xs font-bold tabular-nums min-w-0 flex-1 overflow-x-auto no-scrollbar">
          <AdaptiveLogo variant="horizontal" surface="auto" darkTone="gold" size="2xs" className="hidden sm:inline-flex shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-[#00552B] text-[#F8F5EF] text-[10px] font-extrabold shrink-0 whitespace-nowrap">
            {lang === 'en' ? `Lv.${level}` : `Màn ${level}`}
          </span>
          <div className="flex items-center gap-1 whitespace-nowrap shrink-0">
            <span className="hidden sm:inline text-[#202020]/65 dark:text-[#F1EFEA]/65">{lang === 'en' ? 'Score' : 'Điểm'}:</span>
            <span className={`text-xs sm:text-base font-extrabold transition-colors ${reachedGoal ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#111111] dark:text-white'}`}>
              {stageScore}
            </span>
            <span className="text-[10px] text-[#202020]/50 dark:text-[#F1EFEA]/50">/{targetScore}</span>
          </div>

          <div className={`flex items-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 transition-transform ${newBestFlash ? 'scale-110 text-amber-500' : 'text-[#8C6D32] dark:text-[#C6A667]'}`}>
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>{bestScore}</span>
          </div>

          {combo > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold shrink-0 whitespace-nowrap">
              <Flame className="w-3 h-3 text-orange-500" />
              <span>x{combo}</span>
              <span className="hidden sm:inline-flex items-center gap-0.5 ml-0.5" aria-hidden="true">
                {[0, 1, 2].map((pip) => (
                  <span
                    key={pip}
                    className={`w-1 h-1 rounded-full transition-opacity ${
                      pip < comboGrace ? 'bg-orange-500 opacity-100' : 'bg-orange-500/25 opacity-60'
                    }`}
                  />
                ))}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              gameSound.muted = !muted;
              setMuted(gameSound.muted);
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-[#202020]/15 dark:border-white/15 flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={resetGame}
            aria-label={lang === 'en' ? 'Restart' : 'Chơi lại'}
            title={lang === 'en' ? 'Restart' : 'Chơi lại'}
            className="w-7 h-7 sm:w-auto sm:px-2.5 sm:h-8 rounded-lg border border-[#202020]/15 dark:border-white/15 text-[11px] font-bold inline-flex items-center justify-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'en' ? 'Restart' : 'Chơi lại'}</span>
          </button>
        </div>
      </div>

      {/* Slim Goal Progress + Instant Claim Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-[#202020]/10 dark:bg-white/10 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              reachedGoal ? 'bg-gradient-to-r from-[#22C55E] via-[#FACC15] to-[#06B6D4]' : 'bg-[#00552B] dark:bg-[#C6A667]'
            }`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {reachedGoal && !claimed && phase === 'playing' && (
          !isSignedIn ? (
            <button
              type="button"
              onClick={() => handleClaim(false)}
              className="px-2.5 py-1 rounded-lg bg-[#C6A667] text-[#111111] text-[11px] font-extrabold inline-flex items-center gap-1 shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
            >
              <Sparkles className="w-3 h-3" />
              <span>{lang === 'en' ? 'Preview Prize' : 'Nhận Thử Quà'}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={claiming || (!canFree && userPoints < costPts)}
              onClick={() => handleClaim(!canFree)}
              className="px-2.5 py-1 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-extrabold inline-flex items-center gap-1 shadow-sm cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50"
            >
              <Gift className="w-3 h-3 text-[#C6A667]" />
              <span>
                {claiming
                  ? '...'
                  : canFree
                    ? lang === 'en'
                      ? 'Claim Reward!'
                      : 'Nhận Quà Ngay!'
                    : lang === 'en'
                      ? `Claim (-${costPts} pts)`
                      : `Nhận Quà (-${costPts}đ)`}
              </span>
            </button>
          )
        )}
      </div>

      {/* Classic Block Blast 8x8 Navy Board */}
      <div
        className={`relative w-full max-w-[min(84vw,298px)] sm:max-w-[348px] aspect-square mx-auto ${
          boardShake === 'heavy'
            ? 'animate-bb-shake-heavy'
            : boardShake === 'light'
              ? 'animate-bb-shake-light'
              : ''
        }`}
      >
        <div
          ref={boardRef}
          className={`relative w-full h-full rounded-2xl bg-[#161F36] p-1.5 sm:p-2 shadow-xl grid grid-cols-8 grid-rows-8 gap-1 touch-none overflow-hidden transition-all ${
            combo >= 3
              ? 'border-[3px] border-[#FACC15] shadow-[0_0_24px_rgba(250,204,21,0.38)]'
              : combo >= 2
                ? 'border-[3px] border-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.28)]'
                : 'border-[3px] border-[#2C3A61]'
          }`}
        >
          {/* Subtle Official ROAR COFFEE Crest Watermark inside Board */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.08]">
            <AdaptiveLogo variant="vertical" surface="dark" darkTone="gold" size="lg" />
          </div>

          {grid.map((rowArr, r) =>
            rowArr.map((cellColor, c) => {
              const key = `${r}-${c}`;
              const isClearing = clearingSet.has(key);
              const isJustPlaced = placedFlashSet.has(key);
              const isGhost = previewMeta.ghostKeys.has(key);
              const isClearPreview = previewMeta.clearHighlightKeys.has(key);

              const activeStyle = cellColor ? COLOR_STYLES[cellColor] : null;
              const ghostStyle = previewMeta.color ? COLOR_STYLES[previewMeta.color] : null;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleBoardCellTap(r, c)}
                  aria-label={`Row ${r + 1} Column ${c + 1}`}
                  className={`relative rounded-[5px] sm:rounded-[6px] transition-all duration-100 overflow-hidden ${
                    selectedSlot !== null && !cellColor ? 'cursor-pointer hover:ring-1 hover:ring-[#38BDF8]/80' : 'cursor-default'
                  } ${
                    isClearing && activeStyle
                      ? `${activeStyle.face} border-2 ${activeStyle.bevel} animate-bb-blast`
                      : isClearing
                        ? 'bg-white animate-bb-blast'
                        : activeStyle
                          ? `${activeStyle.face} border-2 ${activeStyle.bevel} ${activeStyle.glow} ${isJustPlaced ? 'animate-bb-place' : ''}`
                          : isGhost
                            ? previewMeta.valid && ghostStyle
                              ? `${ghostStyle.face} border-2 ${ghostStyle.bevel} opacity-60 scale-[0.96]`
                              : 'bg-red-500/40 ring-1 ring-red-400/80'
                            : 'bg-[#0E1526] border border-[#232F4E]'
                  } ${
                    isClearPreview
                      ? 'ring-2 ring-white/95 brightness-125 shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                      : ''
                  }`}
                >
                  {(activeStyle || (isGhost && previewMeta.valid)) && !isClearing && (
                    <span className="absolute inset-[18%] rounded-[2px] bg-white/15 pointer-events-none" />
                  )}
                  {isClearPreview && !isClearing && previewMeta.color && (
                    <span
                      className="absolute inset-0 opacity-30 pointer-events-none animate-pulse"
                      style={{ backgroundColor: COLOR_STYLES[previewMeta.color].hex }}
                    />
                  )}
                </button>
              );
            })
          )}

          {/* Laser Sweep Overlay on Impending Preview Lines */}
          {previewMeta.valid && (previewMeta.previewRows.length > 0 || previewMeta.previewCols.length > 0) && previewMeta.color && (
            <div className="pointer-events-none absolute inset-1.5 sm:inset-2 z-10">
              {previewMeta.previewRows.map((r) => (
                <div
                  key={`pr-row-${r}`}
                  className="absolute left-0 right-0 rounded-md border border-white/75 animate-pulse"
                  style={{
                    top: `${(r / GRID_SIZE) * 100}%`,
                    height: `${100 / GRID_SIZE}%`,
                    boxShadow: `0 0 14px ${COLOR_STYLES[previewMeta.color!].hex}`,
                  }}
                />
              ))}
              {previewMeta.previewCols.map((c) => (
                <div
                  key={`pr-col-${c}`}
                  className="absolute top-0 bottom-0 rounded-md border border-white/75 animate-pulse"
                  style={{
                    left: `${(c / GRID_SIZE) * 100}%`,
                    width: `${100 / GRID_SIZE}%`,
                    boxShadow: `0 0 14px ${COLOR_STYLES[previewMeta.color!].hex}`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Line-Clear Energy Sweep Beams */}
          {clearingLines && (
            <div className="pointer-events-none absolute inset-1.5 sm:inset-2 z-20 overflow-hidden">
              {clearingLines.rows.map((r) => (
                <div
                  key={`sweep-r-${r}`}
                  className="absolute left-0 right-0 rounded-full animate-bb-row-sweep"
                  style={{
                    top: `${((r + 0.1) / GRID_SIZE) * 100}%`,
                    height: `${(0.8 / GRID_SIZE) * 100}%`,
                    background: `linear-gradient(90deg, transparent, #FFFFFF 22%, ${clearingLines.hex} 50%, #FFFFFF 78%, transparent)`,
                    boxShadow: `0 0 18px ${clearingLines.hex}`,
                  }}
                />
              ))}
              {clearingLines.cols.map((c) => (
                <div
                  key={`sweep-c-${c}`}
                  className="absolute top-0 bottom-0 rounded-full animate-bb-col-sweep"
                  style={{
                    left: `${((c + 0.1) / GRID_SIZE) * 100}%`,
                    width: `${(0.8 / GRID_SIZE) * 100}%`,
                    background: `linear-gradient(180deg, transparent, #FFFFFF 22%, ${clearingLines.hex} 50%, #FFFFFF 78%, transparent)`,
                    boxShadow: `0 0 18px ${clearingLines.hex}`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Jewel Shatter Shards Overlay */}
          {shatterShards.length > 0 && (
            <div className="pointer-events-none absolute inset-1.5 sm:inset-2 z-20 overflow-visible">
              {shatterShards.map((shard) => (
                <span
                  key={shard.id}
                  className="absolute rounded-[2px] animate-bb-shard shadow-sm"
                  style={
                    {
                      left: `${shard.leftPct}%`,
                      top: `${shard.topPct}%`,
                      width: `${shard.size}px`,
                      height: `${shard.size}px`,
                      backgroundColor: shard.hex,
                      border: '1px solid rgba(255,255,255,0.75)',
                      '--tx': `${shard.tx}px`,
                      '--ty': `${shard.ty}px`,
                      '--rot': `${shard.rot}deg`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
          )}

          {/* Floating +Score Popups */}
          {floatingScores.map((pop) => (
            <div
              key={pop.id}
              className={`pointer-events-none absolute z-30 font-display font-extrabold tabular-nums drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] animate-bb-float-score ${
                pop.isClear ? 'text-base sm:text-lg text-[#FDE047]' : 'text-xs sm:text-sm text-white'
              }`}
              style={{
                left: `${Math.max(15, Math.min(85, pop.leftPct))}%`,
                top: `${Math.max(18, Math.min(85, pop.topPct))}%`,
              }}
            >
              +{pop.points}
            </div>
          ))}
        </div>

        {/* Official Block Blast Combo Praise Banner */}
        {praiseBanner && (
          <div
            key={praiseBanner.id}
            className="pointer-events-none absolute top-4 left-1/2 z-30 flex flex-col items-center animate-bb-banner"
          >
            <div
              className={`px-3.5 py-1 rounded-full bg-gradient-to-r ${bannerColors[praiseBanner.tone]} text-sm sm:text-base font-black tracking-wider shadow-[0_6px_20px_rgba(0,0,0,0.45)] border border-white/60 whitespace-nowrap`}
            >
              {praiseBanner.headline}
            </div>
            {praiseBanner.subline && (
              <span className="mt-1 px-2 py-0.5 rounded bg-[#0B1020]/85 text-[#FDE047] text-[10px] font-extrabold tracking-widest shadow whitespace-nowrap">
                {praiseBanner.subline}
              </span>
            )}
          </div>
        )}

        {/* Celebratory Stage Clear Fireworks + Next Level Overlay */}
        {stageCleared && phase === 'playing' && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-[#07110C]/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center text-white overflow-hidden">
            <FireworksOverlay active={true} />
            <div className="relative z-30 space-y-2.5 max-w-[260px]">
              <div className="flex justify-center">
                <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FDE047] to-[#F97316] text-[#111111] text-[10px] font-black uppercase tracking-widest shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? `LEVEL ${level} CLEARED!` : `HOÀN THÀNH MÀN ${level}!`}</span>
              </div>
              <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#FDE047] tabular-nums drop-shadow">
                {stageScore} pts
              </div>
              <p className="text-[11px] sm:text-xs text-white/85">
                {lang === 'en'
                  ? 'Dazzling victory! Advance to the next stage or claim your ROAR gift now.'
                  : 'Tuyệt vời! Bạn đã mở khóa Màn tiếp theo và đủ điều kiện nhận quà ROAR.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={advanceToNextLevel}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#16A34A] hover:brightness-110 text-white text-xs font-extrabold shadow-lg cursor-pointer"
                >
                  {lang === 'en' ? `Next: Level ${level + 1} →` : `Chơi Màn ${level + 1} →`}
                </button>
                {!claimed && (
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() => (isSignedIn ? handleClaim(!canFree) : handleClaim(false))}
                    className="px-3.5 py-2 rounded-xl bg-[#FACC15] text-[#111111] text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Claim Gift' : 'Nhận Quà'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {phase === 'ended' && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-[#0B1020]/82 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center text-white">
            <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" className="mb-2" />
            <div className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.18em] text-[#FACC15] mb-1">
              {reachedGoal
                ? lang === 'en'
                  ? 'PUZZLE GOAL CLEARED!'
                  : 'VƯỢT MỐC NHẬN THƯỞNG!'
                : lang === 'en'
                  ? 'NO MORE MOVES · GAME OVER'
                  : 'HẾT NƯỚC ĐI · KẾT THÚC'}
            </div>
            <div className="font-display text-2xl sm:text-3xl font-extrabold tabular-nums mb-1">{score} pts</div>
            <p className="text-[11px] sm:text-xs text-white/80 max-w-[240px] mb-3">
              {reachedGoal
                ? claimed
                  ? lang === 'en'
                    ? 'Reward claimed! Play another round to beat your high score.'
                    : 'Đã ghi nhận quà! Chơi ván mới để phá kỷ lục ngay.'
                  : lang === 'en'
                    ? `You reached ${targetScore}+ pts! Claim your ROAR gift now.`
                    : `Đạt ${targetScore}+ điểm! Nhận quà ROAR thật ngay nhé.`
                : lang === 'en'
                  ? `Need ${targetScore} pts to unlock a reward. Try again!`
                  : `Cần ${targetScore}+ điểm để mở khóa quà. Thử lại nhé!`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {reachedGoal && !claimed && (
                !isSignedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleClaim(false)}
                      className="px-3.5 py-2 rounded-xl bg-[#FACC15] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Preview Prize' : 'Xem Thử Quà'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                    >
                      {lang === 'en' ? 'Sign In' : 'Đăng nhập'}
                    </button>
                  </>
                ) : canFree ? (
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() => handleClaim(false)}
                    className="px-4 py-2 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{claiming ? '...' : lang === 'en' ? 'Claim Reward' : 'Nhận Quà Ngay'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={claiming || userPoints < costPts}
                    onClick={() => handleClaim(true)}
                    className="px-4 py-2 rounded-xl bg-[#FACC15] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4" />
                    <span>{lang === 'en' ? `Claim (-${costPts} pts)` : `Nhận Quà (-${costPts}đ)`}</span>
                  </button>
                )
              )}
              <button
                type="button"
                onClick={resetGame}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Play Again' : 'Chơi Lại'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3-Piece Polyomino Dock */}
      <div className="w-full max-w-[348px] mx-auto grid grid-cols-3 gap-2">
        {tray.map((piece, idx) => {
          const isBeingDragged = dragState?.activeDrag && dragState.slotIndex === idx;
          const isSelected = selectedSlot === idx;
          const fits = piece ? canPieceFitAnywhere(grid, piece.cells) : false;

          return (
            <div
              key={`${trayDealKey}-${idx}`}
              onPointerDown={(e) => {
                if (!piece || phase !== 'playing') return;
                e.preventDefault();
                const boardWidth = boardRef.current?.getBoundingClientRect().width || 298;
                setDragState({
                  slotIndex: idx,
                  piece,
                  pointerId: e.pointerId,
                  clientX: e.clientX,
                  clientY: e.clientY,
                  startX: e.clientX,
                  startY: e.clientY,
                  isTouch: e.pointerType === 'touch',
                  activeDrag: false,
                  cellSize: boardWidth / GRID_SIZE,
                });
              }}
              className={`h-[76px] sm:h-[88px] rounded-xl border flex items-center justify-center p-2 transition-all touch-none select-none ${
                !piece
                  ? 'bg-[#161F36]/40 border-dashed border-[#2C3A61]/45'
                  : isSelected
                    ? 'bg-[#1C2847] border-2 border-[#38BDF8] shadow-md cursor-grab scale-[1.03]'
                    : fits
                      ? 'bg-[#161F36] border-[#2C3A61] hover:border-[#38BDF8]/70 cursor-grab active:cursor-grabbing'
                      : 'bg-[#161F36]/55 border-[#2C3A61]/40 opacity-45'
              }`}
            >
              {piece && !isBeingDragged && (
                <div
                  className="grid gap-[2px] pointer-events-none animate-bb-tray-deal"
                  style={{
                    gridTemplateColumns: `repeat(${piece.cells[0].length}, minmax(0, 1fr))`,
                    animationDelay: `${idx * 55}ms`,
                  }}
                >
                  {piece.cells.map((rowArr, r) =>
                    rowArr.map((filled, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`relative w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] rounded-[3px] ${
                          filled
                            ? `${COLOR_STYLES[piece.color].face} border ${COLOR_STYLES[piece.color].bevel} ${COLOR_STYLES[piece.color].glow}`
                            : 'bg-transparent'
                        }`}
                      >
                        {filled && <span className="absolute inset-[20%] rounded-[1px] bg-white/15" />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle instruction line */}
      <p className="text-center text-[10px] sm:text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 leading-tight">
        {selectedSlot !== null
          ? lang === 'en'
            ? 'Tap any square on the 8×8 board to place the selected block.'
            : 'Chạm vào ô bất kỳ trên bảng 8×8 để đặt khối đã chọn.'
          : lang === 'en'
            ? 'Drag & drop blocks onto the 8×8 grid (or tap piece then tap board).'
            : 'Kéo thả khối vào bảng 8×8 (hoặc chạm chọn khối rồi chạm ô để đặt).'}
      </p>

      {/* Floating Dragged Polyomino Overlay */}
      {dragState?.activeDrag && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragState.clientX,
            top: dragState.clientY - (dragState.isTouch ? 56 : 0),
            transform: 'translate(-50%, -50%) scale(1.06)',
          }}
        >
          <div
            className="grid gap-[3px] drop-shadow-[0_14px_20px_rgba(0,0,0,0.55)]"
            style={{
              gridTemplateColumns: `repeat(${dragState.piece.cells[0].length}, ${Math.max(24, dragState.cellSize - 4)}px)`,
            }}
          >
            {dragState.piece.cells.map((rowArr, r) =>
              rowArr.map((filled, c) => {
                const sz = Math.max(24, dragState.cellSize - 4);
                return (
                  <div
                    key={`${r}-${c}`}
                    style={{ width: sz, height: sz }}
                    className={`relative rounded-[5px] ${
                      filled
                        ? `${COLOR_STYLES[dragState.piece.color].face} border-2 ${COLOR_STYLES[dragState.piece.color].bevel} ${COLOR_STYLES[dragState.piece.color].glow}`
                        : 'bg-transparent'
                    }`}
                  >
                    {filled && <span className="absolute inset-[18%] rounded-[2px] bg-white/15" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
