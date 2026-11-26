import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Coffee, Droplets, Headphones, Pause, Play, RotateCcw, ShoppingBag, Thermometer, Timer } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { MediaImage } from './MediaImage';
import { roarCafeAudio } from './RoarCafeAudioEngine';

export type BrewMethodKey = 'phin_small' | 'phin_large' | 'v60' | 'espresso' | 'cold_brew';

interface BrewPreset {
  id: BrewMethodKey;
  labelVi: string;
  labelEn: string;
  defaultDoseG: number;
  ratio: number; // 1 : ratio
  tempLabel: string;
  grindVi: string;
  grindEn: string;
  pairedSlug: string;
  steps: Array<{
    key: string;
    labelVi: string;
    labelEn: string;
    durationSec: number;
    waterPct: number;
  }>;
}

const BREW_PRESETS: BrewPreset[] = [
  {
    id: 'phin_small',
    labelVi: 'Phin Nhỏ (1 ly)',
    labelEn: 'Classic Phin (1 cup)',
    defaultDoseG: 20,
    ratio: 4.5,
    tempLabel: '92–95°C',
    grindVi: 'Vừa-thô (Phin)',
    grindEn: 'Medium-Coarse',
    pairedSlug: 'roar-phin-heritage',
    steps: [
      { key: 'bloom', labelVi: 'Ủ nở bột cà phê (Bloom)', labelEn: 'Bloom Coffee Bed', durationSec: 30, waterPct: 0.3 },
      { key: 'draw', labelVi: 'Châm nước & nhỏ giọt hoàn tất', labelEn: 'Main Pour & Slow Drip', durationSec: 210, waterPct: 1.0 },
    ],
  },
  {
    id: 'phin_large',
    labelVi: 'Phin Lớn (Quán/Nhóm)',
    labelEn: 'Large Phin (Batch)',
    defaultDoseG: 60,
    ratio: 4.0,
    tempLabel: '93–95°C',
    grindVi: 'Thô-vừa (Phin lớn)',
    grindEn: 'Coarse-Medium',
    pairedSlug: 'roar-dam-bold',
    steps: [
      { key: 'bloom', labelVi: 'Ủ nở & thấm đều bề mặt', labelEn: 'Full Bed Saturation Bloom', durationSec: 45, waterPct: 0.3 },
      { key: 'draw', labelVi: 'Chiết xuất nước cốt Phin lớn', labelEn: 'Batch Extraction Drawdown', durationSec: 300, waterPct: 1.0 },
    ],
  },
  {
    id: 'v60',
    labelVi: 'Pour-Over V60',
    labelEn: 'Pour-Over V60',
    defaultDoseG: 15,
    ratio: 16,
    tempLabel: '90–93°C',
    grindVi: 'Vừa (Đường cát)',
    grindEn: 'Medium (Sea Salt)',
    pairedSlug: 'arabica-selection',
    steps: [
      { key: 'bloom', labelVi: 'Rót ủ Bloom xoắn nhẹ', labelEn: 'Gentle Bloom Swirl', durationSec: 35, waterPct: 0.2 },
      { key: 'pour1', labelVi: 'Lần rót 1 (Đến 65% nước)', labelEn: 'First Pour (to 65%)', durationSec: 45, waterPct: 0.65 },
      { key: 'pour2', labelVi: 'Lần rót 2 & rút cạn (100%)', labelEn: 'Final Pour & Drawdown', durationSec: 70, waterPct: 1.0 },
    ],
  },
  {
    id: 'espresso',
    labelVi: 'Espresso Máy',
    labelEn: 'Espresso 9-Bar',
    defaultDoseG: 18,
    ratio: 2.0,
    tempLabel: '91–93°C',
    grindVi: 'Mịn (Espresso)',
    grindEn: 'Fine Espresso',
    pairedSlug: 'roar-espresso-gold',
    steps: [
      { key: 'pre', labelVi: 'Tiền ngâm áp suất thấp (Pre-infuse)', labelEn: 'Pre-Infusion Wetting', durationSec: 6, waterPct: 0.15 },
      { key: 'ext', labelVi: 'Chiết xuất crema vàng hổ phách', labelEn: 'Crema Extraction Pull', durationSec: 22, waterPct: 1.0 },
    ],
  },
  {
    id: 'cold_brew',
    labelVi: 'Cold Brew 1:10',
    labelEn: 'Cold Brew 1:10',
    defaultDoseG: 50,
    ratio: 10,
    tempLabel: '4–18°C',
    grindVi: 'Thô (Coarse)',
    grindEn: 'Coarse',
    pairedSlug: 'signature-reserve',
    steps: [
      { key: 'wet', labelVi: 'Ngâm ướt & khuấy đều', labelEn: 'Submerge & Stir Evenly', durationSec: 30, waterPct: 1.0 },
      { key: 'steep', labelVi: 'Đậy nắp đưa vào ngăn mát (Ủ 12–16h)', labelEn: 'Seal & Refrigerate (12–16h steep)', durationSec: 60, waterPct: 1.0 },
    ],
  },
];

