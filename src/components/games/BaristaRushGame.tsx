import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Clock,
  Coffee,
  Coins,
  Flame,
  Gift,
  Music,
  Play,
  RotateCcw,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { FireworksOverlay } from './FireworksOverlay';
import { gameSound } from './RoarGamesSound';

interface BaristaRushGameProps {
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

type IngredientId =
  | 'ice'
  | 'espresso'
  | 'coldbrew'
  | 'milk'
  | 'condensed'
  | 'saltedcream'
  | 'matcha'
  | 'caramel'
  | 'citrus';

interface IngredientSpec {
  id: IngredientId;
  nameVi: string;
  nameEn: string;
  icon: string;
  layerBg: string;
  btnClass: string;
}

const INGREDIENTS: IngredientSpec[] = [
  { id: 'ice', nameVi: 'Đá Viên', nameEn: 'Ice', icon: '🧊', layerBg: 'bg-sky-200/85 text-sky-950', btnClass: 'bg-sky-500/20 border-sky-400/40 text-sky-100 hover:bg-sky-500/35' },
  { id: 'espresso', nameVi: 'Espresso', nameEn: 'Espresso', icon: '☕', layerBg: 'bg-[#3B1E0D] text-amber-100', btnClass: 'bg-amber-900/50 border-amber-500/40 text-amber-100 hover:bg-amber-800/60' },
  { id: 'coldbrew', nameVi: 'Cold Brew', nameEn: 'Cold Brew', icon: '🥃', layerBg: 'bg-[#5A2D0C] text-amber-100', btnClass: 'bg-orange-900/45 border-orange-400/40 text-orange-100 hover:bg-orange-800/60' },
  { id: 'milk', nameVi: 'Sữa Tươi', nameEn: 'Fresh Milk', icon: '🥛', layerBg: 'bg-[#FEF9C3] text-amber-950', btnClass: 'bg-yellow-100/20 border-yellow-200/40 text-yellow-50 hover:bg-yellow-100/30' },
  { id: 'condensed', nameVi: 'Sữa Đặc', nameEn: 'Cond. Milk', icon: '🍯', layerBg: 'bg-[#FDE68A] text-amber-950', btnClass: 'bg-amber-400/20 border-amber-300/45 text-amber-100 hover:bg-amber-400/35' },
  { id: 'saltedcream', nameVi: 'Kem Muối', nameEn: 'Salted Cream', icon: '🧁', layerBg: 'bg-pink-200 text-pink-950', btnClass: 'bg-pink-500/20 border-pink-400/40 text-pink-100 hover:bg-pink-500/35' },
  { id: 'matcha', nameVi: 'Matcha', nameEn: 'Matcha', icon: '🍵', layerBg: 'bg-emerald-500 text-emerald-950', btnClass: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/35' },
  { id: 'caramel', nameVi: 'Caramel', nameEn: 'Caramel', icon: '🍮', layerBg: 'bg-orange-500 text-orange-950', btnClass: 'bg-orange-500/20 border-orange-400/40 text-orange-100 hover:bg-orange-500/35' },
  { id: 'citrus', nameVi: 'Cam Sả', nameEn: 'Citrus', icon: '🍊', layerBg: 'bg-amber-400 text-amber-950', btnClass: 'bg-amber-500/20 border-amber-400/40 text-amber-100 hover:bg-amber-500/35' },
];

interface RecipeSpec {
  id: string;
  nameVi: string;
  nameEn: string;
  steps: IngredientId[];
  basePts: number;
}

const RECIPES: RecipeSpec[] = [
  { id: 'iced_espresso', nameVi: 'Espresso Đá', nameEn: 'Iced Espresso', steps: ['ice', 'espresso'], basePts: 40 },
  { id: 'bac_xiu', nameVi: 'Bạc Xỉu ROAR', nameEn: 'ROAR Bac Xiu', steps: ['condensed', 'ice', 'milk', 'espresso'], basePts: 68 },
  { id: 'salted_coffee', nameVi: 'Cà Phê Muối', nameEn: 'Salted Cream Coffee', steps: ['espresso', 'ice', 'saltedcream'], basePts: 58 },
  { id: 'iced_latte', nameVi: 'Latte Sữa Tươi', nameEn: 'Iced Latte', steps: ['ice', 'milk', 'espresso'], basePts: 54 },
  { id: 'caramel_macchiato', nameVi: 'Caramel Macchiato', nameEn: 'Caramel Macchiato', steps: ['milk', 'espresso', 'caramel'], basePts: 60 },
  { id: 'matcha_espresso', nameVi: 'Matcha Espresso', nameEn: 'Matcha Espresso', steps: ['ice', 'milk', 'matcha', 'espresso'], basePts: 72 },
  { id: 'coldbrew_citrus', nameVi: 'Cold Brew Cam Sả', nameEn: 'Citrus Cold Brew', steps: ['ice', 'citrus', 'coldbrew'], basePts: 62 },
  { id: 'phin_sua', nameVi: 'Nâu Đá Truyền Thống', nameEn: 'Iced Cond. Milk', steps: ['condensed', 'espresso', 'ice'], basePts: 56 },
];

const CUSTOMER_PERSONAS = [
  { avatar: '🦊', nameVi: 'Khách Sành Espresso', nameEn: 'Espresso Connoisseur' },
  { avatar: '🐯', nameVi: 'Team Deadline', nameEn: 'Deadline Sprinter' },
  { avatar: '🦁', nameVi: 'Doanh Nhân ROAR', nameEn: 'ROAR Executive' },
  { avatar: '🦉', nameVi: 'Designer Đêm', nameEn: 'Night Designer' },
  { avatar: '🐆', nameVi: 'Khách VIP Reserve', nameEn: 'Reserve VIP' },
];

interface CustomerTicket {
  uid: number;
  persona: (typeof CUSTOMER_PERSONAS)[number];
  recipe: RecipeSpec;
  patienceMax: number;
  patienceLeft: number;
}

const ROUND_SECONDS = 50;
const GUEST_STORAGE_KEY = 'roar_baristarush_best_v1';

export const BaristaRushGame: React.FC<BaristaRushGameProps> = ({
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

  const [phase, setPhase] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState<number>(() => {
    try {
      const local = Number(window.localStorage.getItem(GUEST_STORAGE_KEY) || 0);
      return Math.max(local, Number(savedProgress?.best_score || 0));
    } catch {
      return Number(savedProgress?.best_score || 0);
    }
  });
  const [servedCount, setServedCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tickets, setTickets] = useState<CustomerTicket[]>([]);
  const [activeTicketIdx, setActiveTicketIdx] = useState(0);
  const [cupLayers, setCupLayers] = useState<IngredientId[]>([]);
  const [feedbackBanner, setFeedbackBanner] = useState<{ text: string; tone: 'good' | 'bad' } | null>(null);
  const [muted, setMuted] = useState(gameSound.muted);
  const [lofiOn, setLofiOn] = useState(gameSound.lofiActive);
  const [submitting, setSubmitting] = useState(false);
  const [claimedThisRun, setClaimedThisRun] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  const nextTicketIdRef = useRef(1);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  const ingMap = useMemo(() => new Map(INGREDIENTS.map((i) => [i.id, i])), []);

  const createRandomTicket = useCallback((): CustomerTicket => {
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const persona = CUSTOMER_PERSONAS[Math.floor(Math.random() * CUSTOMER_PERSONAS.length)];
    const patience = 15 + recipe.steps.length * 2.2;
    return {
      uid: nextTicketIdRef.current++,
      persona,
      recipe,
      patienceMax: patience,
      patienceLeft: patience,
    };
  }, []);

  const startRound = useCallback(() => {
    setPhase('playing');
    setTimeLeft(ROUND_SECONDS);
    setScore(0);
    setServedCount(0);
    setCombo(0);
    setCupLayers([]);
    setFeedbackBanner(null);
    setClaimedThisRun(false);
    setShowFireworks(false);
    setActiveTicketIdx(0);
    setTickets([createRandomTicket(), createRandomTicket(), createRandomTicket()]);
    gameSound.flip();
  }, [createRandomTicket]);

  // Countdown + Patience Loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const iv = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setPhase('ended');
          const finalScore = scoreRef.current;
          if (finalScore >= minScore) {
            setShowFireworks(true);
            gameSound.win();
          } else {
            gameSound.gameOver();
          }
          setBestScore((b) => {
            const nb = Math.max(b, finalScore);
            try {
              window.localStorage.setItem(GUEST_STORAGE_KEY, String(nb));
            } catch {
              // ignore
            }
            return nb;
          });
          onSaveProgress?.({
            currentLevel: Math.max(1, Math.floor(finalScore / 150) + 1),
            maxLevel: Math.max(1, Math.floor(finalScore / 150) + 1),
            bestScore: finalScore,
          });
          return 0;
        }
        return prev - 1;
      });

