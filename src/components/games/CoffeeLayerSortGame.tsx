import React, { useCallback, useMemo, useState } from 'react';
import {
  Coins,
  Gift,
  Lightbulb,
  Music,
  Plus,
  RotateCcw,
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

interface CoffeeLayerSortGameProps {
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

interface FlavorDef {
  id: string;
  labelVi: string;
  labelEn: string;
  shortCode: string;
  gradient: string;
  foam: string;
  textColor: string;
}

const FLAVORS: FlavorDef[] = [
  {
    id: 'espresso',
    labelVi: 'Espresso Đậm',
    labelEn: 'Espresso',
    shortCode: 'ES',
    gradient: 'from-[#3B1E0D] via-[#271307] to-[#1A0B03]',
    foam: 'bg-[#A16207]',
    textColor: 'text-amber-200/80',
  },
  {
    id: 'milk',
    labelVi: 'Sữa Tươi',
    labelEn: 'Fresh Milk',
    shortCode: 'MK',
    gradient: 'from-[#FFFBEB] via-[#FEF3C7] to-[#FDE68A]',
    foam: 'bg-white',
    textColor: 'text-amber-900/75',
  },
  {
    id: 'matcha',
    labelVi: 'Matcha Nhật',
    labelEn: 'Matcha',
    shortCode: 'MT',
    gradient: 'from-[#4ADE80] via-[#16A34A] to-[#14532D]',
    foam: 'bg-[#BBF7D0]',
    textColor: 'text-emerald-950/85',
  },
  {
    id: 'caramel',
    labelVi: 'Caramel',
    labelEn: 'Caramel',
    shortCode: 'CR',
    gradient: 'from-[#FB923C] via-[#EA580C] to-[#9A3412]',
    foam: 'bg-[#FED7AA]',
    textColor: 'text-orange-950/85',
  },
  {
    id: 'salted',
    labelVi: 'Kem Muối',
    labelEn: 'Salted Cream',
    shortCode: 'SC',
    gradient: 'from-[#F9A8D4] via-[#EC4899] to-[#9D174D]',
    foam: 'bg-[#FCE7F3]',
    textColor: 'text-pink-950/85',
  },
  {
    id: 'blueberry',
    labelVi: 'Cold Brew Berry',
    labelEn: 'Berry Brew',
    shortCode: 'BR',
    gradient: 'from-[#60A5FA] via-[#2563EB] to-[#1E3A8A]',
    foam: 'bg-[#DBEAFE]',
    textColor: 'text-blue-950/85',
  },
  {
    id: 'pandan',
    labelVi: 'Cốt Dừa Lá Dứa',
    labelEn: 'Pandan',
    shortCode: 'PD',
    gradient: 'from-[#2DD4BF] via-[#0D9488] to-[#115E59]',
    foam: 'bg-[#CCFBF1]',
    textColor: 'text-teal-950/85',
  },
];

const CAPACITY = 4;
const GUEST_STORAGE_KEY = 'roar_layersort_progress_v1';

function isCupUniformComplete(cup: string[]): boolean {
  return cup.length === CAPACITY && cup.every((item) => item === cup[0]);
}

function generateSolvableCups(level: number): string[][] {
  const numColors = Math.min(FLAVORS.length, level === 1 ? 3 : level === 2 ? 4 : level === 3 ? 5 : level <= 5 ? 6 : 7);
  const emptyCups = 2;
  const activeFlavors = FLAVORS.slice(0, numColors).map((f) => f.id);

  // Create shuffled pool guaranteed not to start pre-solved
  let cups: string[][] = [];
  for (let attempt = 0; attempt < 20; attempt++) {
    const pool: string[] = [];
    for (const f of activeFlavors) {
      for (let k = 0; k < CAPACITY; k++) pool.push(f);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    cups = [];
    for (let c = 0; c < numColors; c++) {
      cups.push(pool.slice(c * CAPACITY, (c + 1) * CAPACITY));
    }
    for (let e = 0; e < emptyCups; e++) {
      cups.push([]);
    }
    const anyAlreadySolved = cups.some((cp) => isCupUniformComplete(cp));
    if (!anyAlreadySolved) break;
  }
  return cups;
}

function canPour(src: string[], dst: string[]): boolean {
  if (src.length === 0 || dst.length >= CAPACITY) return false;
  if (isCupUniformComplete(src)) return false;
  if (dst.length === 0) {
    // Avoid trivial endless loop pouring pure cup into empty cup
    const allSame = src.every((x) => x === src[0]);
    if (allSame) return false;
    return true;
  }
  return src[src.length - 1] === dst[dst.length - 1];
}

export const CoffeeLayerSortGame: React.FC<CoffeeLayerSortGameProps> = ({
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
  const minScore = Number(config?.min_score_to_win || 150);
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

  const [initialStageCups, setInitialStageCups] = useState<string[][]>(() => generateSolvableCups(level));
  const [cups, setCups] = useState<string[][]>(() => initialStageCups.map((c) => [...c]));
  const [history, setHistory] = useState<string[][][]>([]);
  const [selectedCup, setSelectedCup] = useState<number | null>(null);
  const [hintPair, setHintPair] = useState<[number, number] | null>(null);
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [extraCupAdded, setExtraCupAdded] = useState(false);
  const [wonStage, setWonStage] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [submitting, setSubmitting] = useState(false);
  const [claimedThisRun, setClaimedThisRun] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const flavorMap = useMemo(() => new Map(FLAVORS.map((f) => [f.id, f])), []);

  const loadLevel = useCallback((targetLevel: number, resetScore = false) => {
    const fresh = generateSolvableCups(targetLevel);
    setLevel(targetLevel);
    setInitialStageCups(fresh);
    setCups(fresh.map((c) => [...c]));
    setHistory([]);
    setSelectedCup(null);
    setHintPair(null);
    setMoves(0);
    setExtraCupAdded(false);
    setWonStage(false);
    setShowFireworks(false);
    if (resetScore) {
      setScore(0);
      setClaimedThisRun(false);
    }
  }, []);

  const restartCurrentStage = () => {
    setCups(initialStageCups.map((c) => [...c]));
    setHistory([]);
    setSelectedCup(null);
    setHintPair(null);
    setMoves(0);
    setExtraCupAdded(false);
    setWonStage(false);
    setShowFireworks(false);
  };

  const handleCupTap = (idx: number) => {
    if (wonStage) return;
    setHintPair(null);

    if (selectedCup === null) {
      if (cups[idx].length === 0) return;
      setSelectedCup(idx);
      gameSound.flip();
      return;
    }

    if (selectedCup === idx) {
      setSelectedCup(null);
      return;
    }

    const src = cups[selectedCup];
    const dst = cups[idx];

    if (!canPour(src, dst)) {
      if (dst.length > 0 && !isCupUniformComplete(dst)) {
        setSelectedCup(idx);
        gameSound.flip();
      } else {
        setSelectedCup(null);
        gameSound.cubeBlocked();
      }
      return;
    }

    // Perform pour of all matching contiguous top layers that fit
    setHistory((prev) => [...prev.slice(-24), cups.map((c) => [...c])]);
    const nextCups = cups.map((c) => [...c]);
    const topFlavor = nextCups[selectedCup][nextCups[selectedCup].length - 1];
    let pouredCount = 0;
    while (
      nextCups[selectedCup].length > 0 &&
      nextCups[idx].length < CAPACITY &&
      nextCups[selectedCup][nextCups[selectedCup].length - 1] === topFlavor
    ) {
      nextCups[idx].push(nextCups[selectedCup].pop()!);
      pouredCount++;
    }

    setCups(nextCups);
    setSelectedCup(null);
    setMoves((m) => m + 1);
    gameSound.liquidPour(nextCups[idx].length);

    const completedJustNow = isCupUniformComplete(nextCups[idx]);
    const gain = pouredCount * 12 + (completedJustNow ? 50 : 0);
    const nextScore = score + gain;
    setScore(nextScore);

    if (completedJustNow) {
      gameSound.tubeComplete();
    }

    // Check stage win (every non-empty cup is uniformly filled to CAPACITY)
    const allSolved = nextCups.every((c) => c.length === 0 || isCupUniformComplete(c));
    if (allSolved) {
      const stageBonus = 80 + level * 25;
      const total = nextScore + stageBonus;
      setScore(total);
      setWonStage(true);
      setShowFireworks(true);
      gameSound.win();
      setBestScore((prev) => {
        const nb = Math.max(prev, total);
        try {
          window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify({ level: level + 1, bestScore: nb }));
        } catch {
          // ignore
        }
        return nb;
      });
      onSaveProgress?.({
        currentLevel: level + 1,
        maxLevel: level + 1,
        bestScore: total,
      });
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || wonStage) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCups(prev);
    setSelectedCup(null);
    gameSound.flip();
  };

  const handleAddExtraCup = () => {
    if (extraCupAdded || wonStage) return;
    setHistory((prev) => [...prev.slice(-24), cups.map((c) => [...c])]);
    setCups((prev) => [...prev, []]);
    setExtraCupAdded(true);
    gameSound.hintChime();
  };

  const handleHint = () => {
    if (wonStage) return;
    for (let i = 0; i < cups.length; i++) {
      for (let j = 0; j < cups.length; j++) {
        if (i !== j && canPour(cups[i], cups[j]) && cups[j].length > 0) {
          setHintPair([i, j]);
          setSelectedCup(i);
          gameSound.hintChime();
          return;
        }
      }
    }
    for (let i = 0; i < cups.length; i++) {
      for (let j = 0; j < cups.length; j++) {
        if (i !== j && canPour(cups[i], cups[j])) {
          setHintPair([i, j]);
          setSelectedCup(i);
          gameSound.hintChime();
          return;
        }
      }
    }
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

  const reachedTarget = score >= minScore;

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-[#0E2430] via-[#102E38] to-[#0A1E1A] border border-[#C6A667]/30 p-3 sm:p-4 text-[#F8F5EF] overflow-hidden shadow-lg">
      {showFireworks && <FireworksOverlay active={showFireworks} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
          <span className="text-xs font-extrabold text-[#FDE68A]">
            LAYER SORT · {isEn ? `Cup Stage ${level}` : `Màn Rót ${level}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-[#C6A667]/30 text-center">
            <div className="text-[10px] uppercase text-white/60">{isEn ? 'Score' : 'Điểm'}</div>
            <div className="text-sm font-black text-[#FDE68A] tabular-nums">{score}</div>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-white/15 text-center">
            <div className="text-[10px] uppercase text-white/60">{isEn ? 'Moves' : 'Bước'}</div>
            <div className="text-sm font-black text-sky-300 tabular-nums">{moves}</div>
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
        </div>
      </div>

      {/* Instructions & Reward Target */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-white/80">
        <span>
          {isEn
            ? 'Tap a glass to pick, then tap another glass to pour matching coffee layers.'
            : 'Chạm chọn 1 ly rồi chạm ly đích để rót các tầng cà phê cùng vị về 1 ly.'}
        </span>
        <span className={`font-bold tabular-nums ${reachedTarget ? 'text-emerald-300' : 'text-[#FDE68A]'}`}>
          {isEn ? `Goal: ${score}/${minScore} pts` : `Mục tiêu quà: ${score}/${minScore} điểm`}
        </span>
      </div>

      {/* Glass Cups Stage */}
      <div className="mt-4 relative min-h-[260px] py-4 px-2 rounded-2xl bg-black/25 border border-white/10 flex flex-wrap items-end justify-center gap-3 sm:gap-5">
        {cups.map((cup, idx) => {
          const isSelected = selectedCup === idx;
          const isComplete = isCupUniformComplete(cup);
          const isHintSrc = hintPair?.[0] === idx;
          const isHintDst = hintPair?.[1] === idx;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCupTap(idx)}
              className={`relative group flex flex-col items-center focus-visible:outline-none cursor-pointer transition-transform duration-200 ${
                isSelected ? '-translate-y-4 scale-105' : 'hover:-translate-y-1'
              }`}
            >
              {/* Status indicator above cup */}
              <div className="h-5 flex items-center justify-center text-[10px] font-extrabold">
                {isComplete ? (
                  <span className="text-emerald-300">✓ {isEn ? 'PURE' : 'CHUẨN'}</span>
                ) : isHintSrc ? (
                  <span className="text-amber-300 animate-bounce">{isEn ? 'PICK' : 'CHỌN'}</span>
                ) : isHintDst ? (
                  <span className="text-sky-300 animate-bounce">{isEn ? 'POUR' : 'RÓT VÀO'}</span>
                ) : null}
              </div>

              {/* Glass Tube */}
              <div
                className={`w-14 sm:w-16 h-40 sm:h-44 rounded-b-3xl rounded-t-lg border-2 p-1 flex flex-col-reverse gap-0.5 bg-white/[0.06] backdrop-blur-xs shadow-inner transition-all ${
                  isSelected
                    ? 'border-[#FDE68A] ring-2 ring-[#FDE68A]/50 shadow-[0_0_20px_rgba(253,230,138,0.35)]'
                    : isComplete
                      ? 'border-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.35)]'
                      : isHintDst
                        ? 'border-sky-400'
                        : 'border-white/30 group-hover:border-white/55'
                }`}
              >
                {cup.map((flavorId, layerIdx) => {
                  const fl = flavorMap.get(flavorId) || FLAVORS[0];
                  const isTop = layerIdx === cup.length - 1;
                  return (
                    <div
                      key={layerIdx}
                      className={`relative w-full h-[23%] rounded-md bg-gradient-to-b ${fl.gradient} flex items-center justify-center overflow-hidden transition-all duration-200`}
                    >
                      {isTop && <div className={`absolute top-0 inset-x-0 h-1 ${fl.foam} opacity-80`} />}
                      <span className={`text-[10px] font-black tracking-tight ${fl.textColor}`}>
                        {fl.shortCode}
                      </span>
                    </div>
                  );
                })}
              </div>
              <span className="mt-1.5 text-[10px] font-mono text-white/45">#{idx + 1}</span>
            </button>
          );
        })}

        {wonStage && (
          <div className="absolute inset-0 rounded-2xl bg-black/80 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center space-y-3 z-20">
            <Trophy className="w-10 h-10 text-[#FDE047]" />
            <div>
              <h4 className="text-lg font-black text-white">
                {isEn ? `Stage ${level} Complete!` : `Hoàn Thành Màn ${level}!`}
              </h4>
              <p className="text-xs text-white/75 mt-1">
                {isEn ? 'Score:' : 'Điểm:'} <span className="font-bold text-[#FDE68A]">{score}</span> ·{' '}
                {isEn ? 'Best:' : 'Kỷ lục:'} <span className="font-bold text-emerald-300">{Math.max(bestScore, score)}</span>
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
                        <span>{submitting ? (isEn ? 'Claiming...' : 'Đang nhận...') : (isEn ? `Claim Free Reward (${remainingFreeToday})` : `Nhận Quà Miễn Phí (${remainingFreeToday})`)}</span>
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
              <button
                type="button"
                onClick={() => loadLevel(level + 1, false)}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-[#111111] font-extrabold text-xs cursor-pointer"
              >
                {isEn ? `Continue Stage ${level + 1}` : `Tiếp Tục Màn ${level + 1}`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          disabled={history.length === 0 || wonStage}
          onClick={handleUndo}
          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Undo2 className="w-3.5 h-3.5 text-sky-300" />
          <span>{isEn ? 'Undo' : 'Hoàn tác'}</span>
        </button>

        <button
          type="button"
          disabled={extraCupAdded || wonStage}
          onClick={handleAddExtraCup}
          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-300" />
          <span>{isEn ? '+1 Cup' : '+1 Ly rỗng'}</span>
        </button>

        <button
          type="button"
          disabled={wonStage}
          onClick={handleHint}
          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
          <span>{isEn ? 'Hint' : 'Gợi ý'}</span>
        </button>

        <button
          type="button"
          onClick={restartCurrentStage}
          className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-300" />
          <span>{isEn ? 'Restart' : 'Xếp lại màn'}</span>
        </button>
      </div>

      {/* Early Reward Claim while progressing */}
      {reachedTarget && !claimedThisRun && !wonStage && (
        <div className="mt-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleClaimReward(remainingFreeToday <= 0)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00552B] to-emerald-600 border border-emerald-300/40 text-white text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FDE68A]" />
            <span>{isEn ? 'Target Reached! Claim ROAR Reward' : 'Đủ Điểm! Bấm Nhận Quà ROAR Ngay'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
