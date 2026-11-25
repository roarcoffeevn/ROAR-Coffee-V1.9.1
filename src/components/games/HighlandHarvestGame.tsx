import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Coins, Gift, Play, RotateCcw, Sparkles } from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { OFFICIAL_LOGOS } from '../../lib/media';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { gameSound } from './RoarGamesSound';

interface FallingItem {
  id: number;
  x: number;
  y: number;
  vy: number;
  kind: 'red_cherry' | 'golden_bean' | 'green_cherry' | 'twig';
  radius: number;
}

interface HighlandHarvestGameProps {
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

const CANVAS_W = 540;
const CANVAS_H = 360;
const BASKET_W = 84;
const BASKET_H = 28;
const ROUND_SECONDS = 25;

export const HighlandHarvestGame: React.FC<HighlandHarvestGameProps> = ({
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
  const [level, setLevel] = useState<number>(() => {
    try {
      const local = Number(window.localStorage.getItem('roar_harvest_level_v1') || 1);
      return Math.max(1, savedProgress?.current_level || local);
    } catch {
      return Math.max(1, savedProgress?.current_level || 1);
    }
  });
  const baseTarget = config?.min_score_to_win || 180;
  const targetScore = baseTarget + (level - 1) * 40;
  const costPts = config?.extra_play_cost_points || 20;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [claimed, setClaimed] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (savedProgress && savedProgress.current_level > level) {
      setLevel(savedProgress.current_level);
    }
  }, [savedProgress]);