      setTickets((prevTickets) =>
        prevTickets.map((tk) => {
          const nextPat = tk.patienceLeft - 1;
          if (nextPat <= 0) {
            setCombo(0);
            return createRandomTicket();
          }
          return { ...tk, patienceLeft: nextPat };
        })
      );
    }, 1000);
    return () => window.clearInterval(iv);
  }, [createRandomTicket, minScore, onSaveProgress, phase]);

  const activeTicket = tickets[activeTicketIdx] || tickets[0] || null;

  const flashFeedback = (text: string, tone: 'good' | 'bad') => {
    setFeedbackBanner({ text, tone });
    window.setTimeout(() => {
      setFeedbackBanner((cur) => (cur?.text === text ? null : cur));
    }, 950);
  };

  const handleAddIngredient = (ingId: IngredientId) => {
    if (phase !== 'playing' || !activeTicket) return;
    if (cupLayers.length >= 6) return;
    gameSound.liquidPour(cupLayers.length + 1);
    setCupLayers((prev) => [...prev, ingId]);
  };

  const handleServeDrink = useCallback(() => {
    if (phase !== 'playing' || !activeTicket || cupLayers.length === 0) return;
    const expected = activeTicket.recipe.steps;
    const exactMatch =
      cupLayers.length === expected.length &&
      cupLayers.every((id, idx) => id === expected[idx]);

    if (exactMatch) {
      const nextCombo = combo + 1;
      const tipBonus = Math.round((activeTicket.patienceLeft / activeTicket.patienceMax) * 20);
      const comboBonus = Math.min(nextCombo - 1, 5) * 14;
      const earned = activeTicket.recipe.basePts + tipBonus + comboBonus;
      setScore((s) => s + earned);
      setServedCount((c) => c + 1);
      setCombo(nextCombo);
      gameSound.baristaServe(nextCombo);
      flashFeedback(
        isEn ? `PERFECT! +${earned} pts${nextCombo >= 2 ? ` (${nextCombo}x)` : ''}` : `CHUẨN GU! +${earned}đ${nextCombo >= 2 ? ` (Combo x${nextCombo})` : ''}`,
        'good'
      );

      // Replace served ticket
      setTickets((prev) => {
        const copy = [...prev];
        copy[activeTicketIdx] = createRandomTicket();
        return copy;
      });
      setCupLayers([]);
    } else {
      setCombo(0);
      gameSound.baristaWrong();
      flashFeedback(
        isEn ? 'Wrong recipe order! Remaking...' : 'Sai thứ tự công thức! Làm lại ly mới nhé!',
        'bad'
      );
      setCupLayers([]);
    }
  }, [activeTicket, activeTicketIdx, combo, createRandomTicket, cupLayers, isEn, phase]);

  const handleTrashCup = () => {
    if (cupLayers.length === 0) return;
    setCupLayers([]);
    gameSound.flip();
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
    <div className="relative rounded-2xl bg-gradient-to-b from-[#2A1910] via-[#1B110B] to-[#0F1B14] border border-[#C6A667]/35 p-3 sm:p-4 text-[#F8F5EF] overflow-hidden shadow-lg">
      {showFireworks && <FireworksOverlay active={showFireworks} />}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" />
          <span className="text-xs font-extrabold text-[#FDE68A]">GOOD BARISTA RUSH</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-2.5 py-1 rounded-lg border text-center ${timeLeft <= 10 && phase === 'playing' ? 'bg-red-500/25 border-red-400/60 animate-pulse' : 'bg-black/35 border-white/15'}`}>
            <div className="text-[10px] uppercase text-white/60 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{isEn ? 'Time' : 'Giờ'}</span>
            </div>
            <div className="text-sm font-black text-white tabular-nums">{timeLeft}s</div>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-black/35 border border-[#C6A667]/30 text-center">
            <div className="text-[10px] uppercase text-white/60">{isEn ? 'Score' : 'Doanh thu'}</div>
            <div className="text-sm font-black text-[#FDE68A] tabular-nums">{score}</div>
          </div>

          {combo >= 2 && (
            <div className="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400/45 text-amber-300 text-xs font-black flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>x{combo}</span>
            </div>
          )}

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

      {phase === 'ready' ? (
        <div className="py-10 px-4 text-center space-y-5">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-[#C6A667]/20 border border-[#C6A667]/45 flex items-center justify-center text-3xl shadow-lg">
            ☕
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="font-serif text-xl font-bold text-white">
              {isEn ? '50-Second Barista Shift!' : 'Ca Pha Chế Thần Tốc 50 Giây!'}
            </h3>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              {isEn
                ? `Tap ingredients from bottom-to-top matching each customer's order ticket, then hit Serve! Reach ${minScore}+ pts to unlock ROAR gifts.`
                : `Chọn đúng thứ tự nguyên liệu từ đáy ly lên miệng ly theo phiếu gọi món của khách, sau đó bấm Giao Ly! Đạt ${minScore}+ điểm để mở quà ROAR.`}
            </p>
          </div>
          <button
            type="button"
            onClick={startRound}
            className="px-6 py-3 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] font-extrabold text-sm inline-flex items-center gap-2 shadow-lg cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isEn ? 'Open Bar Counter' : 'Mở Quầy Pha Chế Ngay'}</span>
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Customer Queue Tickets */}
          <div className="grid grid-cols-3 gap-2">
            {tickets.map((tk, idx) => {
              const selected = idx === activeTicketIdx;
              const pct = Math.max(0, Math.round((tk.patienceLeft / tk.patienceMax) * 100));
              return (
                <button
                  key={tk.uid}
                  type="button"
                  onClick={() => {
                    setActiveTicketIdx(idx);
                    gameSound.tick();
                  }}
                  className={`p-2 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#C6A667]/20 border-[#FDE68A] ring-1 ring-[#FDE68A]/50 shadow-sm'
                      : 'bg-black/30 border-white/10 hover:border-white/25 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base leading-none">{tk.persona.avatar}</span>
                    <span className="text-[10px] font-bold text-[#FDE68A] tabular-nums">+{tk.recipe.basePts}</span>
                  </div>
                  <div className="text-[11px] font-extrabold text-white mt-1 truncate">
                    {isEn ? tk.recipe.nameEn : tk.recipe.nameVi}
                  </div>
                  {/* Patience bar */}
                  <div className="mt-1.5 h-1 rounded-full bg-white/15 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        pct > 50 ? 'bg-emerald-400' : pct > 25 ? 'bg-amber-400' : 'bg-red-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Order Recipe Strip + Live Cup Preview + Ingredient Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-[190px_minmax(0,1fr)] gap-3 items-stretch">
            {/* Center Mixing Cup */}
            <div className="rounded-2xl bg-black/35 border border-white/12 p-3 flex flex-col items-center justify-between gap-2.5 relative">
              {feedbackBanner && (
                <div
                  className={`absolute top-2 inset-x-2 z-20 px-2 py-1 rounded-lg text-[11px] font-extrabold text-center shadow ${
                    feedbackBanner.tone === 'good' ? 'bg-emerald-500 text-[#0B1F14]' : 'bg-rose-500 text-white'
                  }`}
                >
                  {feedbackBanner.text}
                </div>
              )}

              <div className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                {isEn ? 'Mixing Cup' : 'Ly Đang Pha'}
              </div>

              {/* Glass Cup Visual */}
              <div className="w-24 h-36 rounded-b-3xl rounded-t-lg border-2 border-white/40 bg-white/[0.06] p-1.5 flex flex-col-reverse gap-1 shadow-inner">
                {cupLayers.length === 0 ? (
                  <div className="m-auto text-[11px] text-white/35 text-center leading-tight">
                    {isEn ? 'Tap items\nbelow' : 'Chạm món\nbên phải'}
                  </div>
                ) : (
                  cupLayers.map((id, idx) => {
                    const spec = ingMap.get(id)!;
                    return (
                      <div
                        key={idx}
                        className={`w-full h-[22%] rounded-md ${spec.layerBg} px-1.5 flex items-center justify-between text-[10px] font-extrabold shadow-xs`}
                      >
                        <span>{spec.icon}</span>
                        <span className="truncate">{isEn ? spec.nameEn : spec.nameVi}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="w-full grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={handleTrashCup}
                  disabled={phase !== 'playing' || cupLayers.length === 0}
                  className="py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/85 text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Clear' : 'Đổ'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleServeDrink}
                  disabled={phase !== 'playing' || cupLayers.length === 0}
                  className="py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0B1F14] text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Serve' : 'Giao Ly'}</span>
                </button>
              </div>
            </div>

            {/* Right: Recipe Guide + 9 Ingredients Grid */}
            <div className="space-y-2.5 flex flex-col justify-between">
              {activeTicket && (
                <div className="p-2.5 rounded-xl bg-black/30 border border-[#C6A667]/30 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold text-[#FDE68A] inline-flex items-center gap-1.5">
                      <Coffee className="w-3.5 h-3.5" />
                      <span>
                        {isEn ? activeTicket.recipe.nameEn : activeTicket.recipe.nameVi}
                      </span>
                    </span>
                    <span className="text-[11px] text-white/65">
                      {isEn ? 'Bottom → Top' : 'Đáy ly → Miệng ly'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeTicket.recipe.steps.map((stepId, idx) => {
                      const spec = ingMap.get(stepId)!;
                      const doneCorrect = cupLayers[idx] === stepId;
                      return (
                        <div
                          key={idx}
                          className={`px-2 py-1 rounded-md border text-[11px] font-bold inline-flex items-center gap-1 ${
                            doneCorrect
                              ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                              : 'bg-white/10 border-white/15 text-white/85'
                          }`}
                        >
                          <span>{idx + 1}.</span>
                          <span>{spec.icon}</span>
                          <span>{isEn ? spec.nameEn : spec.nameVi}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                {INGREDIENTS.map((ing) => (
                  <button
                    key={ing.id}
                    type="button"
                    disabled={phase !== 'playing'}
                    onClick={() => handleAddIngredient(ing.id)}
                    className={`p-2.5 rounded-xl border text-center transition-transform active:scale-95 cursor-pointer disabled:opacity-45 ${ing.btnClass}`}
                  >
                    <div className="text-xl leading-none">{ing.icon}</div>
                    <div className="text-[11px] font-bold mt-1 truncate">
                      {isEn ? ing.nameEn : ing.nameVi}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ended Overlay */}
      {phase === 'ended' && (
        <div className="absolute inset-0 z-30 bg-black/82 backdrop-blur-xs flex flex-col items-center justify-center p-5 text-center space-y-4">
          <Trophy className="w-11 h-11 text-[#FDE047]" />
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#C6A667]">
              {isEn ? 'Shift Complete!' : 'Hết Ca Pha Chế!'}
            </div>
            <div className="text-3xl font-black text-white mt-1 tabular-nums">{score}</div>
            <div className="text-xs text-white/75 mt-1">
              {isEn ? `Served ${servedCount} drinks · Best ${Math.max(bestScore, score)}` : `Đã phục vụ ${servedCount} ly · Kỷ lục ${Math.max(bestScore, score)}`}
            </div>
          </div>

          <div className="w-full max-w-[270px] space-y-2">
            {reachedTarget && !claimedThisRun ? (
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
                  {isEn ? 'Preview Reward Draw' : 'Xem Thử Quà'}
                </button>
              </>
            ) : !reachedTarget ? (
              <p className="text-xs text-amber-200/85">
                {isEn
                  ? `Reach ${minScore} points to unlock real ROAR rewards!`
                  : `Cần đạt ${minScore} điểm để mở khóa nhận quà ROAR nhé!`}
              </p>
            ) : null}

            <button
              type="button"
              onClick={startRound}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-[#111111] font-extrabold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isEn ? 'Play New Shift' : 'Chơi Ca Mới'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
