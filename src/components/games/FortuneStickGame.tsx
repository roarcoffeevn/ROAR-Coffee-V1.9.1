import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Coins, Gift, RefreshCw, ShoppingBag, Smartphone, Sparkles, Volume2, VolumeX } from 'lucide-react';
import type { Product } from '../../context/StoreContext';
import { FORTUNE_SLIPS, type FortuneSlipItem, type GameConfigRecord, type GameRewardRecord } from '../../lib/gamesCatalog';
import { AdaptiveLogo } from '../AdaptiveLogo';
import { gameSound } from './RoarGamesSound';

interface FortuneStickGameProps {
  lang: 'vi' | 'en';
  config: GameConfigRecord;
  rewards: GameRewardRecord[];
  products: Product[];
  remainingFreeToday: number;
  isSignedIn: boolean;
  userPoints: number;
  onPlayReal: (useExtraPoints: boolean) => Promise<any>;
  onAddProductToCart: (product: Product) => void;
  onRequireLogin: () => void;
  onDemoResult: (reward: GameRewardRecord) => void;
}

export const FortuneStickGame: React.FC<FortuneStickGameProps> = ({
  lang,
  config,
  rewards,
  products,
  remainingFreeToday,
  isSignedIn,
  userPoints,
  onPlayReal,
  onAddProductToCart,
  onRequireLogin,
  onDemoResult,
}) => {
  const [shaking, setShaking] = useState(false);
  const [drawnSlip, setDrawnSlip] = useState<FortuneSlipItem | null>(null);
  const [wonReward, setWonReward] = useState<GameRewardRecord | null>(null);
  const [muted, setMuted] = useState(gameSound.muted);
  const [shakeCount, setShakeCount] = useState(0);
  const timerRef = useRef<number | null>(null);
  const busyRef = useRef(false);

  const canFree = remainingFreeToday > 0;
  const costPts = Math.max(1, Number(config.extra_play_cost_points || 25));
  const blockedNoPoints = isSignedIn && !canFree && userPoints < costPts;

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const drawFortuneStick = useCallback(
    async (useExtraPoints: boolean) => {
      if (busyRef.current || shaking) return;
      if (isSignedIn && useExtraPoints && userPoints < costPts) return;

      busyRef.current = true;
      setShaking(true);
      setDrawnSlip(null);
      setWonReward(null);

      // Rhythmic bamboo stick rattling sound
      gameSound.rattle();
      const s1 = window.setTimeout(() => gameSound.rattle(), 240);
      const s2 = window.setTimeout(() => gameSound.rattle(), 480);
      const s3 = window.setTimeout(() => gameSound.rattle(), 720);

      let realPromise: Promise<any> | null = null;
      if (isSignedIn) {
        realPromise = onPlayReal(useExtraPoints);
      }

      timerRef.current = window.setTimeout(async () => {
        window.clearTimeout(s1);
        window.clearTimeout(s2);
        window.clearTimeout(s3);

        const pickedSlip = FORTUNE_SLIPS[Math.floor(Math.random() * FORTUNE_SLIPS.length)];
        setShaking(false);
        setDrawnSlip(pickedSlip);
        setShakeCount((c) => c + 1);
        gameSound.fortuneReveal();

        if (!isSignedIn) {
          const pool = rewards.filter((r) => r.active && (r.stock_total < 0 || r.stock_remaining > 0));
          const list = pool.length > 0 ? pool : rewards;
          const totalW = list.reduce((acc, r) => acc + Math.max(1, Number(r.weight || 1)), 0);
          let roll = Math.random() * totalW;
          let picked = list[0];
          for (const r of list) {
            roll -= Math.max(1, Number(r.weight || 1));
            if (roll <= 0) {
              picked = r;
              break;
            }
          }
          if (picked) {
            setWonReward(picked);
            onDemoResult(picked);
          }
        } else if (realPromise) {
          const res = await realPromise;
          if (res?.won && res.reward) {
            setWonReward(res.reward);
          }
        }
        busyRef.current = false;
      }, 1150);
    },
    [costPts, isSignedIn, onDemoResult, onPlayReal, rewards, shaking, userPoints]
  );

  // Optional DeviceMotion trigger on mobile while ready
  useEffect(() => {
    if (typeof window === 'undefined' || !('DeviceMotionEvent' in window)) return;
    let lastX = 0;
    let lastY = 0;
    let init = false;
    const onMotion = (ev: DeviceMotionEvent) => {
      if (busyRef.current || drawnSlip || blockedNoPoints) return;
      const a = ev.accelerationIncludingGravity;
      if (!a) return;
      const x = a.x ?? 0;
      const y = a.y ?? 0;
      if (!init) {
        lastX = x;
        lastY = y;
        init = true;
        return;
      }
      const delta = Math.abs(x - lastX) + Math.abs(y - lastY);
      lastX = x;
      lastY = y;
      if (delta > 26) {
        drawFortuneStick(isSignedIn && !canFree);
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, [blockedNoPoints, canFree, drawFortuneStick, drawnSlip, isSignedIn]);

  const toggleMute = () => {
    gameSound.muted = !muted;
    setMuted(gameSound.muted);
  };

  const matchedProduct = drawnSlip
    ? products.find((p) => p.slug === drawnSlip.recommendedProductSlug) || products[0]
    : null;

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Header Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 min-w-0">
          {isSignedIn ? (
            <span className="truncate">
              {canFree
                ? lang === 'en'
                  ? `Free draws: ${remainingFreeToday}`
                  : `Lượt gieo miễn phí: ${remainingFreeToday}`
                : lang === 'en'
                  ? `Cost: ${costPts} pts`
                  : `Đổi ${costPts} điểm`}
            </span>
          ) : (
            <span className="truncate">
              {lang === 'en'
                ? 'Demo mode'
                : 'Gieo thử'}
            </span>
          )}
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1 text-[#00552B] dark:text-[#C6A667] font-semibold whitespace-nowrap shrink-0">
            <Smartphone className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Shake or tap' : 'Lắc hoặc bấm'}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer shrink-0"
          aria-label="Toggle Sound"
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />}
        </button>
      </div>

      {/* Main Cylinder + Drawn Fortune Card */}
      <div className="rounded-2xl bg-[#0D261A] text-white border border-[#C6A667]/35 p-4 sm:p-8 flex flex-col items-center space-y-3.5 sm:space-y-6">
        {!drawnSlip ? (
          <>
            <div className="text-center space-y-1 max-w-md">
              <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] text-[#C6A667] font-bold">
                {lang === 'en' ? 'ROAR DAILY FORTUNE RITUAL' : 'GIEO QUẺ BẢN LĨNH ĐẦU NGÀY'}
              </p>
              <p className="text-[11px] sm:text-xs text-white/75 leading-snug">
                {lang === 'en'
                  ? 'Tap the bamboo cylinder below or shake your phone to draw your fortune stick.'
                  : 'Nhấn nút hoặc lắc điện thoại để rút thẻ xăm may mắn.'}
              </p>
            </div>

            {/* Bamboo Cylinder SVG with Official ROAR COFFEE Crest */}
            <button
              type="button"
              disabled={shaking || blockedNoPoints}
              onClick={() => drawFortuneStick(isSignedIn && !canFree)}
              className="relative w-32 h-36 sm:w-44 sm:h-52 flex items-center justify-center cursor-pointer disabled:cursor-not-allowed focus:outline-none touch-manipulation"
              style={{
                transform: shaking ? 'rotate(-14deg) translateY(-6px)' : 'rotate(0deg)',
                transition: 'transform 160ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              aria-label={lang === 'en' ? 'Draw fortune stick' : 'Lắc ống xăm'}
            >
              <svg viewBox="0 0 180 210" className="w-full h-full">
                {/* Fortune Sticks Protruding Top */}
                <g>
                  <rect x="64" y="22" width="10" height="72" rx="2" fill="#D9B87A" transform="rotate(-12 69 75)" />
                  <rect x="64" y="22" width="10" height="14" rx="2" fill="#991B1B" transform="rotate(-12 69 75)" />

                  <rect x="78" y="14" width="10" height="80" rx="2" fill="#E8CA8C" transform="rotate(-4 83 75)" />
                  <rect x="78" y="14" width="10" height="15" rx="2" fill="#B91C1C" transform="rotate(-4 83 75)" />

                  <rect x="92" y="12" width="11" height="82" rx="2" fill="#F2D79B" transform="rotate(3 97 75)" />
                  <rect x="92" y="12" width="11" height="16" rx="2" fill="#991B1B" transform="rotate(3 97 75)" />

                  <rect x="106" y="20" width="10" height="74" rx="2" fill="#D9B87A" transform="rotate(11 111 75)" />
                  <rect x="106" y="20" width="10" height="14" rx="2" fill="#B91C1C" transform="rotate(11 111 75)" />
                </g>

                {/* Bamboo Cylinder Body */}
                <rect x="46" y="72" width="88" height="114" rx="14" fill="#18472F" stroke="#C6A667" strokeWidth="3" />
                <ellipse cx="90" cy="72" rx="44" ry="10" fill="#0B2417" stroke="#C6A667" strokeWidth="2.5" />
                <line x1="46" y1="126" x2="134" y2="126" stroke="#C6A667" strokeWidth="2" opacity="0.65" />
                <circle cx="90" cy="128" r="27" fill="#0E1512" stroke="#C6A667" strokeWidth="2.2" />
              </svg>
              <span className="pointer-events-none absolute top-[61%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                <AdaptiveLogo variant="vertical" surface="dark" darkTone="gold" size="2xs" className="scale-[0.82] sm:scale-100" />
              </span>
            </button>

            {blockedNoPoints ? (
              <div className="text-center space-y-2">
                <p className="text-xs text-amber-300">
                  {lang === 'en'
                    ? `Need ${costPts} pts to draw another stick today.`
                    : `Cần ${costPts} điểm ROAR để gieo quẻ thêm hôm nay.`}
                </p>
                <button
                  type="button"
                  onClick={onRequireLogin}
                  className="px-5 py-2 rounded-xl bg-white/15 text-white text-xs font-bold cursor-pointer"
                >
                  {lang === 'en' ? 'Earn More Points' : 'Tích điểm tại Điểm Danh'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={shaking}
                onClick={() => drawFortuneStick(isSignedIn && !canFree)}
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-lg cursor-pointer whitespace-nowrap disabled:opacity-60 min-h-[44px]"
              >
                {isSignedIn && !canFree ? <Coins className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span>
                  {shaking
                    ? lang === 'en'
                      ? 'Shaking Cylinder...'
                      : 'Đang Gieo Quẻ...'
                    : !isSignedIn
                      ? lang === 'en'
                        ? 'Draw Fortune Stick (Demo)'
                        : 'Lắc Ống Xin Xăm (Thử)'
                      : canFree
                        ? lang === 'en'
                          ? 'Draw Your Fortune Stick'
                          : 'Lắc Ống Xin Xăm Ngay'
                        : lang === 'en'
                          ? `Draw Stick (-${costPts} pts)`
                          : `Xin Quẻ Mới (-${costPts} điểm)`}
                </span>
              </button>
            )}
          </>
        ) : (
          /* Revealed Fortune Slip Result */
          <div className="w-full max-w-lg rounded-2xl bg-[#F8F5EF] dark:bg-[#14201A] text-[#202020] dark:text-[#F1EFEA] border-2 border-[#C6A667] p-4 sm:p-6 space-y-3 sm:space-y-4 text-left">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#C6A667]/30">
              <div>
                <AdaptiveLogo variant="horizontal" surface="auto" darkTone="gold" size="2xs" className="mb-1.5" />
                <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#8C6D32] dark:text-[#C6A667]">
                  {lang === 'en'
                    ? `FORTUNE STICK #${drawnSlip.number} · ${drawnSlip.tierEn}`
                    : `QUẺ XĂM SỐ ${drawnSlip.number} · ${drawnSlip.tierVi}`}
                </div>
                <h3 className="font-serif text-xl font-bold text-[#111111] dark:text-[#F8F5EF] mt-1">
                  {lang === 'en' ? drawnSlip.titleEn : drawnSlip.titleVi}
                </h3>
              </div>
              <span className="font-mono text-lg font-extrabold px-2.5 py-1 rounded-lg bg-[#00552B] text-[#C6A667] shrink-0">
                #{drawnSlip.number}
              </span>
            </div>

            <blockquote className="italic text-sm font-serif text-[#00552B] dark:text-[#C6A667] bg-white/80 dark:bg-[#0E1512] p-3.5 rounded-xl border border-[#202020]/8 dark:border-white/10">
              “{lang === 'en' ? drawnSlip.verseEn : drawnSlip.verseVi}”
            </blockquote>

            <p className="text-xs leading-relaxed text-[#202020]/85 dark:text-[#F1EFEA]/85">
              <strong>{lang === 'en' ? 'Guidance:' : 'Lời giải quẻ:'}</strong>{' '}
              {lang === 'en' ? drawnSlip.adviceEn : drawnSlip.adviceVi}
            </p>

            <div className="p-3 rounded-xl bg-white dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                {lang === 'en' ? 'Lucky Coffee Pairing Today' : 'Gợi Ý Tách Cà Phê Hợp Vận Hôm Nay'}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">
                    {matchedProduct
                      ? lang === 'en'
                        ? matchedProduct.name_en
                        : matchedProduct.name_vi
                      : drawnSlip.recommendedProductSlug}
                  </div>
                  <div className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65">
                    {lang === 'en' ? drawnSlip.brewNoteEn : drawnSlip.brewNoteVi}
                  </div>
                </div>
                {matchedProduct && (
                  <button
                    type="button"
                    onClick={() => onAddProductToCart(matchedProduct)}
                    className="px-3 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Add to Cart' : 'Thêm Vào Giỏ'}</span>
                  </button>
                )}
              </div>
            </div>

            {wonReward && (
              <div className="p-3 rounded-xl bg-[#00552B]/10 dark:bg-[#C6A667]/15 border border-[#00552B]/25 dark:border-[#C6A667]/35 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#00552B] dark:text-[#C6A667]">
                  🎁 {lang === 'en' ? wonReward.label_en : wonReward.label_vi}
                </span>
                <span className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70">
                  {isSignedIn
                    ? lang === 'en'
                      ? 'Saved in your bag'
                      : 'Đã lưu vào Túi Quà'
                    : lang === 'en'
                      ? 'Demo preview'
                      : 'Xem thử'}
                </span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDrawnSlip(null);
                  setWonReward(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#202020]/15 dark:border-white/15 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? `Draw Again (${shakeCount})` : `Gieo Quẻ Lại (${shakeCount})`}</span>
              </button>

              {!isSignedIn && (
                <button
                  type="button"
                  onClick={onRequireLogin}
                  className="px-4 py-2 rounded-xl bg-[#00552B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Sign In to Claim Real Gift' : 'Đăng nhập nhận lộc thật'}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
