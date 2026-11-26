import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Coffee, Flame, History, RefreshCw, ShoppingBag, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { MediaImage } from './MediaImage';

interface RecommendationItem {
  product: Product;
  matchScore: number;
  isRepurchase: boolean;
  reasonVi: string;
  reasonEn: string;
}

interface TastePrefState {
  brewMethods: string[];
  roastLevel: string;
  flavorNotes: string[];
}

const PREF_STORAGE_KEY = 'roar_guest_taste_pref_v1';
const RECENT_SLUGS_KEY = 'roar_recent_viewed_slugs';

const BREW_CHOICES = [
  { id: 'phin', vi: 'Pha Phin', en: 'Vietnamese Phin' },
  { id: 'espresso', vi: 'Espresso Máy', en: 'Espresso' },
  { id: 'pourover', vi: 'Pour-Over / V60', en: 'Pour-Over / V60' },
  { id: 'coldbrew', vi: 'Cold Brew', en: 'Cold Brew' },
  { id: 'instant', vi: 'Hòa tan tiện lợi', en: 'Instant' },
];

const ROAST_CHOICES = [
  { id: 'light', vi: 'Rang Sáng (Chua thanh)', en: 'Light (Bright)' },
  { id: 'medium_dark', vi: 'Rang Vừa-Đậm (Cân bằng)', en: 'Medium-Dark (Balanced)' },
  { id: 'dark', vi: 'Rang Đậm (Đắng dày)', en: 'Dark (Bold)' },
];

const FLAVOR_CHOICES = [
  { id: 'bold', vi: 'Đậm mạnh tỉnh táo', en: 'Bold & Energetic' },
  { id: 'chocolate', vi: 'Cacao & Hạt rang', en: 'Cocoa & Nutty' },
  { id: 'fruity', vi: 'Trái cây & Hoa thơm', en: 'Fruity & Floral' },
  { id: 'creamy', vi: 'Ngọt mượt / Sữa đá', en: 'Creamy / Milk' },
];

interface PersonalizedPicksSectionProps {
  compact?: boolean;
}

