import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Gift, Heart, Printer, Search } from 'lucide-react';
import { GiftVoucherModal } from '../components/GiftVoucherModal';
import { MediaImage } from '../components/MediaImage';
import { RecentlyViewedStrip } from '../components/RecentlyViewedStrip';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { parseCategoryBanners } from '../lib/categoryBanners';
import { localizeCoffeeType } from '../lib/i18nHelpers';
import { getTierPriceRange, resolveVolumeTier } from '../lib/pricing';
import { printB2BQuoteSheet } from '../lib/printDocuments';
import { fetchProductsWithFallback } from '../lib/staticFallback';

interface ShopPageProps {
  defaultCategory?: 'all' | 'roasted' | 'roasted_beans' | 'instant' | 'pepper' | 'green_bean' | 'gift_voucher';
}

export const ShopPage: React.FC<ShopPageProps> = ({ defaultCategory = 'all' }) => {
  const { lang, t, localePath } = useI18n();
  const { settings, formatPrice, currency, setCurrency, addToCart, wishlist, toggleWishlist, showToast } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlCat = searchParams.get('category');
  const [category, setCategory] = useState<string>(urlCat || defaultCategory);
  const [search, setSearch] = useState<string>(searchParams.get('q') || '');
  const [mascotFilter, setMascotFilter] = useState<string>('');
  const [gcTypeFilter, setGcTypeFilter] = useState<string>(searchParams.get('type') || 'all');
  const [gcScreenFilter, setGcScreenFilter] = useState<string>(searchParams.get('screen') || 'all');
  const [gcProcFilter, setGcProcFilter] = useState<string>(searchParams.get('proc') || 'all');
  const [kgByProduct, setKgByProduct] = useState<Record<number, number>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [giftModalProduct, setGiftModalProduct] = useState<Product | null>(null);
  const [giftModalMode, setGiftModalMode] = useState<'self' | 'gift'>('gift');
  const [catBannerIdx, setCatBannerIdx] = useState(0);

  const matchingCategoryBanners = useMemo(
    () =>
      parseCategoryBanners(settings?.cms_category_banners_json).filter(
        (b) => b.categoryKey === category && b.visible
      ),
    [settings?.cms_category_banners_json, category]
  );

  useEffect(() => {
    setCategory(urlCat || defaultCategory);
    setCatBannerIdx(0);
  }, [defaultCategory, urlCat]);

  useEffect(() => {
    if (matchingCategoryBanners.length <= 1) return;
    const timer = window.setInterval(() => {
      setCatBannerIdx((prev) => (prev + 1) % matchingCategoryBanners.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [matchingCategoryBanners.length]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearch(q);
    setGcTypeFilter(searchParams.get('type') || 'all');
    setGcScreenFilter(searchParams.get('screen') || 'all');
    setGcProcFilter(searchParams.get('proc') || 'all');
  }, [searchParams]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    if (mascotFilter) params.set('mascot', mascotFilter);
    if (category === 'green_bean') {
      if (gcTypeFilter !== 'all') params.set('coffee_type', gcTypeFilter);
      if (gcScreenFilter !== 'all') params.set('screen', gcScreenFilter);
      if (gcProcFilter !== 'all') params.set('processing', gcProcFilter);
    }

    fetchProductsWithFallback(params)
      .then((list) => setProducts(list))
      .finally(() => setLoading(false));
  }, [category, search, mascotFilter, gcTypeFilter, gcScreenFilter, gcProcFilter]);

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-5 sm:py-10 space-y-3.5 sm:space-y-7">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-2.5 sm:gap-4 border-b border-[#202020]/10 dark:border-white/10 pb-3.5 sm:pb-6">
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
            {t('Danh mục Sản phẩm Chính thức', 'Official ROAR COFFEE Catalog')}
          </p>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] leading-tight text-balance">
            {category === 'roasted'
              ? t('Cà Phê Rang Xay', 'Roasted Coffee Collections')
              : category === 'roasted_beans'
              ? t('Cà Phê Hạt Rang (Giá Theo Kg)', 'Roasted Coffee Beans (Volume Tiers)')
              : category === 'instant'
              ? t('Cà Phê Hòa Tan Silver & Gold', 'Instant Coffee — Silver & Gold')
              : category === 'pepper'
              ? t('Tiêu Đen & Tiêu Sọ Tây Nguyên', 'Highland Black & White Pepper')
              : category === 'green_bean'
              ? t('Cà Phê Nhân Xanh (Giá Theo Kg)', 'Green Coffee Beans (Per Kg Catalog)')
              : category === 'gift_voucher'
              ? t('Thẻ Quà Tặng ROAR Gift Voucher', 'ROAR Gift Vouchers')
              : t('Tất Cả Sản Phẩm Cà Phê', 'All Coffee Products')}
          </h1>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3">
          <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded-md overflow-hidden text-[11px] sm:text-xs font-mono shrink-0">
            <button
              type="button"
              onClick={() => setCurrency('VND')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 cursor-pointer ${currency === 'VND' ? 'bg-[#00552B] text-white' : 'bg-white dark:bg-[#16221C] text-[#202020] dark:text-[#F1EFEA]'}`}
            >
              VND (₫)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 cursor-pointer ${currency === 'USD' ? 'bg-[#00552B] text-white' : 'bg-white dark:bg-[#16221C] text-[#202020] dark:text-[#F1EFEA]'}`}
            >
              USD ($)
            </button>
          </div>

          {category === 'roasted_beans' && products.length > 0 && (
            <button
              type="button"
              onClick={() =>
                printB2BQuoteSheet({
                  titleVi: 'Bảng Báo Giá Cà Phê Hạt Rang 5 Mức Sản Lượng (kg)',
                  titleEn: 'Roasted Coffee Beans — 5-Tier Volume Quotation (kg)',
                  subtitleVi: 'Áp dụng cho Quán Cà Phê, HORECA, Văn Phòng & Khách Sỉ ROAR COFFEE',
                  subtitleEn: 'Commercial wholesale schedule for Cafes, HORECA & Offices',
                  products: products.filter((p) => (p.pricing_tiers?.length || 0) > 0),
                  lang,
                  mode: 'roasted_beans',
                  formatPrice,
                  companySettings: settings,
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] text-[11px] sm:text-xs font-semibold rounded hover:bg-[#00552B]/8 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('In Báo Giá Kg (PDF)', 'Export Kg Quote')}</span>
            </button>
          )}

          <Link
            to={localePath('/coffee/green-beans')}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#003D25] text-[#C6A667] text-[11px] sm:text-xs font-semibold rounded hover:bg-[#00552B] transition-colors whitespace-nowrap"
          >
            <span className="sm:hidden">{t('Ma trận 27 SKUs →', '27-SKU Matrix →')}</span>
            <span className="hidden sm:inline">{t('Mở Ma Trận Nhân Xanh (27 SKUs) →', 'B2B Green Beans Matrix →')}</span>
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-4 items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 rounded-lg overflow-x-auto no-scrollbar lg:flex-wrap">
          {[
            { id: 'all', vi: 'Tất cả', en: 'All', to: '/shop' },
            { id: 'roasted', vi: 'Cà phê Rang Xay', en: 'Roasted Coffee', to: '/coffee/roasted' },
            { id: 'roasted_beans', vi: 'Cà phê Hạt Rang (kg)', en: 'Roasted Beans (kg)', to: '/coffee/roasted-beans' },
            { id: 'green_bean', vi: 'Cà phê Nhân Xanh', en: 'Green Coffee', to: '/coffee/green-coffee' },
            { id: 'instant', vi: 'Cà phê Hòa Tan', en: 'Instant Coffee', to: '/coffee/instant' },
            { id: 'pepper', vi: 'Tiêu Tây Nguyên', en: 'Highland Pepper', to: '/coffee/pepper' },
            { id: 'gift_voucher', vi: 'Gift Voucher', en: 'Gift Voucher', to: '/coffee/gift-vouchers' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setCategory(tab.id);
                navigate(localePath(tab.to));
              }}
              className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                category === tab.id ? 'bg-[#00552B] text-white' : 'text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:text-[#202020] dark:hover:text-white'
              }`}
            >
              {t(tab.vi, tab.en)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {category !== 'green_bean' && (
            <select
              value={mascotFilter}
              onChange={(e) => setMascotFilter(e.target.value)}
              aria-label={t('Lọc theo cá tính', 'Filter by personality')}
              className="bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs text-[#202020] dark:text-[#F1EFEA] max-w-[140px] sm:max-w-none shrink-0"
            >
              <option value="">{t('Tất cả Cá tính', 'All Personalities')}</option>
              <option value="tiger">{t('Hổ (Vị đậm bản lĩnh)', 'Tiger (Bold)')}</option>
              <option value="lion">{t('Sư tử (Chuẩn Phin)', 'Lion (Phin)')}</option>
              <option value="fox">{t('Cáo (Espresso)', 'Fox (Espresso)')}</option>
              <option value="eagle">{t('Đại bàng (Espresso Gold)', 'Eagle (Espresso Gold)')}</option>
              <option value="black-panther">{t('Báo đen (Signature Reserve)', 'Black Panther (Reserve)')}</option>
            </select>
          )}

          <div className="relative flex-1 min-w-0 sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#202020]/45 dark:text-[#F1EFEA]/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm tên sản phẩm, mã SKU...', 'Search product or SKU...')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg pl-8 sm:pl-9 pr-3 py-1.5 sm:py-2 text-xs text-[#202020] dark:text-[#F1EFEA] focus:outline-none focus:border-[#00552B] dark:focus:border-[#C6A667]"
            />
          </div>
        </div>
      </div>

      {/* Category Showcase Banner (Managed via Admin CMS -> Banner Danh Mục Sản Phẩm) */}
      {(() => {
        if (matchingCategoryBanners.length === 0) return null;
        const safeIdx = catBannerIdx % matchingCategoryBanners.length;
        const activeBanner = matchingCategoryBanners[safeIdx];
        const eyebrow = lang === 'en' ? activeBanner.eyebrowEn : activeBanner.eyebrowVi;
        const title = lang === 'en' ? activeBanner.titleEn : activeBanner.titleVi;
        const subtitle = lang === 'en' ? activeBanner.subtitleEn : activeBanner.subtitleVi;
        const ctaLabel = lang === 'en' ? activeBanner.ctaLabelEn : activeBanner.ctaLabelVi;

        return (
          <section className="relative rounded-xl overflow-hidden bg-[#0D1B14] border border-[#00552B]/25 dark:border-[#C6A667]/25 shadow-sm grid grid-cols-12 items-stretch min-h-[96px] sm:h-[112px] lg:h-[118px]">
            <div className="col-span-8 lg:col-span-8 px-3.5 py-2.5 sm:px-5 sm:py-3 lg:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 min-w-0">
              <div className="min-w-0 space-y-0.5 sm:space-y-1">
                {eyebrow && (
                  <p className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C6A667] truncate">
                    {eyebrow}
                  </p>
                )}
                <h2 className="text-[13px] sm:text-base lg:text-lg font-bold text-white leading-snug line-clamp-1">
                  {title}
                </h2>
                {subtitle && (
                  <p className="hidden md:block text-xs text-[#F1EFEA]/75 leading-snug line-clamp-1 max-w-2xl">
                    {subtitle}
                  </p>
                )}
              </div>

              {ctaLabel && activeBanner.ctaPath && (
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={localePath(activeBanner.ctaPath)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-[#C6A667] hover:bg-[#d5b578] text-[#111111] text-[10px] sm:text-xs font-bold rounded transition-colors whitespace-nowrap"
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </Link>
                </div>
              )}
            </div>

            <div className="col-span-4 lg:col-span-4 relative bg-[#09120D] overflow-hidden">
              <MediaImage
                imageKey={activeBanner.imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B14] via-[#0D1B14]/30 to-transparent pointer-events-none" />
              {matchingCategoryBanners.length > 1 && (
                <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 bg-black/55 border border-white/20 rounded-full px-1.5 py-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCatBannerIdx((prev) => (prev - 1 + matchingCategoryBanners.length) % matchingCategoryBanners.length)
                    }
                    aria-label={t('Banner trước', 'Previous banner')}
                    className="p-0.5 text-white hover:text-[#C6A667] cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] text-white/90 px-1 tabular-nums">
                    {safeIdx + 1}/{matchingCategoryBanners.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCatBannerIdx((prev) => (prev + 1) % matchingCategoryBanners.length)}
                    aria-label={t('Banner tiếp', 'Next banner')}
                    className="p-0.5 text-white hover:text-[#C6A667] cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Inline Green Coffee Technical Sub-Filters (compact 3-col dropdowns on mobile; quick buttons on md+) */}
      {category === 'green_bean' && (
        <>
          <div className="grid grid-cols-3 gap-1.5 md:hidden">
            <select
              value={gcTypeFilter}
              onChange={(e) => setGcTypeFilter(e.target.value)}
              aria-label={t('Dòng hạt', 'Bean Type')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#202020] dark:text-[#F1EFEA]"
            >
              <option value="all">{t('Hạt: Tất cả', 'Type: All')}</option>
              <option value="Robusta">Robusta</option>
              <option value="Arabica">Arabica</option>
              <option value="Culi">Culi</option>
            </select>

            <select
              value={gcScreenFilter}
              onChange={(e) => setGcScreenFilter(e.target.value)}
              aria-label={t('Cỡ sàng', 'Screen Size')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#202020] dark:text-[#F1EFEA]"
            >
              <option value="all">{t('Sàng: Tất cả', 'Screen: All')}</option>
              <option value="S14">S14</option>
              <option value="S16">S16</option>
              <option value="S18">S18</option>
            </select>

            <select
              value={gcProcFilter}
              onChange={(e) => setGcProcFilter(e.target.value)}
              aria-label={t('Chế biến', 'Processing')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg px-2 py-1.5 text-[11px] font-medium text-[#202020] dark:text-[#F1EFEA]"
            >
              <option value="all">{t('Chế biến: Tất cả', 'Proc: All')}</option>
              <option value="NAT">Natural (NAT)</option>
              <option value="HON">Honey (HON)</option>
              <option value="CBU">Washed (CBU)</option>
            </select>
          </div>

          <div className="hidden md:flex bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65 mr-1">{t('Dòng hạt:', 'Type:')}</span>
                {[
                  { id: 'all', label: t('Tất cả', 'All') },
                  { id: 'Robusta', label: 'Robusta' },
                  { id: 'Arabica', label: 'Arabica' },
                  { id: 'Culi', label: 'Culi' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGcTypeFilter(opt.id)}
                    className={`px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                      gcTypeFilter === opt.id
                        ? 'bg-[#00552B] text-white border-[#00552B] font-semibold'
                        : 'border-[#202020]/15 dark:border-white/15 hover:border-[#00552B]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65 mr-1">{t('Cỡ sàng:', 'Screen:')}</span>
                {['all', 'S14', 'S16', 'S18'].map((sc) => (
                  <button
                    key={sc}
                    type="button"
                    onClick={() => setGcScreenFilter(sc)}
                    className={`px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                      gcScreenFilter === sc
                        ? 'bg-[#00552B] text-white border-[#00552B] font-semibold'
                        : 'border-[#202020]/15 dark:border-white/15 hover:border-[#00552B]'
                    }`}
                  >
                    {sc === 'all' ? t('Tất cả', 'All') : sc}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65 mr-1">{t('Chế biến:', 'Process:')}</span>
                {[
                  { id: 'all', label: t('Tất cả', 'All') },
                  { id: 'NAT', label: 'Natural (NAT)' },
                  { id: 'HON', label: 'Honey (HON)' },
                  { id: 'CBU', label: 'Washed (CBU)' },
                ].map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setGcProcFilter(pr.id)}
                    className={`px-2.5 py-1 rounded border cursor-pointer transition-colors ${
                      gcProcFilter === pr.id
                        ? 'bg-[#00552B] text-white border-[#00552B] font-semibold'
                        : 'border-[#202020]/15 dark:border-white/15 hover:border-[#00552B]'
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            <Link
              to={localePath('/coffee/green-beans')}
              className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
            >
              {t('Chuyển sang Bảng Ma trận 27 SKU →', 'Switch to 27-SKU Matrix View →')}
            </Link>
          </div>
        </>
      )}

      {/* Product Grid */}
      {(() => {
        const isAllGrid = category === 'all';
        const gridClass = isAllGrid
          ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6';

        if (loading) {
          return (
            <div className={gridClass}>
              {(isAllGrid ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [1, 2, 3, 4, 5, 6]).map((n) => (
                <div key={n} className="h-80 rounded-xl bg-white/70 dark:bg-[#16221C]/70 animate-pulse border border-[#202020]/5 dark:border-white/10" />
              ))}
            </div>
          );
        }

        if (products.length === 0) {
          return (
            <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-12 text-center space-y-3">
              <p className="text-base font-medium text-[#202020] dark:text-[#F1EFEA]">
                {t('Không tìm thấy sản phẩm phù hợp với bộ lọc.', 'No products matched your current filter.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  setCategory('all');
                  setSearch('');
                  setMascotFilter('');
                  setGcTypeFilter('all');
                  setGcScreenFilter('all');
                  setGcProcFilter('all');
                }}
                className="px-4 py-2 bg-[#00552B] text-white text-xs font-medium rounded cursor-pointer"
              >
                {t('Xóa bộ lọc', 'Reset Filters')}
              </button>
            </div>
          );
        }

        return (
          <div className={gridClass}>
            {products.map((p) => {
              const wished = wishlist.includes(p.slug);
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/8 dark:border-white/10 overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 transition-transform"
                >
                  <div>
                    <div className="relative aspect-[4/5] bg-[#F8F5EF] dark:bg-[#0E1512] overflow-hidden">
                      <Link to={localePath(`/product/${p.slug}`)} className="block w-full h-full">
                        <MediaImage
                          imageKey={p.image_key}
                          alt={lang === 'vi' ? p.name_vi : p.name_en}
                          brandMark="bottom-left"
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(p.slug)}
                        aria-label={t('Yêu thích', 'Toggle wishlist')}
                        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 dark:bg-[#16221C]/90 flex items-center justify-center text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] cursor-pointer shadow-sm"
                      >
                        <Heart className={`w-4 h-4 ${wished ? 'fill-[#00552B] dark:fill-[#C6A667] text-[#00552B] dark:text-[#C6A667]' : ''}`} />
                      </button>
                    </div>

                    <div className={isAllGrid ? 'p-3.5 space-y-1.5' : 'p-5 space-y-2'}>
                      <div className={`flex flex-wrap items-center gap-1 text-[#202020]/60 dark:text-[#F1EFEA]/60 font-mono ${isAllGrid ? 'text-[10px]' : 'text-[11px]'}`}>
                        <span className="text-[#00552B] dark:text-[#C6A667] font-semibold truncate">
                          {p.category === 'roasted_beans' && p.pricing_tiers && p.pricing_tiers.length > 0 && p.sub_category ? p.sub_category : p.sku}
                        </span>
                        <span>·</span>
                        <span className="truncate">{localizeCoffeeType(p.coffee_type, lang)}</span>
                        {!isAllGrid && p.status === 'configurable_on_request' && (
                          <>
                            <span>·</span>
                            <span>{t('Cấu hình theo đơn', 'Configurable')}</span>
                          </>
                        )}
                      </div>
                      <Link
                        to={localePath(`/product/${p.slug}`)}
                        className={`block font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] ${
                          isAllGrid ? 'text-sm leading-snug line-clamp-2' : 'text-base'
                        }`}
                      >
                        {lang === 'vi' ? p.name_vi : p.name_en}
                      </Link>
                      <p className={`text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2 ${isAllGrid ? 'text-[11px]' : 'text-xs'}`}>
                        {lang === 'vi' ? p.subtitle_vi : p.subtitle_en}
                      </p>
                      {p.barcode && (
                        <p className="text-[10px] font-mono text-[#202020]/45 dark:text-[#F1EFEA]/45 truncate">
                          EAN-13: {p.barcode}
                        </p>
                      )}
                    </div>
                  </div>

                  {p.category === 'roasted_beans' && p.pricing_tiers && p.pricing_tiers.length > 0 ? (
                    (() => {
                      const selectedKg = Math.max(1, kgByProduct[p.id] ?? 1);
                      const activeTier = resolveVolumeTier(p.pricing_tiers, selectedKg);
                      const range = getTierPriceRange(p.pricing_tiers);
                      const unitVnd = activeTier ? activeTier.priceVnd : p.price_vnd;
                      const unitUsd = activeTier ? activeTier.priceUsd : p.price_usd;
                      return (
                        <div className={`${isAllGrid ? 'px-3.5 pb-3.5 pt-2.5 space-y-2' : 'px-5 pb-5 pt-3 space-y-3'} border-t border-[#202020]/8 dark:border-white/10`}>
                          <div className="flex items-baseline justify-between gap-1.5">
                            <div className="min-w-0">
                              <span className={`${isAllGrid ? 'text-sm' : 'text-base'} font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums`}>
                                {formatPrice(unitVnd, unitUsd)}
                                <span className="text-[11px] font-normal opacity-75">/kg</span>
                              </span>
                              {!isAllGrid && range && (
                                <span className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55 block tabular-nums">
                                  {t(
                                    `5 mức giá: ${formatPrice(range.minVnd, range.minUsd)} – ${formatPrice(range.maxVnd, range.maxUsd)}/kg`,
                                    `5 tiers: ${formatPrice(range.minVnd, range.minUsd)} – ${formatPrice(range.maxVnd, range.maxUsd)}/kg`
                                  )}
                                </span>
                              )}
                            </div>
                            {activeTier && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00552B]/10 dark:bg-[#C6A667]/20 text-[#00552B] dark:text-[#C6A667] font-semibold shrink-0">
                                {lang === 'vi' ? activeTier.labelVi : activeTier.labelEn}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded bg-[#F8F5EF] dark:bg-[#0E1512] shrink-0">
                              <input
                                type="number"
                                min={1}
                                max={50000}
                                value={selectedKg}
                                onChange={(e) =>
                                  setKgByProduct((prev) => ({
                                    ...prev,
                                    [p.id]: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                                  }))
                                }
                                aria-label={t('Số lượng (kg)', 'Quantity (kg)')}
                                className={`${isAllGrid ? 'w-11 px-1 py-1 text-[11px]' : 'w-16 px-2 py-1.5 text-xs'} font-semibold text-center bg-transparent focus:outline-none tabular-nums`}
                              />
                              <span className="pr-1.5 text-[10px] font-mono opacity-60">kg</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                addToCart({
                                  productId: p.id,
                                  slug: p.slug,
                                  sku: p.sku,
                                  nameVi: p.name_vi,
                                  nameEn: p.name_en,
                                  variantLabel: activeTier ? `${selectedKg} kg · ${activeTier.labelVi}` : `${selectedKg} kg`,
                                  unitPriceVnd: unitVnd,
                                  unitPriceUsd: unitUsd,
                                  quantity: selectedKg,
                                  imageKey: p.image_key,
                                  unit: 'kg',
                                  pricingTiers: p.pricing_tiers,
                                });
                                showToast(
                                  t(
                                    `Đã thêm ${selectedKg} kg (${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}) vào giỏ`,
                                    `Added ${selectedKg} kg to cart`
                                  )
                                );
                              }}
                              className={`flex-1 min-w-0 truncate bg-[#00552B] text-white font-semibold rounded hover:bg-[#003D25] cursor-pointer text-center ${
                                isAllGrid ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
                              }`}
                            >
                              {isAllGrid
                                ? t('Thêm', 'Add')
                                : t(
                                    `Thêm · ${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}`,
                                    `Add · ${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}`
                                  )}
                            </button>
                          </div>

                          <Link
                            to={localePath(`/product/${p.slug}`)}
                            className="block text-center text-[11px] font-medium text-[#00552B] dark:text-[#C6A667] hover:underline truncate"
                          >
                            {isAllGrid ? t('Bảng giá 5 mức →', '5-tier pricing →') : t('Xem bảng giá 5 mức chi tiết →', 'View full 5-tier price table →')}
                          </Link>
                        </div>
                      );
                    })()
                  ) : p.category === 'green_bean' ? (
                    (() => {
                      const selectedKg = Math.max(1, kgByProduct[p.id] ?? 1);
                      const unitVnd = p.price_vnd;
                      const unitUsd = p.price_usd;
                      return (
                        <div className={`${isAllGrid ? 'px-3.5 pb-3.5 pt-2.5 space-y-2' : 'px-5 pb-5 pt-3 space-y-3'} border-t border-[#202020]/8 dark:border-white/10`}>
                          <div className="flex items-baseline justify-between gap-1.5">
                            <div className="min-w-0">
                              <span className={`${isAllGrid ? 'text-sm' : 'text-base'} font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums`}>
                                {formatPrice(unitVnd, unitUsd)}
                                <span className="text-[11px] font-normal opacity-75">/kg</span>
                              </span>
                              {!isAllGrid && (
                                <span className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55 block">
                                  {t(
                                    'Quy cách: Mẫu 1kg · Bao 30 / 60 / 69 / 1.000kg',
                                    'Pack: Sample 1kg · Bags 30 / 60 / 69 / 1,000kg'
                                  )}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00552B]/10 dark:bg-[#C6A667]/20 text-[#00552B] dark:text-[#C6A667] font-semibold shrink-0">
                              {p.screen_size} · {p.processing_method}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded bg-[#F8F5EF] dark:bg-[#0E1512] shrink-0">
                              <input
                                type="number"
                                min={1}
                                max={50000}
                                value={selectedKg}
                                onChange={(e) =>
                                  setKgByProduct((prev) => ({
                                    ...prev,
                                    [p.id]: Math.max(1, Math.floor(Number(e.target.value) || 1)),
                                  }))
                                }
                                aria-label={t('Số lượng (kg)', 'Quantity (kg)')}
                                className={`${isAllGrid ? 'w-11 px-1 py-1 text-[11px]' : 'w-16 px-2 py-1.5 text-xs'} font-semibold text-center bg-transparent focus:outline-none tabular-nums`}
                              />
                              <span className="pr-1.5 text-[10px] font-mono opacity-60">kg</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                addToCart({
                                  productId: p.id,
                                  slug: p.slug,
                                  sku: p.sku,
                                  nameVi: p.name_vi,
                                  nameEn: p.name_en,
                                  variantLabel: `${selectedKg} kg · ${p.screen_size} ${p.processing_method}`,
                                  unitPriceVnd: unitVnd,
                                  unitPriceUsd: unitUsd,
                                  quantity: selectedKg,
                                  imageKey: p.image_key,
                                  unit: 'kg',
                                });
                                showToast(
                                  t(
                                    `Đã thêm ${selectedKg} kg (${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}) vào giỏ`,
                                    `Added ${selectedKg} kg to cart`
                                  )
                                );
                              }}
                              className={`flex-1 min-w-0 truncate bg-[#00552B] text-white font-semibold rounded hover:bg-[#003D25] cursor-pointer text-center ${
                                isAllGrid ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
                              }`}
                            >
                              {isAllGrid
                                ? t('Thêm', 'Add')
                                : t(
                                    `Thêm · ${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}`,
                                    `Add · ${formatPrice(unitVnd * selectedKg, unitUsd * selectedKg)}`
                                  )}
                            </button>
                          </div>

                          <Link
                            to={localePath(`/product/${p.slug}`)}
                            className="block text-center text-[11px] font-medium text-[#00552B] dark:text-[#C6A667] hover:underline truncate"
                          >
                            {isAllGrid ? t('Thông số & Báo giá →', 'Specs & Quote →') : t('Xem thông số & Yêu cầu mẫu / báo giá →', 'View specs & Request sample / quote →')}
                          </Link>
                        </div>
                      );
                    })()
                  ) : p.sub_category === 'Gift Voucher' || p.slug.startsWith('gift-voucher-') ? (
                    <div className={`${isAllGrid ? 'px-3.5 pb-3.5 pt-2.5 space-y-2' : 'px-5 pb-5 pt-3 space-y-2.5'} border-t border-[#202020]/8 dark:border-white/10`}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className={`${isAllGrid ? 'text-sm' : 'text-base'} font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums`}>
                          {formatPrice(p.price_vnd, p.price_usd)}
                        </span>
                        {!isAllGrid && (
                          <span className="text-[10px] font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55">
                            {t('SMS / Zalo · Email', 'SMS / Zalo · Email')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setGiftModalMode('gift');
                            setGiftModalProduct(p);
                          }}
                          className={`flex-1 inline-flex items-center justify-center gap-1.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded cursor-pointer whitespace-nowrap ${
                            isAllGrid ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
                          }`}
                        >
                          <Gift className="w-3.5 h-3.5 shrink-0" />
                          <span>{isAllGrid ? t('Tặng', 'Gift') : t('Tặng ngay', 'Send Gift')}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const firstVar = p.variants[0];
                            addToCart({
                              productId: p.id,
                              slug: p.slug,
                              sku: p.sku,
                              nameVi: p.name_vi,
                              nameEn: p.name_en,
                              variantLabel: firstVar ? firstVar.label : 'Standard',
                              unitPriceVnd: firstVar ? firstVar.priceVnd : p.price_vnd,
                              unitPriceUsd: firstVar ? firstVar.priceUsd : p.price_usd,
                              quantity: 1,
                              imageKey: p.image_key,
                            });
                            showToast(t('Đã thêm vào giỏ hàng', 'Added to cart'));
                          }}
                          className={`border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] font-semibold rounded hover:bg-[#00552B]/8 cursor-pointer shrink-0 whitespace-nowrap ${
                            isAllGrid ? 'px-2 py-1.5 text-[11px]' : 'px-3 py-2 text-xs'
                          }`}
                        >
                          {t('+ Giỏ', '+ Cart')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`${isAllGrid ? 'px-3.5 pb-3.5 pt-2.5' : 'px-5 pb-5 pt-3'} border-t border-[#202020]/8 dark:border-white/10 flex items-center justify-between gap-2`}>
                      <div className="min-w-0">
                        <span className={`${isAllGrid ? 'text-sm' : 'text-base'} font-bold text-[#202020] dark:text-[#F1EFEA] tabular-nums block`}>
                          {formatPrice(p.price_vnd, p.price_usd)}
                        </span>
                        {!isAllGrid && p.is_demo_data === 1 && (
                          <span className="text-[10px] text-[#202020]/50 dark:text-[#F1EFEA]/50">
                            {t('Giá tham khảo phát triển', 'Reference Demo Price')}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const firstVar = p.variants[0];
                          addToCart({
                            productId: p.id,
                            slug: p.slug,
                            sku: p.sku,
                            nameVi: p.name_vi,
                            nameEn: p.name_en,
                            variantLabel: firstVar ? firstVar.label : 'Standard',
                            unitPriceVnd: firstVar ? firstVar.priceVnd : p.price_vnd,
                            unitPriceUsd: firstVar ? firstVar.priceUsd : p.price_usd,
                            quantity: 1,
                            imageKey: p.image_key,
                          });
                          showToast(t('Đã thêm vào giỏ hàng', 'Added to cart'));
                        }}
                        className={`bg-[#00552B] text-white font-medium rounded hover:bg-[#003D25] cursor-pointer shrink-0 ${
                          isAllGrid ? 'px-2.5 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
                        }`}
                      >
                        {isAllGrid ? t('Mua', 'Add') : t('Thêm vào giỏ', 'Add to Cart')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })()}
      <RecentlyViewedStrip />
      <GiftVoucherModal
        isOpen={Boolean(giftModalProduct)}
        initialProduct={giftModalProduct}
        allVoucherProducts={products.filter((item) => item.sub_category === 'Gift Voucher' || item.slug.startsWith('gift-voucher-'))}
        initialMode={giftModalMode}
        onClose={() => setGiftModalProduct(null)}
      />
    </div>
  );
};