  const basketXRef = useRef((CANVAS_W - BASKET_W) / 2);
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const itemsRef = useRef<FallingItem[]>([]);
  const scoreRef = useRef(0);
  const timeRef = useRef(ROUND_SECONDS);
  const nextSpawnRef = useRef(0);
  const itemSeqRef = useRef(1);
  const phaseRef = useRef<'ready' | 'playing' | 'ended'>('ready');
  const logoCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = OFFICIAL_LOGOS.vertical;
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = 140;
      off.height = 140;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.drawImage(img, 0, 0, 140, 140);
      octx.globalCompositeOperation = 'source-in';
      octx.fillStyle = '#C6A667';
      octx.fillRect(0, 0, 140, 140);
      logoCanvasRef.current = off;
    };
  }, []);

  const drawScene = useCallback((ctx: CanvasRenderingContext2D) => {
    // Highland sky & warm coffee ground gradient
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, '#0E2419');
    grad.addColorStop(0.75, '#133122');
    grad.addColorStop(1, '#2D1E14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Subtle mountain silhouette
    ctx.fillStyle = 'rgba(198, 166, 103, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, 290);
    ctx.lineTo(130, 210);
    ctx.lineTo(270, 265);
    ctx.lineTo(410, 195);
    ctx.lineTo(CANVAS_W, 270);
    ctx.lineTo(CANVAS_W, 360);
    ctx.lineTo(0, 360);
    ctx.closePath();
    ctx.fill();

    // Subtle ROAR COFFEE official logo watermark in sky
    if (logoCanvasRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(logoCanvasRef.current, CANVAS_W / 2 - 42, 42, 84, 84);
      ctx.restore();
    }

    // Draw falling cherries & beans
    for (const item of itemsRef.current) {
      ctx.save();
      ctx.translate(item.x, item.y);
      if (item.kind === 'red_cherry') {
        ctx.fillStyle = '#D93829';
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.arc(-4, -4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#62B665';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -item.radius);
        ctx.lineTo(4, -item.radius - 7);
        ctx.stroke();
      } else if (item.kind === 'golden_bean') {
        ctx.fillStyle = '#C6A667';
        ctx.beginPath();
        ctx.ellipse(0, 0, item.radius + 2, item.radius - 2, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3B2314';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, -4);
        ctx.quadraticCurveTo(0, 2, 6, 4);
        ctx.stroke();
      } else if (item.kind === 'green_cherry') {
        ctx.fillStyle = '#4B7F52';
        ctx.beginPath();
        ctx.arc(0, 0, item.radius - 1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // twig obstacle
        ctx.rotate(0.45);
        ctx.fillStyle = '#6B4423';
        ctx.fillRect(-13, -4, 26, 8);
      }
      ctx.restore();
    }

    // Draw rattan harvest basket with ROAR COFFEE crest
    const bx = basketXRef.current;
    const by = CANVAS_H - 42;
    ctx.fillStyle = '#C6A667';
    ctx.beginPath();
    ctx.roundRect(bx, by, BASKET_W, BASKET_H, [4, 4, 12, 12]);
    ctx.fill();
    ctx.strokeStyle = '#5C4018';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#111111';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROAR COFFEE', bx + BASKET_W / 2, by + 18);
  }, []);

  const startRound = () => {
    itemsRef.current = [];
    scoreRef.current = 0;
    timeRef.current = ROUND_SECONDS;
    nextSpawnRef.current = 0;
    basketXRef.current = (CANVAS_W - BASKET_W) / 2;
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setClaimed(false);
    phaseRef.current = 'playing';
    setPhase('playing');
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastTs = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;

      if (phaseRef.current === 'playing') {
        // Move basket
        const speed = 380;
        if (keysRef.current.left) basketXRef.current = Math.max(8, basketXRef.current - speed * dt);
        if (keysRef.current.right) basketXRef.current = Math.min(CANVAS_W - BASKET_W - 8, basketXRef.current + speed * dt);

        // Countdown
        timeRef.current = Math.max(0, timeRef.current - dt);
        setTimeLeft(Math.ceil(timeRef.current));
        if (timeRef.current <= 0) {
          phaseRef.current = 'ended';
          setPhase('ended');
          if (scoreRef.current >= targetScore) {
            gameSound.victoryFanfare();
            const nextLvl = level + 1;
            setLevel(nextLvl);
            try {
              window.localStorage.setItem('roar_harvest_level_v1', String(nextLvl));
            } catch {
              // ignore
            }
            onSaveProgress?.({
              currentLevel: nextLvl,
              maxLevel: Math.max(savedProgress?.max_level || 1, nextLvl),
              bestScore: Math.max(savedProgress?.best_score || 0, scoreRef.current),
            });
          }
        }

        // Spawn falling items
        nextSpawnRef.current -= dt;
        if (nextSpawnRef.current <= 0) {
          nextSpawnRef.current = 0.36 + Math.random() * 0.28;
          const r = Math.random();
          const kind: FallingItem['kind'] =
            r < 0.56 ? 'red_cherry' : r < 0.78 ? 'golden_bean' : r < 0.9 ? 'green_cherry' : 'twig';
          itemsRef.current.push({
            id: itemSeqRef.current++,
            x: 24 + Math.random() * (CANVAS_W - 48),
            y: -18,
            vy: 155 + Math.random() * 115,
            kind,
            radius: kind === 'golden_bean' ? 14 : 13,
          });
        }

        // Advance & catch detection
        const byTop = CANVAS_H - 42;
        const bxLeft = basketXRef.current - 6;
        const bxRight = basketXRef.current + BASKET_W + 6;
        const remaining: FallingItem[] = [];

        for (const item of itemsRef.current) {
          item.y += item.vy * dt;
          const hitBasket =
            item.y + item.radius >= byTop &&
            item.y - item.radius <= byTop + BASKET_H &&
            item.x >= bxLeft &&
            item.x <= bxRight;

          if (hitBasket) {
            if (item.kind === 'red_cherry') {
              scoreRef.current += 10;
              gameSound.catchGood();
            } else if (item.kind === 'golden_bean') {
              scoreRef.current += 25;
              gameSound.catchGolden();
            } else if (item.kind === 'green_cherry') {
              scoreRef.current = Math.max(0, scoreRef.current - 10);
              gameSound.catchBad();
            } else {
              scoreRef.current = Math.max(0, scoreRef.current - 20);
              gameSound.catchBad();
            }
            setScore(scoreRef.current);
            continue;
          }
          if (item.y < CANVAS_H + 30) {
            remaining.push(item);
          }
        }
        itemsRef.current = remaining;
      }

      drawScene(ctx);
      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [drawScene, targetScore]);

  const handlePointerMove = (clientX: number) => {
    if (phaseRef.current !== 'playing' || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const localX = (clientX - rect.left) * scaleX;
    basketXRef.current = Math.max(8, Math.min(CANVAS_W - BASKET_W - 8, localX - BASKET_W / 2));
  };

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
  const reachedGoal = score >= targetScore;

  return (
    <div className="space-y-2.5 sm:space-y-4">
      {/* HUD */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 text-[11px] sm:text-xs font-bold tabular-nums">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <AdaptiveLogo variant="horizontal" surface="auto" darkTone="gold" size="2xs" className="hidden sm:inline-flex shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-[#00552B] text-white text-[10px] font-extrabold whitespace-nowrap">
            {lang === 'en' ? `Lv.${level}` : `Màn ${level}`}
          </span>
          <span className="whitespace-nowrap">
            <span className="hidden sm:inline">{lang === 'en' ? 'Score:' : 'Điểm:'} </span>
            <strong className={reachedGoal ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#111111] dark:text-white'}>
              {score}
            </strong>
            /{targetScore}
          </span>
          <span className="whitespace-nowrap">
            <strong className={timeLeft <= 5 && phase === 'playing' ? 'text-red-500' : ''}>{timeLeft}s</strong>
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 whitespace-nowrap shrink-0">
          🔴+10 🟡+25 🪵-20
        </div>
      </div>

      {/* Canvas Arena */}
      <div className="relative rounded-2xl overflow-hidden border border-[#C6A667]/35 shadow-inner bg-[#0E2419] max-w-[540px] mx-auto">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onTouchMove={(e) => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
          }}
          className="w-full h-auto block touch-none cursor-ew-resize"
        />

        {phase === 'ready' && (
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 sm:p-6 text-center text-white">
            <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" className="mb-1.5 sm:mb-2" />
            <h4 className="font-serif text-base sm:text-xl font-bold mb-1">
              {lang === 'en' ? 'Highland Cherry Harvest' : 'Thu Hoạch Quả Chín Tây Nguyên'}
            </h4>
            <p className="text-[11px] sm:text-xs text-white/85 max-w-sm mb-2.5 sm:mb-4 line-clamp-2 sm:line-clamp-none">
              {lang === 'en'
                ? `Catch ripe cherries (+10) & golden beans (+25). Reach ${targetScore}+ pts in ${ROUND_SECONDS}s!`
                : `Hứng quả đỏ (+10) & hạt vàng (+25). Đạt ${targetScore}+ điểm trong ${ROUND_SECONDS}s để nhận quà!`}
            </p>
            <button
              type="button"
              onClick={startRound}
              className="px-4 py-2 sm:px-6 sm:py-3 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-lg cursor-pointer min-h-[40px] sm:min-h-[44px]"
            >
              <Play className="w-4 h-4 text-[#C6A667]" />
              <span>{lang === 'en' ? 'Start 25s Sprint' : 'Bắt Đầu Hứng Hạt'}</span>
            </button>
          </div>
        )}

        {phase === 'ended' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center p-3 sm:p-6 text-center text-white">
            <AdaptiveLogo variant="horizontal" surface="dark" darkTone="gold" size="2xs" className="mb-1.5" />
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#C6A667] mb-0.5 sm:mb-1">
              {reachedGoal
                ? lang === 'en'
                  ? 'HARVEST GOAL ACHIEVED'
                  : 'ĐẠT CHỈ TIÊU THU HOẠCH'
                : lang === 'en'
                  ? 'ALMOST THERE'
                  : 'CHƯA ĐỦ CHỈ TIÊU'}
            </div>
            <div className="font-serif text-2xl sm:text-3xl font-bold tabular-nums mb-0.5 sm:mb-1">{score} pts</div>
            <p className="text-[11px] sm:text-xs text-white/80 mb-2.5 sm:mb-4 line-clamp-2 sm:line-clamp-none">
              {reachedGoal
                ? lang === 'en'
                  ? `You cleared ${targetScore} pts! Claim your reward now.`
                  : `Vượt mốc ${targetScore} điểm! Nhận phần thưởng ngay.`
                : lang === 'en'
                  ? `Need ${targetScore} pts. Try again free!`
                  : `Cần ${targetScore}+ điểm để mở quà. Thử lại miễn phí!`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {reachedGoal && !claimed && (
                !isSignedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleClaim(false)}
                      className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#C6A667] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{lang === 'en' ? 'Preview Prize' : 'Xem Thử Quà'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onRequireLogin}
                      className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer"
                    >
                      {lang === 'en' ? 'Sign In to Claim' : 'Đăng nhập Nhận Quà'}
                    </button>
                  </>
                ) : canFree ? (
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() => handleClaim(false)}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{claiming ? '...' : lang === 'en' ? 'Claim Reward' : 'Nhận Quà Mùa Vụ'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={claiming || userPoints < costPts}
                    onClick={() => handleClaim(true)}
                    className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#C6A667] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Coins className="w-4 h-4" />
                    <span>{lang === 'en' ? `Claim (-${costPts} pts)` : `Nhận Quà (-${costPts} điểm)`}</span>
                  </button>
                )
              )}
              <button
                type="button"
                onClick={startRound}
                className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Play Again' : 'Chơi Lại'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls */}
      <div className="flex items-center justify-center gap-4 sm:hidden">
        <button
          type="button"
          onTouchStart={() => { keysRef.current.left = true; }}
          onTouchEnd={() => { keysRef.current.left = false; }}
          onMouseDown={() => { keysRef.current.left = true; }}
          onMouseUp={() => { keysRef.current.left = false; }}
          className="w-24 h-11 rounded-xl bg-[#00552B] text-white flex items-center justify-center active:scale-95 touch-manipulation select-none"
          aria-label="Move Left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          type="button"
          onTouchStart={() => { keysRef.current.right = true; }}
          onTouchEnd={() => { keysRef.current.right = false; }}
          onMouseDown={() => { keysRef.current.right = true; }}
          onMouseUp={() => { keysRef.current.right = false; }}
          className="w-24 h-11 rounded-xl bg-[#00552B] text-white flex items-center justify-center active:scale-95 touch-manipulation select-none"
          aria-label="Move Right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
