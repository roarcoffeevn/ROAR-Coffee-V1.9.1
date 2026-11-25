import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Coins, Gift, RotateCw, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { GameConfigRecord, GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { gameSound } from './RoarGamesSound';

interface LuckyWheelGameProps {
  lang: string;
  config?: GameConfigRecord;
  rewards: GameRewardRecord[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  onPlayReal: (useExtraPoints: boolean) => Promise<{ reward?: GameRewardRecord; claim?: any; promoCode?: string } | null>;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

export const LuckyWheelGame: React.FC<LuckyWheelGameProps> = ({
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
  const activeRewards = useMemo(
    () => rewards.filter((r) => r.active && (r.stock_total < 0 || r.stock_remaining > 0)),
    [rewards]
  );

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [muted, setMuted] = useState(gameSound.muted);
  const tickTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
    };
  }, []);

  const slices = activeRewards.length > 0 ? activeRewards : rewards;
  const sliceCount = Math.max(1, slices.length);
  const sliceDeg = 360 / sliceCount;

  const triggerSpinAnimation = (targetIndex: number) => {
    // Segment i center starts at (i + 0.5) * sliceDeg clockwise from 12 o'clock.
    // Rotating wheel by R puts slice center at ((i + 0.5) * sliceDeg + R) mod 360.
    // To land under top pointer (0 deg), R mod 360 = (360 - (i + 0.5) * sliceDeg) mod 360.
    const centerOffset = (targetIndex + 0.5) * sliceDeg;
    const desiredMod = (360 - (centerOffset % 360) + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const deltaMod = (desiredMod - currentMod + 360) % 360;
    const jitter = (Math.random() - 0.5) * (sliceDeg * 0.4);
    const fullSpins = 360 * 6;
    const nextRot = rotation + fullSpins + deltaMod + jitter;
    setRotation(nextRot);

    if (tickTimerRef.current) window.clearInterval(tickTimerRef.current);
    tickTimerRef.current = window.setInterval(() => gameSound.tick(), 140);
    window.setTimeout(() => {
      if (tickTimerRef.current) {
        window.clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }
      gameSound.win();
      setSpinning(false);
    }, 4100);
  };

  const handleSpin = async (useExtraPoints = false) => {
    if (spinning || slices.length === 0) return;

    if (!isSignedIn) {
      setSpinning(true);
      const demoIdx = Math.floor(Math.random() * slices.length);
      triggerSpinAnimation(demoIdx);
      window.setTimeout(() => onDemoResult(slices[demoIdx]), 4150);
      return;
    }

    setSpinning(true);
    const res = await onPlayReal(useExtraPoints);
    if (!res || !res.reward) {
      setSpinning(false);
      return;
    }
    const idx = slices.findIndex((s) => s.id === res.reward!.id);
    const targetIdx = idx >= 0 ? idx : 0;
    triggerSpinAnimation(targetIdx);
  };

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (cx: number, cy: number, r: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', cx, cy, 'L', start.x, start.y, 'A', r, r, 0, largeArc, 0, end.x, end.y, 'Z'].join(' ');
  };

  const costPts = config?.extra_play_cost_points || 30;
  const canFree = remainingFreeToday > 0;

  return (
    <div className="flex flex-col items-center gap-3 sm:gap-6 w-full min-w-0">
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <div className="text-[11px] sm:text-xs font-semibold text-[#202020]/75 dark:text-[#F1EFEA]/75 min-w-0 truncate">
          {isSignedIn ? (
            <span>
              {lang === 'en' ? 'Free spins today:' : 'Lượt miễn phí:'}{' '}
              <strong className="text-[#00552B] dark:text-[#C6A667] tabular-nums">{remainingFreeToday}</strong>
            </span>
          ) : (
            <span>
              {lang === 'en' ? 'Demo spin mode' : 'Quay thử · Đăng nhập nhận quà thật'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            gameSound.muted = !muted;
            setMuted(gameSound.muted);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-[11px] sm:text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0 whitespace-nowrap"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{muted ? (lang === 'en' ? 'Muted' : 'Tắt tiếng') : (lang === 'en' ? 'Sound' : 'Âm thanh')}</span>
        </button>
      </div>

      {/* Precision SVG Lucky Wheel */}
      <div className="relative w-[min(62vw,224px)] h-[min(62vw,224px)] sm:w-[368px] sm:h-[368px] select-none shrink-0 mx-auto">
        {/* Top Pointer */}
        <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
          <svg className="w-7 h-8 sm:w-[34px] sm:h-[38px]" viewBox="0 0 34 38">
            <path d="M17 36L3 8C1.5 5 3.5 2 7 2H27C30.5 2 32.5 5 31 8L17 36Z" fill="#C6A667" stroke="#111111" strokeWidth="2.5" />
            <circle cx="17" cy="11" r="4" fill="#111111" />
          </svg>
        </div>

        {/* Outer Gold Rim */}
        <div className="w-full h-full rounded-full p-2 sm:p-2.5 bg-gradient-to-br from-[#C6A667] via-[#F2E0B6] to-[#8C6D32] shadow-2xl">
          <div className="w-full h-full rounded-full bg-[#111814] p-1 relative overflow-hidden">
            <svg
              viewBox="0 0 400 400"
              className="w-full h-full will-change-transform"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? 'transform 4.1s cubic-bezier(0.14, 0.85, 0.16, 1)' : 'none',
              }}
            >
              {slices.map((s, idx) => {
                const startA = idx * sliceDeg;
                const endA = (idx + 1) * sliceDeg;
                const midA = startA + sliceDeg / 2;
                const fill = s.color_hex || (idx % 2 === 0 ? '#00552B' : '#C6A667');
                const isLightFill = fill.toUpperCase() === '#C6A667' || fill.toUpperCase() === '#F8F5EF';
                const textColor = isLightFill ? '#111111' : '#F8F5EF';
                const label = lang === 'en' ? s.label_en : s.label_vi;
                const shortLabel = label.length > 17 ? `${label.slice(0, 16)}…` : label;

                return (
                  <g key={s.id || idx}>
                    <path d={describeArc(200, 200, 195, startA, endA)} fill={fill} stroke="#F8F5EF" strokeWidth="1.5" />
                    <g transform={`rotate(${midA} 200 200)`}>
                      <text
                        x="200"
                        y="62"
                        fill={textColor}
                        fontSize="11.5"
                        fontWeight="800"
                        textAnchor="middle"
                        style={{ letterSpacing: '0.02em' }}
                      >
                        {s.badge_vi && s.reward_type === 'product_gift' ? '🎁 ' : ''}
                        {shortLabel}
                      </text>
                      {s.badge_vi && (
                        <text
                          x="200"
                          y="82"
                          fill={textColor}
                          opacity="0.85"
                          fontSize="9.5"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {lang === 'en' ? s.badge_en : s.badge_vi}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* Studs around perimeter */}
              {Array.from({ length: sliceCount }).map((_, idx) => {
                const pt = polarToCartesian(200, 200, 187, idx * sliceDeg);
                return <circle key={idx} cx={pt.x} cy={pt.y} r="3.2" fill="#F8F5EF" />;
              })}
            </svg>

            {/* Center Spin Hub with Official ROAR COFFEE Logo */}
            <button
              type="button"
              disabled={spinning || slices.length === 0}
              onClick={() => handleSpin(isSignedIn && !canFree)}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#111111] border-[3px] sm:border-4 border-[#C6A667] text-[#F8F5EF] flex flex-col items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform cursor-pointer disabled:opacity-60 overflow-hidden"
            >
              <AdaptiveLogo
                variant="vertical"
                surface="dark"
                darkTone="gold"
                size="2xs"
                className={`pointer-events-none transition-transform duration-300 ${spinning ? 'scale-90 animate-pulse' : ''}`}
              />
              {spinning && (
                <RotateCw className="w-3.5 h-3.5 text-[#C6A667] animate-spin absolute bottom-1" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        {!isSignedIn ? (
          <>
            <button
              type="button"
              disabled={spinning}
              onClick={() => handleSpin(false)}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 sm:gap-2 shadow-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 min-h-[44px]"
            >
              <Sparkles className="w-4 h-4 text-[#C6A667] shrink-0" />
              <span>{lang === 'en' ? 'Spin Demo Free' : 'Quay Thử Miễn Phí'}</span>
            </button>
            <button
              type="button"
              onClick={onRequireLogin}
              className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl border border-[#C6A667] text-[#8C6D32] dark:text-[#C6A667] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-[#C6A667]/10 whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <Gift className="w-4 h-4 shrink-0" />
              <span>{lang === 'en' ? 'Sign In to Claim' : 'Đăng nhập Nhận Quà'}</span>
            </button>
          </>
        ) : canFree ? (
          <button
            type="button"
            disabled={spinning || slices.length === 0}
            onClick={() => handleSpin(false)}
            className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md whitespace-nowrap cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4 text-[#C6A667] shrink-0" />
            <span>
              {spinning
                ? lang === 'en'
                  ? 'Spinning...'
                  : 'Đang quay...'
                : lang === 'en'
                  ? `Spin Free (${remainingFreeToday} left)`
                  : `Quay Miễn Phí (còn ${remainingFreeToday} lượt)`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            disabled={spinning || slices.length === 0 || userPoints < costPts}
            onClick={() => handleSpin(true)}
            className="w-full sm:w-auto px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-md whitespace-nowrap cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <Coins className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'en'
                ? `Spin Extra (-${costPts} pts)`
                : `Quay Thêm (-${costPts} điểm)`}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
