import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Camera,
  Check,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Heading2,
  Heading3,
  Image as ImageIcon,
  ImagePlus,
  List,
  Plus,
  Quote,
  RotateCcw,
  Search,
  Table2,
  Trash2,
} from 'lucide-react';
import { resolveMediaUrl } from '../../lib/media';
import { localizeJournalCategory } from '../../lib/i18nHelpers';
import {
  getNodeBySlug,
  JOURNAL_PILLARS,
  type JournalChartType,
} from '../../lib/journalEcosystem';
import { getArticleEnrichment, type JournalFigure } from '../../lib/journalEnrichments';
import { useStore } from '../../context/StoreContext';
import { useI18n } from '../../i18n/I18nContext';
import { MediaPickerModal, type MediaAssetRecord } from './MediaPickerModal';

export interface JournalAdminArticle {
  id: number;
  slug: string;
  category: string;
  tags: string[];
  title_vi: string;
  title_en: string;
  excerpt_vi: string;
  excerpt_en: string;
  content_vi: string;
  content_en: string;
  author: string;
  read_minutes: number;
  image_key: string;
  gallery?: JournalFigure[];
  chart_type?: string;
  cms_edited?: number;
  published: number;
  published_at: string;
}

interface JournalManagerSectionProps {
  articles: JournalAdminArticle[];
  mediaAssets: MediaAssetRecord[];
  onRefresh: () => Promise<void> | void;
  onMediaUploaded: () => Promise<void> | void;
}

const JOURNAL_CATEGORIES = [
  'Coffee knowledge',
  'Coffee processing',
  'Coffee varieties',
  'Brewing techniques',
  'Coffee origins',
];

const CHART_OPTIONS: Array<{ value: '' | 'none' | JournalChartType; labelVi: string; labelEn: string }> = [
  { value: '', labelVi: 'Tự động theo mã bài (Mặc định)', labelEn: 'Auto by Article Code (Default)' },
  { value: 'none', labelVi: 'Ẩn biểu đồ phân tích', labelEn: 'Hide Analytical Chart' },
  { value: 'coffee_history_timeline', labelVi: 'Dòng thời gian lịch sử cà phê', labelEn: 'Coffee History Timeline' },
  { value: 'coffee_botany_anatomy', labelVi: 'Cấu tạo giải phẫu trái cà phê', labelEn: 'Coffee Cherry Anatomy' },
  { value: 'species_comparison', labelVi: 'So sánh Arabica vs Robusta vs Liberica', labelEn: 'Species Comparison' },
  { value: 'global_coffee_belt', labelVi: 'Vành đai cà phê toàn cầu (Coffee Belt)', labelEn: 'Global Coffee Belt' },
  { value: 'altitude_variety_matrix', labelVi: 'Ma trận độ cao & giống cà phê', labelEn: 'Altitude & Variety Matrix' },
  { value: 'cherry_development_cycle', labelVi: 'Chu kỳ chín & tích lũy đường', labelEn: 'Cherry Ripening Cycle' },
  { value: 'processing_methods_diagram', labelVi: 'So sánh Natural / Honey / CBU Washed', labelEn: 'Processing Methods Comparison' },
  { value: 'screen_size_mm_chart', labelVi: 'Cỡ sàng ISO 4150 (S13–S18)', labelEn: 'ISO 4150 Screen Size Chart' },
  { value: 'roast_thermal_curve', labelVi: 'Đường cong nhiệt rang & Maillard', labelEn: 'Roast Thermal & Maillard Curve' },
  { value: 'roast_degree_spectrum', labelVi: 'Phổ mức rang Light → Dark (Agtron)', labelEn: 'Roast Degree Spectrum' },
  { value: 'degassing_co2_curve', labelVi: 'Biểu đồ xả khí CO₂ sau rang', labelEn: 'Post-Roast CO₂ Degassing Curve' },
  { value: 'sensory_cupping_wheel', labelVi: 'Vòng cảm quan & Cupping SCA', labelEn: 'SCA Sensory Cupping Profile' },
  { value: 'extraction_balance', labelVi: 'Biểu đồ cân bằng chiết xuất (TDS / EY%)', labelEn: 'Extraction Yield Balance' },
  { value: 'particle_grind_spectrum', labelVi: 'Phổ cỡ xay Phin / Pour-over / Espresso', labelEn: 'Grind Size Spectrum' },
  { value: 'water_mineral_balance', labelVi: 'Cân bằng khoáng chất nước pha (GH/KH)', labelEn: 'Brew Water Mineral Balance' },
  { value: 'caffeine_safety_curve', labelVi: 'Đường cong Caffeine & Ngưỡng khuyến nghị', labelEn: 'Caffeine & Intake Curve' },
  { value: 'vietnam_terroir_elevation', labelVi: 'Bản đồ độ cao vùng trồng Việt Nam', labelEn: 'Vietnam Terroir Elevation' },
  { value: 'moisture_aw_stability', labelVi: 'Độ ẩm & Hoạt độ nước (Aw) nhân xanh', labelEn: 'Moisture & Water Activity (Aw)' },
];