export const PersonalizedPicksSection: React.FC<PersonalizedPicksSectionProps> = ({ compact = false }) => {
  const { lang, t, localePath } = useI18n();
  const { user, apiFetch, addToCart, formatPrice, showToast } = useStore();

  const [prefs, setPrefs] = useState<TastePrefState>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREF_STORAGE_KEY) || 'null');
      if (saved && Array.isArray(saved.brewMethods)) return saved;
    } catch {}
    return { brewMethods: ['phin'], roastLevel: 'medium_dark', flavorNotes: ['chocolate', 'bold'] };
  });

  const [showTuner, setShowTuner] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasOrderHistory, setHasOrderHistory] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [repurchaseItems, setRepurchaseItems] = useState<RecommendationItem[]>([]);

  // Load saved server preferences for logged-in member
  useEffect(() => {
    if (!user) return;
    apiFetch('/api/account/preferences')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.preferences) {
          setPrefs({
            brewMethods: Array.isArray(d.preferences.brewMethods) && d.preferences.brewMethods.length > 0 ? d.preferences.brewMethods : ['phin'],
            roastLevel: d.preferences.roastLevel || 'medium_dark',
            flavorNotes: Array.isArray(d.preferences.flavorNotes) ? d.preferences.flavorNotes : ['chocolate'],
          });
        }
      })
      .catch(() => {});
  }, [user, apiFetch]);

  const loadRecommendations = useCallback(
    async (activePrefs: TastePrefState) => {
      setLoading(true);
      try {
        let recentSlugs: string[] = [];
        try {
          const raw = JSON.parse(localStorage.getItem(RECENT_SLUGS_KEY) || '[]');
          if (Array.isArray(raw)) recentSlugs = raw.slice(0, 8);
        } catch {}

        const qs = new URLSearchParams();
        if (activePrefs.brewMethods.length > 0) qs.set('brew', activePrefs.brewMethods.join(','));
        if (activePrefs.roastLevel) qs.set('roast', activePrefs.roastLevel);
        if (activePrefs.flavorNotes.length > 0) qs.set('flavor', activePrefs.flavorNotes.join(','));
        if (recentSlugs.length > 0) qs.set('recentSlugs', recentSlugs.join(','));

        const res = await apiFetch(`/api/recommendations/personalized?${qs.toString()}`);
        if (res.ok) {
          const d = await res.json();
          setRecommendations(Array.isArray(d.recommendations) ? d.recommendations : []);
          setRepurchaseItems(Array.isArray(d.repurchaseItems) ? d.repurchaseItems : []);
          setHasOrderHistory(Boolean(d.hasOrderHistory));
        }
      } finally {
        setLoading(false);
      }
    },
    [apiFetch]
  );

  useEffect(() => {
    loadRecommendations(prefs);
  }, [prefs, loadRecommendations]);

  const toggleMulti = (field: 'brewMethods' | 'flavorNotes', value: string) => {
    setPrefs((prev) => {
      const exists = prev[field].includes(value);
      const nextList = exists
        ? prev[field].length > 1
          ? prev[field].filter((x) => x !== value)
          : prev[field]
        : [...prev[field], value];
      const next = { ...prev, [field]: nextList };
      localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const setRoast = (roastLevel: string) => {
    setPrefs((prev) => {
      const next = { ...prev, roastLevel };
      localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSavePrefs = async () => {
    localStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(prefs));
    if (user) {
      setSavingPrefs(true);
      try {
        const res = await apiFetch('/api/account/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs),
        });
        if (res.ok) {
          showToast(t('Đã lưu Hồ sơ Gu Cà Phê của bạn!', 'Saved your Personal Coffee Taste Profile!'));
        }
      } finally {
        setSavingPrefs(false);
      }
    } else {
      showToast(t('Đã cập nhật gợi ý theo gu thưởng thức của bạn!', 'Updated recommendations to match your taste!'));
    }
    setShowTuner(false);
    await loadRecommendations(prefs);
  };

  const handleQuickAdd = (product: Product) => {
    const firstVar = product.variants?.[0];
    const isPerKg = (product.pricing_tiers?.length || 0) > 0 || product.category === 'green_bean';
    addToCart({
      productId: product.id,
      slug: product.slug,
      sku: product.sku,
      nameVi: product.name_vi,
      nameEn: product.name_en,
      variantLabel: firstVar ? firstVar.label : isPerKg ? '1 kg' : 'Standard',
      unitPriceVnd: firstVar ? firstVar.priceVnd : product.price_vnd,
      unitPriceUsd: firstVar ? firstVar.priceUsd : product.price_usd,
      quantity: 1,
      imageKey: product.image_key,
      unit: isPerKg ? 'kg' : 'unit',
      pricingTiers: product.pricing_tiers,
    });
    showToast(t(`Đã thêm ${product.name_vi} vào giỏ hàng`, `Added ${product.name_en} to cart`));
  };

  const visibleItems = compact ? recommendations.slice(0, 3) : recommendations.slice(0, 6);

  return (
    <section className={compact ? 'space-y-5' : 'max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-6'}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#202020]/10 dark:border-white/10 pb-5">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {user
              ? t(`Cá Nhân Hóa Dành Riêng Cho ${user.fullName.split(' ').slice(-1)[0]}`, `Personalized For ${user.fullName.split(' ').slice(-1)[0]}`)
              : t('Gợi Ý Cá Nhân Hóa Theo Gu Thưởng Thức', 'Personalized Coffee Recommendations')}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] tracking-tight">
            {hasOrderHistory
              ? t('Đề Xuất Chuẩn Gu & Đặt Lại Món Quen', 'Tailored Picks & Quick Reorders')
              : t('Chọn Đúng Dòng Cà Phê Hợp Khẩu Vị Bạn', 'Matched To Your Brewing Ritual & Palate')}
          </h2>
          <p className="text-xs sm:text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70 max-w-2xl">
            {hasOrderHistory
              ? t(
                  'Hệ thống tự động phân tích lịch sử đơn hàng, cách pha và độ rang yêu thích của bạn để đề xuất mẻ rang phù hợp nhất.',
                  'Automatically curated from your past order history, brew methods, and saved taste profile.'
                )
              : t(
                  'Chỉnh nhanh cách pha & hương vị yêu thích bên cạnh — hệ thống sẽ xếp hạng mức độ hợp gu cho từng sản phẩm ROAR.',
                  'Tune your brew method and tasting notes to rank ROAR coffees by personal match score.'
                )}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTuner((s) => !s)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#00552B]/30 dark:border-[#C6A667]/40 bg-white dark:bg-[#16221C] text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white dark:hover:bg-[#C6A667] dark:hover:text-[#111111] transition-colors cursor-pointer shrink-0 whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>{showTuner ? t('Thu gọn bộ lọc Gu', 'Hide Taste Tuner') : t('Tùy chỉnh Gu thưởng thức', 'Tune My Taste Profile')}</span>
        </button>
      </div>

      {/* Collapsible Personal Taste Profile Tuner */}
      {showTuner && (
        <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#00552B]/25 dark:border-[#C6A667]/30 p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#202020]/70 dark:text-[#F1EFEA]/70 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                {t('1. Dụng cụ / Cách pha', '1. Brew Methods')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BREW_CHOICES.map((b) => {
                  const active = prefs.brewMethods.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleMulti('brewMethods', b.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#00552B] text-white'
                          : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/80 dark:text-[#F1EFEA]/80 border border-[#202020]/10 dark:border-white/10'
                      }`}
                    >
                      {lang === 'en' ? b.en : b.vi}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#202020]/70 dark:text-[#F1EFEA]/70 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                {t('2. Mức rang ưa thích', '2. Roast Level')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ROAST_CHOICES.map((r) => {
                  const active = prefs.roastLevel === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRoast(r.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#00552B] text-white'
                          : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/80 dark:text-[#F1EFEA]/80 border border-[#202020]/10 dark:border-white/10'
                      }`}
                    >
                      {lang === 'en' ? r.en : r.vi}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-[#202020]/70 dark:text-[#F1EFEA]/70 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                {t('3. Nốt hương yêu thích', '3. Flavor Notes')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FLAVOR_CHOICES.map((f) => {
                  const active = prefs.flavorNotes.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggleMulti('flavorNotes', f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#00552B] text-white'
                          : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/80 dark:text-[#F1EFEA]/80 border border-[#202020]/10 dark:border-white/10'
                      }`}
                    >
                      {lang === 'en' ? f.en : f.vi}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#202020]/10 dark:border-white/10">
            <button
              type="button"
              onClick={handleSavePrefs}
              disabled={savingPrefs}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {savingPrefs
                  ? t('Đang lưu...', 'Saving...')
                  : user
                    ? t('Lưu vào tài khoản & Gợi ý ngay', 'Save to Account & Refresh Picks')
                    : t('Áp dụng Gu & Xem gợi ý', 'Apply Taste Profile')}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Reorder Strip for Returning Buyers */}
      {repurchaseItems.length > 0 && (
        <div className="bg-[#003D25] text-[#F8F5EF] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#C6A667] shrink-0">
              <History className="w-5 h-5" />
            </span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C6A667]">
                {t('Đặt lại nhanh 1 chạm', '1-Tap Quick Reorder')}
              </p>
              <p className="text-sm font-bold">
                {t('Các dòng cà phê quen thuộc từ lịch sử mua hàng của bạn', 'Your frequently ordered favorites ready to restock')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {repurchaseItems.map((item) => (
              <button
                key={item.product.id}
                type="button"
                onClick={() => handleQuickAdd(item.product)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-[#C6A667] hover:text-[#111111] text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? item.product.name_en : item.product.name_vi}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Personalized Cards Grid */}
      {loading && visibleItems.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-72 rounded-2xl bg-white/70 dark:bg-[#16221C]/70 border border-[#202020]/10 dark:border-white/10 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visibleItems.map((item) => {
            const p = item.product;
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40 transition-colors"
              >
                <div>
                  <Link
                    to={localePath(`/product/${p.slug}`)}
                    className="block relative aspect-[4/3] bg-[#EFECE4] dark:bg-[#0E1512] overflow-hidden"
                  >
                    <MediaImage
                      imageKey={p.image_key}
                      alt={lang === 'en' ? p.name_en : p.name_vi}
                      className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-200"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#003D25]/92 text-[#C6A667] text-[11px] font-mono font-bold tabular-nums">
                      {item.matchScore}% {t('hợp gu', 'match')}
                    </div>
                  </Link>

                  <div className="p-4 sm:p-5 space-y-2">
                    <p className="text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {lang === 'en' ? item.reasonEn : item.reasonVi}
                    </p>
                    <Link
                      to={localePath(`/product/${p.slug}`)}
                      className="block text-base font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] line-clamp-1"
                    >
                      {lang === 'en' ? p.name_en : p.name_vi}
                    </Link>
                    <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 line-clamp-2">
                      {lang === 'en' ? p.tasting_notes_en || p.subtitle_en : p.tasting_notes_vi || p.subtitle_vi}
                    </p>
                  </div>
                </div>

                <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-[#202020]/8 dark:border-white/10 flex items-center justify-between gap-2">
                  <span className="text-base font-bold font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">
                    {formatPrice(p.variants?.[0]?.priceVnd || p.price_vnd, p.variants?.[0]?.priceUsd || p.price_usd)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(p)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{item.isRepurchase ? t('Đặt lại', 'Reorder') : t('Thêm giỏ', 'Add')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
