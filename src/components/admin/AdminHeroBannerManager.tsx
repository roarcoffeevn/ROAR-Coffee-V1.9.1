import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ImagePlus,
  Layers,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';
import { MediaImage } from '../MediaImage';
import { MediaPickerModal, type MediaAssetRecord } from './MediaPickerModal';
import {
  CATEGORY_BANNER_META,
  CATEGORY_BANNER_OPTIONS,
  DEFAULT_CATEGORY_BANNERS,
  parseCategoryBanners,
  type CmsCategoryBanner,
} from '../../lib/categoryBanners';
import {
  DEFAULT_HERO_METRICS,
  DEFAULT_HERO_SLIDES,
  parseHeroMetrics,
  parseHeroSlides,
  type HeroMetricConfig,
  type HeroSlideConfig,
} from '../../lib/heroBanners';

export type CmsHeroSlide = HeroSlideConfig;
export type CmsHeroMetric = HeroMetricConfig;
export const DEFAULT_CMS_HERO_SLIDES = DEFAULT_HERO_SLIDES;
export const DEFAULT_CMS_HERO_METRICS = DEFAULT_HERO_METRICS;

interface AdminHeroBannerManagerProps {
  settings: Record<string, string>;
  onSaved?: (next: Record<string, string>) => void;
  mediaAssets?: MediaAssetRecord[];
  onMediaUploaded?: () => Promise<void> | void;
}

const SURFACE_PRESETS = [
  { value: 'bg-[#003D25]', labelVi: 'Xanh Emerald ROAR (#003D25)', labelEn: 'ROAR Emerald (#003D25)' },
  { value: 'bg-[#0D1913]', labelVi: 'Đen Obsidian Reserve (#0D1913)', labelEn: 'Obsidian Reserve (#0D1913)' },
  { value: 'bg-[#062C1B]', labelVi: 'Rừng sâu Tây Nguyên (#062C1B)', labelEn: 'Highland Forest (#062C1B)' },
  { value: 'bg-[#111312]', labelVi: 'Đen Tuyền Báo Đen (#111312)', labelEn: 'Black Panther (#111312)' },
];

