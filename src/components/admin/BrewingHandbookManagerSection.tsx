import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Check,
  Coffee,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { BREWING_HANDBOOK_TOPICS, type BrewingHandbookArticle } from '../../data/brewingHandbook';
import { resolveMediaUrl } from '../../lib/media';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';
import { MediaPickerModal, type MediaAssetRecord } from './MediaPickerModal';

export interface HandbookAdminArticle extends BrewingHandbookArticle {
  sortOrder?: number;
  cmsEdited?: number;
  published?: number;
  updatedAt?: string;
}

interface BrewingHandbookManagerSectionProps {
  mediaAssets: MediaAssetRecord[];
  onMediaUploaded: () => Promise<void> | void;
  onCountChange?: (count: number) => void;
}

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

type PickerTarget =
  | { kind: 'cover' }
  | { kind: 'quick_cover'; article: HandbookAdminArticle };

export const BrewingHandbookManagerSection: React.FC<BrewingHandbookManagerSectionProps> = ({
  mediaAssets,
  onMediaUploaded,
  onCountChange,
}) => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [articles, setArticles] = useState<HandbookAdminArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [quickSavingId, setQuickSavingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Filters
  const [topicFilter, setTopicFilter] = useState<'all' | BrewingHandbookArticle['topic']>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [search, setSearch] = useState('');

  // Form fields
  const [titleVi, setTitleVi] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [topic, setTopic] = useState<BrewingHandbookArticle['topic']>('phin');
  const [excerptVi, setExcerptVi] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [readMinutes, setReadMinutes] = useState(4);
  const [coverImageKey, setCoverImageKey] = useState('journal_phin_ritual');
  const [dose, setDose] = useState('25g');
  const [water, setWater] = useState('90ml');
  const [temp, setTemp] = useState('92–95°C');
  const [time, setTime] = useState('4:30');
  const [grindVi, setGrindVi] = useState('Vừa-thô (Medium-Coarse)');
  const [grindEn, setGrindEn] = useState('Medium-Coarse');
  const [introViText, setIntroViText] = useState('');
  const [introEnText, setIntroEnText] = useState('');
  const [stepsViText, setStepsViText] = useState('');
  const [stepsEnText, setStepsEnText] = useState('');
  const [baristaTipVi, setBaristaTipVi] = useState('');
  const [baristaTipEn, setBaristaTipEn] = useState('');
  const [primaryProductSlug, setPrimaryProductSlug] = useState('roar-phin-heritage');
  const [secondaryProductSlug, setSecondaryProductSlug] = useState('roar-dam-bold');
  const [upsellHeadlineVi, setUpsellHeadlineVi] = useState('');
  const [upsellHeadlineEn, setUpsellHeadlineEn] = useState('');
  const [upsellReasonVi, setUpsellReasonVi] = useState('');
  const [upsellReasonEn, setUpsellReasonEn] = useState('');
  const [published, setPublished] = useState(true);
  const [showEnFields, setShowEnFields] = useState(false);

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const loadHandbook = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/brewing-handbook');
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d.articles) ? (d.articles as HandbookAdminArticle[]) : [];
        setArticles(list);
        onCountChange?.(list.length);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHandbook();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      if (topicFilter !== 'all' && a.topic !== topicFilter) return false;
      if (statusFilter === 'published' && a.published === 0) return false;
      if (statusFilter === 'draft' && a.published !== 0) return false;
      if (!q) return true;
      return `${a.titleVi} ${a.titleEn} ${a.slug} ${a.topicVi} ${a.excerptVi}`.toLowerCase().includes(q);
    });
  }, [articles, topicFilter, statusFilter, search]);

  const openNew = () => {
    setEditingId(null);
    setTitleVi('');
    setTitleEn('');
    setSlug('');
    setSlugTouched(false);
    setTopic('phin');
    setExcerptVi('');
    setExcerptEn('');
    setReadMinutes(4);
    setCoverImageKey('journal_phin_ritual');
    setDose('25g');
    setWater('90ml');
    setTemp('92–95°C');
    setTime('4:30');
    setGrindVi('Vừa-thô (Medium-Coarse)');
    setGrindEn('Medium-Coarse');
    setIntroViText('');
    setIntroEnText('');
    setStepsViText('');
    setStepsEnText('');
    setBaristaTipVi('');
    setBaristaTipEn('');
    setPrimaryProductSlug('roar-phin-heritage');
    setSecondaryProductSlug('roar-dam-bold');
    setUpsellHeadlineVi('');
    setUpsellHeadlineEn('');
    setUpsellReasonVi('');
    setUpsellReasonEn('');
    setPublished(true);
    setShowEnFields(false);
    setMode('edit');
  };

  const openEdit = (a: HandbookAdminArticle) => {
    setEditingId(a.id);
    setTitleVi(a.titleVi || '');
    setTitleEn(a.titleEn || '');
    setSlug(a.slug || '');
    setSlugTouched(true);
    setTopic(a.topic || 'phin');
    setExcerptVi(a.excerptVi || '');
    setExcerptEn(a.excerptEn || '');
    setReadMinutes(a.readMinutes || 4);
    setCoverImageKey(a.coverImageKey || 'journal_phin_ritual');
    setDose(a.spec?.dose || '');
    setWater(a.spec?.water || '');
    setTemp(a.spec?.temp || '');
    setTime(a.spec?.time || '');
    setGrindVi(a.spec?.grindVi || '');
    setGrindEn(a.spec?.grindEn || '');
    setIntroViText((a.introVi || []).join('\n\n'));
    setIntroEnText((a.introEn || []).join('\n\n'));
    setStepsViText((a.stepsVi || []).join('\n'));
    setStepsEnText((a.stepsEn || []).join('\n'));
    setBaristaTipVi(a.baristaTipVi || '');
    setBaristaTipEn(a.baristaTipEn || '');
    setPrimaryProductSlug(a.primaryProductSlug || 'roar-phin-heritage');
    setSecondaryProductSlug(a.secondaryProductSlug || 'roar-dam-bold');
    setUpsellHeadlineVi(a.upsellHeadlineVi || '');
    setUpsellHeadlineEn(a.upsellHeadlineEn || '');
    setUpsellReasonVi(a.upsellReasonVi || '');
    setUpsellReasonEn(a.upsellReasonEn || '');
    setPublished(a.published !== 0);
    setShowEnFields(false);
    setMode('edit');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleVi.trim()) {
      showToast(t('Vui lòng nhập tiêu đề bài Cẩm nang pha chế', 'Please enter a guide title'));
      return;
    }
    setSaving(true);
    try {
      const splitParagraphs = (raw: string) =>
        raw
          .split(/\n+/)
          .map((s) => s.trim())
          .filter(Boolean);

      const payload = {
        titleVi: titleVi.trim(),
        titleEn: titleEn.trim() || titleVi.trim(),
        slug: slug.trim() || toSafeSlugClient(titleVi),
        topic,
        excerptVi: excerptVi.trim(),
        excerptEn: excerptEn.trim() || excerptVi.trim(),
        readMinutes: Number(readMinutes) || 4,
        coverImageKey: coverImageKey.trim() || 'journal_phin_ritual',
        spec: {
          dose: dose.trim(),
          water: water.trim(),
          temp: temp.trim(),
          time: time.trim(),
          grindVi: grindVi.trim(),
          grindEn: grindEn.trim() || grindVi.trim(),
        },
        introVi: splitParagraphs(introViText),
        introEn: splitParagraphs(introEnText || introViText),
        stepsVi: splitParagraphs(stepsViText),
        stepsEn: splitParagraphs(stepsEnText || stepsViText),
        baristaTipVi: baristaTipVi.trim(),
        baristaTipEn: baristaTipEn.trim() || baristaTipVi.trim(),
        primaryProductSlug: primaryProductSlug.trim() || 'roar-phin-heritage',
        secondaryProductSlug: secondaryProductSlug.trim() || 'roar-dam-bold',
        upsellHeadlineVi: upsellHeadlineVi.trim(),
        upsellHeadlineEn: upsellHeadlineEn.trim() || upsellHeadlineVi.trim(),
        upsellReasonVi: upsellReasonVi.trim(),
        upsellReasonEn: upsellReasonEn.trim() || upsellReasonVi.trim(),
        published: published ? 1 : 0,
      };

      const url = editingId ? `/api/admin/brewing-handbook/${editingId}` : '/api/admin/brewing-handbook';
      const method = editingId ? 'PATCH' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(d.error || t('Không thể lưu bài cẩm nang', 'Failed to save guide'));
        return;
      }
      showToast(
        editingId
          ? t('Đã cập nhật bài Cẩm nang pha chế!', 'Updated brewing guide!')
          : t('Đã tạo bài Cẩm nang pha chế mới!', 'Created new brewing guide!')
      );
      await loadHandbook();
      setMode('list');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/api/admin/brewing-handbook/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast(t('Đã xóa bài cẩm nang', 'Deleted brewing guide'));
      setConfirmDeleteId(null);
      await loadHandbook();
    } else {
      showToast(t('Không thể xóa bài cẩm nang', 'Could not delete guide'));
    }
  };

  const handleQuickCoverSelect = async (article: HandbookAdminArticle, nextUrl: string) => {
    setQuickSavingId(article.id);
    try {
      const res = await apiFetch(`/api/admin/brewing-handbook/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverImageKey: nextUrl }),
      });
      if (res.ok) {
        showToast(t('Đã đổi ảnh bìa Cẩm nang pha chế!', 'Updated guide cover image!'));
        await loadHandbook();
      }
    } finally {
      setQuickSavingId(null);
    }
  };

  if (mode === 'edit') {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('Quay lại danh sách', 'Back to list')}
            </button>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              {editingId
                ? t('Chỉnh sửa bài Cẩm nang pha chế', 'Edit Brewing Handbook Guide')
                : t('Viết bài Cẩm nang pha chế mới', 'New Brewing Handbook Guide')}
            </h3>
          </div>
          {editingId && slug && (
            <Link
              to={`/brewing-handbook/${slug}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] hover:underline"
            >
              <span>{t('Xem ngoài website', 'View live')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Main Content */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="block space-y-1 sm:col-span-2">
                <span className="font-semibold text-slate-700">{t('Tiêu đề bài viết (Tiếng Việt) *', 'Title (VI) *')}</span>
                <input
                  type="text"
                  required
                  value={titleVi}
                  onChange={(e) => {
                    setTitleVi(e.target.value);
                    if (!slugTouched) setSlug(toSafeSlugClient(e.target.value));
                  }}
                  placeholder={t('VD: Bạc Xỉu 3 Tầng Chuẩn Quán Sài Gòn...', 'Guide title...')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">{t('Đường dẫn (Slug)', 'URL Slug')}</span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs"
                />
              </label>

              <label className="block space-y-1">
                <span className="font-semibold text-slate-700">{t('Chuyên mục pha chế', 'Brewing Topic')}</span>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as BrewingHandbookArticle['topic'])}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                >
                  {BREWING_HANDBOOK_TOPICS.filter((tp) => tp.id !== 'all').map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {tp.vi} ({tp.en})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">{t('Mô tả ngắn (Tóm tắt)', 'Short Excerpt (VI)')}</span>
              <textarea
                rows={2}
                value={excerptVi}
                onChange={(e) => setExcerptVi(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </label>

            {/* Technical Specs Grid */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
              <p className="text-xs font-bold text-[#00552B]">{t('Thông số kỹ thuật pha chế', 'Brewing Spec Parameters')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <label className="block space-y-1">
                  <span className="text-slate-600">{t('Liều lượng (Dose)', 'Dose')}</span>
                  <input value={dose} onChange={(e) => setDose(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono" />
                </label>
                <label className="block space-y-1">
                  <span className="text-slate-600">{t('Nước / Thành phẩm', 'Water / Yield')}</span>
                  <input value={water} onChange={(e) => setWater(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono" />
                </label>
                <label className="block space-y-1">
                  <span className="text-slate-600">{t('Nhiệt độ', 'Temp')}</span>
                  <input value={temp} onChange={(e) => setTemp(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono" />
                </label>
                <label className="block space-y-1">
                  <span className="text-slate-600">{t('Thời gian', 'Brew Time')}</span>
                  <input value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white font-mono" />
                </label>
                <label className="block space-y-1 col-span-2">
                  <span className="text-slate-600">{t('Cỡ xay (VI)', 'Grind Size (VI)')}</span>
                  <input value={grindVi} onChange={(e) => setGrindVi(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white" />
                </label>
              </div>
            </div>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                {t('Đoạn mở đầu & Nguyên lý (mỗi đoạn xuống dòng)', 'Intro Paragraphs (one per line)')}
              </span>
              <textarea
                rows={4}
                value={introViText}
                onChange={(e) => setIntroViText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">
                {t('Các bước thực hiện (mỗi bước 1 dòng)', 'Step-by-Step Instructions (one step per line)')}
              </span>
              <textarea
                rows={6}
                value={stepsViText}
                onChange={(e) => setStepsViText(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed"
              />
            </label>

            <label className="block space-y-1 text-xs">
              <span className="font-semibold text-slate-700">{t('Mẹo Barista ROAR', 'Barista Tip (VI)')}</span>
              <textarea
                rows={2}
                value={baristaTipVi}
                onChange={(e) => setBaristaTipVi(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
              />
            </label>

            {/* Optional English Fields */}
            <div className="pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowEnFields((v) => !v)}
                className="text-xs font-semibold text-[#00552B] hover:underline cursor-pointer"
              >
                {showEnFields
                  ? t('Ẩn nội dung Tiếng Anh (EN) ↑', 'Hide English fields ↑')
                  : t('Mở chỉnh sửa song ngữ Tiếng Anh (EN) ↓', 'Edit English version (EN) ↓')}
              </button>

              {showEnFields && (
                <div className="mt-3 space-y-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Title (EN)</span>
                    <input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white" />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Excerpt (EN)</span>
                    <textarea rows={2} value={excerptEn} onChange={(e) => setExcerptEn(e.target.value)} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white" />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Intro (EN — one per line)</span>
                    <textarea rows={3} value={introEnText} onChange={(e) => setIntroEnText(e.target.value)} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white" />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Steps (EN — one per line)</span>
                    <textarea rows={4} value={stepsEnText} onChange={(e) => setStepsEnText(e.target.value)} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white" />
                  </label>
                  <label className="block space-y-1">
                    <span className="font-semibold text-slate-700">Barista Tip (EN)</span>
                    <input value={baristaTipEn} onChange={(e) => setBaristaTipEn(e.target.value)} className="w-full px-3 py-1.5 rounded border border-slate-300 bg-white" />
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Cover Image, Product Pairing & Publish */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-800">{t('Ảnh đại diện bài Cẩm nang', 'Guide Cover Image')}</p>
              <div className="aspect-[16/10] rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                <img
                  src={resolveMediaUrl(coverImageKey)}
                  alt={titleVi || 'Cover'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPickerTarget({ kind: 'cover' })}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-semibold cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  {t('Chọn / Tải ảnh mới', 'Choose / Upload')}
                </button>
              </div>
              <input
                type="text"
                value={coverImageKey}
                onChange={(e) => setCoverImageKey(e.target.value)}
                placeholder="/uploads/... hoặc imageKey"
                className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-[11px]"
              />
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
              <p className="font-bold text-slate-800">{t('Gợi ý sản phẩm ROAR đi kèm', 'Paired ROAR Products')}</p>
              <label className="block space-y-1">
                <span className="text-slate-600">{t('Slug sản phẩm chính', 'Primary Product Slug')}</span>
                <input value={primaryProductSlug} onChange={(e) => setPrimaryProductSlug(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-[11px]" />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-600">{t('Slug sản phẩm phụ', 'Secondary Product Slug')}</span>
                <input value={secondaryProductSlug} onChange={(e) => setSecondaryProductSlug(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono text-[11px]" />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-600">{t('Tiêu đề gợi ý mua (VI)', 'Upsell Headline (VI)')}</span>
                <input value={upsellHeadlineVi} onChange={(e) => setUpsellHeadlineVi(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300" />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-600">{t('Lý do hợp gu (VI)', 'Pairing Reason (VI)')}</span>
                <textarea rows={2} value={upsellReasonVi} onChange={(e) => setUpsellReasonVi(e.target.value)} className="w-full px-2.5 py-1.5 rounded border border-slate-300" />
              </label>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1">
                  <span className="text-slate-600">{t('Phút đọc', 'Read min')}</span>
                  <input
                    type="number"
                    min={1}
                    max={45}
                    value={readMinutes}
                    onChange={(e) => setReadMinutes(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded border border-slate-300 font-mono"
                  />
                </label>
                <label className="flex items-center gap-2 pt-5 cursor-pointer">
                  <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-[#00552B]" />
                  <span className="font-semibold text-slate-700">{t('Xuất bản', 'Published')}</span>
                </label>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-bold text-xs cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {saving ? t('Đang lưu...', 'Saving...') : t('Lưu bài Cẩm nang', 'Save Brewing Guide')}
              </button>
            </div>
          </div>
        </form>

        <MediaPickerModal
          open={pickerTarget?.kind === 'cover'}
          onClose={() => setPickerTarget(null)}
          mediaAssets={mediaAssets}
          title={t('Chọn hoặc tải ảnh bìa bài Cẩm nang', 'Select or Upload Brewing Guide Cover')}
          onMediaUploaded={onMediaUploaded}
          onSelect={(url) => {
            setCoverImageKey(url);
            setPickerTarget(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm bài Cẩm nang pha chế...', 'Search brewing guides...')}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs"
            />
          </div>
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
          >
            {BREWING_HANDBOOK_TOPICS.map((tp) => (
              <option key={tp.id} value={tp.id}>
                {lang === 'vi' ? tp.vi : tp.en}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
          >
            <option value="all">{t('Tất cả trạng thái', 'All Status')}</option>
            <option value="published">{t('Đang hiển thị', 'Published')}</option>
            <option value="draft">{t('Bản nháp', 'Draft')}</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>{t('Viết bài Cẩm nang mới', 'New Brewing Guide')}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">{t('Đang tải danh sách cẩm nang...', 'Loading brewing guides...')}</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Coffee className="w-7 h-7 mx-auto text-slate-300" />
            <p className="text-xs text-slate-500">{t('Chưa có bài cẩm nang nào khớp bộ lọc.', 'No matching guides.')}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((a, idx) => (
              <div
                key={a.id}
                className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => setPickerTarget({ kind: 'quick_cover', article: a })}
                    title={t('Bấm để đổi nhanh ảnh bìa', 'Click to quick-swap cover image')}
                    className="relative w-20 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group cursor-pointer"
                  >
                    <img
                      src={resolveMediaUrl(a.coverImageKey)}
                      alt={a.titleVi}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-4 h-4" />
                    </span>
                    {quickSavingId === a.id && (
                      <span className="absolute inset-0 bg-black/60 text-white text-[10px] flex items-center justify-center font-bold">
                        ...
                      </span>
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="font-mono font-bold text-[#00552B] tabular-nums">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-600">{lang === 'vi' ? a.topicVi : a.topicEn}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500">
                        {a.spec?.dose} / {a.spec?.water}
                      </span>
                      {a.published === 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                          {t('Nháp', 'Draft')}
                        </span>
                      )}
                      {a.cmsEdited === 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          CMS
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-1">{a.titleVi}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{a.excerptVi}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <Link
                    to={`/brewing-handbook/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-[#00552B] hover:border-[#00552B]/40"
                    title={t('Xem ngoài website', 'Preview live')}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00552B]/10 hover:bg-[#00552B] text-[#00552B] hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('Sửa', 'Edit')}</span>
                  </button>
                  {confirmDeleteId === a.id ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold cursor-pointer"
                    >
                      {t('Xác nhận xóa', 'Confirm')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(a.id)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 cursor-pointer"
                      title={t('Xóa bài viết', 'Delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MediaPickerModal
        open={pickerTarget?.kind === 'quick_cover'}
        onClose={() => setPickerTarget(null)}
        mediaAssets={mediaAssets}
        title={t('Đổi nhanh ảnh bìa Cẩm nang pha chế', 'Quick-Swap Brewing Guide Cover')}
        onMediaUploaded={onMediaUploaded}
        onSelect={(url) => {
          if (pickerTarget?.kind === 'quick_cover') {
            handleQuickCoverSelect(pickerTarget.article, url);
          }
          setPickerTarget(null);
        }}
      />
    </div>
  );
};