function playSoftBell(kind: 'step' | 'done') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = kind === 'done' ? [523.25, 659.25, 783.99] : [587.33];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.12;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.48);
    });
  } catch {
    // ignore Web Audio block errors
  }
}

export const BrewTimerCalculator: React.FC<{
  products?: Product[];
  defaultMethod?: BrewMethodKey;
}> = ({ products = [], defaultMethod = 'phin_small' }) => {
  const { lang, t, localePath } = useI18n();
  const { addToCart, formatPrice, showToast } = useStore();

  const [methodId, setMethodId] = useState<BrewMethodKey>(defaultMethod);
  const preset = useMemo(() => BREW_PRESETS.find((p) => p.id === methodId) || BREW_PRESETS[0], [methodId]);

  const [cups, setCups] = useState(1);
  const [ratio, setRatio] = useState(preset.ratio);
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [chillWithMusic, setChillWithMusic] = useState(false);
  const prevStepIdxRef = useRef<number>(0);

  const totalSec = useMemo(() => preset.steps.reduce((s, st) => s + st.durationSec, 0), [preset]);
  const doseG = preset.defaultDoseG * cups;
  const totalWaterMl = Math.round(doseG * ratio);

  // Sync ratio & reset timer when preset switches
  const selectMethod = (id: BrewMethodKey) => {
    const next = BREW_PRESETS.find((p) => p.id === id) || BREW_PRESETS[0];
    setMethodId(id);
    setRatio(next.ratio);
    setRunning(false);
    setElapsedSec(0);
    prevStepIdxRef.current = 0;
  };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setElapsedSec((prev) => {
        if (prev + 1 >= totalSec) {
          setRunning(false);
          playSoftBell('done');
          return totalSec;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, totalSec]);

  // Compute current active step based on elapsedSec
  const stepInfo = useMemo(() => {
    let acc = 0;
    for (let i = 0; i < preset.steps.length; i++) {
      const st = preset.steps[i];
      if (elapsedSec < acc + st.durationSec || i === preset.steps.length - 1) {
        return {
          idx: i,
          step: st,
          stepElapsed: Math.max(0, elapsedSec - acc),
          stepRemaining: Math.max(0, acc + st.durationSec - elapsedSec),
          targetWaterMl: Math.round(totalWaterMl * st.waterPct),
        };
      }
      acc += st.durationSec;
    }
    return {
      idx: 0,
      step: preset.steps[0],
      stepElapsed: 0,
      stepRemaining: preset.steps[0].durationSec,
      targetWaterMl: Math.round(totalWaterMl * preset.steps[0].waterPct),
    };
  }, [preset, elapsedSec, totalWaterMl]);

  useEffect(() => {
    if (running && stepInfo.idx !== prevStepIdxRef.current) {
      playSoftBell('step');
      prevStepIdxRef.current = stepInfo.idx;
    }
  }, [running, stepInfo.idx]);

  const togglePlay = () => {
    if (elapsedSec >= totalSec) {
      setElapsedSec(0);
      prevStepIdxRef.current = 0;
    }
    if (!running && chillWithMusic) {
      roarCafeAudio.start();
    }
    setRunning((r) => !r);
  };

  const resetTimer = () => {
    setRunning(false);
    setElapsedSec(0);
    prevStepIdxRef.current = 0;
  };

  const pairedProduct = useMemo(() => {
    return (
      products.find((p) => p.slug === preset.pairedSlug) ||
      products.find((p) => p.category === 'roasted' && p.status === 'active') ||
      null
    );
  }, [products, preset.pairedSlug]);

  const formatMmSs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressPct = totalSec > 0 ? Math.min(100, Math.round((elapsedSec / totalSec) * 100)) : 0;

  return (
    <section className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-[#C6A667]/25 overflow-hidden shadow-sm">
      <div className="px-5 sm:px-7 py-4 bg-[#003D25] text-white flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C6A667] flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            <span>{t('Barista Timer & Công Thức Thông Minh', 'Interactive Barista Timer & Ratio Engine')}</span>
          </p>
          <h2 className="text-lg sm:text-xl font-bold">
            {t('Bấm Giờ Pha Chế Chuẩn Quán & Tính Tỷ Lệ Nước', 'Precision Brew Stopwatch & Water Calculator')}
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            const next = !chillWithMusic;
            setChillWithMusic(next);
            if (next) roarCafeAudio.start();
            else roarCafeAudio.stop();
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
            chillWithMusic
              ? 'bg-[#C6A667] text-[#111111]'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Headphones className="w-3.5 h-3.5" />
          <span>{chillWithMusic ? t('Nhạc Lo-Fi Đang Bật', 'Lo-Fi Café On') : t('Pha cùng nhạc Chill', 'Brew with Chill Music')}</span>
        </button>
      </div>

      <div className="p-5 sm:p-7 space-y-6">
        {/* Method Tabs */}
        <div className="flex flex-wrap gap-2">
          {BREW_PRESETS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => selectMethod(m.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                methodId === m.id
                  ? 'bg-[#00552B] text-white'
                  : 'bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/12 dark:border-white/15 text-[#202020] dark:text-[#F1EFEA] hover:border-[#00552B]'
              }`}
            >
              {t(m.labelVi, m.labelEn)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Ratio Controls + Specs */}
          <div className="lg:col-span-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 bg-[#F8F5EF] dark:bg-[#0E1512] rounded-xl p-4 border border-[#202020]/8 dark:border-white/10">
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65 block">
                  {t('Số phần pha (Tách)', 'Servings (Cups)')}
                </span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCups(n)}
                      className={`w-8 h-8 rounded-lg font-mono text-xs font-bold cursor-pointer transition-colors ${
                        cups === n
                          ? 'bg-[#00552B] text-white'
                          : 'bg-white dark:bg-[#16221C] border border-[#202020]/12 dark:border-white/15'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  <span>{t('Tỷ lệ (1 : X)', 'Ratio (1 : X)')}</span>
                  <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">1 : {ratio}</span>
                </div>
                <input
                  type="range"
                  min={methodId === 'espresso' ? 1.5 : 3}
                  max={methodId === 'espresso' ? 3.0 : 18}
                  step={0.5}
                  value={ratio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  className="w-full accent-[#00552B] dark:accent-[#C6A667] cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[#202020]/10 dark:border-white/10 p-3">
                <Coffee className="w-4 h-4 mx-auto text-[#00552B] dark:text-[#C6A667] mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-[#202020]/55 dark:text-[#F1EFEA]/55 block">
                  {t('Cà phê', 'Coffee Dose')}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-[#202020] dark:text-[#F1EFEA]">{doseG}g</span>
              </div>
              <div className="rounded-xl border border-[#202020]/10 dark:border-white/10 p-3">
                <Droplets className="w-4 h-4 mx-auto text-[#00552B] dark:text-[#C6A667] mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-[#202020]/55 dark:text-[#F1EFEA]/55 block">
                  {t('Tổng nước', 'Total Water')}
                </span>
                <span className="text-lg font-bold font-mono tabular-nums text-[#00552B] dark:text-[#C6A667]">{totalWaterMl}ml</span>
              </div>
              <div className="rounded-xl border border-[#202020]/10 dark:border-white/10 p-3">
                <Thermometer className="w-4 h-4 mx-auto text-[#00552B] dark:text-[#C6A667] mb-1" />
                <span className="text-[10px] uppercase tracking-wider text-[#202020]/55 dark:text-[#F1EFEA]/55 block">
                  {t('Nhiệt độ', 'Temp')}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums text-[#202020] dark:text-[#F1EFEA] mt-0.5 block">
                  {preset.tempLabel}
                </span>
              </div>
            </div>

            {/* Paired ROAR Product 1-Click Buy */}
            {pairedProduct && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/15 dark:border-[#C6A667]/25">
                <Link to={localePath(`/product/${pairedProduct.slug}`)} className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-14 rounded-lg overflow-hidden shrink-0 bg-white">
                    <MediaImage
                      imageKey={pairedProduct.image_key}
                      alt={lang === 'vi' ? pairedProduct.name_vi : pairedProduct.name_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667] block">
                      {t('Hạt chuẩn gu công thức này:', 'Best Match Coffee:')}
                    </span>
                    <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] truncate">
                      {lang === 'vi' ? pairedProduct.name_vi : pairedProduct.name_en}
                    </p>
                    <p className="text-[11px] font-mono font-semibold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                      {formatPrice(pairedProduct.variants?.[0]?.priceVnd || pairedProduct.price_vnd)}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    const v = pairedProduct.variants?.[0];
                    addToCart({
                      productId: pairedProduct.id,
                      slug: pairedProduct.slug,
                      sku: pairedProduct.sku,
                      nameVi: pairedProduct.name_vi,
                      nameEn: pairedProduct.name_en,
                      variantLabel: v?.label || 'Standard',
                      unitPriceVnd: v?.priceVnd || pairedProduct.price_vnd,
                      unitPriceUsd: v?.priceUsd || pairedProduct.price_usd,
                      quantity: 1,
                      imageKey: pairedProduct.image_key,
                    });
                    showToast(t(`Đã thêm ${pairedProduct.name_vi} vào giỏ`, `Added ${pairedProduct.name_en} to cart`));
                  }}
                  className="px-3 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t('Mua hạt này', 'Buy Coffee')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Right: Live Step-by-Step Stopwatch */}
          <div className="lg:col-span-6 rounded-2xl bg-[#0D1A13] text-[#F8F5EF] p-5 space-y-4 border border-[#C6A667]/25">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#C6A667] block">
                  {elapsedSec >= totalSec
                    ? t('Hoàn tất chiết xuất!', 'Brew Complete!')
                    : t(`Bước ${stepInfo.idx + 1}/${preset.steps.length}`, `Step ${stepInfo.idx + 1}/${preset.steps.length}`)}
                </span>
                <h3 className="text-base font-bold text-white">
                  {elapsedSec >= totalSec
                    ? t('Thưởng thức ly cà phê chuẩn ROAR!', 'Enjoy your freshly brewed ROAR cup!')
                    : lang === 'vi'
                    ? stepInfo.step.labelVi
                    : stepInfo.step.labelEn}
                </h3>
              </div>
              <div className="text-right font-mono tabular-nums">
                <span className="text-2xl sm:text-3xl font-bold text-[#C6A667] block leading-none">
                  {formatMmSs(elapsedSec)}
                </span>
                <span className="text-[10px] text-white/60">
                  / {formatMmSs(totalSec)} · {t('Chuông báo bước', 'Audio Chime')} <Bell className="w-2.5 h-2.5 inline" />
                </span>
              </div>
            </div>

            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00552B] to-[#C6A667] transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            <div className="space-y-1.5">
              {preset.steps.map((st, idx) => {
                const isActive = running && idx === stepInfo.idx && elapsedSec < totalSec;
                const waterTarget = Math.round(totalWaterMl * st.waterPct);
                return (
                  <div
                    key={st.key}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? 'bg-[#00552B] text-white font-semibold'
                        : 'bg-white/5 text-white/75'
                    }`}
                  >
                    <span className="truncate">
                      {idx + 1}. {lang === 'vi' ? st.labelVi : st.labelEn}
                    </span>
                    <span className="font-mono text-[11px] shrink-0 tabular-nums text-[#C6A667]">
                      {waterTarget}ml · {st.durationSec}s
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={togglePlay}
                className="flex-1 py-2.5 px-4 rounded-lg bg-[#C6A667] hover:bg-[#d7b97b] text-[#111111] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>
                  {running
                    ? t('Tạm dừng đồng hồ', 'Pause Timer')
                    : elapsedSec >= totalSec
                    ? t('Pha lại từ đầu', 'Brew Again')
                    : elapsedSec > 0
                    ? t('Tiếp tục bấm giờ', 'Resume Timer')
                    : t('Bắt đầu pha ngay', 'Start Brew Timer')}
                </span>
              </button>
              <button
                type="button"
                onClick={resetTimer}
                aria-label={t('Đặt lại đồng hồ', 'Reset timer')}
                className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
