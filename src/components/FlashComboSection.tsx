import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock, Flame, Gift, PackageCheck, ShoppingBag, Sparkles, Tag, Wand2 } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { MediaImage } from './MediaImage';

interface FlashComboSectionProps {
  products: Product[];
}

interface CmsComboDto {
  id: number | string;
  slug: string;
  title_vi: string;
  title_en: string;
  desc_vi: string;
  desc_en: string;
  badge_text: string;
  discount_pct: number;
  promo_code: string;
  productSlugs: string[];
}

function getRemainingTimeToday() {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const diffSec = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const FlashComboSection: React.FC<FlashComboSectionProps> = ({ products }) => {
  const { lang, t, localePath } = useI18n();
  const { addToCart, formatPrice, setPendingVoucherCode, showToast, apiFetch } = useStore();
  const [countdown, setCountdown] = useState(getRemainingTimeToday);
  const [cmsCombos, setCmsCombos] = useState<CmsComboDto[]>([]);
  const [builderOpen, setBuilderOpen] = useState(false);

  // Custom 3-Step Mix & Match + Gift Card State
  const [pick1Slug, setPick1Slug] = useState('');
  const [pick2Slug, setPick2Slug] = useState('');
  const [cardTheme, setCardTheme] = useState<'gold' | 'emerald' | 'cream'>('gold');
  const [recipientName, setRecipientName] = useState('');
  const [giftNote, setGiftNote] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCountdown(getRemainingTimeToday());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    apiFetch('/api/combos')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (Array.isArray(d?.combos) && d.combos.length > 0) {
          setCmsCombos(d.combos);
        }
      })
      .catch(() => {});
  }, [apiFetch]);

  const retailProducts = useMemo(
    () => products.filter((p) => p.category !== 'green_bean' && p.status === 'active' && !p.slug.startsWith('gift-voucher-')),
    [products]
  );

  useEffect(() => {
    if (retailProducts.length >= 2 && !pick1Slug && !pick2Slug) {
      setPick1Slug(retailProducts[0].slug);
      setPick2Slug(retailProducts[1].slug);
    }
  }, [retailProducts, pick1Slug, pick2Slug]);

  const productBySlug = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const p of products) map[p.slug] = p;
    return map;
  }, [products]);

  // Pick 2 Fresh Roast highlights with clear stock visibility
  const freshRoastPicks = useMemo(() => {
    const preferred = ['signature-reserve', 'roar-phin-heritage', 'instant-gold-collection', 'roar-dam-bold'];
    const found: Product[] = [];
    for (const slug of preferred) {
      const match = retailProducts.find((p) => p.slug === slug);
      if (match) found.push(match);
      if (found.length >= 2) break;
    }
    if (found.length < 2) {
      for (const p of retailProducts) {
        if (!found.some((f) => f.id === p.id)) found.push(p);
        if (found.length >= 2) break;
      }
    }
    return found;
  }, [retailProducts]);

  // Resolve CMS combos against live products, or fallback to 3 curated bundles
  const curatedCombos = useMemo(() => {
    if (retailProducts.length < 2) return [];

    if (cmsCombos.length > 0) {
      return cmsCombos
        .map((c) => {
          const items = (c.productSlugs || []).map((s) => productBySlug[s]).filter(Boolean);
          if (items.length === 0) return null;
          const rawTotalVnd = items.reduce((s, p) => s + (p.variants?.[0]?.priceVnd || p.price_vnd), 0);
          const pct = Math.max(0, Math.min(50, Number(c.discount_pct ?? 12)));
          const discountedVnd = Math.round(rawTotalVnd * (1 - pct / 100));
          return {
            id: String(c.id),
            titleVi: c.title_vi,
            titleEn: c.title_en,
            descVi: c.desc_vi,
            descEn: c.desc_en,
            badgeText: c.badge_text || `${c.promo_code || 'ROARCOMBO12'} · -${pct}%`,
            promoCode: c.promo_code || 'ROARCOMBO12',
            discountPct: pct,
            items,
            rawTotalVnd,
            discountedVnd,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
        .slice(0, 3);
    }

    const findByCategories = (cats: string[], fallbackIdx: number) =>
      retailProducts.find((p) => cats.some((c) => `${p.slug} ${p.category}`.toLowerCase().includes(c))) ||
      retailProducts[fallbackIdx % retailProducts.length];

    const phin = findByCategories(['phin', 'dam-bold', 'roasted'], 0);
    const instant = findByCategories(['instant-gold', 'instant'], 1);
    const espresso = findByCategories(['espresso-gold', 'espresso'], 2);
    const arabica = findByCategories(['arabica', 'roasted_beans'], 3);
    const pepper = findByCategories(['tieu', 'pepper'], 4);
    const reserve = findByCategories(['signature-reserve', 'reserve'], 5);

    const makeBundle = (
      id: string,
      titleVi: string,
      titleEn: string,
      descVi: string,
      descEn: string,
      items: Product[]
    ) => {
      const unique = items.filter((item, idx, arr) => arr.findIndex((x) => x.id === item.id) === idx);
      const rawTotalVnd = unique.reduce((s, p) => s + (p.variants?.[0]?.priceVnd || p.price_vnd), 0);
      const discountedVnd = Math.round(rawTotalVnd * 0.88);
      return {
        id,
        titleVi,
        titleEn,
        descVi,
        descEn,
        badgeText: 'ROARCOMBO12 · -12%',
        promoCode: 'ROARCOMBO12',
        discountPct: 12,
        items: unique,
        rawTotalVnd,
        discountedVnd,
      };
    };

    return [
      makeBundle(
        'combo-morning',
        'Combo Sáng Bản Lĩnh',
        'Bold Morning Ritual Duo',
        'Rang xay Phin đậm đà + Hòa tan Gold tiện lợi cho cả ngày năng lượng.',
        'Traditional Phin roast paired with Gold Freeze-Dried Instant.',
        [phin, instant]
      ),
      makeBundle(
        'combo-chill',
        'Combo Chill Cuối Tuần',
        'Weekend Slow Chill Set',
        'Espresso Gold pha máy chuẩn quán kết hợp Arabica Selection cân bằng.',
        'Artisan Espresso Gold paired with aromatic Arabica balance.',
        [espresso, arabica]
      ),
      makeBundle(
        'combo-highland',
        'Combo Quà Cao Nguyên',
        'Highland Reserve Gift Set',
        'Bộ đôi Signature Reserve & Tiêu đen Tây Nguyên biếu tặng chuẩn sang.',
        'Signature Highland coffee & specialty pairing ready for gifting.',
        [reserve, pepper]
      ),
    ];
  }, [retailProducts, cmsCombos, productBySlug]);

  if (retailProducts.length === 0) return null;

  const pushProductToCart = (p: Product) => {
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
  };

  const addSingleRoast = (p: Product) => {
    pushProductToCart(p);
    showToast(t(`Đã thêm mẻ rang mới ${p.name_vi} vào giỏ`, `Added fresh batch ${p.name_en} to cart`));
  };

  const addBundle = (combo: (typeof curatedCombos)[number]) => {
    for (const p of combo.items) {
      pushProductToCart(p);
    }
    if (combo.promoCode) setPendingVoucherCode(combo.promoCode);
    showToast(
      t(
        `Đã thêm ${combo.titleVi}${combo.promoCode ? ` & gắn mã ${combo.promoCode} (-${combo.discountPct}%)` : ''}`,
        `Added ${combo.titleEn}${combo.promoCode ? ` & applied ${combo.promoCode} (-${combo.discountPct}%)` : ''}`
      )
    );
  };

  const pick1Product = productBySlug[pick1Slug] || retailProducts[0];
  const pick2Product = productBySlug[pick2Slug] || retailProducts[1] || retailProducts[0];
  const customRawVnd =
    (pick1Product ? pick1Product.variants?.[0]?.priceVnd || pick1Product.price_vnd : 0) +
    (pick2Product ? pick2Product.variants?.[0]?.priceVnd || pick2Product.price_vnd : 0);
  const customFinalVnd = Math.round(customRawVnd * 0.88);

  const addCustomMixBundle = () => {
    if (pick1Product) pushProductToCart(pick1Product);
    if (pick2Product) pushProductToCart(pick2Product);
    setPendingVoucherCode('ROARCOMBO12');
    const noteText = [
      recipientName.trim() ? `Gửi: ${recipientName.trim()}` : '',
      giftNote.trim() || '',
    ]
      .filter(Boolean)
      .join(' — ');
    if (noteText) {
      try {
        window.sessionStorage.setItem('roar_gift_card_note', `[Thiệp quà tặng ROAR] ${noteText}`);
      } catch {
        // ignore storage restrictions
      }
    }
    showToast(
      t(
        'Đã thêm Combo Tự Mix + Thiệp quà tặng & áp dụng mã ROARCOMBO12 (-12%)!',
        'Added Custom Combo + Gift Card & applied ROARCOMBO12 (-12%)!'
      )
    );
    setBuilderOpen(false);
  };

  return (
    <section id="combos" className="max-w-[1280px] mx-auto px-6 py-14 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#202020]/10 dark:border-white/10 pb-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667] inline-flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>{t('Mẻ Rang Trong Ngày & Bộ Combo -12%', 'Fresh Batch Today & -12% Combo Sets')}</span>
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] text-balance">
            {t('Ưu Đãi Mẻ Rang Mới & Combo Tiết Kiệm', 'Fresh Roast Drops & Curated Combos')}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setBuilderOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C6A667] hover:bg-[#d7b87a] text-[#111111] text-xs font-bold cursor-pointer transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{builderOpen ? t('Đóng Tự Mix Combo', 'Close Custom Mixer') : t('Tự Mix Combo + Thiệp Quà (-12%)', 'Build Custom Gift Combo (-12%)')}</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-[#C6A667]/25">
            <Clock className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />
            <span className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 whitespace-nowrap">
              {t('Còn:', 'Ends in:')}
            </span>
            <span className="font-mono text-sm font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
              {countdown}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive 3-Step Mix & Match Combo + Greeting Card Studio */}
      {builderOpen && (
        <div className="bg-white dark:bg-[#16221C] rounded-2xl border-2 border-[#C6A667]/60 p-5 sm:p-7 space-y-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">
                  {t('Tự Mix Combo Quà Tặng 3 Bước · Giảm Ngay 12%', '3-Step Custom Gift Combo · Instant -12%')}
                </h3>
                <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  {t(
                    'Chọn 2 sản phẩm yêu thích + viết thiệp chúc ROAR ép kim miễn phí.',
                    'Pair any 2 items and include a complimentary bespoke ROAR greeting card.'
                  )}
                </p>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#00552B] dark:text-[#C6A667]">
              ROARCOMBO12 · -12%
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Steps 1 & 2 */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#00552B] dark:text-[#C6A667] block">
                  {t('Bước 1 · Chọn Cà phê Chính', 'Step 1 · Primary Coffee')}
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {retailProducts.slice(0, 8).map((p) => {
                    const selected = pick1Slug === p.slug;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setPick1Slug(p.slug)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                          selected
                            ? 'border-[#00552B] bg-[#00552B]/10 dark:border-[#C6A667] dark:bg-[#C6A667]/15'
                            : 'border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40'
                        }`}
                      >
                        <div className="w-9 h-10 rounded overflow-hidden shrink-0 bg-[#F8F5EF]">
                          <MediaImage imageKey={p.image_key} alt={p.name_vi} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{lang === 'vi' ? p.name_vi : p.name_en}</p>
                          <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">
                            {formatPrice(p.variants?.[0]?.priceVnd || p.price_vnd)}
                          </p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-[#00552B] dark:text-[#C6A667] block">
                  {t('Bước 2 · Chọn Món Ghép Cặp', 'Step 2 · Companion Pairing')}
                </span>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {retailProducts.slice(0, 10).map((p) => {
                    const selected = pick2Slug === p.slug;
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => setPick2Slug(p.slug)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition-colors ${
                          selected
                            ? 'border-[#00552B] bg-[#00552B]/10 dark:border-[#C6A667] dark:bg-[#C6A667]/15'
                            : 'border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40'
                        }`}
                      >
                        <div className="w-9 h-10 rounded overflow-hidden shrink-0 bg-[#F8F5EF]">
                          <MediaImage imageKey={p.image_key} alt={p.name_vi} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{lang === 'vi' ? p.name_vi : p.name_en}</p>
                          <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">
                            {formatPrice(p.variants?.[0]?.priceVnd || p.price_vnd)}
                          </p>
                        </div>
                        {selected && <Check className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Live Gift Card Preview + Add */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold text-[#00552B] dark:text-[#C6A667] block">
                {t('Bước 3 · Thiết Kế Thiệp Quà ROAR Miễn Phí', 'Step 3 · Custom Complimentary Gift Card')}
              </span>

              <div className="flex items-center gap-2 text-[11px]">
                {(
                  [
                    { id: 'gold', vi: 'Vàng Kim', en: 'Gold Foil' },
                    { id: 'emerald', vi: 'Xanh Rừng', en: 'Forest Emerald' },
                    { id: 'cream', vi: 'Kem Mộc', en: 'Warm Ivory' },
                  ] as const
                ).map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setCardTheme(th.id)}
                    className={`px-2.5 py-1 rounded border font-semibold cursor-pointer ${
                      cardTheme === th.id
                        ? 'bg-[#00552B] text-white border-[#00552B]'
                        : 'border-[#202020]/15 dark:border-white/15'
                    }`}
                  >
                    {t(th.vi, th.en)}
                  </button>
                ))}
              </div>

              {/* Live Card Preview */}
              <div
                className={`rounded-xl p-4 border transition-colors space-y-2 ${
                  cardTheme === 'emerald'
                    ? 'bg-[#003D25] text-[#F8F5EF] border-[#C6A667]/50'
                    : cardTheme === 'gold'
                    ? 'bg-gradient-to-br from-[#231C10] to-[#3B2E17] text-[#F8F5EF] border-[#C6A667]'
                    : 'bg-[#F8F5EF] text-[#202020] border-[#C6A667]/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest opacity-80">
                  <span>ROAR COFFEE® RESERVE CARD</span>
                  <Sparkles className="w-3.5 h-3.5 text-[#C6A667]" />
                </div>
                <p className="text-xs font-semibold">
                  {recipientName.trim()
                    ? t(`Gửi tới: ${recipientName.trim()}`, `To: ${recipientName.trim()}`)
                    : t('Gửi tới: Người bạn trân quý', 'To: Someone Special')}
                </p>
                <p className="text-xs italic opacity-85 min-h-[2.25rem]">
                  “
                  {giftNote.trim() ||
                    t(
                      'Chúc bạn mỗi sáng luôn tràn đầy năng lượng cùng hương vị cà phê Cao nguyên Việt Nam.',
                      'Wishing you energized mornings with authentic Vietnamese Highland coffee.'
                    )}
                  ”
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder={t('Tên người nhận (tuỳ chọn)', 'Recipient name (optional)')}
                  className="bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2"
                />
                <input
                  type="text"
                  value={giftNote}
                  onChange={(e) => setGiftNote(e.target.value)}
                  placeholder={t('Lời chúc in lên thiệp...', 'Personal card message...')}
                  className="bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-[#202020]/10 dark:border-white/10">
                <div className="font-mono tabular-nums">
                  <span className="text-xs line-through text-[#202020]/45 dark:text-[#F1EFEA]/45 block">
                    {formatPrice(customRawVnd)}
                  </span>
                  <span className="text-base font-bold text-[#00552B] dark:text-[#C6A667]">
                    {formatPrice(customFinalVnd)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={addCustomMixBundle}
                  className="px-4 py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{t('Thêm Combo Tự Mix vào giỏ', 'Add Custom Combo')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fresh Roast Batches + Curated Combos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 2 Today's Fresh Roast Spotlights */}
        <div className="lg:col-span-5 space-y-4">
          {freshRoastPicks.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 flex items-center gap-4"
            >
              <Link to={localePath(`/product/${p.slug}`)} className="w-20 h-24 rounded-lg overflow-hidden shrink-0 bg-[#F8F5EF]">
                <MediaImage
                  imageKey={p.image_key}
                  alt={lang === 'vi' ? p.name_vi : p.name_en}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] truncate">
                  {t('Rang mới 24h', 'Roasted <24h')} · {t(`Còn ${Math.max(8, Math.min(48, p.inventory || 18))} túi`, `${Math.max(8, Math.min(48, p.inventory || 18))} bags left`)}
                </p>
                <Link
                  to={localePath(`/product/${p.slug}`)}
                  className="block text-sm font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] truncate"
                >
                  {lang === 'vi' ? p.name_vi : p.name_en}
                </Link>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                    {formatPrice(p.price_vnd, p.price_usd)}
                  </span>
                  <button
                    type="button"
                    onClick={() => addSingleRoast(p)}
                    className="px-3 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{t('Đặt mẻ mới', 'Order Fresh')}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: 3 Curated 1-Click Combos (Managed via Admin CMS) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {curatedCombos.map((combo) => (
            <div
              key={combo.id}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-[#C6A667]/25 p-4 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {combo.items.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      to={localePath(`/product/${item.slug}`)}
                      className="aspect-[4/5] rounded-lg overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10"
                    >
                      <MediaImage
                        imageKey={item.image_key}
                        alt={lang === 'vi' ? item.name_vi : item.name_en}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-mono text-[#00552B] dark:text-[#C6A667] font-semibold inline-flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{combo.badgeText}</span>
                  </p>
                  <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] leading-snug">
                    {t(combo.titleVi, combo.titleEn)}
                  </h3>
                  <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 line-clamp-2">
                    {t(combo.descVi, combo.descEn)}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#202020]/8 dark:border-white/10 space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs line-through text-[#202020]/45 dark:text-[#F1EFEA]/45 tabular-nums">
                    {formatPrice(combo.rawTotalVnd)}
                  </span>
                  <span className="text-sm font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                    {formatPrice(combo.discountedVnd)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => addBundle(combo)}
                  className="w-full py-2 px-3 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>{t('Chọn trọn Combo', 'Add Combo')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
