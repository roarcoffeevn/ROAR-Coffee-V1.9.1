import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Coins, Gift, RefreshCw, Smartphone, Sparkles, Volume2, VolumeX, Zap } from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { gameSound } from './RoarGamesSound';

interface ShakePhoneGameProps {
  lang: 'vi' | 'en';
  config: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  onPlayReal: (useExtraPoints: boolean) => Promise<any>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

type ShakePhase = 'READY' | 'SHAKING' | 'COMPLETE';

export const ShakePhoneGame: React.FC<ShakePhoneGameProps> = ({
  lang,
  config,
  rewards,
  remainingFreeToday,
  isSignedIn,
  userPoints,
  onPlayReal,
  onRequireLogin,
  onDemoResult,
}) => {
  const [phase, setPhase] = useState<ShakePhase>('READY');
  const [energy, setEnergy] = useState(0);
  const [wobbleTick, setWobbleTick] = useState(0);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionSupported, setMotionSupported] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);
  const [holding, setHolding] = useState(false);

  const energyRef = useRef(0);
  const busyRef = useRef(false);
  const lastMotionRef = useRef(0);
  const holdTimerRef = useRef<number | null>(null);

  const activeRewards = rewards.filter((r) => r.active && (r.stock_total < 0 || r.stock_remaining > 0));
  const canFree = remainingFreeToday > 0;
  const costPts = Math.max(1, Number(config.extra_play_cost_points || 20));

  useEffect(() => {
    setMotionSupported(typeof window !== 'undefined' && 'DeviceMotionEvent' in window);
    return () => {
      if (holdTimerRef.current) window.clearInterval(holdTimerRef.current);
    };
  }, []);

  const triggerOutcome = useCallback(
    async (useExtraPoints: boolean) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setPhase('COMPLETE');

      try {
        if (!isSignedIn) {
          const fallbackPool = activeRewards.length > 0 ? activeRewards : rewards;
          const totalW = fallbackPool.reduce((acc, r) => acc + Math.max(1, Number(r.weight || 1)), 0);
          let roll = Math.random() * totalW;
          let picked = fallbackPool[0];
          for (const r of fallbackPool) {
            roll -= Math.max(1, Number(r.weight || 1));
            if (roll <= 0) {
              picked = r;
              break;
            }
          }
          gameSound.win();
          if (picked) onDemoResult(picked);
        } else {
          const res = await onPlayReal(useExtraPoints);
          if (res?.won) {
            gameSound.win();
          }
        }
      } finally {
        window.setTimeout(() => {
          busyRef.current = false;
        }, 600);
      }
    },
    [activeRewards, isSignedIn, onDemoResult, onPlayReal, rewards]
  );

  const addEnergyImpulse = useCallback(
    (amount: number) => {
      if (busyRef.current || phase === 'COMPLETE') return;
      if (isSignedIn && !canFree && userPoints < costPts) return;

      const next = Math.min(100, energyRef.current + amount);
      energyRef.current = next;
      setEnergy(next);
      setPhase(next >= 100 ? 'COMPLETE' : 'SHAKING');
      setWobbleTick((t) => t + 1);
      gameSound.rattle();

      if (next >= 100) {
        if (holdTimerRef.current) {
          window.clearInterval(holdTimerRef.current);
          holdTimerRef.current = null;
        }
        setHolding(false);
        triggerOutcome(isSignedIn && !canFree);
      }
    },
    [canFree, costPts, isSignedIn, phase, triggerOutcome, userPoints]
  );

  // Mobile accelerometer listener
  useEffect(() => {
    if (!motionSupported || typeof window === 'undefined') return;
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    let initialized = false;

    const handleMotion = (ev: DeviceMotionEvent) => {
      const acc = ev.accelerationIncludingGravity;
      if (!acc) return;
      const x = acc.x ?? 0;
      const y = acc.y ?? 0;
      const z = acc.z ?? 0;
      if (!initialized) {
        lastX = x;
        lastY = y;
        lastZ = z;
        initialized = true;
        return;
      }
      const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
      lastX = x;
      lastY = y;
      lastZ = z;
      const now = Date.now();
      if (delta > 16 && now - lastMotionRef.current > 110) {
        lastMotionRef.current = now;
        setMotionEnabled(true);
        addEnergyImpulse(26);
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [addEnergyImpulse, motionSupported]);

  // Keyboard spacebar support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        addEnergyImpulse(25);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addEnergyImpulse]);

  const requestIosMotion = async () => {
    try {
      const DME = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DME?.requestPermission === 'function') {
        const res = await DME.requestPermission();
        if (res === 'granted') setMotionEnabled(true);
      } else {
        setMotionEnabled(true);
      }
    } catch {
      // fallback silently to tap/hold controls
    }
  };

  const startHoldCharge = () => {
    if (busyRef.current || phase === 'COMPLETE') return;
    if (isSignedIn && !canFree && userPoints < costPts) return;
    setHolding(true);
    addEnergyImpulse(22);
    if (holdTimerRef.current) window.clearInterval(holdTimerRef.current);
    holdTimerRef.current = window.setInterval(() => {
      addEnergyImpulse(18);
    }, 170);
  };

  const stopHoldCharge = () => {
    setHolding(false);
    if (holdTimerRef.current) {
      window.clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const resetRound = () => {
    stopHoldCharge();
    busyRef.current = false;
    energyRef.current = 0;
    setEnergy(0);
    setPhase('READY');
  };

  const toggleMute = () => {
    gameSound.muted = !muted;
    setMuted(gameSound.muted);
  };

  const tiltAngle = phase === 'SHAKING' ? (wobbleTick % 2 === 0 ? -11 : 11) : 0;
  const translateX = phase === 'SHAKING' ? (wobbleTick % 2 === 0 ? -6 : 6) : 0;
  const blockedNoPoints = isSignedIn && !canFree && userPoints < costPts;

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Top Status & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 min-w-0">
          {isSignedIn ? (
            <span className="truncate">
              {canFree
                ? lang === 'en'
                  ? `Free shakes: ${remainingFreeToday}`
                  : `Lượt lắc miễn phí: ${remainingFreeToday}`
                : lang === 'en'
                  ? `Cost: ${costPts} pts`
                  : `Đổi ${costPts} điểm`}
            </span>
          ) : (
            <span className="truncate">
              {lang === 'en'
                ? 'Demo mode'
                : 'Chơi thử'}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span className="font-mono font-bold tabular-nums text-[#00552B] dark:text-[#C6A667] whitespace-nowrap">
            {energy}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {motionSupported && !motionEnabled && (
            <button
              type="button"
              onClick={requestIosMotion}
              className="px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-[11px] font-semibold inline-flex items-center gap-1 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer whitespace-nowrap"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
              <span>{lang === 'en' ? 'Sensor' : 'Cảm Biến'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
            aria-label="Toggle Sound"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />}
          </button>
        </div>
      </div>

      {/* Interactive Shaker Arena */}
      <div className="rounded-2xl bg-[#0B2B1C] text-white border border-[#C6A667]/30 p-4 sm:p-8 flex flex-col items-center text-center space-y-3 sm:space-y-5 relative overflow-hidden">
        <AdaptiveLogo
          variant="horizontal"
          surface="dark"
          darkTone="gold"
          size="2xs"
          className="opacity-85 pointer-events-none"
        />
        <p className="text-[11px] sm:text-xs text-[#F8F5EF]/80 max-w-md leading-snug">
          {lang === 'en'
            ? 'Shake your phone or tap/hold the ROAR shaker to reach 100% and unlock your prize!'
            : 'Lắc điện thoại, giữ nút hoặc chạm vào bình ROAR để nạp đủ 100% mở quà!'}
        </p>

        {/* Interactive Shaker SVG */}
        <button
          type="button"
          onClick={() => addEnergyImpulse(25)}
          disabled={blockedNoPoints || phase === 'COMPLETE'}
          aria-label={lang === 'en' ? 'Tap to shake ROAR canister' : 'Chạm để lắc bình cà phê ROAR'}
          className="relative w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none group touch-manipulation"
          style={{
            transform: `translateX(${translateX}px) rotate(${tiltAngle}deg) scale(${holding ? 1.04 : 1})`,
            transition: 'transform 110ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Energy Halo Ring */}
          <svg viewBox="0 0 180 180" className="w-full h-full">
            <circle cx="90" cy="90" r="78" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
            <circle
              cx="90"
              cy="90"
              r="78"
              fill="none"
              stroke="#C6A667"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={490}
              strokeDashoffset={490 - (490 * energy) / 100}
              transform="rotate(-90 90 90)"
              style={{ transition: 'stroke-dashoffset 140ms ease-out' }}
            />
            {/* ROAR Coffee Tin Shaker */}
            <rect x="56" y="42" width="68" height="96" rx="12" fill="#00552B" stroke="#C6A667" strokeWidth="3" />
            <rect x="52" y="34" width="76" height="16" rx="6" fill="#C6A667" />
            <rect x="74" y="24" width="32" height="10" rx="4" fill="#8C6D32" />
            <circle cx="90" cy="86" r="24" fill="#0E1512" stroke="#C6A667" strokeWidth="2" />
            <text
              x="90"
              y="126"
              textAnchor="middle"
              fill="#F8F5EF"
              fontSize="9"
              fontWeight="600"
              opacity="0.85"
            >
              {energy}%
            </text>
          </svg>
          <span className="pointer-events-none absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <AdaptiveLogo variant="vertical" surface="dark" darkTone="gold" size="2xs" className="scale-[0.78] sm:scale-[0.95]" />
          </span>
        </button>

        {/* Energy Progress Bar */}
        <div className="w-full max-w-sm space-y-1.5">
          <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden border border-white/15">
            <div
              className="h-full bg-gradient-to-r from-[#C6A667] via-[#e2c687] to-[#16A34A] transition-all duration-150"
              style={{ width: `${energy}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-white/70 tabular-nums">
            <span>{lang === 'en' ? 'Shake Charge' : 'Mức Nạp Lắc'}</span>
            <span>{energy}/100%</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-0.5">
          {phase === 'COMPLETE' ? (
            <button
              type="button"
              onClick={resetRound}
              className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer whitespace-nowrap min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{lang === 'en' ? 'Shake Again' : 'Lắc Lượt Mới'}</span>
            </button>
          ) : blockedNoPoints ? (
            <div className="space-y-2">
              <p className="text-xs text-amber-300">
                {lang === 'en'
                  ? `You need ${costPts} points for another shake today.`
                  : `Bạn cần ${costPts} điểm ROAR để lắc thêm hôm nay.`}
              </p>
              <button
                type="button"
                onClick={onRequireLogin}
                className="px-5 py-2.5 rounded-xl bg-white/15 text-white text-xs font-bold cursor-pointer min-h-[44px]"
              >
                {lang === 'en' ? 'Earn Points via Check-in' : 'Kiếm thêm điểm tại Điểm Danh'}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onMouseDown={startHoldCharge}
                onMouseUp={stopHoldCharge}
                onMouseLeave={stopHoldCharge}
                onTouchStart={(e) => {
                  e.preventDefault();
                  startHoldCharge();
                }}
                onTouchEnd={stopHoldCharge}
                onClick={() => addEnergyImpulse(34)}
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs sm:text-sm font-bold inline-flex items-center gap-1.5 sm:gap-2 shadow-lg cursor-pointer whitespace-nowrap select-none min-h-[44px] touch-manipulation"
              >
                {isSignedIn && !canFree ? <Coins className="w-4 h-4 shrink-0" /> : <Zap className="w-4 h-4 shrink-0" />}
                <span>
                  {!isSignedIn
                    ? lang === 'en'
                      ? 'Tap / Hold to Shake'
                      : 'Chạm / Giữ Để Lắc'
                    : canFree
                      ? lang === 'en'
                        ? 'Tap or Hold to Shake'
                        : 'Chạm / Giữ Để Lắc'
                      : lang === 'en'
                        ? `Shake (-${costPts} pts)`
                        : `Lắc (-${costPts} điểm)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => addEnergyImpulse(100)}
                className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C6A667] shrink-0" />
                <span>{lang === 'en' ? 'Instant Shake' : 'Lắc 1 Chạm'}</span>
              </button>
            </>
          )}
        </div>

        {!isSignedIn && (
          <button
            type="button"
            onClick={onRequireLogin}
            className="text-xs text-[#C6A667] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Gift className="w-3.5 h-3.5" />
            <span>
              {lang === 'en'
                ? 'Sign in to claim real gifts & vouchers'
                : 'Đăng nhập để nhận quà & mã giảm giá thật'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
