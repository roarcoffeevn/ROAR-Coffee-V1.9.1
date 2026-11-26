import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Coffee, Flame, RotateCcw, ShoppingBag, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { localizeCoffeeType } from '../lib/i18nHelpers';
import { MediaImage } from './MediaImage';

type BrewPref = 'phin' | 'espresso' | 'instant' | 'beans';
type TastePref = 'bold' | 'balanced' | 'fruity' | 'reserve';
type OccasionPref = 'daily' | 'chill' | 'gift';

interface TasteFinderSectionProps {
  products: Product[];
}

export const TasteFinderSection: React.FC<TasteFinderSectionProps> = ({ products }) => {
  const { lang, t, localePath } = useI18n();
  const { addToCart, formatPrice, setPendingVoucherCode, showToast } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [brew, setBrew] = useState<BrewPref>('phin');
  const [taste, setTaste] = useState<TastePref>('bold');
  const [occasion, setOccasion] = useState<OccasionPref>('daily');

  const retailPool = useMemo(
    () => products.filter((p) => p.category !== 'green_bean' && p.status === 'active'),
    [products]
  );

  const matchedProducts = useMemo(() => {
    if (retailPool.length === 0) return [];
    const scored = retailPool.map((p) => {
      let score = 0;
      const text = `${p.slug} ${p.name_vi} ${p.name_en} ${p.tasting_notes_vi} ${p.coffee_type} ${p.roast_profile_vi}`.toLowerCase();
      const methods = (p.brewing_methods || []).join(' ').toLowerCase();

      if (brew === 'phin' && (methods.includes('phin') || p.category === 'roasted')) score += 4;
      if (brew === 'espresso' && (methods.includes('espresso') || text.includes('espresso') || p.category === 'roasted_beans')) score += 4;
      if (brew === 'instant' && p.category === 'instant') score += 6;
      if (brew === 'beans' && p.category === 'roasted_beans') score += 6;

      if (taste === 'bold' && (text.includes('robusta') || text.includes('tiger') || text.includes('lion') || text.includes('đậm'))) score += 3;
      if (taste === 'balanced' && (text.includes('blend') || text.includes('fox') || text.includes('culi') || text.includes('gold'))) score += 3;
      if (taste === 'fruity' && (text.includes('arabica') || text.includes('cầu đất') || text.includes('honey') || text.includes('washed'))) score += 4;
      if (taste === 'reserve' && (text.includes('reserve') || text.includes('panther') || text.includes('eagle') || p.price_vnd >= 240000)) score += 4;

      if (occasion === 'gift' && (text.includes('reserve') || text.includes('panther') || text.includes('gold') || p.price_vnd >= 200000)) score += 2;
      if (occasion === 'chill' && (text.includes('arabica') || text.includes('cold') || text.includes('fox') || text.includes('gold'))) score += 2;
      if (occasion === 'daily' && (p.category === 'roasted' || p.category === 'instant')) score += 2;

      return { product: p, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 2).map((s) => s.product);
  }, [retailPool, brew, taste, occasion]);

  if (retailPool.length === 0) return null;

  const handleReset = () => {
    setStep(1);
  };

  const handleQuickAdd = (p: Product) => {
    const isKg = p.category === 'roasted_beans' && (p.pricing_tiers?.length || 0) > 0;
    const firstVar = p.variants?.[0];
    addToCart({
      productId: p.id,
      slug: p.slug,
      sku: p.sku,
      nameVi: p.name_vi,
      nameEn: p.name_en,
      variantLabel: isKg ? '1 kg' : firstVar?.label || 'Standard',
      unitPriceVnd: isKg ? p.pricing_tiers?.[0]?.priceVnd || p.price_vnd : firstVar?.priceVnd || p.price_vnd,
      unitPriceUsd: isKg ? p.pricing_tiers?.[0]?.priceUsd || p.price_usd : firstVar?.priceUsd || p.price_usd,
      quantity: 1,
      imageKey: p.image_key,
      unit: isKg ? 'kg' : 'unit',
      pricingTiers: isKg ? p.pricing_tiers : undefined,
    });
    setPendingVoucherCode('ROARWELCOME10');
    showToast(t(`Đã thêm ${p.name_vi} & gắn sẵn mã ROARWELCOME10 (-10%)`, `Added ${p.name_en} with ROARWELCOME10 (-10%)`));
  };

  return (
    <section className="max-w-[1280px] mx-auto px-6 py-12">
      <div className="rounded-2xl bg-white dark:bg-[#14201A] border border-[#202020]/10 dark:border-[#C6A667]/25 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Interactive Finder */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
                  {t('Trắc nghiệm Gu Cà Phê 15 Giây', '15-Second Taste Finder')}
                </span>
                <span className="text-xs font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums">
                  {step <= 3 ? t(`Bước ${step}/3`, `Step ${step}/3`) : t('Gợi ý chuẩn gu của bạn', 'Your Matched Roast')}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] text-balance">
                {t('Chọn Đúng Vị Cà Phê Hợp Gu Bạn Nhất', 'Find Your Exact ROAR Roast in 3 Taps')}
              </h2>
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-[#202020]/80 dark:text-[#F1EFEA]/80">
                  {t('01. Bạn thường pha cà phê theo cách nào?', '01. How do you usually brew your coffee?')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'phin' as BrewPref, vi: 'Phin truyền thống đậm đà', en: 'Traditional Vietnamese Phin' },
                    { id: 'espresso' as BrewPref, vi: 'Pha máy Espresso / Moka', en: 'Espresso Machine / Moka' },
                    { id: 'instant' as BrewPref, vi: 'Hòa tan tiện lợi mang đi', en: 'Convenient Instant Stick' },
                    { id: 'beans' as BrewPref, vi: 'Hạt rang nguyên chất tự xay', en: 'Whole Roasted Beans (kg)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setBrew(opt.id);
                        setStep(2);
                      }}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        brew === opt.id
                          ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/8 dark:bg-[#C6A667]/12 text-[#00552B] dark:text-[#C6A667]'
                          : 'border-[#202020]/12 dark:border-white/12 hover:border-[#00552B]/50'
                      }`}
                    >
                      <span className="truncate">{t(opt.vi, opt.en)}</span>
                      <ArrowRight className="w-4 h-4 shrink-0 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#202020]/80 dark:text-[#F1EFEA]/80">
                    {t('02. Gu vị yêu thích của bạn là gì?', '02. Which flavor profile matches your palate?')}
                  </p>
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer whitespace-nowrap">
                    {t('← Chọn lại', '← Back')}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'bold' as TastePref, vi: 'Đậm mạnh, hậu socola đắng', en: 'Bold body, dark cocoa finish' },
                    { id: 'balanced' as TastePref, vi: 'Cân bằng, êm dịu dễ uống', en: 'Balanced, smooth daily cup' },
                    { id: 'fruity' as TastePref, vi: 'Thơm thanh, chua dịu trái cây', en: 'Floral aroma, bright citrus' },
                    { id: 'reserve' as TastePref, vi: 'Đặc sản thượng hạng sâu lắng', en: 'Signature Reserve complexity' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setTaste(opt.id);
                        setStep(3);
                      }}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        taste === opt.id
                          ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/8 dark:bg-[#C6A667]/12 text-[#00552B] dark:text-[#C6A667]'
                          : 'border-[#202020]/12 dark:border-white/12 hover:border-[#00552B]/50'
                      }`}
                    >
                      <span className="truncate">{t(opt.vi, opt.en)}</span>
                      <ArrowRight className="w-4 h-4 shrink-0 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[#202020]/80 dark:text-[#F1EFEA]/80">
                    {t('03. Bạn chọn cà phê cho dịp nào?', '03. What is the occasion?')}
                  </p>
                  <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer whitespace-nowrap">
                    {t('← Chọn lại', '← Back')}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'daily' as OccasionPref, vi: 'Tỉnh táo mỗi sáng', en: 'Daily morning fuel' },
                    { id: 'chill' as OccasionPref, vi: 'Thư giãn cuối tuần', en: 'Weekend slow brew' },
                    { id: 'gift' as OccasionPref, vi: 'Biếu tặng sang trọng', en: 'Premium gifting' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setOccasion(opt.id);
                        setStep(4);
                      }}
                      className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        occasion === opt.id
                          ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/8 dark:bg-[#C6A667]/12 text-[#00552B] dark:text-[#C6A667]'
                          : 'border-[#202020]/12 dark:border-white/12 hover:border-[#00552B]/50'
                      }`}
                    >
                      <span className="truncate">{t(opt.vi, opt.en)}</span>
                      <Check className="w-4 h-4 shrink-0 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/20 dark:border-[#C6A667]/25 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#00552B] dark:text-[#C6A667] inline-flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t('Tặng bạn mã làm quen ROARWELCOME10 (-10%)', 'Unlocked ROARWELCOME10 (-10% Off)')}</span>
                    </p>
                    <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70">
                      {t('Tự động áp dụng ngay khi bạn bấm "Chọn ngay" sản phẩm bên cạnh.', 'Automatically queued for checkout when you add your matched roast.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-white dark:hover:bg-white/10 cursor-pointer whitespace-nowrap"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('Chọn gu khác', 'Retake')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step Progress Dots */}
            <div className="flex items-center justify-between pt-2 border-t border-[#202020]/8 dark:border-white/10 text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">
              <div className="flex items-center gap-2">
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStep(n as 1 | 2 | 3)}
                    className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold cursor-pointer transition-colors ${
                      step >= n
                        ? 'bg-[#00552B] text-white'
                        : 'bg-[#F8F5EF] dark:bg-white/10 text-[#202020]/50 dark:text-[#F1EFEA]/50'
                    }`}
                  >
                    0{n}
                  </button>
                ))}
              </div>
              <Link to={localePath('/personalities')} className="font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap">
                {t('Xem 7 Cá tính Rang →', 'Explore 7 Personalities →')}
              </Link>
            </div>
          </div>

          {/* Right Live Matched Products */}
          <div className="lg:col-span-5 bg-[#EFECE4] dark:bg-[#0B120E] p-6 sm:p-7 border-t lg:border-t-0 lg:border-l border-[#202020]/10 dark:border-white/10 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667] inline-flex items-center gap-1.5">
                {step === 4 ? <Flame className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                <span>{step === 4 ? t('2 Lựa Chọn Chuẩn Gu Nhất', 'Top 2 Matched For You') : t('Gợi ý Trực Tiếp Theo Lựa Chọn', 'Live Taste Match')}</span>
              </span>
              <span className="text-[11px] font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums">
                {brew.toUpperCase()} · {taste.toUpperCase()}
              </span>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {matchedProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-3 flex items-center gap-3.5"
                >
                  <Link to={localePath(`/product/${p.slug}`)} className="w-16 h-20 rounded-lg overflow-hidden shrink-0 bg-[#F8F5EF]">
                    <MediaImage
                      imageKey={p.image_key}
                      alt={lang === 'vi' ? p.name_vi : p.name_en}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-[10px] font-mono text-[#00552B] dark:text-[#C6A667] truncate">
                      {p.sku} · {localizeCoffeeType(p.coffee_type, lang)}
                    </p>
                    <Link
                      to={localePath(`/product/${p.slug}`)}
                      className="block text-sm font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] truncate"
                    >
                      {lang === 'vi' ? p.name_vi : p.name_en}
                    </Link>
                    <p className="text-xs font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                      {formatPrice(p.price_vnd, p.price_usd)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(p)}
                    className="px-3 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t('Chọn ngay', 'Add')}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
