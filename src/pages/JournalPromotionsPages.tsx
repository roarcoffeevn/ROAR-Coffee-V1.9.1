import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Compass,
  Copy,
  FileCheck2,
  Lightbulb,
  Link2,
  ListTree,
  MapPin,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Users,
} from 'lucide-react';
import { JournalCharts } from '../components/JournalCharts';
import { JournalFlowchart } from '../components/JournalFlowchart';
import { MediaImage } from '../components/MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { localizeBrewingMethod, localizeJournalCategory } from '../lib/i18nHelpers';
import { getArticleEnrichment } from '../lib/journalEnrichments';
import {
  FIND_YOUR_COFFEE_NEEDS,
  getNodeByCode,
  getNodeBySlug,
  JOURNAL_CURRICULUM_B001_B050,
  JOURNAL_PILLARS,
} from '../lib/journalEcosystem';
import { getPromoVoucherImage, resolveMediaUrl } from '../lib/media';
import { updateCustomSeoHead, upsertJsonLd } from '../lib/routeSeo';
import {
  fetchArticleBySlugWithFallback,
  fetchJournalWithFallback,
  fetchProductsWithFallback,
  fetchPromotionsWithFallback,
} from '../lib/staticFallback';

export const PromotionsPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { showToast } = useStore();
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionsWithFallback()
      .then((list) => setPromotions(list))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    showToast(t(`Đã sao chép mã ${code}`, `Copied voucher code ${code}`));
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-14 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {t('Ưu đãi & Voucher Đang Hoạt Động', 'Active Promotions & Vouchers')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Chương Trình Ưu Đãi ROAR COFFEE', 'ROAR COFFEE Offers')}
          </h1>
          <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75">
            {t(
              'Chỉ hiển thị các chiến dịch còn hiệu lực theo ngày hệ thống. Nhập mã tại trang Thanh toán.',
              'Only currently valid campaigns are displayed. Apply voucher codes directly during checkout.'
            )}
          </p>
        </div>
        <Link
          to={localePath('/play')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold shrink-0 whitespace-nowrap"
        >
          {t('Chơi Mini-Game Săn Quà & Voucher →', 'Play Mini-Games for Real Gifts →')}
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-[#202020]/60 dark:text-[#F1EFEA]/60">{t('Đang tải ưu đãi...', 'Loading promotions...')}</p>
      ) : promotions.length === 0 ? (
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-10 text-center text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
          {t('Hiện chưa có chương trình khuyến mãi đang mở.', 'No active promotions are currently running.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((p) => (
            <div key={p.id} className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between">
              <div>
                <div className="relative aspect-[4/3] bg-[#0B120E] overflow-hidden">
                  <MediaImage
                    imageKey={getPromoVoucherImage(p)}
                    alt={lang === 'vi' ? p.title_vi : p.title_en}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#111111]/85 text-[#C6A667] font-mono text-xs font-bold shadow-sm">
                    <Tag className="w-3.5 h-3.5" /> {p.code}
                  </span>
                  <span className="absolute bottom-2.5 right-3 px-2 py-0.5 rounded bg-black/70 text-white/90 text-[11px] font-mono tabular-nums">
                    {t('Hạn:', 'Ends')} {p.end_date}
                  </span>
                </div>
                <div className="p-5 space-y-2.5">
                  <h2 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">{lang === 'vi' ? p.title_vi : p.title_en}</h2>
                  <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">{lang === 'vi' ? p.description_vi : p.description_en}</p>
                  <div className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60 pt-2 border-t border-[#202020]/8 dark:border-white/10 space-y-1">
                    <p>{t('Điều kiện:', 'Terms:')} {lang === 'vi' ? p.terms_vi : p.terms_en}</p>
                    {p.min_order_value > 0 && (
                      <p className="tabular-nums">{t('Đơn tối thiểu:', 'Min order:')} {p.min_order_value.toLocaleString()} ₫</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 px-5 pb-5 pt-1">
                <button
                  type="button"
                  onClick={() => copyCode(p.code)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 border border-[#00552B] dark:border-[#C6A667] text-[#00552B] dark:text-[#C6A667] text-xs font-semibold rounded hover:bg-[#00552B]/5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> {t('Sao chép mã', 'Copy Code')}
                </button>
                <Link
                  to={localePath('/shop')}
                  className="flex-1 text-center py-2 bg-[#00552B] text-white text-xs font-semibold rounded hover:bg-[#003D25]"
                >
                  {t('Mua ngay', 'Shop Now')}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const JournalPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { formatPrice } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [articles, setArticles] = useState<any[]>([]);
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState(() => searchParams.get('category') || 'all');
  const [search, setSearch] = useState('');
  const [selectedNeedId, setSelectedNeedId] = useState<string>(FIND_YOUR_COFFEE_NEEDS[0].id);
  const [activePillarId, setActivePillarId] = useState<string>('01');
  const [roadmapOpen, setRoadmapOpen] = useState(true);

  useEffect(() => {
    const qCat = searchParams.get('category');
    setCategory(qCat || 'all');
  }, [searchParams]);

  useEffect(() => {
    fetchJournalWithFallback().then((list) => setAllArticles(list || []));
    fetchProductsWithFallback(new URLSearchParams())
      .then((list) => setProducts(list || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== 'all') params.set('category', category);
    if (search.trim()) params.set('search', search.trim());
    fetchJournalWithFallback(params).then((list) => setArticles(list || []));
  }, [category, search]);

  const categories = ['all', 'Coffee knowledge', 'Coffee processing', 'Coffee varieties', 'Brewing techniques', 'Coffee origins'];

  const handleSelectCategory = (nextCat: string) => {
    setCategory(nextCat);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextCat === 'all') next.delete('category');
        else next.set('category', nextCat);
        return next;
      },
      { replace: true }
    );
  };

  const countForCategory = (c: string) =>
    c === 'all' ? allArticles.length : allArticles.filter((item) => item.category === c).length;

  const publishedSlugSet = useMemo(() => new Set(allArticles.map((a) => a.slug)), [allArticles]);

  const featuredArticle = useMemo(() => {
    return (
      allArticles.find((a) => a.slug === 'hanh-trinh-ca-phe-tu-ethiopia-den-viet-nam') ||
      allArticles.find((a) => a.slug === 'arabica-robusta-va-nhung-loai-ca-phe-tren-the-gioi') ||
      allArticles[0] ||
      null
    );
  }, [allArticles]);

  const selectedNeed = useMemo(
    () => FIND_YOUR_COFFEE_NEEDS.find((n) => n.id === selectedNeedId) || FIND_YOUR_COFFEE_NEEDS[0],
    [selectedNeedId]
  );

  const recommendedProductsForNeed = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return selectedNeed.productSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is Product => Boolean(p && p.status !== 'draft'));
  }, [products, selectedNeed]);

  const activePillarNodes = useMemo(
    () => JOURNAL_CURRICULUM_B001_B050.filter((n) => n.pillarId === activePillarId),
    [activePillarId]
  );

  // Order articles so B001–B010 foundations appear cleanly first when viewing All
  const sortedArticles = useMemo(() => {
    return [...articles].sort((a, b) => {
      const na = getNodeBySlug(a.slug)?.code || 'Z999';
      const nb = getNodeBySlug(b.slug)?.code || 'Z999';
      return na.localeCompare(nb);
    });
  }, [articles]);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
      {/* 1. Editorial Hero */}
      <section className="rounded-2xl bg-[#0B140F] text-[#F8F5EF] p-6 sm:p-10 border border-[#C6A667]/25 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#C6A667]">
            <span>ROAR COFFEE JOURNAL · B001–B050</span>
            <span>·</span>
            <span>ROOTS · ORIGINALITY · ARTISTRY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">
            {t('Hệ Sinh Thái Kiến Thức Cà Phê Việt Nam & Thế Giới', 'The ROAR Coffee Knowledge & Craft Ecosystem')}
          </h1>
          <p className="text-sm sm:text-base text-[#F8F5EF]/80 leading-relaxed max-w-2xl">
            {t(
              'Từ lịch sử Ethiopia đến thổ nhưỡng Tây Nguyên, từ khoa học sơ chế CBU/Honey đến nghệ thuật chiết xuất Phin & Espresso. Hiểu đúng hạt cà phê để chọn đúng hương vị dành cho bạn.',
              'From Ethiopian origins and Central Highlands basalt to CBU/Honey processing and Phin/Espresso extraction—organized as a structured learning path from bean anatomy to your daily cup.'
            )}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {featuredArticle && (
              <Link
                to={localePath(`/journal/${featuredArticle.slug}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#C6A667] hover:bg-[#d7b97b] text-[#111111] text-xs font-bold whitespace-nowrap transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                <span>{t('Bắt đầu từ Bài B001', 'Start With B001 Guide')}</span>
              </Link>
            )}
            <a
              href="#find-your-coffee"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/25 hover:border-[#C6A667] text-white text-xs font-semibold whitespace-nowrap transition-colors"
            >
              <Compass className="w-4 h-4 text-[#C6A667]" />
              <span>{t('Chọn cà phê phù hợp', 'Find Your Coffee')}</span>
            </a>
          </div>
        </div>

        {featuredArticle && (
          <Link
            to={localePath(`/journal/${featuredArticle.slug}`)}
            className="lg:col-span-5 group rounded-xl overflow-hidden border border-white/15 bg-[#122019] flex flex-col sm:flex-row lg:flex-col"
          >
            <div className="aspect-[16/9] sm:w-44 lg:w-full overflow-hidden shrink-0">
              <MediaImage
                imageKey={featuredArticle.image_key}
                alt={lang === 'vi' ? featuredArticle.title_vi : featuredArticle.title_en}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-4 space-y-1.5">
              <span className="text-[11px] font-mono font-bold text-[#C6A667]">
                {getNodeBySlug(featuredArticle.slug)?.code || 'FEATURED'} · {featuredArticle.read_minutes}{' '}
                {t('phút đọc', 'min read')}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white group-hover:text-[#C6A667] transition-colors leading-snug">
                {lang === 'vi' ? featuredArticle.title_vi : featuredArticle.title_en}
              </h2>
              <p className="text-xs text-[#F8F5EF]/70 line-clamp-2">
                {lang === 'vi' ? featuredArticle.excerpt_vi : featuredArticle.excerpt_en}
              </p>
            </div>
          </Link>
        )}
      </section>

      {/* 2. 10-Pillar B001–B050 Learning Roadmap Explorer */}
      <section className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-5 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
              {t('Lộ trình kiến thức 10 chuyên đề · B001–B050', '10-Pillar Curriculum Architecture · B001–B050')}
            </p>
            <h2 className="text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Bản Đồ Bài Viết Theo Hành Trình Học Tập', 'Structured Learning Path')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setRoadmapOpen((v) => !v)}
            className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline self-start sm:self-auto cursor-pointer"
          >
            {roadmapOpen ? t('Thu gọn lộ trình ↑', 'Collapse Roadmap ↑') : t('Mở lộ trình B001–B050 ↓', 'Expand B001–B050 Roadmap ↓')}
          </button>
        </div>

        {roadmapOpen && (
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {JOURNAL_PILLARS.map((pillar) => {
                const isSelected = activePillarId === pillar.id;
                const pillarNodes = JOURNAL_CURRICULUM_B001_B050.filter((n) => n.pillarId === pillar.id);
                const liveCount = pillarNodes.filter((n) => n.slug && publishedSlugSet.has(n.slug)).length;
                return (
                  <button
                    key={pillar.id}
                    type="button"
                    onClick={() => setActivePillarId(pillar.id)}
                    className={`shrink-0 px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#00552B] border-[#00552B] text-white'
                        : 'bg-[#F8F5EF]/70 dark:bg-[#0E1512] border-[#202020]/10 dark:border-white/10 text-[#202020]/85 dark:text-[#F1EFEA]/85 hover:border-[#00552B]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-mono opacity-80">
                      <span>{pillar.codeRange}</span>
                      <span>
                        {liveCount}/{pillarNodes.length}
                      </span>
                    </div>
                    <div className="text-xs font-semibold mt-0.5 whitespace-nowrap">
                      {pillar.id}. {lang === 'vi' ? pillar.nameVi : pillar.nameEn}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activePillarNodes.map((node) => {
                const isPublished = Boolean(node.slug && publishedSlugSet.has(node.slug));
                if (isPublished && node.slug) {
                  return (
                    <Link
                      key={node.code}
                      to={localePath(`/journal/${node.slug}`)}
                      className="rounded-xl p-3.5 bg-[#F8F5EF]/75 dark:bg-[#0E1512] border border-[#00552B]/20 dark:border-[#C6A667]/25 hover:border-[#00552B] dark:hover:border-[#C6A667] flex items-start justify-between gap-3 transition-colors group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          <span className="font-bold text-[#00552B] dark:text-[#C6A667]">{node.code}</span>
                          <span className="text-[#202020]/50 dark:text-[#F1EFEA]/50">·</span>
                          <span className="text-[#00552B] dark:text-[#C6A667] font-semibold">
                            {t('Đã xuất bản', 'Published')}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#202020] dark:text-[#F1EFEA] group-hover:text-[#00552B] dark:group-hover:text-[#C6A667] leading-snug">
                          {lang === 'vi' ? node.titleVi : node.titleEn}
                        </p>
                        <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 line-clamp-1">
                          {lang === 'vi' ? node.searchIntentVi : node.searchIntentEn}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0 mt-1" />
                    </Link>
                  );
                }
                return (
                  <div
                    key={node.code}
                    className="rounded-xl p-3.5 bg-[#F8F5EF]/40 dark:bg-[#0E1512]/50 border border-dashed border-[#202020]/15 dark:border-white/15 flex items-start justify-between gap-3 opacity-80"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-[#202020]/60 dark:text-[#F1EFEA]/60">
                        <span className="font-bold">{node.code}</span>
                        <span>·</span>
                        <span>{t(`Đợt ${node.batch} (Đang biên tập)`, `Batch ${node.batch} (Scheduled)`)}</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-snug">
                        {lang === 'vi' ? node.titleVi : node.titleEn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 3. Find Your Coffee by Need (Section VI Recommender) */}
      <section
        id="find-your-coffee"
        className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-5 sm:p-7 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
              {t('Chọn Cà Phê Theo Nhu Cầu Thực Tế', 'Need-Based Coffee Discovery')}
            </p>
            <h2 className="text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Chọn Cà Phê Phù Hợp Gu Của Bạn', 'Find Your Coffee')}
            </h2>
          </div>
          <Link
            to={localePath(selectedNeed.shopCategory ? `/shop?category=${selectedNeed.shopCategory}` : '/shop')}
            className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
          >
            {t('Mở toàn bộ danh mục sản phẩm →', 'Browse Full Catalog →')}
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {FIND_YOUR_COFFEE_NEEDS.map((need) => (
            <button
              key={need.id}
              type="button"
              onClick={() => setSelectedNeedId(need.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedNeedId === need.id
                  ? 'bg-[#00552B] text-white'
                  : 'bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/12 dark:border-white/12 text-[#202020]/80 dark:text-[#F1EFEA]/80 hover:border-[#00552B]/40'
              }`}
            >
              {lang === 'vi' ? need.labelVi : need.labelEn}
            </button>
          ))}
        </div>

        <div className="rounded-xl bg-[#F8F5EF]/75 dark:bg-[#0E1512] p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <p className="text-xs sm:text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80">
              {lang === 'vi' ? selectedNeed.descVi : selectedNeed.descEn}
            </p>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedNeed.articleCodes.map((code) => {
                const node = getNodeByCode(code);
                if (!node?.slug || !publishedSlugSet.has(node.slug)) return null;
                return (
                  <Link
                    key={code}
                    to={localePath(`/journal/${node.slug}`)}
                    className="text-[11px] font-mono font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
                  >
                    {t(`Đọc ${code}`, `Read ${code}`)} →
                  </Link>
                );
              })}
            </div>
          </div>

          {recommendedProductsForNeed.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recommendedProductsForNeed.map((p) => (
                <Link
                  key={p.id}
                  to={localePath(`/product/${p.slug}`)}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-3 flex items-center gap-3 hover:border-[#00552B]/50 transition-colors"
                >
                  <div className="w-14 aspect-[4/5] rounded-lg overflow-hidden shrink-0 bg-[#F8F5EF] dark:bg-[#0E1512]">
                    <MediaImage
                      imageKey={p.image_key}
                      alt={lang === 'vi' ? p.name_vi : p.name_en}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <span className="text-[10px] font-mono text-[#00552B] dark:text-[#C6A667] block">{p.sku}</span>
                    <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] line-clamp-1">
                      {lang === 'vi' ? p.name_vi : p.name_en}
                    </p>
                    <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
                      {p.status === 'active'
                        ? `${formatPrice(p.price_vnd, p.price_usd)}${p.category === 'roasted_beans' || p.category === 'green_bean' ? '/kg' : ''}`
                        : t('Cấu hình theo đơn', 'Configurable')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Topic Filter + Search + Article Grid */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const count = countForCategory(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleSelectCategory(c)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    category === c
                      ? 'bg-[#00552B] text-white'
                      : 'bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 text-[#202020]/80 dark:text-[#F1EFEA]/80 hover:border-[#00552B]/50'
                  }`}
                >
                  <span>{c === 'all' ? t('Tất cả chuyên mục', 'All Topics') : localizeJournalCategory(c, lang)}</span>
                  {allArticles.length > 0 && (
                    <span
                      className={`font-mono text-[11px] ${
                        category === c ? 'text-[#C6A667]' : 'text-[#202020]/45 dark:text-[#F1EFEA]/45'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#202020]/45 dark:text-[#F1EFEA]/45 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm theo từ khóa hoặc mã bài...', 'Search articles or topics...')}
              className="w-full bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded-lg pl-9 pr-3 py-2 text-xs text-[#202020] dark:text-[#F1EFEA]"
            />
          </div>
        </div>

        {sortedArticles.length === 0 ? (
          <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-10 text-center space-y-3">
            <p className="text-sm font-medium text-[#202020]/75 dark:text-[#F1EFEA]/75">
              {t('Không tìm thấy bài viết phù hợp trong chuyên mục này.', 'No articles found matching your filter.')}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                handleSelectCategory('all');
              }}
              className="px-4 py-2 bg-[#00552B] text-white text-xs font-semibold rounded-lg cursor-pointer"
            >
              {t('Xem tất cả bài viết', 'View All Articles')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sortedArticles.map((a) => {
              const nodeMeta = getNodeBySlug(a.slug);
              return (
                <article
                  key={a.id}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
                >
                  <Link
                    to={localePath(`/journal/${a.slug}`)}
                    className="aspect-[4/5] bg-[#F8F5EF] dark:bg-[#0E1512] overflow-hidden block relative"
                  >
                    <MediaImage
                      imageKey={a.image_key}
                      alt={lang === 'vi' ? a.title_vi : a.title_en}
                      className="w-full h-full object-cover"
                    />
                    {nodeMeta && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#111111]/85 text-[#C6A667] font-mono text-[11px] font-bold">
                        {nodeMeta.code}
                      </span>
                    )}
                  </Link>
                  <div className="p-5 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="text-xs text-[#202020]/55 dark:text-[#F1EFEA]/55 flex flex-wrap items-center gap-2">
                        <Link
                          to={localePath(`/journal?category=${encodeURIComponent(a.category)}`)}
                          className="font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
                        >
                          {localizeJournalCategory(a.category, lang)}
                        </Link>
                        <span>·</span>
                        <span>
                          {a.read_minutes} {t('phút đọc', 'min read')}
                        </span>
                      </div>
                      <Link to={localePath(`/journal/${a.slug}`)} className="block group">
                        <h3 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA] group-hover:text-[#00552B] dark:group-hover:text-[#C6A667] transition-colors leading-snug">
                          {lang === 'vi' ? a.title_vi : a.title_en}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-3">
                        {lang === 'vi' ? a.excerpt_vi : a.excerpt_en}
                      </p>
                    </div>
                    <Link
                      to={localePath(`/journal/${a.slug}`)}
                      className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] pt-2 inline-flex items-center hover:underline"
                    >
                      {t('Đọc chi tiết →', 'Read Guide →')}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

interface ParsedHeading {
  id: string;
  text: string;
}

function renderInlineMarkdown(text: string, localePath: (path: string) => string): React.ReactNode[] {
  const tokens = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((part, idx) => {
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      const [, label, href] = linkMatch;
      if (href.startsWith('/')) {
        return (
          <Link
            key={idx}
            to={localePath(href)}
            className="font-semibold text-[#00552B] dark:text-[#C6A667] underline underline-offset-2 decoration-[#00552B]/40 dark:decoration-[#C6A667]/45 hover:decoration-[#00552B] dark:hover:decoration-[#C6A667] transition-colors"
          >
            {label}
          </Link>
        );
      }
      return (
        <a
          key={idx}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[#00552B] dark:text-[#C6A667] underline underline-offset-2"
        >
          {label}
        </a>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-[#202020] dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

function parseRichArticleBody(
  content: string,
  localePath: (path: string) => string
): { headings: ParsedHeading[]; blocks: React.ReactNode[]; sections: React.ReactNode[][] } {
  const lines = String(content || '').split('\n');
  const headings: ParsedHeading[] = [];
  const blocks: React.ReactNode[] = [];
  const sections: React.ReactNode[][] = [];
  let currentSection: React.ReactNode[] = [];

  const pushBlock = (node: React.ReactNode) => {
    blocks.push(node);
    currentSection.push(node);
  };

  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      if (currentSection.length > 0) {
        sections.push(currentSection);
        currentSection = [];
      }
      const text = line.replace(/^##\s+/, '').trim();
      const id = `sec-${headings.length + 1}`;
      headings.push({ id, text });
      pushBlock(
        <h2
          key={`h2-${i}`}
          id={id}
          className="text-xl sm:text-2xl font-bold text-[#202020] dark:text-[#F1EFEA] pt-4 scroll-mt-24"
        >
          {renderInlineMarkdown(text, localePath)}
        </h2>
      );
      i += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      const text = line.replace(/^###\s+/, '').trim();
      pushBlock(
        <h3 key={`h3-${i}`} className="text-base sm:text-lg font-bold text-[#00552B] dark:text-[#C6A667] pt-2">
          {renderInlineMarkdown(text, localePath)}
        </h3>
      );
      i += 1;
      continue;
    }

    // Callout / Blockquote block (> ...)
    if (line.startsWith('> ') || line === '>') {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('> ') || lines[i].trim() === '>')) {
        const cleaned = lines[i].trim().replace(/^>\s?/, '').trim();
        if (cleaned) quoteLines.push(cleaned);
        i += 1;
      }
      if (quoteLines.length > 0) {
        pushBlock(
          <div
            key={`callout-${i}`}
            className="rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#00552B]/20 dark:border-[#C6A667]/25 p-4 sm:p-5 my-3 flex items-start gap-3"
          >
            <Lightbulb className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0 mt-1" />
            <div className="space-y-1.5 text-sm text-[#202020]/90 dark:text-[#F1EFEA]/90 leading-relaxed min-w-0">
              {quoteLines.map((ql, qi) => (
                <p key={qi}>{renderInlineMarkdown(ql, localePath)}</p>
              ))}
            </div>
          </div>
        );
      }
      continue;
    }

    // Markdown table block
    if (line.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i += 1;
      }
      const rows = tableLines
        .filter((l) => !/^\|[\s:-]+\|$/.test(l.replace(/\|[\s:-]+/g, '|---')))
        .filter((l) => !/^\|(?:\s*:?-+:?\s*\|)+$/.test(l))
        .map((rowLine) =>
          rowLine
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim())
        );
      if (rows.length > 0) {
        const [header, ...bodyRows] = rows;
        pushBlock(
          <div key={`tbl-${i}`} className="overflow-x-auto rounded-xl border border-[#202020]/12 dark:border-white/15 my-3">
            <table className="w-full text-xs sm:text-sm text-left">
              <thead className="bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]">
                <tr>
                  {header.map((col, ci) => (
                    <th key={ci} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                      {renderInlineMarkdown(col, localePath)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]/10 dark:divide-white/10">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className="hover:bg-[#F8F5EF]/50 dark:hover:bg-white/5">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3.5 py-2.5 text-[#202020]/85 dark:text-[#F1EFEA]/85 align-top leading-relaxed">
                        {renderInlineMarkdown(cell, localePath)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Bullet list block (- or •)
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))) {
        items.push(lines[i].trim().replace(/^[-•]\s+/, ''));
        i += 1;
      }
      pushBlock(
        <ul key={`ul-${i}`} className="space-y-2 pl-5 list-disc marker:text-[#00552B] dark:marker:text-[#C6A667]">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm sm:text-base text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
              {renderInlineMarkdown(item, localePath)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list block (1. 2. ...)
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      pushBlock(
        <ol key={`ol-${i}`} className="space-y-2 pl-5 list-decimal marker:font-mono marker:font-bold marker:text-[#00552B] dark:marker:text-[#C6A667]">
          {items.map((item, idx) => (
            <li key={idx} className="text-sm sm:text-base text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
              {renderInlineMarkdown(item, localePath)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    pushBlock(
      <p key={`p-${i}`} className="text-sm sm:text-base text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
        {renderInlineMarkdown(line, localePath)}
      </p>
    );
    i += 1;
  }

  if (currentSection.length > 0) {
    sections.push(currentSection);
  }

  return { headings, blocks, sections };
}

export const JournalArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t, localePath } = useI18n();
  const { setCustomBreadcrumb, addToCart, formatPrice, showToast } = useStore();
  const [article, setArticle] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [allArticles, setAllArticles] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!slug) return;
    fetchArticleBySlugWithFallback(slug).then((d) => {
      if (d) {
        setArticle(d.article);
        setRelated(d.related || []);
      }
    });
    fetchJournalWithFallback().then((list) => setAllArticles(list || []));
    fetchProductsWithFallback(new URLSearchParams())
      .then((list) => setAllProducts(list || []))
      .catch(() => {});
  }, [slug]);

  const nodeMeta = useMemo(() => getNodeBySlug(article?.slug), [article?.slug]);
  const pillarMeta = useMemo(
    () => (nodeMeta ? JOURNAL_PILLARS.find((p) => p.id === nodeMeta.pillarId) : undefined),
    [nodeMeta]
  );

  useEffect(() => {
    if (!article) return;
    const titleText = lang === 'vi' ? article.title_vi : article.title_en;
    const excerptText = lang === 'vi' ? article.excerpt_vi : article.excerpt_en;
    const pathname = window.location.pathname;
    const imgUrl = resolveMediaUrl(article.image_key);
    const fullImg = imgUrl.startsWith('http') ? imgUrl : `${window.location.origin}${imgUrl}`;

    updateCustomSeoHead({
      title: `${nodeMeta ? `${nodeMeta.code}: ` : ''}${titleText} | ROAR COFFEE®`,
      description: excerptText,
      pathname,
      type: 'article',
      imageUrl: fullImg,
    });

    upsertJsonLd('roar-article-ld', {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: titleText,
      description: excerptText,
      image: [fullImg],
      author: { '@type': 'Organization', name: article.author || 'ROAR COFFEE®' },
      publisher: { '@type': 'Organization', name: 'ROAR COFFEE®' },
      datePublished: article.published_at || '2026-01-01',
      mainEntityOfPage: window.location.href,
    });

    setCustomBreadcrumb([
      { labelVi: 'Tạp chí Cà phê', labelEn: 'Coffee Journal', to: '/journal' },
      {
        labelVi: localizeJournalCategory(article.category, 'vi'),
        labelEn: localizeJournalCategory(article.category, 'en'),
        to: `/journal?category=${encodeURIComponent(article.category)}`,
      },
      { labelVi: article.title_vi, labelEn: article.title_en },
    ]);

    return () => {
      setCustomBreadcrumb(null);
      upsertJsonLd('roar-article-ld', null);
    };
  }, [article, lang, nodeMeta, setCustomBreadcrumb]);

  const parsedContent = useMemo(
    () => parseRichArticleBody(article ? (lang === 'vi' ? article.content_vi : article.content_en) : '', localePath),
    [article, lang, localePath]
  );

  const enrichment = useMemo(
    () => (nodeMeta ? getArticleEnrichment(nodeMeta, article?.image_key) : null),
    [nodeMeta, article?.image_key]
  );

  const relatedCoffeeProducts = useMemo(() => {
    if (!nodeMeta?.relatedProductSlugs?.length || !allProducts.length) return [];
    const bySlug = new Map(allProducts.map((p) => [p.slug, p]));
    return nodeMeta.relatedProductSlugs
      .map((s) => bySlug.get(s))
      .filter((p): p is Product => Boolean(p && p.status !== 'draft'));
  }, [nodeMeta, allProducts]);

  const mappedRelatedArticles = useMemo(() => {
    const out: any[] = [];
    const seen = new Set<string>([article?.slug || '']);
    if (nodeMeta?.relatedCodes?.length) {
      for (const code of nodeMeta.relatedCodes) {
        const target = getNodeByCode(code);
        if (!target?.slug || seen.has(target.slug)) continue;
        const found = allArticles.find((a) => a.slug === target.slug);
        if (found) {
          seen.add(found.slug);
          out.push(found);
        }
      }
    }
    for (const r of related) {
      if (!seen.has(r.slug)) {
        seen.add(r.slug);
        out.push(r);
      }
    }
    return out.slice(0, 4);
  }, [nodeMeta, allArticles, related, article?.slug]);

  const pillarSiblingNodes = useMemo(
    () => (nodeMeta ? JOURNAL_CURRICULUM_B001_B050.filter((n) => n.pillarId === nodeMeta.pillarId) : []),
    [nodeMeta]
  );

  const nextArticleNode = useMemo(() => {
    if (!nodeMeta?.nextCode) return null;
    const candidate = getNodeByCode(nodeMeta.nextCode);
    if (!candidate?.slug) return null;
    const found = allArticles.find((a) => a.slug === candidate.slug);
    return found ? { ...candidate, article: found } : null;
  }, [nodeMeta, allArticles]);

  if (!article) {
    return (
      <div className="max-w-[820px] mx-auto px-6 py-20 text-center text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
        {t('Đang tải bài viết...', 'Loading article...')}
      </div>
    );
  }

  const glossaryItems = lang === 'vi' ? nodeMeta?.glossaryVi : nodeMeta?.glossaryEn;

  return (
    <article className="max-w-[920px] mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={localePath('/journal')} className="inline-flex items-center gap-1.5 text-xs text-[#00552B] dark:text-[#C6A667] hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('Quay lại Tạp Chí Cà Phê', 'Back to Coffee Journal')}
        </Link>
        <Link
          to={localePath(`/journal?category=${encodeURIComponent(article.category)}`)}
          className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
        >
          {t('Chuyên mục:', 'Topic:')} {localizeJournalCategory(article.category, lang)} →
        </Link>
      </div>

      {/* Article Header */}
      <header className="space-y-3">
        <div className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60 flex flex-wrap items-center gap-2">
          {nodeMeta && (
            <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#00552B] text-white text-[11px]">
              {nodeMeta.code}
            </span>
          )}
          {pillarMeta && (
            <>
              <span className="font-medium text-[#00552B] dark:text-[#C6A667]">
                {lang === 'vi' ? pillarMeta.nameVi : pillarMeta.nameEn}
              </span>
              <span>·</span>
            </>
          )}
          <span>{article.author}</span>
          <span>·</span>
          <span>
            {article.read_minutes} {t('phút đọc', 'min read')}
          </span>
          {article.published_at && (
            <>
              <span>·</span>
              <span className="font-mono">{String(article.published_at).slice(0, 10)}</span>
            </>
          )}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] leading-tight">
          {lang === 'vi' ? article.title_vi : article.title_en}
        </h1>
        <p className="text-base text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
          {lang === 'vi' ? article.excerpt_vi : article.excerpt_en}
        </p>
      </header>

      {/* Hero Editorial Visual (Fig. 1) */}
      <figure className="max-w-xl mx-auto space-y-2">
        <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10">
          <MediaImage
            imageKey={article.image_key}
            alt={lang === 'vi' ? article.title_vi : article.title_en}
            className="w-full h-full object-cover"
          />
        </div>
        <figcaption className="text-center text-xs italic text-[#202020]/60 dark:text-[#F1EFEA]/60">
          Fig. 1 — {lang === 'vi' ? article.title_vi : article.title_en} · ROAR Coffee Journal
        </figcaption>
      </figure>

      {/* Interactive Table of Contents + Quick Contextual Links */}
      {parsedContent.headings.length >= 2 && (
        <nav
          aria-label={t('Mục lục bài viết', 'Table of contents')}
          className="rounded-xl bg-[#F8F5EF] dark:bg-[#121D17] border border-[#202020]/10 dark:border-white/10 p-4 sm:p-5 space-y-2.5"
        >
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            <ListTree className="w-4 h-4" />
            <span>{t('Mục lục nội dung', 'Table of Contents')}</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            {parsedContent.headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className="text-[#202020]/80 dark:text-[#F1EFEA]/80 hover:text-[#00552B] dark:hover:text-[#C6A667] hover:underline inline-flex items-center gap-1"
                >
                  <ChevronRight className="w-3 h-3 shrink-0 opacity-60" />
                  <span>{h.text}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {nodeMeta && ((nodeMeta.quickLinks?.length || 0) > 0 || (nodeMeta.relatedCodes?.length || 0) > 0 || relatedCoffeeProducts.length > 0) && (
        <aside
          aria-label={t('Liên kết nhanh và gợi ý trong bài', 'Quick links and suggestions')}
          className="rounded-xl bg-white dark:bg-[#16221C] border border-[#00552B]/20 dark:border-[#C6A667]/25 p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              <Link2 className="w-4 h-4" />
              <span>{t('Liên kết nhanh & Gợi ý khám phá', 'Quick Links & Exploration Suggestions')}</span>
            </div>
            {relatedCoffeeProducts.length > 0 && (
              <a
                href="#related-coffee"
                className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
              >
                {t('Xem sản phẩm phù hợp ↓', 'Jump to Matching Lots ↓')}
              </a>
            )}
          </div>

          {nodeMeta.quickLinks && nodeMeta.quickLinks.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {nodeMeta.quickLinks.map((ql) => {
                const QuickIcon =
                  ql.kind === 'origin'
                    ? MapPin
                    : ql.kind === 'personality'
                      ? Users
                      : ql.kind === 'journal'
                        ? BookOpen
                        : ShoppingBag;
                return (
                  <Link
                    key={`${ql.to}-${ql.labelEn}`}
                    to={localePath(ql.to)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/12 dark:border-white/12 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs font-medium text-[#202020] dark:text-[#F1EFEA] transition-colors"
                  >
                    <QuickIcon className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667] shrink-0" />
                    <span>{lang === 'vi' ? ql.labelVi : ql.labelEn}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {nodeMeta.relatedCodes.length > 0 && (
            <div className="pt-2 border-t border-[#202020]/8 dark:border-white/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60 font-medium">
                {t('Đọc nối tiếp:', 'Cross-references:')}
              </span>
              {nodeMeta.relatedCodes.map((code) => {
                const target = getNodeByCode(code);
                if (!target) return null;
                return (
                  <Link
                    key={code}
                    to={localePath(`/journal/${target.slug}`)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#00552B]/8 dark:bg-[#00552B]/25 text-[#00552B] dark:text-[#C6A667] hover:underline font-medium"
                  >
                    <span className="font-mono font-bold">{target.code}</span>
                    <span>·</span>
                    <span className="line-clamp-1 max-w-[240px]">
                      {lang === 'vi' ? target.titleVi : target.titleEn}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </aside>
      )}

      {/* Main Article Body + Interleaved Visual Figures, Interactive Chart & Process Flowchart */}
      <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-10 space-y-6">
        {/* Opening Sections (1-2) */}
        {parsedContent.sections.slice(0, 2).map((sec, sIdx) => (
          <div key={`sec-top-${sIdx}`} className="space-y-5">
            {sec}
          </div>
        ))}

        {/* Curated Visual Figures (Fig. 2 - Fig. 3) */}
        {enrichment && enrichment.visualFigures.slice(0, 2).length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            {enrichment.visualFigures.slice(0, 2).map((fig, idx) => (
              <figure
                key={`fig-top-${fig.imageKey}`}
                className="rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/50 dark:bg-[#0E1512] flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <MediaImage
                    imageKey={fig.imageKey}
                    alt={lang === 'vi' ? fig.captionVi : fig.captionEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="p-3 text-xs italic text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">
                  Fig. {idx + 2} — {lang === 'vi' ? fig.captionVi : fig.captionEn}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* Mid Section (3) */}
        {parsedContent.sections[2] && <div className="space-y-5">{parsedContent.sections[2]}</div>}

        {/* Dedicated Analytical Chart & Step-by-Step Process Flowchart */}
        {enrichment && nodeMeta && (
          <div className="space-y-4">
            <JournalCharts chartType={enrichment.chartType} lang={lang} />
            <JournalFlowchart flowchart={enrichment.flowchart} articleCode={nodeMeta.code} lang={lang} />
          </div>
        )}

        {/* Remaining Sections (4+) */}
        {parsedContent.sections.slice(3).map((sec, sIdx) => (
          <div key={`sec-rest-${sIdx}`} className="space-y-5">
            {sec}
          </div>
        ))}

        {/* Supporting Visual Figures Gallery (Fig. 4 - Fig. 6) */}
        {enrichment && enrichment.visualFigures.slice(2).length > 0 && (
          <div
            className={`grid grid-cols-1 ${
              enrichment.visualFigures.slice(2).length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'
            } gap-4 pt-2`}
          >
            {enrichment.visualFigures.slice(2).map((fig, idx) => (
              <figure
                key={`fig-bot-${fig.imageKey}`}
                className="rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/50 dark:bg-[#0E1512] flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <MediaImage
                    imageKey={fig.imageKey}
                    alt={lang === 'vi' ? fig.captionVi : fig.captionEn}
                    className="w-full h-full object-cover"
                  />
                </div>
                <figcaption className="p-3 text-xs italic text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">
                  Fig. {idx + 4} — {lang === 'vi' ? fig.captionVi : fig.captionEn}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      {/* Verified Scientific & Institutional Evidence */}
      {enrichment && enrichment.evidenceItems.length > 0 && (
        <section className="rounded-2xl bg-[#F8F5EF]/80 dark:bg-[#121D17] border border-[#202020]/10 dark:border-white/10 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              <FileCheck2 className="w-4 h-4" />
              <span>{t('Dẫn chứng khoa học & Tiêu chuẩn tham chiếu', 'Scientific Evidence & Reference Standards')}</span>
            </div>
            <span className="text-[11px] font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums">
              {enrichment.evidenceItems.length} {t('nguồn xác thực', 'verified citations')}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enrichment.evidenceItems.map((ev, idx) => (
              <div
                key={`${ev.source}-${idx}`}
                className="rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-4 space-y-1.5"
              >
                <p className="text-[11px] font-mono font-semibold text-[#00552B] dark:text-[#C6A667]">
                  {ev.source} · {ev.standardOrYear}
                </p>
                <p className="text-xs sm:text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
                  {lang === 'vi' ? ev.findingVi : ev.findingEn}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Practical Takeaways & Action Checklist */}
      {nodeMeta && ((lang === 'vi' ? nodeMeta.actionTipsVi : nodeMeta.actionTipsEn)?.length || 0) > 0 && (
        <section className="rounded-2xl bg-[#F8F5EF] dark:bg-[#121D17] border border-[#00552B]/20 dark:border-[#C6A667]/25 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            <Lightbulb className="w-4 h-4" />
            <span>{t('Gợi ý thực hành & Điểm cốt lõi', 'Key Takeaways & Practical Suggestions')}</span>
          </div>
          <ul className="space-y-2.5">
            {(lang === 'vi' ? nodeMeta.actionTipsVi : nodeMeta.actionTipsEn)?.map((tip, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-[#00552B] dark:text-[#C6A667] shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Contextual Product Discovery: "Khám phá cà phê liên quan / Explore Related Coffee" */}
      {relatedCoffeeProducts.length > 0 && (
        <section
          id="related-coffee"
          className="rounded-2xl bg-[#F8F5EF] dark:bg-[#121D17] border border-[#00552B]/20 dark:border-[#C6A667]/25 p-5 sm:p-7 space-y-4 scroll-mt-24"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('Khám phá cà phê liên quan', 'Explore Related Coffee')}</span>
              </p>
              <h2 className="text-lg sm:text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
                {t('Kết Nối Kiến Thức Với Sản Phẩm Thực Tế', 'Discover Matching ROAR Lots')}
              </h2>
              {nodeMeta && (nodeMeta.recommendationReasonVi || nodeMeta.recommendationReasonEn) && (
                <p className="text-xs sm:text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 max-w-2xl">
                  {lang === 'vi' ? nodeMeta.recommendationReasonVi : nodeMeta.recommendationReasonEn}
                </p>
              )}
            </div>
            <Link
              to={localePath('/shop')}
              className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
            >
              {t('Chọn cà phê phù hợp →', 'Find Your Coffee →')}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedCoffeeProducts.map((p) => {
              const firstVariant = p.variants?.[0];
              const isKg = p.category === 'roasted_beans';
              const isGreen = p.category === 'green_bean';
              const canPurchase = p.status === 'active' && !isGreen;
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <Link to={localePath(`/product/${p.slug}`)} className="aspect-[4/3] block overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512]">
                      <MediaImage
                        imageKey={p.image_key}
                        alt={lang === 'vi' ? p.name_vi : p.name_en}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                    <div className="p-4 space-y-1.5">
                      <span className="text-[10px] font-mono font-semibold text-[#00552B] dark:text-[#C6A667]">
                        {p.sku} · {p.processing_method || p.coffee_type}
                      </span>
                      <Link to={localePath(`/product/${p.slug}`)} className="block group">
                        <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] group-hover:text-[#00552B] dark:group-hover:text-[#C6A667] line-clamp-1">
                          {lang === 'vi' ? p.name_vi : p.name_en}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 line-clamp-2">
                        {lang === 'vi' ? p.subtitle_vi : p.subtitle_en}
                      </p>
                      {p.brewing_methods?.length > 0 && (
                        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
                          {p.brewing_methods.slice(0, 3).map((m) => localizeBrewingMethod(m, lang)).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="px-4 pb-4 pt-2 border-t border-[#202020]/8 dark:border-white/10 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                      {p.status === 'active'
                        ? `${formatPrice(firstVariant?.priceVnd || p.price_vnd, firstVariant?.priceUsd || p.price_usd)}${isKg || isGreen ? '/kg' : ''}`
                        : t('B2B Báo giá', 'On Request')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={localePath(`/product/${p.slug}`)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-[11px] font-semibold text-[#202020] dark:text-[#F1EFEA] hover:border-[#00552B] whitespace-nowrap"
                      >
                        {t('Chi tiết', 'Details')}
                      </Link>
                      {canPurchase && (
                        <button
                          type="button"
                          onClick={() => {
                            addToCart({
                              productId: p.id,
                              slug: p.slug,
                              sku: p.sku,
                              nameVi: p.name_vi,
                              nameEn: p.name_en,
                              variantLabel: firstVariant?.label || p.packaging_options?.[0] || 'Standard',
                              unitPriceVnd: firstVariant?.priceVnd || p.price_vnd,
                              unitPriceUsd: firstVariant?.priceUsd || p.price_usd,
                              quantity: 1,
                              imageKey: p.image_key,
                              unit: isKg ? 'kg' : 'unit',
                              pricingTiers: isKg ? p.pricing_tiers : undefined,
                            });
                            showToast(t('Đã thêm vào giỏ hàng', 'Added to cart'));
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{t('Thêm', 'Add')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Glossary & Verified References */}
      {((glossaryItems && glossaryItems.length > 0) || (nodeMeta?.references && nodeMeta.references.length > 0)) && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {glossaryItems && glossaryItems.length > 0 && (
            <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
                {t('Thuật ngữ chuyên ngành', 'Key Coffee Glossary')}
              </h3>
              <dl className="space-y-2 text-xs">
                {glossaryItems.map((g) => (
                  <div key={g.term} className="space-y-0.5">
                    <dt className="font-bold text-[#00552B] dark:text-[#C6A667]">{g.term}</dt>
                    <dd className="text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">{g.def}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {nodeMeta?.references && nodeMeta.references.length > 0 && (
            <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 space-y-3">
              <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
                {t('Nguồn tham khảo khoa học & tổ chức', 'Scientific & Industry References')}
              </h3>
              <ul className="space-y-1.5 text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 list-disc pl-4">
                {nodeMeta.references.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Next in Learning Path */}
      {nextArticleNode && (
        <div className="rounded-xl bg-[#00552B]/8 dark:bg-[#00552B]/25 border border-[#00552B]/20 dark:border-[#C6A667]/25 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              {t('Bài tiếp theo trong hành trình', 'Next in Learning Path')} · {nextArticleNode.code}
            </span>
            <h3 className="text-base font-bold text-[#202020] dark:text-[#F1EFEA]">
              {lang === 'vi' ? nextArticleNode.article.title_vi : nextArticleNode.article.title_en}
            </h3>
          </div>
          <Link
            to={localePath(`/journal/${nextArticleNode.article.slug}`)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold whitespace-nowrap shrink-0"
          >
            <span>{t('Đọc bài tiếp theo', 'Read Next Guide')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Same-Pillar Syllabus Navigation */}
      {pillarMeta && pillarSiblingNodes.length > 1 && (
        <section className="rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
                {t('Chuyên đề', 'Pillar')} {pillarMeta.id} · {pillarMeta.codeRange}
              </p>
              <h2 className="text-base sm:text-lg font-bold text-[#202020] dark:text-[#F1EFEA]">
                {lang === 'vi' ? pillarMeta.nameVi : pillarMeta.nameEn}
              </h2>
            </div>
            <Link
              to={localePath('/journal')}
              className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
            >
              {t('Toàn bộ lộ trình B001–B050 →', 'Full B001–B050 Curriculum →')}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pillarSiblingNodes.map((sib) => {
              const isCurrent = sib.slug === article.slug;
              return (
                <Link
                  key={sib.code}
                  to={localePath(`/journal/${sib.slug}`)}
                  className={`rounded-xl px-3.5 py-2.5 border text-xs flex items-center justify-between gap-2 transition-colors ${
                    isCurrent
                      ? 'bg-[#00552B] border-[#00552B] text-white font-semibold'
                      : 'bg-[#F8F5EF]/70 dark:bg-[#0E1512] border-[#202020]/10 dark:border-white/10 text-[#202020]/85 dark:text-[#F1EFEA]/85 hover:border-[#00552B]/50 dark:hover:border-[#C6A667]/50'
                  }`}
                >
                  <span className="truncate">
                    <span className={`font-mono font-bold mr-1.5 ${isCurrent ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                      {sib.code}
                    </span>
                    {lang === 'vi' ? sib.titleVi : sib.titleEn}
                  </span>
                  {!isCurrent && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Related Articles */}
      {mappedRelatedArticles.length > 0 && (
        <section className="pt-6 border-t border-[#202020]/10 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold dark:text-[#F1EFEA]">{t('Bài viết liên quan', 'Related Articles')}</h2>
            <Link
              to={localePath(`/journal?category=${encodeURIComponent(article.category)}`)}
              className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
            >
              {t('Xem tất cả cùng chuyên mục →', 'All in this topic →')}
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mappedRelatedArticles.map((r) => {
              const rNode = getNodeBySlug(r.slug);
              return (
                <Link
                  key={r.id}
                  to={localePath(`/journal/${r.slug}`)}
                  className="bg-white dark:bg-[#16221C] p-4 rounded-xl border border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {rNode && <span className="font-mono">{rNode.code} ·</span>}
                      <span>{localizeJournalCategory(r.category, lang)}</span>
                    </div>
                    <h3 className="text-sm font-bold mt-1.5 dark:text-[#F1EFEA] leading-snug">
                      {lang === 'vi' ? r.title_vi : r.title_en}
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55 mt-3">
                    {r.read_minutes} {t('phút đọc', 'min read')}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
};
