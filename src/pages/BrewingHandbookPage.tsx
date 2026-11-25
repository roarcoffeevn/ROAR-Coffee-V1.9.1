import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Coffee, Droplets, Search, ShoppingBag, Sparkles, Thermometer } from 'lucide-react';
import { MediaImage } from '../components/MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { fetchProductsWithFallback } from '../lib/staticFallback';
import {
  BREWING_HANDBOOK_ARTICLES,
  BREWING_HANDBOOK_TOPICS,
  type BrewingHandbookArticle,
} from '../data/brewingHandbook';

export const BrewingHandbookPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { lang, t, localePath } = useI18n();
  const { formatPrice, addToCart, showToast, setCustomBreadcrumb } = useStore();

  const [productsBySlug, setProductsBySlug] = useState<Record<string, Product>>({});
  const [topic, setTopic] = useState<'all' | BrewingHandbookArticle['topic']>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProductsWithFallback()
      .then((list) => {
        const map: Record<string, Product> = {};
        for (const p of list) {
          map[p.slug] = p;
        }
        setProductsBySlug(map);
      })
      .catch(() => {});
  }, []);

  const selectedArticle = slug ? BREWING_HANDBOOK_ARTICLES.find((a) => a.slug === slug) : null;

  useEffect(() => {
    if (!selectedArticle) {
      setCustomBreadcrumb(null);
      return;
    }
    setCustomBreadcrumb([
      { labelVi: 'Cẩm nang pha chế', labelEn: 'Brewing Handbook', to: '/brewing-handbook' },
      { labelVi: selectedArticle.titleVi, labelEn: selectedArticle.titleEn },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [selectedArticle, setCustomBreadcrumb]);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return BREWING_HANDBOOK_ARTICLES.filter((a) => {
      if (topic !== 'all' && a.topic !== topic) return false;
      if (!q) return true;
      const haystack = [
        a.titleVi,
        a.titleEn,
        a.excerptVi,
        a.excerptEn,
        a.topicVi,
        a.topicEn,
        a.upsellReasonVi,
        a.upsellReasonEn,
        productsBySlug[a.primaryProductSlug]?.name_vi || '',
        productsBySlug[a.primaryProductSlug]?.name_en || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [topic, search, productsBySlug]);

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
    showToast(t(`Đã thêm ${product.name_vi} vào giỏ`, `Added ${product.name_en} to cart`));
  };

  if (slug && selectedArticle) {
    const currentIdx = BREWING_HANDBOOK_ARTICLES.findIndex((a) => a.slug === selectedArticle.slug);
    const prevArticle = currentIdx > 0 ? BREWING_HANDBOOK_ARTICLES[currentIdx - 1] : null;
    const nextArticle =
      currentIdx >= 0 && currentIdx < BREWING_HANDBOOK_ARTICLES.length - 1
        ? BREWING_HANDBOOK_ARTICLES[currentIdx + 1]
        : null;

    const primaryProduct = productsBySlug[selectedArticle.primaryProductSlug];
    const secondaryProduct = productsBySlug[selectedArticle.secondaryProductSlug];
    const relatedArticles = BREWING_HANDBOOK_ARTICLES.filter(
      (a) => a.slug !== selectedArticle.slug && a.topic === selectedArticle.topic
    ).slice(0, 3);

    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to={localePath('/brewing-handbook')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('Quay lại 15 bài Cẩm nang pha chế', 'Back to All 15 Brewing Guides')}</span>
          </Link>

          <Link
            to={localePath('/brewing')}
            className="text-xs font-medium text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#00552B] dark:hover:text-[#C6A667]"
          >
            {t('Mở Công cụ Tính Tỷ Lệ Pha →', 'Open Interactive Brew Calculator →')}
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Column */}
          <article className="lg:col-span-8 space-y-7">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60">
                <span className="font-mono font-semibold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                  {String(selectedArticle.id).padStart(2, '0')} / 15
                </span>
                <span>·</span>
                <span className="font-semibold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                  {lang === 'vi' ? selectedArticle.topicVi : selectedArticle.topicEn}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedArticle.readMinutes} {t('phút đọc', 'min read')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] leading-tight text-balance">
                {lang === 'vi' ? selectedArticle.titleVi : selectedArticle.titleEn}
              </h1>

              <p className="text-base text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                {lang === 'vi' ? selectedArticle.excerptVi : selectedArticle.excerptEn}
              </p>
            </header>

            <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-[#EFECE4] dark:bg-[#121C17] border border-[#202020]/10 dark:border-white/10">
              <MediaImage
                imageKey={selectedArticle.coverImageKey}
                alt={lang === 'vi' ? selectedArticle.titleVi : selectedArticle.titleEn}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Technical Brew Specs Bar */}
            <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 block">
                  {t('Liều lượng', 'Dose')}
                </span>
                <span className="text-sm font-bold font-mono text-[#00552B] dark:text-[#C6A667]">
                  {selectedArticle.spec.dose}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 block">
                  {t('Nước / Thành phẩm', 'Water / Yield')}
                </span>
                <span className="text-sm font-bold font-mono text-[#202020] dark:text-[#F1EFEA]">
                  {selectedArticle.spec.water}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 flex items-center gap-1">
                  <Thermometer className="w-3 h-3" /> {t('Nhiệt độ', 'Temp')}
                </span>
                <span className="text-sm font-bold font-mono text-[#202020] dark:text-[#F1EFEA]">
                  {selectedArticle.spec.temp}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {t('Thời gian', 'Time')}
                </span>
                <span className="text-sm font-bold font-mono text-[#202020] dark:text-[#F1EFEA]">
                  {selectedArticle.spec.time}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 block">
                  {t('Cỡ xay', 'Grind')}
                </span>
                <span className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
                  {lang === 'vi' ? selectedArticle.spec.grindVi : selectedArticle.spec.grindEn}
                </span>
              </div>
            </div>

            {/* Article Body */}
            <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8 space-y-6">
              <div className="space-y-4 text-sm sm:text-base text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
                {(lang === 'vi' ? selectedArticle.introVi : selectedArticle.introEn).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="pt-4 border-t border-[#202020]/10 dark:border-white/10 space-y-3">
                <h2 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">
                  {t('Quy trình thực hiện từng bước', 'Step-by-Step Brewing Protocol')}
                </h2>
                <ol className="space-y-3 text-sm sm:text-base text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  {(lang === 'vi' ? selectedArticle.stepsVi : selectedArticle.stepsEn).map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-md bg-[#00552B]/10 dark:bg-[#C6A667]/20 text-[#00552B] dark:text-[#C6A667] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="p-4 sm:p-5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/15 dark:border-[#C6A667]/25 space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                  {t('Mẹo tinh chỉnh từ Barista ROAR', 'ROAR Barista Pro Tip')}
                </p>
                <p className="text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
                  {lang === 'vi' ? selectedArticle.baristaTipVi : selectedArticle.baristaTipEn}
                </p>
              </div>
            </div>

            {/* Prev / Next Navigation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevArticle ? (
                <Link
                  to={localePath(`/brewing-handbook/${prevArticle.slug}`)}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40 transition-colors"
                >
                  <span className="text-[11px] font-medium text-[#202020]/55 dark:text-[#F1EFEA]/55 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> {t('Bài trước', 'Previous Guide')}
                  </span>
                  <p className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] mt-1 line-clamp-2">
                    {lang === 'vi' ? prevArticle.titleVi : prevArticle.titleEn}
                  </p>
                </Link>
              ) : (
                <div />
              )}

              {nextArticle && (
                <Link
                  to={localePath(`/brewing-handbook/${nextArticle.slug}`)}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 text-right hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40 transition-colors"
                >
                  <span className="text-[11px] font-medium text-[#202020]/55 dark:text-[#F1EFEA]/55 inline-flex items-center gap-1">
                    {t('Bài tiếp theo', 'Next Guide')} <ArrowRight className="w-3 h-3" />
                  </span>
                  <p className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] mt-1 line-clamp-2">
                    {lang === 'vi' ? nextArticle.titleVi : nextArticle.titleEn}
                  </p>
                </Link>
              )}
            </div>
          </article>

          {/* Right Sticky Upsell Sidebar */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            <div className="bg-[#FAF8F3] dark:bg-[#121C17] rounded-2xl border border-[#00552B]/25 dark:border-[#C6A667]/30 p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {t('Gợi ý cà phê phù hợp nhất', 'Recommended ROAR Match')}
                </p>
                <h2 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">
                  {lang === 'vi' ? selectedArticle.upsellHeadlineVi : selectedArticle.upsellHeadlineEn}
                </h2>
                <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                  {lang === 'vi' ? selectedArticle.upsellReasonVi : selectedArticle.upsellReasonEn}
                </p>
              </div>

              {[primaryProduct, secondaryProduct].filter(Boolean).map((prod, idx) => (
                <div
                  key={prod.slug}
                  className={`rounded-xl border p-3.5 space-y-3 ${
                    idx === 0
                      ? 'bg-white dark:bg-[#16221C] border-[#00552B]/35 dark:border-[#C6A667]/45'
                      : 'bg-white/80 dark:bg-[#16221C]/80 border-[#202020]/10 dark:border-white/10'
                  }`}
                >
                  <div className="flex gap-3">
                    <Link
                      to={localePath(`/product/${prod.slug}`)}
                      className="w-20 aspect-[4/5] rounded-lg overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512] shrink-0 border border-[#202020]/10 dark:border-white/10"
                    >
                      <MediaImage
                        imageKey={prod.image_key}
                        alt={lang === 'vi' ? prod.name_vi : prod.name_en}
                        className="w-full h-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 min-w-0 space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667] block">
                        {idx === 0 ? t('Khuyên dùng #1', 'Top Match #1') : t('Lựa chọn bổ sung', 'Alternative Match')}
                      </span>
                      <Link
                        to={localePath(`/product/${prod.slug}`)}
                        className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] line-clamp-2 block"
                      >
                        {lang === 'vi' ? prod.name_vi : prod.name_en}
                      </Link>
                      <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 line-clamp-1">
                        {lang === 'vi' ? prod.tasting_notes_vi : prod.tasting_notes_en}
                      </p>
                      <p className="text-sm font-bold font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums pt-0.5">
                        {formatPrice(prod.price_vnd, prod.price_usd)}
                        {(prod.pricing_tiers?.length || 0) > 0 ? '/kg' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickAdd(prod)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#00552B] text-white text-xs font-semibold rounded-lg hover:bg-[#003D25] transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{t('Thêm vào giỏ', 'Add to Cart')}</span>
                    </button>
                    <Link
                      to={localePath(`/product/${prod.slug}`)}
                      className="px-3 py-2 border border-[#202020]/15 dark:border-white/15 rounded-lg text-xs font-semibold text-[#202020] dark:text-[#F1EFEA] hover:border-[#00552B] dark:hover:border-[#C6A667] transition-colors whitespace-nowrap"
                    >
                      {t('Chi tiết', 'Details')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#003D25] text-[#F8F5EF] rounded-2xl p-5 space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C6A667]">
                {t('Dành cho Quán & Văn phòng', 'For Cafés & Offices')}
              </p>
              <h3 className="text-base font-bold">
                {t('Mua Hạt Rang Theo Kg — Giá Sỉ Tự Động 5 Bậc', 'Whole Roasted Beans — 5-Tier Kg Pricing')}
              </h3>
              <p className="text-xs text-[#F8F5EF]/80 leading-relaxed">
                {t(
                  'Đặt từ 1kg đến ≥100kg với bảng chiết khấu minh bạch cho Robusta S18, Culi S18 và Arabica Cầu Đất CBU.',
                  'Order from 1kg up to 100kg+ with transparent tier discounts across Robusta S18, Culi S18, and Cầu Đất CBU Arabica.'
                )}
              </p>
              <Link
                to={localePath('/coffee/roasted-beans')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C6A667] hover:underline pt-1"
              >
                <span>{t('Xem bảng giá Hạt Rang (kg) →', 'Shop Roasted Beans by Kg →')}</span>
              </Link>
            </div>
          </aside>
        </div>

        {relatedArticles.length > 0 && (
          <section className="pt-8 border-t border-[#202020]/10 dark:border-white/10 space-y-5">
            <h2 className="text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Bài cẩm nang cùng chuyên mục', 'More Guides in This Series')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {relatedArticles.map((r) => (
                <Link
                  key={r.slug}
                  to={localePath(`/brewing-handbook/${r.slug}`)}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 space-y-2 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40 transition-colors"
                >
                  <span className="font-mono text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667]">
                    {String(r.id).padStart(2, '0')} · {lang === 'vi' ? r.topicVi : r.topicEn}
                  </span>
                  <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] line-clamp-2">
                    {lang === 'vi' ? r.titleVi : r.titleEn}
                  </h3>
                  <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 line-clamp-2">
                    {lang === 'vi' ? r.excerptVi : r.excerptEn}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 border-b border-[#202020]/10 dark:border-white/10 pb-6">
        <div className="space-y-2 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {t('Khám Phá · Thư Viện Kiến Thức Pha Chế', 'Discover · Brewing Knowledge Library')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] tracking-tight text-balance">
            {t('Cẩm Nang Pha Chế Cà Phê ROAR (15 Chuyên Đề)', 'ROAR Coffee Brewing Handbook (15 Guides)')}
          </h1>
          <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
            {t(
              'Tổng hợp 15 bài hướng dẫn thực chiến từ Phin truyền thống, Espresso 9 bar, Pour-Over V60, Cold Brew đến khoa học nước pha — kèm gợi ý dòng cà phê ROAR tối ưu cho từng phương pháp.',
              'Explore 15 practical guides spanning Vietnamese Phin, 9-bar Espresso, V60 Pour-Over, Cold Brew, and water science — each paired with its ideal ROAR Coffee match.'
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#202020]/45 dark:text-[#F1EFEA]/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm cách pha, dụng cụ, sản phẩm...', 'Search method, tool, coffee...')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg pl-9 pr-3 py-2 text-xs text-[#202020] dark:text-[#F1EFEA] focus:outline-none focus:border-[#00552B] dark:focus:border-[#C6A667]"
            />
          </div>

          <Link
            to={localePath('/brewing')}
            className="px-4 py-2 bg-[#00552B] text-white text-xs font-semibold rounded-lg hover:bg-[#003D25] transition-colors text-center whitespace-nowrap"
          >
            {t('Công cụ tính tỷ lệ pha →', 'Brew Ratio Calculator →')}
          </Link>
        </div>
      </div>

      {/* Topic Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {BREWING_HANDBOOK_TOPICS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTopic(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              topic === tab.id
                ? 'bg-[#00552B] text-white'
                : 'bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 text-[#202020]/80 dark:text-[#F1EFEA]/80 hover:border-[#00552B]/40'
            }`}
          >
            {t(tab.vi, tab.en)}
          </button>
        ))}
      </div>

      {/* 15-Guide Grid with Integrated ROAR Coffee Upsells */}
      {filteredArticles.length === 0 ? (
        <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-10 text-center space-y-2">
          <Coffee className="w-8 h-8 mx-auto text-[#00552B] dark:text-[#C6A667]" />
          <p className="text-sm font-semibold text-[#202020] dark:text-[#F1EFEA]">
            {t('Không tìm thấy bài cẩm nang phù hợp.', 'No matching brewing guide found.')}
          </p>
          <button
            type="button"
            onClick={() => {
              setTopic('all');
              setSearch('');
            }}
            className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer"
          >
            {t('Hiển thị tất cả 15 cẩm nang', 'Show all 15 guides')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => {
            const matchedProd = productsBySlug[article.primaryProductSlug];
            return (
              <div
                key={article.slug}
                className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40 transition-colors"
              >
                <div>
                  <Link
                    to={localePath(`/brewing-handbook/${article.slug}`)}
                    className="block aspect-[4/3] bg-[#EFECE4] dark:bg-[#0E1512] overflow-hidden"
                  >
                    <MediaImage
                      imageKey={article.coverImageKey}
                      alt={lang === 'vi' ? article.titleVi : article.titleEn}
                      className="w-full h-full object-cover hover:scale-[1.03] transition-transform duration-200"
                    />
                  </Link>

                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                      <span className="font-mono font-semibold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                        {String(article.id).padStart(2, '0')} · {lang === 'vi' ? article.topicVi : article.topicEn}
                      </span>
                      <span>
                        {article.readMinutes} {t('phút', 'min')}
                      </span>
                    </div>

                    <Link
                      to={localePath(`/brewing-handbook/${article.slug}`)}
                      className="block text-base font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] leading-snug line-clamp-2"
                    >
                      {lang === 'vi' ? article.titleVi : article.titleEn}
                    </Link>

                    <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2 leading-relaxed">
                      {lang === 'vi' ? article.excerptVi : article.excerptEn}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] font-mono text-[#202020]/70 dark:text-[#F1EFEA]/70">
                      <span className="inline-flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-[#00552B] dark:text-[#C6A667]" />
                        {article.spec.dose} / {article.spec.water}
                      </span>
                      <span>·</span>
                      <span>{article.spec.temp}</span>
                    </div>
                  </div>
                </div>

                {/* Integrated ROAR Coffee Upsell Footer */}
                <div className="px-5 pb-5 pt-3 border-t border-[#202020]/8 dark:border-white/10 space-y-3 bg-[#FAF8F3]/70 dark:bg-[#101814]/60">
                  {matchedProd && (
                    <div className="flex items-center justify-between gap-2.5">
                      <Link
                        to={localePath(`/product/${matchedProd.slug}`)}
                        className="flex items-center gap-2.5 min-w-0 group"
                      >
                        <div className="w-10 h-12 rounded-md overflow-hidden bg-white dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 shrink-0">
                          <MediaImage
                            imageKey={matchedProd.image_key}
                            alt={lang === 'vi' ? matchedProd.name_vi : matchedProd.name_en}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667] block">
                            {t('Gợi ý chuẩn vị:', 'Paired Coffee:')}
                          </span>
                          <span className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] group-hover:underline truncate block">
                            {lang === 'vi' ? matchedProd.name_vi : matchedProd.name_en}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                            {formatPrice(matchedProd.price_vnd, matchedProd.price_usd)}
                            {(matchedProd.pricing_tiers?.length || 0) > 0 ? '/kg' : ''}
                          </span>
                        </div>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleQuickAdd(matchedProd)}
                        title={t('Thêm nhanh vào giỏ', 'Quick Add to Cart')}
                        className="px-2.5 py-1.5 rounded-lg bg-[#00552B] text-white text-[11px] font-semibold hover:bg-[#003D25] transition-colors cursor-pointer shrink-0 inline-flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>{t('Mua', 'Buy')}</span>
                      </button>
                    </div>
                  )}

                  <Link
                    to={localePath(`/brewing-handbook/${article.slug}`)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
                  >
                    <span>{t('Đọc hướng dẫn & công thức chi tiết', 'Read Full Recipe & Match')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