type PickerTarget =
  | { kind: 'cover' }
  | { kind: 'gallery_replace'; index: number }
  | { kind: 'gallery_add' }
  | { kind: 'inline_body'; lang: 'vi' | 'en' }
  | { kind: 'quick_list_cover'; article: JournalAdminArticle };

function toSafeSlugClient(raw: string): string {
  return String(raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const JournalManagerSection: React.FC<JournalManagerSectionProps> = ({
  articles,
  mediaAssets,
  onRefresh,
  onMediaUploaded,
}) => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorTab, setEditorTab] = useState<'content' | 'gallery' | 'preview'>('content');

  // List filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [pillarFilter, setPillarFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'code' | 'newest' | 'title'>('code');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [quickSavingId, setQuickSavingId] = useState<number | null>(null);

  // Editor form states
  const [titleVi, setTitleVi] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerptVi, setExcerptVi] = useState('');
  const [contentVi, setContentVi] = useState('');
  const [showEnFields, setShowEnFields] = useState(false);
  const [titleEn, setTitleEn] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [category, setCategory] = useState('Coffee knowledge');
  const [author, setAuthor] = useState('Ban Biên Tập ROAR COFFEE');
  const [readMinutes, setReadMinutes] = useState(5);
  const [tagsText, setTagsText] = useState('');
  const [imageKey, setImageKey] = useState('hero_roar_coffee');
  const [galleryFigures, setGalleryFigures] = useState<JournalFigure[]>([]);
  const [chartType, setChartType] = useState<string>('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  // Media picker state
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const bodyViRef = useRef<HTMLTextAreaElement | null>(null);
  const bodyEnRef = useRef<HTMLTextAreaElement | null>(null);

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = articles.filter((a) => {
      if (statusFilter === 'published' && !a.published) return false;
      if (statusFilter === 'draft' && a.published) return false;
      if (catFilter !== 'all' && a.category !== catFilter) return false;
      const node = getNodeBySlug(a.slug);
      if (pillarFilter !== 'all') {
        if (pillarFilter === 'custom') {
          if (node) return false;
        } else if (!node || node.pillarId !== pillarFilter) {
          return false;
        }
      }
      if (q) {
        const codeMatch = node?.code.toLowerCase().includes(q);
        return (
          Boolean(codeMatch) ||
          a.title_vi.toLowerCase().includes(q) ||
          a.title_en.toLowerCase().includes(q) ||
          a.slug.toLowerCase().includes(q)
        );
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'code') {
        const ca = getNodeBySlug(a.slug)?.code || 'Z999';
        const cb = getNodeBySlug(b.slug)?.code || 'Z999';
        if (ca !== cb) return ca.localeCompare(cb);
        return b.id - a.id;
      }
      if (sortBy === 'title') {
        return a.title_vi.localeCompare(b.title_vi, 'vi');
      }
      return b.id - a.id;
    });
  }, [articles, statusFilter, catFilter, pillarFilter, sortBy, search]);

  const activeNodeMeta = useMemo(() => getNodeBySlug(slug), [slug]);

  const openCreateEditor = () => {
    setEditingId(null);
    setTitleVi('');
    setSlug('');
    setSlugTouched(false);
    setExcerptVi('');
    setContentVi('');
    setTitleEn('');
    setExcerptEn('');
    setContentEn('');
    setShowEnFields(false);
    setCategory('Coffee knowledge');
    setAuthor('Ban Biên Tập ROAR COFFEE');
    setReadMinutes(5);
    setTagsText('');
    setImageKey('hero_roar_coffee');
    setGalleryFigures([]);
    setChartType('');
    setPublished(true);
    setEditorTab('content');
    setMode('edit');
  };

  const openEditEditor = (a: JournalAdminArticle) => {
    setEditingId(a.id);
    setTitleVi(a.title_vi || '');
    setSlug(a.slug || '');
    setSlugTouched(true);
    setExcerptVi(a.excerpt_vi || '');
    setContentVi(a.content_vi || '');
    setTitleEn(a.title_en || '');
    setExcerptEn(a.excerpt_en || '');
    setContentEn(a.content_en || '');
    setShowEnFields(false);
    setCategory(a.category || 'Coffee knowledge');
    setAuthor(a.author || 'Ban Biên Tập ROAR COFFEE');
    setReadMinutes(Number(a.read_minutes || 5));
    setTagsText(Array.isArray(a.tags) ? a.tags.join(', ') : '');
    setImageKey(a.image_key || 'hero_roar_coffee');

    // Load custom gallery if already saved, else pre-populate from B001-B050 enrichment so admin can edit/replace every single image!
    if (Array.isArray(a.gallery) && a.gallery.length > 0) {
      setGalleryFigures(a.gallery.map((g) => ({ ...g })));
    } else {
      const node = getNodeBySlug(a.slug);
      if (node) {
        const defaults = getArticleEnrichment(node, a.image_key).visualFigures;
        setGalleryFigures(defaults.map((g) => ({ ...g })));
      } else {
        setGalleryFigures([]);
      }
    }

    setChartType(a.chart_type || '');
    setPublished(Boolean(a.published));
    setEditorTab('content');
    setMode('edit');
  };

  const insertSnippet = (snippet: string, targetLang: 'vi' | 'en' = 'vi') => {
    const ref = targetLang === 'vi' ? bodyViRef.current : bodyEnRef.current;
    const current = targetLang === 'vi' ? contentVi : contentEn;
    const setter = targetLang === 'vi' ? setContentVi : setContentEn;

    if (!ref) {
      setter(current ? `${current}\n\n${snippet}` : snippet);
      return;
    }
    const start = ref.selectionStart ?? current.length;
    const end = ref.selectionEnd ?? current.length;
    const next = `${current.slice(0, start)}${snippet}${current.slice(end)}`;
    setter(next);
    window.setTimeout(() => {
      ref.focus();
      const pos = start + snippet.length;
      ref.setSelectionRange(pos, pos);
    }, 0);
  };

  const handleMediaPicked = async (val: string) => {
    if (!pickerTarget) return;

    if (pickerTarget.kind === 'cover') {
      setImageKey(val);
    } else if (pickerTarget.kind === 'gallery_replace') {
      setGalleryFigures((prev) =>
        prev.map((item, idx) => (idx === pickerTarget.index ? { ...item, imageKey: val } : item))
      );
    } else if (pickerTarget.kind === 'gallery_add') {
      setGalleryFigures((prev) => [
        ...prev,
        {
          imageKey: val,
          captionVi: t('Hình minh họa chuyên đề ROAR COFFEE.', 'ROAR COFFEE editorial illustration.'),
          captionEn: 'ROAR COFFEE editorial illustration.',
        },
      ]);
    } else if (pickerTarget.kind === 'inline_body') {
      const snippet = `\n![Mô tả hình ảnh minh họa](${val})\n`;
      insertSnippet(snippet, pickerTarget.lang);
      showToast(t('Đã chèn ảnh vào nội dung bài viết', 'Inserted image into article body'));
    } else if (pickerTarget.kind === 'quick_list_cover') {
      const targetArticle = pickerTarget.article;
      setQuickSavingId(targetArticle.id);
      try {
        const res = await apiFetch(`/api/admin/journal/${targetArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_key: val }),
        });
        if (res.ok) {
          showToast(t('Đã thay ảnh bìa bài viết ngay lập tức', 'Updated article cover image'));
          await onRefresh();
        } else {
          showToast(t('Không thể cập nhật ảnh bìa', 'Unable to update cover image'));
        }
      } finally {
        setQuickSavingId(null);
      }
    }
    setPickerTarget(null);
  };

  const moveGalleryItem = (index: number, direction: -1 | 1) => {
    setGalleryFigures((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, moved);
      return copy;
    });
  };

  const handleResetGalleryToDefault = () => {
    if (!activeNodeMeta) {
      setGalleryFigures([]);
      return;
    }
    const defaults = getArticleEnrichment(activeNodeMeta, imageKey).visualFigures;
    setGalleryFigures(defaults.map((g) => ({ ...g })));
    showToast(t('Đã khôi phục bộ ảnh minh họa mặc định (nhấn Lưu để áp dụng)', 'Restored default figures (click Save to apply)'));
  };

  const handleSavePost = async (publishState: boolean) => {
    if (!titleVi.trim()) {
      showToast(t('Vui lòng nhập tiêu đề bài viết.', 'Article title is required.'));
      return;
    }
    setSaving(true);
    try {
      const tags = tagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const cleanGallery = galleryFigures
        .filter((g) => Boolean(g.imageKey))
        .map((g) => ({
          imageKey: g.imageKey,
          captionVi: g.captionVi.trim(),
          captionEn: g.captionEn.trim() || g.captionVi.trim(),
        }));

      const payload = {
        slug: slug.trim() || toSafeSlugClient(titleVi),
        category,
        tags,
        title_vi: titleVi.trim(),
        title_en: titleEn.trim() || titleVi.trim(),
        excerpt_vi: excerptVi.trim() || contentVi.trim().slice(0, 160),
        excerpt_en: excerptEn.trim() || contentEn.trim().slice(0, 160) || excerptVi.trim(),
        content_vi: contentVi.trim(),
        content_en: contentEn.trim() || contentVi.trim(),
        author: author.trim() || 'Ban Biên Tập ROAR COFFEE',
        read_minutes: Number(readMinutes || 5),
        image_key: imageKey,
        gallery: cleanGallery,
        chart_type: chartType,
        published: publishState,
      };

      const url = editingId ? `/api/admin/journal/${editingId}` : '/api/admin/journal';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Không thể lưu bài viết.', 'Unable to save post.'));
        return;
      }
      showToast(
        publishState
          ? editingId
            ? t('Đã cập nhật bài viết & toàn bộ hình ảnh', 'Updated article & all images')
            : t('Đã đăng bài viết mới', 'Published new post')
          : t('Đã lưu bản nháp bài viết', 'Saved post as draft')
      );
      await onRefresh();
      setMode('list');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (a: JournalAdminArticle) => {
    const res = await apiFetch(`/api/admin/journal/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !a.published }),
    });
    if (res.ok) {
      showToast(a.published ? t('Đã chuyển về bản nháp', 'Moved to draft') : t('Đã xuất bản bài viết', 'Published post'));
      await onRefresh();
    }
  };

  const handleDeletePost = async (id: number) => {
    const res = await apiFetch(`/api/admin/journal/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(t('Đã xóa bài viết', 'Deleted post'));
      setConfirmDeleteId(null);
      await onRefresh();
    }
  };

  const renderPreviewLines = (raw: string) => {
    return raw
      .split('\n')
      .filter((l) => l.trim().length > 0)
      .map((line, i) => {
        const trimmed = line.trim();
        const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
          const [, alt, src] = imgMatch;
          return (
            <figure key={i} className="my-3 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img src={resolveMediaUrl(src)} alt={alt} className="w-full max-h-72 object-cover" />
              {alt && <figcaption className="px-3 py-2 text-[11px] italic text-slate-600">{alt}</figcaption>}
            </figure>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} className="text-lg font-bold text-slate-900 pt-3">
              {trimmed.replace(/^##\s+/, '')}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="text-sm font-bold text-[#00552B] pt-2">
              {trimmed.replace(/^###\s+/, '')}
            </h3>
          );
        }
        if (trimmed.startsWith('> ')) {
          return (
            <div key={i} className="rounded-lg bg-[#F8F5EF] border border-[#00552B]/20 px-3.5 py-2.5 text-xs text-slate-800">
              {trimmed.replace(/^>\s+/, '')}
            </div>
          );
        }
        return (
          <p key={i} className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {trimmed}
          </p>
        );
      });
  };

  const pickerTitle =
    pickerTarget?.kind === 'cover' || pickerTarget?.kind === 'quick_list_cover'
      ? t('Chọn hoặc tải ảnh bìa bài viết (Fig. 1)', 'Select or Upload Cover Image (Fig. 1)')
      : pickerTarget?.kind === 'inline_body'
        ? t('Chọn hoặc tải ảnh để chèn trực tiếp vào nội dung', 'Select or Upload Inline Article Image')
        : t('Chọn hoặc tải ảnh minh họa trong bài (Fig. 2 – Fig. 6)', 'Select or Upload Gallery Figure');

  if (mode === 'edit') {
    return (
      <>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-[#00552B] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('Quay lại danh sách toàn bộ bài viết', 'Back to All Articles')}
            </button>

            <div className="flex items-center gap-2 text-xs">
              {activeNodeMeta && (
                <span className="font-mono font-bold text-[#00552B]">{activeNodeMeta.code}</span>
              )}
              <span className="text-slate-400">·</span>
              <span className="font-mono text-slate-500">
                {editingId ? `${t('Đang sửa bài #', 'Editing #')}${editingId}` : t('Soạn bài viết mới', 'New Article')}
              </span>
              {editingId && published && (
                <Link
                  to={`/journal/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#00552B] font-semibold hover:underline ml-2"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('Xem thực tế', 'View Live')}</span>
                </Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
            {/* Main Editorial Column */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
              {/* Sub-Navigation Tabs inside Editor */}
              <div className="flex items-center justify-between gap-2 px-4 sm:px-6 border-b border-slate-200 bg-slate-50/70">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditorTab('content')}
                    className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      editorTab === 'content'
                        ? 'border-[#00552B] text-[#00552B] bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('Nội dung bài viết', 'Article Content')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('gallery')}
                    className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      editorTab === 'gallery'
                        ? 'border-[#00552B] text-[#00552B] bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>
                      {t('Bộ ảnh minh họa', 'Gallery Figures')} ({galleryFigures.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorTab('preview')}
                    className={`px-3.5 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      editorTab === 'preview'
                        ? 'border-[#00552B] text-[#00552B] bg-white'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('Xem trước', 'Live Preview')}</span>
                  </button>
                </div>
              </div>

              {editorTab === 'content' && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('Tiêu đề bài viết (Tiếng Việt) *', 'Post Title (VI) *')}
                    </label>
                    <input
                      type="text"
                      value={titleVi}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTitleVi(val);
                        if (!slugTouched) setSlug(toSafeSlugClient(val));
                      }}
                      placeholder={t('Nhập tiêu đề bài viết...', 'Enter post title...')}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('Đường dẫn tĩnh (Slug SEO)', 'Permalink Slug')}
                    </label>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <span className="px-3 py-2 text-slate-500 font-mono border-r border-slate-200">/journal/</span>
                      <input
                        type="text"
                        value={slug}
                        onChange={(e) => {
                          setSlugTouched(true);
                          setSlug(e.target.value);
                        }}
                        placeholder="duong-dan-bai-viet"
                        className="flex-1 px-3 py-2 bg-white font-mono text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {t('Tóm tắt ngắn (Hiển thị trên danh sách & SEO)', 'Excerpt (Summary & SEO)')}
                    </label>
                    <textarea
                      rows={2}
                      value={excerptVi}
                      onChange={(e) => setExcerptVi(e.target.value)}
                      placeholder={t('Đoạn mô tả súc tích thu hút người đọc...', 'Short concise excerpt...')}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2"
                    />
                  </div>

                  {/* Quick Formatting & Inline Image Toolbar */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label className="font-semibold text-slate-700">
                        {t('Nội dung chi tiết bài viết (Hỗ trợ Markdown & Chèn ảnh)', 'Article Body Content (Markdown & Inline Images)')}
                      </label>
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => insertSnippet('\n## Tiêu đề mục mới\n', 'vi')}
                          className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          title="Heading 2"
                        >
                          <Heading2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet('\n### Tiêu đề phụ\n', 'vi')}
                          className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          title="Heading 3"
                        >
                          <Heading3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet('\n> Ghi chú chuyên môn nổi bật từ ROAR COFFEE...\n', 'vi')}
                          className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          title="Callout"
                        >
                          <Quote className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => insertSnippet('\n- Ý chính 1\n- Ý chính 2\n', 'vi')}
                          className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          title="Bullet list"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            insertSnippet(
                              '\n| Tiêu chí | Thông số chuẩn |\n| --- | --- |\n| Nhiệt độ nước | 92–94°C |\n',
                              'vi'
                            )
                          }
                          className="px-2 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                          title="Comparison table"
                        >
                          <Table2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPickerTarget({ kind: 'inline_body', lang: 'vi' })}
                          className="px-2.5 py-1 rounded bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <ImagePlus className="w-3.5 h-3.5" />
                          <span>{t('Chèn ảnh vào bài', 'Insert Image')}</span>
                        </button>
                      </div>
                    </div>

                    <textarea
                      ref={bodyViRef}
                      rows={15}
                      value={contentVi}
                      onChange={(e) => setContentVi(e.target.value)}
                      placeholder={t(
                        'Viết nội dung bài viết bằng Markdown (## Tiêu đề, > Ghi chú, ![Chú thích](url)...)',
                        'Write post content with Markdown (## Heading, > Callout, ![Caption](url)...)'
                      )}
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 leading-relaxed font-mono text-[12px]"
                    />
                  </div>

                  {/* Collapsible English Version */}
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowEnFields(!showEnFields)}
                      className="text-xs font-semibold text-[#00552B] hover:underline cursor-pointer"
                    >
                      {showEnFields
                        ? t('▾ Ẩn nội dung bản dịch Tiếng Anh', '▾ Hide English Translation')
                        : t('▸ Mở rộng chỉnh sửa bản Tiếng Anh (song ngữ)', '▸ Expand English Translation Fields (bilingual)')}
                    </button>
                    {showEnFields && (
                      <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">English Title</label>
                          <input
                            type="text"
                            value={titleEn}
                            onChange={(e) => setTitleEn(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">English Excerpt</label>
                          <textarea
                            rows={2}
                            value={excerptEn}
                            onChange={(e) => setExcerptEn(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
                          />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="font-semibold text-slate-700">English Content</label>
                            <button
                              type="button"
                              onClick={() => setPickerTarget({ kind: 'inline_body', lang: 'en' })}
                              className="px-2 py-1 rounded border border-[#00552B] text-[#00552B] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <ImagePlus className="w-3 h-3" />
                              <span>Insert Image</span>
                            </button>
                          </div>
                          <textarea
                            ref={bodyEnRef}
                            rows={8}
                            value={contentEn}
                            onChange={(e) => setContentEn(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white font-mono text-[12px]"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {editorTab === 'gallery' && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {t('Quản lý Bộ ảnh minh họa trong bài (Fig. 2 – Fig. 6+)', 'Inline Article Gallery Figures (Fig. 2 – Fig. 6+)')}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {t(
                          'Thay thế từng ảnh minh họa từ Thư viện hoặc Tải ảnh mới từ máy, sửa chú thích song ngữ và sắp xếp thứ tự hiển thị.',
                          'Replace any figure from the Media Library or upload new photos, customize bilingual captions, and reorder figures.'
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {activeNodeMeta && (
                        <button
                          type="button"
                          onClick={handleResetGalleryToDefault}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('Ảnh mặc định', 'Reset Defaults')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPickerTarget({ kind: 'gallery_add' })}
                        className="px-3 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>{t('Thêm ảnh mới', 'Add Figure')}</span>
                      </button>
                    </div>
                  </div>

                  {galleryFigures.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2.5 bg-slate-50/50">
                      <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                      <p className="text-xs text-slate-600">
                        {t('Chưa có ảnh minh họa phụ. Nhấn "Thêm ảnh mới" để bổ sung bộ ảnh 4–6 hình cho bài viết.', 'No gallery figures configured yet. Click "Add Figure" to enrich this article.')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPickerTarget({ kind: 'gallery_add' })}
                        className="px-3.5 py-2 rounded-lg bg-[#00552B] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <ImagePlus className="w-3.5 h-3.5" />
                        <span>{t('Chọn / Tải ảnh minh họa đầu tiên', 'Add First Figure')}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {galleryFigures.map((fig, idx) => (
                        <div
                          key={`${fig.imageKey}-${idx}`}
                          className="rounded-xl border border-slate-200 p-3 sm:p-3.5 flex flex-col sm:flex-row gap-3.5 bg-slate-50/40"
                        >
                          <div className="w-full sm:w-36 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0 relative group">
                            <img
                              src={resolveMediaUrl(fig.imageKey)}
                              alt={fig.captionVi || `Fig ${idx + 2}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setPickerTarget({ kind: 'gallery_replace', index: idx })}
                              className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-semibold text-xs cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              <span>{t('Thay ảnh', 'Replace')}</span>
                            </button>
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-[#00552B]">
                                Fig. {idx + 2}{' '}
                                <span className="font-normal text-slate-400">
                                  ({idx < 2 ? t('Hiển thị đầu bài', 'Upper Gallery') : t('Hiển thị cuối bài', 'Lower Gallery')})
                                </span>
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setPickerTarget({ kind: 'gallery_replace', index: idx })}
                                  className="px-2 py-1 rounded border border-[#00552B]/30 text-[#00552B] hover:bg-[#00552B]/10 font-semibold cursor-pointer inline-flex items-center gap-1"
                                >
                                  <ImagePlus className="w-3 h-3" />
                                  <span>{t('Đổi ảnh', 'Swap')}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveGalleryItem(idx, -1)}
                                  className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                                  title={t('Đưa lên', 'Move up')}
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === galleryFigures.length - 1}
                                  onClick={() => moveGalleryItem(idx, 1)}
                                  className="p-1 rounded border border-slate-200 hover:bg-slate-100 disabled:opacity-35 cursor-pointer"
                                  title={t('Đưa xuống', 'Move down')}
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setGalleryFigures((prev) => prev.filter((_, i) => i !== idx))}
                                  className="p-1 rounded border border-slate-200 hover:bg-red-50 text-red-600 cursor-pointer"
                                  title={t('Xóa ảnh này', 'Remove figure')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={fig.captionVi}
                              onChange={(e) =>
                                setGalleryFigures((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, captionVi: e.target.value } : item))
                                )
                              }
                              placeholder={t('Chú thích ảnh (Tiếng Việt)...', 'Figure caption (VI)...')}
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800"
                            />
                            <input
                              type="text"
                              value={fig.captionEn}
                              onChange={(e) =>
                                setGalleryFigures((prev) =>
                                  prev.map((item, i) => (i === idx ? { ...item, captionEn: e.target.value } : item))
                                )
                              }
                              placeholder="Figure caption (English)..."
                              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {editorTab === 'preview' && (
                <div className="p-5 sm:p-7 space-y-4">
                  <div className="space-y-1.5 border-b border-slate-100 pb-4">
                    <p className="text-[11px] font-mono text-[#00552B]">
                      {activeNodeMeta ? `${activeNodeMeta.code} · ` : ''}
                      {localizeJournalCategory(category, lang)} · {readMinutes} {t('phút đọc', 'min read')}
                    </p>
                    <h2 className="text-2xl font-bold text-slate-900">{titleVi || t('(Chưa nhập tiêu đề)', '(Untitled)')}</h2>
                    <p className="text-sm text-slate-600">{excerptVi}</p>
                  </div>
                  <div className="max-w-lg mx-auto aspect-[16/10] rounded-xl overflow-hidden border border-slate-200">
                    <img src={resolveMediaUrl(imageKey)} alt={titleVi} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-3">{renderPreviewLines(contentVi)}</div>
                  {galleryFigures.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <p className="text-[11px] font-mono font-semibold text-slate-500 uppercase">
                        {t(`Bộ ảnh minh họa đi kèm (${galleryFigures.length} ảnh)`, `Attached Visual Figures (${galleryFigures.length})`)}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {galleryFigures.map((fig, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                            <img src={resolveMediaUrl(fig.imageKey)} alt={fig.captionVi} className="aspect-[4/3] w-full object-cover" />
                            <p className="p-2 text-[10px] text-slate-600 line-clamp-2">
                              Fig. {idx + 2} — {fig.captionVi}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Publish & Cover Image Sidebar */}
            <div className="lg:col-span-4 space-y-4 text-xs">
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3.5">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5">
                  {t('Xuất bản & Phân loại', 'Publish & Taxonomy')}
                </h4>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Trạng thái bài viết', 'Post Status')}</label>
                  <select
                    value={published ? '1' : '0'}
                    onChange={(e) => setPublished(e.target.value === '1')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    <option value="1">{t('Đã xuất bản (Công khai)', 'Published (Live)')}</option>
                    <option value="0">{t('Bản nháp (Ẩn khỏi trang web)', 'Draft (Hidden)')}</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">{t('Chuyên mục', 'Category')}</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    {JOURNAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {localizeJournalCategory(cat, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 inline-flex items-center gap-1">
                    <BarChart3 className="w-3.5 h-3.5 text-[#00552B]" />
                    <span>{t('Biểu đồ phân tích trong bài', 'Analytical Chart')}</span>
                  </label>
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  >
                    {CHART_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {lang === 'vi' ? opt.labelVi : opt.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Tác giả', 'Author')}</label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">{t('Thời gian đọc (phút)', 'Read Time (min)')}</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={readMinutes}
                      onChange={(e) => setReadMinutes(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-lg px-2.5 py-2 font-mono tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {t('Thẻ bài viết (cách nhau dấu phẩy)', 'Tags (comma-separated)')}
                  </label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="Robusta, Phin, Rang Xay"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => handleSavePost(published)}
                    className="w-full py-2.5 bg-[#00552B] hover:bg-[#003D25] text-white font-semibold rounded-lg cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {saving
                        ? t('Đang lưu...', 'Saving...')
                        : editingId
                          ? t('Lưu thay đổi bài viết & ảnh', 'Save Post & Images')
                          : published
                            ? t('Đăng bài viết ngay', 'Publish Post')
                            : t('Lưu bản nháp', 'Save Draft')}
                    </span>
                  </button>
                  {published && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => handleSavePost(false)}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer"
                    >
                      {t('Lưu dưới dạng Bản nháp', 'Save as Draft')}
                    </button>
                  )}
                </div>
              </div>

              {/* Featured Cover Image Box (Fig. 1) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">{t('Ảnh bìa bài viết (Fig. 1)', 'Cover Image (Fig. 1)')}</h4>
                  <span className="text-[11px] font-mono text-slate-400">16:10</span>
                </div>
                <div className="aspect-[16/10] rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                  <img
                    src={resolveMediaUrl(imageKey)}
                    alt={titleVi || 'Featured article'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPickerTarget({ kind: 'cover' })}
                  className="w-full py-2 px-3 border border-slate-200 hover:border-[#00552B] hover:bg-slate-50 rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4 text-[#00552B]" />
                  <span>{t('Thay / Tải ảnh bìa mới', 'Replace / Upload Cover')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <MediaPickerModal
          open={pickerTarget !== null}
          onClose={() => setPickerTarget(null)}
          mediaAssets={mediaAssets}
          onMediaUploaded={onMediaUploaded}
          title={pickerTitle}
          onSelect={handleMediaPicked}
        />
      </>
    );
  }

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {/* Top Action & Filter Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-0.5 sm:pb-0 no-scrollbar">
              {[
                { id: 'all', label: `${t('Tất cả', 'All')} (${articles.length})` },
                { id: 'published', label: `${t('Xuất bản', 'Published')} (${articles.filter((a) => a.published).length})` },
                { id: 'draft', label: `${t('Nháp', 'Drafts')} (${articles.filter((a) => !a.published).length})` },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                    statusFilter === st.id ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('Tìm mã B001–B050, tiêu đề...', 'Search B001–B050, title...')}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg w-full sm:w-56"
                />
              </div>
              <button
                type="button"
                onClick={openCreateEditor}
                className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Viết bài mới', 'Add Post')}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-100">
            <select
              value={pillarFilter}
              onChange={(e) => setPillarFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">{t('Tất cả 10 Chuyên đề (B001–B050)', 'All 10 Pillars (B001–B050)')}</option>
              {JOURNAL_PILLARS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id}. {lang === 'vi' ? p.nameVi : p.nameEn} ({p.codeRange})
                </option>
              ))}
              <option value="custom">{t('Bài viết mới thêm ngoài B001–B050', 'Custom Added Posts')}</option>
            </select>

            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">{t('Tất cả chuyên mục', 'All Categories')}</option>
              {JOURNAL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {localizeJournalCategory(c, lang)}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="code">{t('Sắp xếp: Mã bài B001 → B050', 'Sort: Code B001 → B050')}</option>
              <option value="newest">{t('Sắp xếp: Mới nhất', 'Sort: Newest')}</option>
              <option value="title">{t('Sắp xếp: Tiêu đề A–Z', 'Sort: Title A–Z')}</option>
            </select>

            <span className="text-[11px] text-slate-500 ml-auto hidden sm:inline">
              {t('Mẹo: Nhấp vào ảnh bìa từng bài để thay ảnh nhanh chỉ với 1 chạm.', 'Tip: Click any thumbnail to quick-swap the cover image in one click.')}
            </span>
          </div>
        </div>

        {/* Posts List: Compact Mobile Cards + Desktop Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {filteredArticles.length === 0 ? (
            <div className="p-10 text-center space-y-2 text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-sm font-medium">{t('Chưa có bài viết nào phù hợp.', 'No posts match your filter.')}</p>
            </div>
          ) : (
            <>
              <div className="md:hidden divide-y divide-slate-100 text-xs">
                {filteredArticles.map((a) => {
                  const node = getNodeBySlug(a.slug);
                  const customGalCount = Array.isArray(a.gallery) ? a.gallery.length : 0;
                  return (
                    <div key={a.id} className="p-3 flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => setPickerTarget({ kind: 'quick_list_cover', article: a })}
                        className="relative w-14 aspect-[4/5] rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer group"
                        title={t('Đổi ảnh bìa nhanh', 'Quick-swap cover image')}
                      >
                        <img
                          src={resolveMediaUrl(a.image_key)}
                          alt={a.title_vi}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                        </span>
                      </button>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                          {node && <span className="font-bold text-[#00552B]">{node.code}</span>}
                          <span>·</span>
                          <span>{localizeJournalCategory(a.category, lang)}</span>
                          {customGalCount > 0 && (
                            <>
                              <span>·</span>
                              <span className="text-[#00552B]">{customGalCount} ảnh</span>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditEditor(a)}
                          className="font-bold text-slate-900 hover:text-[#00552B] text-left line-clamp-2 cursor-pointer"
                        >
                          {lang === 'en' ? a.title_en : a.title_vi}
                        </button>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePublish(a)}
                            className={`px-2 py-0.5 rounded font-semibold text-[11px] cursor-pointer ${
                              a.published ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {a.published ? t('Đã xuất bản', 'Published') : t('Bản nháp', 'Draft')}
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditEditor(a)}
                              className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 font-semibold cursor-pointer"
                            >
                              {t('Sửa & Ảnh', 'Edit')}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                confirmDeleteId === a.id ? handleDeletePost(a.id) : setConfirmDeleteId(a.id)
                              }
                              className={`px-2 py-1 rounded border cursor-pointer ${
                                confirmDeleteId === a.id
                                  ? 'bg-red-600 text-white border-red-600'
                                  : 'border-slate-200 text-red-600'
                              }`}
                            >
                              {confirmDeleteId === a.id ? t('Xác nhận', 'Confirm') : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="p-3 text-left">{t('Bài viết & Ảnh bìa', 'Article & Cover')}</th>
                      <th className="p-3 text-left">{t('Chuyên mục / Hình ảnh', 'Topic & Media')}</th>
                      <th className="p-3 text-left">{t('Tác giả & Thời lượng', 'Author')}</th>
                      <th className="p-3 text-left">{t('Trạng thái', 'Status')}</th>
                      <th className="p-3 text-right">{t('Thao tác', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredArticles.map((a) => {
                      const node = getNodeBySlug(a.slug);
                      const customGalCount = Array.isArray(a.gallery) ? a.gallery.length : 0;
                      const effectiveFigureCount =
                        customGalCount > 0
                          ? customGalCount
                          : node
                            ? getArticleEnrichment(node, a.image_key).visualFigures.length
                            : 0;
                      return (
                        <tr key={a.id} className="hover:bg-slate-50/70">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                disabled={quickSavingId === a.id}
                                onClick={() => setPickerTarget({ kind: 'quick_list_cover', article: a })}
                                className="relative w-12 aspect-[4/5] rounded-lg overflow-hidden border border-slate-200 shrink-0 cursor-pointer group"
                                title={t('Bấm để thay ảnh bìa ngay', 'Click to replace cover image')}
                              >
                                <img
                                  src={resolveMediaUrl(a.image_key)}
                                  alt={a.title_vi}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera className="w-4 h-4 text-white" />
                                </span>
                              </button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                                  {node && <span className="font-bold text-[#00552B]">{node.code}</span>}
                                  {a.cms_edited === 1 && (
                                    <>
                                      <span>·</span>
                                      <span className="text-amber-700 font-semibold">{t('Đã tùy chỉnh CMS', 'CMS Edited')}</span>
                                    </>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => openEditEditor(a)}
                                  className="font-bold text-slate-900 hover:text-[#00552B] text-left cursor-pointer line-clamp-1"
                                >
                                  {lang === 'en' ? a.title_en : a.title_vi}
                                </button>
                                <p className="text-[11px] font-mono text-slate-400 truncate max-w-sm">/journal/{a.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="font-medium text-slate-700">{localizeJournalCategory(a.category, lang)}</div>
                            <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                              {t(`1 bìa + ${effectiveFigureCount} ảnh minh họa`, `1 cover + ${effectiveFigureCount} figures`)}
                            </div>
                          </td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">
                            <div>{a.author}</div>
                            <div className="text-[11px] text-slate-400 tabular-nums">
                              {a.read_minutes} {t('phút đọc', 'min read')}
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(a)}
                              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                                a.published
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                            >
                              {a.published ? t('Đã xuất bản', 'Published') : t('Bản nháp', 'Draft')}
                            </button>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            {confirmDeleteId === a.id ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(a.id)}
                                  className="px-2.5 py-1 bg-red-600 text-white rounded font-semibold cursor-pointer"
                                >
                                  {t('Xác nhận xóa', 'Confirm')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 border border-slate-200 rounded bg-white cursor-pointer"
                                >
                                  {t('Hủy', 'Cancel')}
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setPickerTarget({ kind: 'quick_list_cover', article: a })}
                                  className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600 inline-flex items-center cursor-pointer"
                                  title={t('Thay nhanh ảnh bìa', 'Quick replace cover image')}
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openEditEditor(a)}
                                  className="px-2.5 py-1.5 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-700 inline-flex items-center gap-1 cursor-pointer font-semibold"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{t('Sửa & Ảnh', 'Edit & Media')}</span>
                                </button>
                                {a.published === 1 && (
                                  <Link
                                    to={`/journal/${a.slug}`}
                                    className="p-1.5 border border-slate-200 rounded-md hover:bg-slate-100 text-slate-600 inline-flex items-center"
                                    title={t('Xem bài viết', 'View Post')}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(a.id)}
                                  className="p-1.5 border border-slate-200 rounded-md hover:bg-red-50 text-red-600 cursor-pointer"
                                  title={t('Xóa bài viết', 'Delete Post')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      <MediaPickerModal
        open={pickerTarget !== null}
        onClose={() => setPickerTarget(null)}
        mediaAssets={mediaAssets}
        onMediaUploaded={onMediaUploaded}
        title={pickerTitle}
        onSelect={handleMediaPicked}
      />
    </>
  );
};