const DOT_COLOR_PRESETS = [
  { value: 'bg-[#C6A667]', labelVi: 'Vàng Champagne (#C6A667)', labelEn: 'Champagne Gold' },
  { value: 'bg-emerald-400', labelVi: 'Xanh Ngọc (#34D399)', labelEn: 'Emerald Mint' },
  { value: 'bg-emerald-300', labelVi: 'Xanh Sáng (#6EE7B7)', labelEn: 'Bright Emerald' },
  { value: 'bg-amber-300', labelVi: 'Hổ Phách (#FCD34D)', labelEn: 'Light Amber' },
  { value: 'bg-amber-400', labelVi: 'Vàng Cam (#FBBF24)', labelEn: 'Warm Gold' },
  { value: 'bg-white', labelVi: 'Trắng Tinh Khôi', labelEn: 'Crisp White' },
];

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export const AdminHeroBannerManager: React.FC<AdminHeroBannerManagerProps> = ({
  settings,
  onSaved,
  mediaAssets = [],
  onMediaUploaded = () => {},
}) => {
  const { t } = useI18n();
  const { apiFetch, showToast, refreshBootstrap } = useStore();
  const [subTab, setSubTab] = useState<'category_banners' | 'slides' | 'carousel'>('slides');
  const [slides, setSlides] = useState<HeroSlideConfig[]>(() =>
    parseHeroSlides(settings.cms_hero_slides_json)
  );
  const [metrics, setMetrics] = useState<HeroMetricConfig[]>(() =>
    parseHeroMetrics(settings.cms_hero_metrics_json)
  );
  const [categoryBanners, setCategoryBanners] = useState<CmsCategoryBanner[]>(() =>
    parseCategoryBanners(settings.cms_category_banners_json)
  );
  const [saving, setSaving] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<
    | { kind: 'slide'; slideId: string }
    | { kind: 'category'; bannerId: string }
    | null
  >(null);

  useEffect(() => {
    setSlides(parseHeroSlides(settings.cms_hero_slides_json));
    setMetrics(parseHeroMetrics(settings.cms_hero_metrics_json));
    setCategoryBanners(parseCategoryBanners(settings.cms_category_banners_json));
  }, [settings.cms_hero_slides_json, settings.cms_hero_metrics_json, settings.cms_category_banners_json]);

  const hasUnsavedChanges = useMemo(() => {
    const savedSlides = JSON.stringify(parseHeroSlides(settings.cms_hero_slides_json));
    const savedMetrics = JSON.stringify(parseHeroMetrics(settings.cms_hero_metrics_json));
    const savedCats = JSON.stringify(parseCategoryBanners(settings.cms_category_banners_json));
    return (
      JSON.stringify(slides) !== savedSlides ||
      JSON.stringify(metrics) !== savedMetrics ||
      JSON.stringify(categoryBanners) !== savedCats
    );
  }, [
    slides,
    metrics,
    categoryBanners,
    settings.cms_hero_slides_json,
    settings.cms_hero_metrics_json,
    settings.cms_category_banners_json,
  ]);

  // ---------- SLIDE HANDLERS ----------
  const addSlide = () => {
    setSlides((prev) => [
      ...prev,
      {
        id: uid('slide'),
        imageKey: 'hero_roar_coffee',
        badgeVi: 'ROAR COFFEE®',
        badgeEn: 'ROAR COFFEE®',
        titleVi: 'Banner Hero mới',
        titleEn: 'New Hero Slide',
        descVi: 'Mô tả ngắn cho slide hero banner mới.',
        descEn: 'Short description for this new hero slide.',
        captionVi: 'ROAR COFFEE — Khơi bản lĩnh. Đậm chất riêng.',
        captionEn: 'ROAR COFFEE — Igniting Courage. Defining Character.',
        primaryCtaVi: 'Khám phá ngay',
        primaryCtaEn: 'Explore Now',
        primaryTo: '/shop',
        secondaryCtaVi: 'Xem thêm',
        secondaryCtaEn: 'Learn More',
        secondaryTo: '/about',
        tabLabelVi: `${String(prev.length + 1).padStart(2, '0')} · Banner mới`,
        tabLabelEn: `${String(prev.length + 1).padStart(2, '0')} · New Slide`,
        surfaceClass: 'bg-[#003D25]',
        visible: true,
      },
    ]);
  };

  const duplicateSlide = (idx: number) => {
    const src = slides[idx];
    if (!src) return;
    const copy: HeroSlideConfig = {
      ...src,
      id: uid('slide'),
      titleVi: `${src.titleVi} (Bản sao)`,
      titleEn: `${src.titleEn} (Copy)`,
      tabLabelVi: `${String(slides.length + 1).padStart(2, '0')} · ${src.tabLabelVi.replace(/^\d+\s*·\s*/, '')}`,
      tabLabelEn: `${String(slides.length + 1).padStart(2, '0')} · ${src.tabLabelEn.replace(/^\d+\s*·\s*/, '')}`,
    };
    setSlides((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
  };

  const moveSlide = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= slides.length) return;
    const copy = [...slides];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setSlides(copy);
  };

  const updateSlide = (id: string, patch: Partial<HeroSlideConfig>) => {
    setSlides((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const deleteSlide = (id: string) => {
    setSlides((prev) => prev.filter((x) => x.id !== id));
  };

  // ---------- METRIC CAROUSEL HANDLERS ----------
  const addMetric = () => {
    setMetrics((prev) => [
      ...prev,
      {
        id: uid('hm'),
        value: '100%',
        dot: 'bg-[#C6A667]',
        titleVi: 'Thẻ chỉ số mới',
        titleEn: 'New Metric Card',
        subVi: 'Mô tả ngắn tiếng Việt',
        subEn: 'Short English caption',
        to: '/shop',
        visible: true,
      },
    ]);
  };

  const duplicateMetric = (idx: number) => {
    const src = metrics[idx];
    if (!src) return;
    const copy: HeroMetricConfig = {
      ...src,
      id: uid('hm'),
      titleVi: `${src.titleVi} (Bản sao)`,
      titleEn: `${src.titleEn} (Copy)`,
    };
    setMetrics((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
  };

  const moveMetric = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= metrics.length) return;
    const copy = [...metrics];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setMetrics(copy);
  };

  const updateMetric = (id: string, patch: Partial<HeroMetricConfig>) => {
    setMetrics((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  };

  const deleteMetric = (id: string) => {
    setMetrics((prev) => prev.filter((x) => x.id !== id));
  };

  // ---------- CATEGORY BANNER HANDLERS ----------
  const addCategoryBanner = () => {
    setCategoryBanners((prev) => [
      ...prev,
      {
        id: uid('cat'),
        categoryKey: 'all',
        eyebrowVi: 'ROAR COFFEE® · KHUYẾN MÃI & BỘ SƯU TẬP',
        eyebrowEn: 'ROAR COFFEE® · CURATED COLLECTION',
        titleVi: 'Banner Danh Mục Sản Phẩm Mới',
        titleEn: 'New Product Category Banner',
        subtitleVi: 'Mô tả ngắn cho banner hiển thị ở đầu trang danh mục sản phẩm.',
        subtitleEn: 'Short subtitle shown at the top of the matching product category.',
        imageUrl: 'hero_roar_coffee',
        ctaLabelVi: 'Khám phá ngay',
        ctaLabelEn: 'Explore Now',
        ctaPath: '/shop',
        visible: true,
      },
    ]);
  };

  const duplicateCategoryBanner = (idx: number) => {
    const src = categoryBanners[idx];
    if (!src) return;
    const copy: CmsCategoryBanner = {
      ...src,
      id: uid('cat'),
      titleVi: `${src.titleVi} (Bản sao)`,
      titleEn: `${src.titleEn} (Copy)`,
    };
    setCategoryBanners((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
  };

  const moveCategoryBanner = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= categoryBanners.length) return;
    const copy = [...categoryBanners];
    [copy[idx], copy[target]] = [copy[target], copy[idx]];
    setCategoryBanners(copy);
  };

  const updateCategoryBanner = (
    bannerId: string,
    patch: Partial<CmsCategoryBanner>
  ) => {
    setCategoryBanners((prev) =>
      prev.map((b, i) => {
        const curId = b.id || `cat-${b.categoryKey}-${i}`;
        return curId === bannerId ? { ...b, ...patch } : b;
      })
    );
  };

  const deleteCategoryBanner = (bannerId: string) => {
    setCategoryBanners((prev) =>
      prev.filter((b, i) => (b.id || `cat-${b.categoryKey}-${i}`) !== bannerId)
    );
  };

  // ---------- SAVE HANDLER ----------
  const handleSave = async () => {
    setSaving(true);
    try {
      const normalizedCats = categoryBanners.map((b, i) => ({
        ...b,
        id: b.id || `cat-${b.categoryKey}-${i + 1}`,
      }));
      const payload = {
        cms_hero_slides_json: JSON.stringify(slides),
        cms_hero_metrics_json: JSON.stringify(metrics),
        cms_category_banners_json: JSON.stringify(normalizedCats),
      };
      const res = await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setCategoryBanners(normalizedCats);
        onSaved?.({ ...settings, ...payload });
        await refreshBootstrap();
        showToast(
          t(
            'Đã lưu toàn bộ thay đổi Banner Danh mục, Hero Slide & Carousel!',
            'Saved Category Banners, Homepage Hero Slides & Carousel!'
          )
        );
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Không thể lưu cấu hình Banner.', 'Failed to save Banner settings.'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Quản lý Banner Danh Mục, Hero & Carousel', 'Category Banners, Hero & Carousel Manager')}
            </h2>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60">
                <AlertCircle className="w-3 h-3" />
                {t('Có thay đổi chưa lưu', 'Unsaved changes')}
              </span>
            )}
          </div>
          <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-1">
            {t(
              'Thêm, xóa, sửa nội dung song ngữ, nhân bản, sắp xếp thứ tự hoặc bật/tắt hiển thị cho Slide Hero Trang chủ, Carousel chỉ số và Banner Danh mục (/shop).',
              'Add, edit, duplicate, reorder, hide, or delete Homepage Hero Slides, Metrics Carousel cards, and Product Category Banners.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSlides(DEFAULT_HERO_SLIDES);
              setMetrics(DEFAULT_HERO_METRICS);
              setCategoryBanners(DEFAULT_CATEGORY_BANNERS);
              showToast(t('Đã khôi phục mặc định (bấm Lưu tất cả Banner để áp dụng)', 'Reset to defaults (click Save All Banners to apply)'));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold hover:bg-[#202020]/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('Khôi phục mặc định', 'Reset Defaults')}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t('Đang lưu...', 'Saving...') : t('Lưu tất cả Banner', 'Save All Banners')}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('slides')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
            subTab === 'slides' ? 'bg-[#00552B] text-white' : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>{t('Slide Hero Trang Chủ', 'Homepage Hero Slides')} ({slides.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('carousel')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
            subTab === 'carousel' ? 'bg-[#00552B] text-white' : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('Carousel Thẻ Chỉ Số', 'Metrics Carousel')} ({metrics.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('category_banners')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
            subTab === 'category_banners' ? 'bg-[#00552B] text-white' : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5'
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          <span>{t('Banner Danh Mục Sản Phẩm', 'Product Category Banners')} ({categoryBanners.length})</span>
        </button>
      </div>

      {/* TAB 0: HERO SLIDES */}
      {subTab === 'slides' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
              {t(
                `Đang có ${slides.length} Slide Hero (${slides.filter((s) => s.visible !== false).length} đang hiển thị).`,
                `${slides.length} Hero Slides (${slides.filter((s) => s.visible !== false).length} visible).`
              )}
            </p>
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Thêm Slide Hero Banner mới', 'Add New Hero Slide')}</span>
            </button>
          </div>

          {slides.length === 0 ? (
            <div className="bg-white dark:bg-[#16221C] p-8 rounded-xl border border-dashed border-[#202020]/20 dark:border-white/20 text-center space-y-3">
              <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {t('Chưa có Slide Hero nào. Hãy thêm Slide mới hoặc khôi phục 4 Slide mặc định.', 'No Hero Slides configured yet.')}
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={addSlide}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Thêm Slide Hero mới', 'Add Hero Slide')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSlides(DEFAULT_HERO_SLIDES)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('Khôi phục 4 Slide mặc định', 'Restore 4 Defaults')}</span>
                </button>
              </div>
            </div>
          ) : (
            slides.map((s, idx) => {
              const isVisible = s.visible !== false;
              return (
                <div
                  key={s.id}
                  className={`bg-white dark:bg-[#16221C] p-5 rounded-xl border space-y-4 transition-opacity ${
                    isVisible
                      ? 'border-[#202020]/10 dark:border-white/10'
                      : 'border-amber-400/50 bg-amber-50/30 dark:bg-[#16221C]/70 opacity-85'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                        Slide #{idx + 1}
                      </span>
                      <span className="text-xs font-medium text-[#202020]/60 dark:text-[#F1EFEA]/60">
                        · {s.tabLabelVi || s.titleVi}
                      </span>
                      {!isVisible && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold">
                          {t('Đang ẩn', 'Hidden')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateSlide(s.id, { visible: !isVisible })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer mr-1 ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isVisible ? t('Hiển thị', 'Visible') : t('Đang ẩn', 'Hidden')}</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveSlide(idx, -1)}
                        title={t('Đưa lên', 'Move up')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === slides.length - 1}
                        onClick={() => moveSlide(idx, 1)}
                        title={t('Đưa xuống', 'Move down')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateSlide(idx)}
                        title={t('Nhân bản slide', 'Duplicate slide')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 text-[#00552B] dark:text-[#C6A667] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSlide(s.id)}
                        title={t('Xóa slide', 'Delete slide')}
                        className="p-1.5 rounded text-red-500 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Live Thumbnail + Image Picker + Surface Theme */}
                    <div className="lg:col-span-4 space-y-2.5">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#0D1B14] border border-[#202020]/15 dark:border-white/15">
                        <MediaImage
                          imageKey={s.imageKey}
                          alt={s.titleVi}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={s.imageKey}
                          onChange={(e) => updateSlide(s.id, { imageKey: e.target.value })}
                          placeholder="hero_roar_coffee hoặc https://..."
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setPickerTarget({ kind: 'slide', slideId: s.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00552B] text-white text-[11px] font-semibold hover:bg-[#004422] shrink-0 cursor-pointer"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                          <span>{t('Chọn ảnh', 'Pick')}</span>
                        </button>
                      </div>
                      <div className="text-xs">
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Màu nền Hero', 'Hero Surface Theme')}
                        </label>
                        <select
                          value={s.surfaceClass}
                          onChange={(e) => updateSlide(s.id, { surfaceClass: e.target.value })}
                          className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
                        >
                          {SURFACE_PRESETS.map((sp) => (
                            <option key={sp.value} value={sp.value}>
                              {t(sp.labelVi, sp.labelEn)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Editorial Fields */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tên Tab Chọn nhanh (VI)', 'Selector Tab Label (VI)')}</label>
                        <input
                          value={s.tabLabelVi}
                          onChange={(e) => updateSlide(s.id, { tabLabelVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tên Tab Chọn nhanh (EN)', 'Selector Tab Label (EN)')}</label>
                        <input
                          value={s.tabLabelEn}
                          onChange={(e) => updateSlide(s.id, { tabLabelEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nhãn phụ (VI)', 'Badge (VI)')}</label>
                        <input
                          value={s.badgeVi}
                          onChange={(e) => updateSlide(s.id, { badgeVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nhãn phụ (EN)', 'Badge (EN)')}</label>
                        <input
                          value={s.badgeEn}
                          onChange={(e) => updateSlide(s.id, { badgeEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tiêu đề chính (VI)', 'Title (VI)')}</label>
                        <input
                          value={s.titleVi}
                          onChange={(e) => updateSlide(s.id, { titleVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Tiêu đề chính (EN)', 'Title (EN)')}</label>
                        <input
                          value={s.titleEn}
                          onChange={(e) => updateSlide(s.id, { titleEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Mô tả ngắn (VI)', 'Description (VI)')}</label>
                        <textarea
                          rows={2}
                          value={s.descVi}
                          onChange={(e) => updateSlide(s.id, { descVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Mô tả ngắn (EN)', 'Description (EN)')}</label>
                        <textarea
                          rows={2}
                          value={s.descEn}
                          onChange={(e) => updateSlide(s.id, { descEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Chú thích ảnh (VI)', 'Image Caption (VI)')}</label>
                        <input
                          value={s.captionVi}
                          onChange={(e) => updateSlide(s.id, { captionVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Chú thích ảnh (EN)', 'Image Caption (EN)')}</label>
                        <input
                          value={s.captionEn}
                          onChange={(e) => updateSlide(s.id, { captionEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút chính (VI)', 'Primary CTA (VI)')}</label>
                          <input
                            value={s.primaryCtaVi}
                            onChange={(e) => updateSlide(s.id, { primaryCtaVi: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút chính (EN)', 'Primary CTA (EN)')}</label>
                          <input
                            value={s.primaryCtaEn}
                            onChange={(e) => updateSlide(s.id, { primaryCtaEn: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Link nút chính', 'Primary Link')}</label>
                          <input
                            value={s.primaryTo}
                            onChange={(e) => updateSlide(s.id, { primaryTo: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút phụ (VI)', 'Secondary CTA (VI)')}</label>
                          <input
                            value={s.secondaryCtaVi}
                            onChange={(e) => updateSlide(s.id, { secondaryCtaVi: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Nút phụ (EN)', 'Secondary CTA (EN)')}</label>
                          <input
                            value={s.secondaryCtaEn}
                            onChange={(e) => updateSlide(s.id, { secondaryCtaEn: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">{t('Link nút phụ', 'Secondary Link')}</label>
                          <input
                            value={s.secondaryTo}
                            onChange={(e) => updateSlide(s.id, { secondaryTo: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {slides.length > 0 && (
            <button
              type="button"
              onClick={addSlide}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-[#00552B] text-[#00552B] dark:text-[#C6A667] dark:border-[#C6A667] text-xs font-semibold hover:bg-[#00552B]/5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('Thêm Slide Hero Banner mới', 'Add New Hero Slide')}</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 1: METRICS CAROUSEL */}
      {subTab === 'carousel' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
              {t(
                `Đang có ${metrics.length} thẻ Carousel chỉ số chạy ngang trên Hero (${metrics.filter((m) => m.visible !== false).length} đang hiển thị).`,
                `${metrics.length} Metrics Carousel cards (${metrics.filter((m) => m.visible !== false).length} visible).`
              )}
            </p>
            <button
              type="button"
              onClick={addMetric}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Thêm thẻ Carousel mới', 'Add Carousel Card')}</span>
            </button>
          </div>

          {metrics.length === 0 ? (
            <div className="bg-white dark:bg-[#16221C] p-8 rounded-xl border border-dashed border-[#202020]/20 dark:border-white/20 text-center space-y-3">
              <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {t('Chưa có thẻ Carousel nào. Thêm thẻ mới hoặc khôi phục 8 thẻ mặc định.', 'No Carousel cards configured.')}
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={addMetric}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Thêm thẻ Carousel mới', 'Add Carousel Card')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMetrics(DEFAULT_HERO_METRICS)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('Khôi phục 8 thẻ mặc định', 'Restore 8 Defaults')}</span>
                </button>
              </div>
            </div>
          ) : (
            metrics.map((m, idx) => {
              const isVisible = m.visible !== false;
              return (
                <div
                  key={m.id}
                  className={`bg-white dark:bg-[#16221C] p-4 rounded-xl border space-y-3 transition-opacity ${
                    isVisible
                      ? 'border-[#202020]/10 dark:border-white/10'
                      : 'border-amber-400/50 bg-amber-50/30 dark:bg-[#16221C]/70 opacity-85'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#003D25] text-[#C6A667] font-mono text-[11px] font-bold">
                        <span className={`w-2 h-2 rounded-full ${m.dot || 'bg-[#C6A667]'}`} />
                        {m.value || '#'}
                      </span>
                      <span className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA]">
                        {t('Thẻ', 'Card')} #{idx + 1} · {m.titleVi}
                      </span>
                      {!isVisible && (
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-semibold">
                          {t('Đang ẩn', 'Hidden')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateMetric(m.id, { visible: !isVisible })}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer mr-1 ${
                          isVisible
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{isVisible ? t('Hiển thị', 'Visible') : t('Đang ẩn', 'Hidden')}</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveMetric(idx, -1)}
                        title={t('Đưa lên', 'Move up')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === metrics.length - 1}
                        onClick={() => moveMetric(idx, 1)}
                        title={t('Đưa xuống', 'Move down')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateMetric(idx)}
                        title={t('Nhân bản thẻ', 'Duplicate card')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 text-[#00552B] dark:text-[#C6A667] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMetric(m.id)}
                        title={t('Xóa thẻ', 'Delete card')}
                        className="p-1.5 rounded text-red-500 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Giá trị / Số liệu nổi bật', 'Value / Stat')}
                      </label>
                      <input
                        value={m.value}
                        onChange={(e) => updateMetric(m.id, { value: e.target.value })}
                        placeholder="7 / 27+ SKUs"
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Màu chấm điểm nhấn', 'Dot Accent Color')}
                      </label>
                      <select
                        value={m.dot || 'bg-[#C6A667]'}
                        onChange={(e) => updateMetric(m.id, { dot: e.target.value })}
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      >
                        {DOT_COLOR_PRESETS.map((dp) => (
                          <option key={dp.value} value={dp.value}>
                            {t(dp.labelVi, dp.labelEn)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Đường dẫn khi bấm thẻ (Link)', 'Target Path')}
                      </label>
                      <input
                        value={m.to}
                        onChange={(e) => updateMetric(m.id, { to: e.target.value })}
                        placeholder="/shop"
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Tiêu đề thẻ (VI)', 'Title (VI)')}
                      </label>
                      <input
                        value={m.titleVi}
                        onChange={(e) => updateMetric(m.id, { titleVi: e.target.value })}
                        placeholder="Tiêu đề thẻ (VI)"
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Tiêu đề thẻ (EN)', 'Title (EN)')}
                      </label>
                      <input
                        value={m.titleEn}
                        onChange={(e) => updateMetric(m.id, { titleEn: e.target.value })}
                        placeholder="Card Title (EN)"
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Chú thích nhỏ (VI)', 'Subtitle (VI)')}
                      </label>
                      <input
                        value={m.subVi}
                        onChange={(e) => updateMetric(m.id, { subVi: e.target.value })}
                        placeholder="Chú thích nhỏ (VI)"
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                        {t('Chú thích nhỏ (EN)', 'Subtitle (EN)')}
                      </label>
                      <input
                        value={m.subEn}
                        onChange={(e) => updateMetric(m.id, { subEn: e.target.value })}
                        placeholder="Short caption (EN)"
                        className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {metrics.length > 0 && (
            <button
              type="button"
              onClick={addMetric}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-[#00552B] text-[#00552B] dark:text-[#C6A667] dark:border-[#C6A667] text-xs font-semibold hover:bg-[#00552B]/5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('Thêm thẻ Carousel mới', 'Add Carousel Card')}</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCT CATEGORY BANNERS */}
      {subTab === 'category_banners' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
              {t(
                `Đang có ${categoryBanners.length} Banner Danh Mục (${categoryBanners.filter((b) => b.visible).length} đang hiển thị). Hỗ trợ gắn nhiều banner xoay vòng cho cùng 1 danh mục.`,
                `${categoryBanners.length} Category Banners (${categoryBanners.filter((b) => b.visible).length} visible). Multiple banners per category rotate automatically.`
              )}
            </p>
            <button
              type="button"
              onClick={addCategoryBanner}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Thêm Banner Danh mục mới', 'Add New Category Banner')}</span>
            </button>
          </div>

          {categoryBanners.length === 0 ? (
            <div className="bg-white dark:bg-[#16221C] p-8 rounded-xl border border-dashed border-[#202020]/20 dark:border-white/20 text-center space-y-3">
              <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70">
                {t('Chưa có Banner Danh Mục nào. Hãy thêm mới hoặc khôi phục 6 Banner mặc định.', 'No Category Banners configured yet.')}
              </p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={addCategoryBanner}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('Thêm Banner Danh mục mới', 'Add Category Banner')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryBanners(DEFAULT_CATEGORY_BANNERS)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t('Khôi phục 6 Banner mặc định', 'Restore 6 Defaults')}</span>
                </button>
              </div>
            </div>
          ) : (
            categoryBanners.map((b, idx) => {
              const bannerId = b.id || `cat-${b.categoryKey}-${idx}`;
              const meta = CATEGORY_BANNER_META[b.categoryKey] || {
                labelVi: b.categoryKey,
                labelEn: b.categoryKey,
                route: '/shop',
              };
              return (
                <div
                  key={bannerId}
                  className={`bg-white dark:bg-[#16221C] p-5 rounded-xl border space-y-4 transition-opacity ${
                    b.visible
                      ? 'border-[#202020]/10 dark:border-white/10'
                      : 'border-amber-400/50 bg-amber-50/30 dark:bg-[#16221C]/70 opacity-85'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202020]/10 dark:border-white/10 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                        Banner #{idx + 1} · {t(meta.labelVi, meta.labelEn)}
                      </span>
                      <span className="font-mono text-[11px] text-[#202020]/50 dark:text-[#F1EFEA]/50">
                        {meta.route}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateCategoryBanner(bannerId, { visible: !b.visible })}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold cursor-pointer mr-1 ${
                          b.visible
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/50'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                      >
                        {b.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{b.visible ? t('Đang hiển thị', 'Visible') : t('Đang ẩn', 'Hidden')}</span>
                      </button>
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => moveCategoryBanner(idx, -1)}
                        title={t('Đưa lên', 'Move up')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === categoryBanners.length - 1}
                        onClick={() => moveCategoryBanner(idx, 1)}
                        title={t('Đưa xuống', 'Move down')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => duplicateCategoryBanner(idx)}
                        title={t('Nhân bản banner', 'Duplicate banner')}
                        className="p-1.5 rounded hover:bg-[#202020]/10 text-[#00552B] dark:text-[#C6A667] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCategoryBanner(bannerId)}
                        title={t('Xóa banner', 'Delete banner')}
                        className="p-1.5 rounded text-red-500 hover:bg-red-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Live Thumbnail + Image Picker + Category Target */}
                    <div className="lg:col-span-4 space-y-2.5">
                      <div className="aspect-[16/9] rounded-xl overflow-hidden bg-[#0D1B14] border border-[#202020]/15 dark:border-white/15">
                        <MediaImage
                          imageKey={b.imageUrl}
                          alt={b.titleVi}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={b.imageUrl}
                          onChange={(e) => updateCategoryBanner(bannerId, { imageUrl: e.target.value })}
                          placeholder="hero_roar_coffee hoặc /assets/..."
                          className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono text-[11px]"
                        />
                        <button
                          type="button"
                          onClick={() => setPickerTarget({ kind: 'category', bannerId })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00552B] text-white text-[11px] font-semibold hover:bg-[#004422] shrink-0 cursor-pointer"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                          <span>{t('Thay ảnh', 'Pick Image')}</span>
                        </button>
                      </div>
                      <div className="text-xs">
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Hiển thị tại Danh mục', 'Target Category')}
                        </label>
                        <select
                          value={b.categoryKey}
                          onChange={(e) => updateCategoryBanner(bannerId, { categoryKey: e.target.value })}
                          className="mt-1 w-full px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs font-medium"
                        >
                          {CATEGORY_BANNER_OPTIONS.map((opt) => (
                            <option key={opt.key} value={opt.key}>
                              {t(opt.labelVi, opt.labelEn)} ({opt.route})
                            </option>
                          ))}
                          {!CATEGORY_BANNER_OPTIONS.some((o) => o.key === b.categoryKey) && (
                            <option value={b.categoryKey}>{b.categoryKey}</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Bilingual Editorial Inputs */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Nhãn phụ Eyebrow (VI)', 'Eyebrow (VI)')}
                        </label>
                        <input
                          value={b.eyebrowVi}
                          onChange={(e) => updateCategoryBanner(bannerId, { eyebrowVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Nhãn phụ Eyebrow (EN)', 'Eyebrow (EN)')}
                        </label>
                        <input
                          value={b.eyebrowEn}
                          onChange={(e) => updateCategoryBanner(bannerId, { eyebrowEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Tiêu đề Banner (VI)', 'Headline (VI)')}
                        </label>
                        <input
                          value={b.titleVi}
                          onChange={(e) => updateCategoryBanner(bannerId, { titleVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Tiêu đề Banner (EN)', 'Headline (EN)')}
                        </label>
                        <input
                          value={b.titleEn}
                          onChange={(e) => updateCategoryBanner(bannerId, { titleEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-semibold"
                        />
                      </div>

                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Mô tả ngắn (VI)', 'Subtitle (VI)')}
                        </label>
                        <textarea
                          rows={2}
                          value={b.subtitleVi}
                          onChange={(e) => updateCategoryBanner(bannerId, { subtitleVi: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {t('Mô tả ngắn (EN)', 'Subtitle (EN)')}
                        </label>
                        <textarea
                          rows={2}
                          value={b.subtitleEn}
                          onChange={(e) => updateCategoryBanner(bannerId, { subtitleEn: e.target.value })}
                          className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                        />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                            {t('Chữ nút CTA (VI)', 'CTA Label (VI)')}
                          </label>
                          <input
                            value={b.ctaLabelVi}
                            onChange={(e) => updateCategoryBanner(bannerId, { ctaLabelVi: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                            {t('Chữ nút CTA (EN)', 'CTA Label (EN)')}
                          </label>
                          <input
                            value={b.ctaLabelEn}
                            onChange={(e) => updateCategoryBanner(bannerId, { ctaLabelEn: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512]"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                            {t('Đường dẫn CTA', 'CTA Path')}
                          </label>
                          <input
                            value={b.ctaPath}
                            onChange={(e) => updateCategoryBanner(bannerId, { ctaPath: e.target.value })}
                            className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {categoryBanners.length > 0 && (
            <button
              type="button"
              onClick={addCategoryBanner}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-dashed border-[#00552B] text-[#00552B] dark:text-[#C6A667] dark:border-[#C6A667] text-xs font-semibold hover:bg-[#00552B]/5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('Thêm Banner Danh mục mới', 'Add New Category Banner')}</span>
            </button>
          )}
        </div>
      )}

      <MediaPickerModal
        open={Boolean(pickerTarget)}
        onClose={() => setPickerTarget(null)}
        mediaAssets={mediaAssets}
        onMediaUploaded={onMediaUploaded}
        title={t('Chọn hoặc tải lên ảnh Banner', 'Select or Upload Banner Image')}
        onSelect={(keyOrUrl) => {
          if (!pickerTarget) return;
          if (pickerTarget.kind === 'category') {
            updateCategoryBanner(pickerTarget.bannerId, { imageUrl: keyOrUrl });
          } else {
            updateSlide(pickerTarget.slideId, { imageKey: keyOrUrl });
          }
          setPickerTarget(null);
        }}
      />
    </div>
  );
};
