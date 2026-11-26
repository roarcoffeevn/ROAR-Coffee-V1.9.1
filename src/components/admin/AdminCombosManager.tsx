import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Edit3, PackageCheck, Plus, RefreshCw, Save, Search, Sparkles, Star, Tag, Trash2, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { type Product, useStore } from '../../context/StoreContext';
import { MediaImage } from '../MediaImage';

export interface ComboRecord {
  id: number;
  slug: string;
  title_vi: string;
  title_en: string;
  desc_vi: string;
  desc_en: string;
  badge_text: string;
  discount_pct: number;
  promo_code: string;
  productSlugs: string[];
  active: number;
  is_featured: number;
  sort_order: number;
  updated_at?: string;
}

interface AdminCombosManagerProps {
  products: Product[];
  promotions: any[];
  formatPrice: (vnd: number, usd?: number) => string;
}

const EMPTY_FORM = {
  slug: '',
  title_vi: '',
  title_en: '',
  desc_vi: '',
  desc_en: '',
  badge_text: 'ROARCOMBO12 · -12%',
  discount_pct: 12,
  promo_code: 'ROARCOMBO12',
  productSlugs: [] as string[],
  active: true,
  is_featured: true,
  sort_order: 10,
};

export const AdminCombosManager: React.FC<AdminCombosManagerProps> = ({ products, promotions, formatPrice }) => {
  const { t, lang } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [combos, setCombos] = useState<ComboRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [productSearch, setProductSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const retailProducts = useMemo(
    () => products.filter((p) => p.category !== 'green_bean' && p.status !== 'draft'),
    [products]
  );

  const productBySlug = useMemo(() => {
    const map: Record<string, Product> = {};
    for (const p of products) map[p.slug] = p;
    return map;
  }, [products]);

  const loadCombos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/combos');
      if (res.ok) {
        const d = await res.json();
        setCombos(Array.isArray(d.combos) ? d.combos : []);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadCombos();
  }, [loadCombos]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sort_order: combos.length + 1 });
    setShowForm(true);
  };

  const openEdit = (c: ComboRecord) => {
    setEditingId(c.id);
    setForm({
      slug: c.slug,
      title_vi: c.title_vi,
      title_en: c.title_en,
      desc_vi: c.desc_vi || '',
      desc_en: c.desc_en || '',
      badge_text: c.badge_text || `${c.promo_code || 'COMBO'} · -${c.discount_pct}%`,
      discount_pct: Number(c.discount_pct ?? 12),
      promo_code: c.promo_code || 'ROARCOMBO12',
      productSlugs: Array.isArray(c.productSlugs) ? c.productSlugs : [],
      active: Boolean(c.active),
      is_featured: Boolean(c.is_featured),
      sort_order: Number(c.sort_order ?? 10),
    });
    setShowForm(true);
  };

  const toggleProductSlug = (slug: string) => {
    setForm((prev) => {
      const exists = prev.productSlugs.includes(slug);
      if (exists) {
        return { ...prev, productSlugs: prev.productSlugs.filter((s) => s !== slug) };
      }
      if (prev.productSlugs.length >= 6) {
        showToast(t('Tối đa 6 sản phẩm trong 1 combo', 'Maximum 6 products per combo'));
        return prev;
      }
      return { ...prev, productSlugs: [...prev.productSlugs, slug] };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_vi.trim() || !form.title_en.trim() || form.productSlugs.length === 0) {
      showToast(t('Vui lòng nhập tên Combo song ngữ và chọn ít nhất 1 sản phẩm', 'Enter bilingual titles and at least 1 product'));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        discount_pct: Math.max(0, Math.min(50, Math.round(Number(form.discount_pct || 0)))),
        sort_order: Math.max(0, Math.round(Number(form.sort_order || 0))),
      };
      const res = await apiFetch(editingId ? `/api/admin/combos/${editingId}` : '/api/admin/combos', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(editingId ? t('Đã cập nhật Combo', 'Combo updated') : t('Đã tạo Combo mới', 'New combo created'));
        setShowForm(false);
        setEditingId(null);
        await loadCombos();
      } else {
        showToast(d.error || t('Không thể lưu Combo', 'Failed to save combo'));
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleComboFlag = async (combo: ComboRecord, field: 'active' | 'is_featured') => {
    const nextVal = combo[field] ? 0 : 1;
    const res = await apiFetch(`/api/admin/combos/${combo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: Boolean(nextVal) }),
    });
    if (res.ok) {
      setCombos((prev) => prev.map((c) => (c.id === combo.id ? { ...c, [field]: nextVal } : c)));
      showToast(t('Đã cập nhật trạng thái Combo', 'Combo status updated'));
    }
  };

  const handleDelete = async (id: number) => {
    const res = await apiFetch(`/api/admin/combos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCombos((prev) => prev.filter((c) => c.id !== id));
      setConfirmDeleteId(null);
      showToast(t('Đã xóa Combo', 'Combo deleted'));
    }
  };

  const filteredCatalog = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return retailProducts;
    return retailProducts.filter(
      (p) =>
        p.name_vi.toLowerCase().includes(q) ||
        p.name_en.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    );
  }, [retailProducts, productSearch]);

  const formRawVnd = useMemo(
    () =>
      form.productSlugs.reduce((sum, slug) => {
        const p = productBySlug[slug];
        if (!p) return sum;
        return sum + (p.variants?.[0]?.priceVnd || p.price_vnd || 0);
      }, 0),
    [form.productSlugs, productBySlug]
  );

  const formDiscountedVnd = Math.round(formRawVnd * (1 - Math.max(0, Math.min(50, form.discount_pct)) / 100));

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[#00552B]">
            <PackageCheck className="w-5 h-5" />
            <h2 className="text-lg font-bold text-slate-900">
              {t('Quản lý Bộ Combo & Quà Tặng Storefront', 'Storefront Combo & Bundle Manager')}
            </h2>
          </div>
          <p className="text-xs text-slate-600">
            {t(
              'Cấu hình các gói Combo hiển thị trực tiếp tại Trang chủ, gán mã giảm giá đồng bộ và chọn sản phẩm từ danh mục thật.',
              'Configure curated bundles shown on the homepage with synchronized discount percentages and live catalog SKUs.'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadCombos}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('Làm mới', 'Refresh')}</span>
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-[#00552B] hover:bg-[#003D25] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('Tạo Combo mới', 'New Combo')}</span>
          </button>
        </div>
      </div>

      {/* Create / Edit Modal Drawer */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border-2 border-[#00552B]/30 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00552B]" />
              <span>{editingId ? t('Chỉnh sửa Combo', 'Edit Combo') : t('Tạo Bộ Combo Mới', 'Create New Bundle')}</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tên Combo (Tiếng Việt) *', 'Combo Title (VI) *')}</label>
              <input
                type="text"
                required
                value={form.title_vi}
                onChange={(e) => setForm({ ...form, title_vi: e.target.value })}
                placeholder="vd: Combo Sáng Phin Đậm Đà"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tên Combo (Tiếng Anh) *', 'Combo Title (EN) *')}</label>
              <input
                type="text"
                required
                value={form.title_en}
                onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                placeholder="e.g. Bold Phin Morning Set"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Mô tả ngắn (VI)', 'Short Description (VI)')}</label>
              <textarea
                rows={2}
                value={form.desc_vi}
                onChange={(e) => setForm({ ...form, desc_vi: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Mô tả ngắn (EN)', 'Short Description (EN)')}</label>
              <textarea
                rows={2}
                value={form.desc_en}
                onChange={(e) => setForm({ ...form, desc_en: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Mức giảm (%)', 'Discount (%)')}</label>
              <input
                type="number"
                min={0}
                max={50}
                value={form.discount_pct}
                onChange={(e) => {
                  const pct = Math.max(0, Math.min(50, Number(e.target.value || 0)));
                  setForm({
                    ...form,
                    discount_pct: pct,
                    badge_text: `${form.promo_code || 'COMBO'} · -${pct}%`,
                  });
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono font-bold tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Mã Voucher áp dụng', 'Linked Promo Code')}</label>
              <input
                type="text"
                value={form.promo_code}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setForm({
                    ...form,
                    promo_code: code,
                    badge_text: `${code || 'COMBO'} · -${form.discount_pct}%`,
                  });
                }}
                list="roar-combo-promos"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono uppercase"
              />
              <datalist id="roar-combo-promos">
                <option value="ROARCOMBO12" />
                {promotions.map((pr) => (
                  <option key={pr.code} value={pr.code} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Nhãn huy hiệu', 'Badge Label')}</label>
              <input
                type="text"
                value={form.badge_text}
                onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Thứ tự hiển thị', 'Sort Order')}</label>
              <input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value || 0) })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Product Picker */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700">
                {t('Chọn sản phẩm trong Combo (2–6 sản phẩm) *', 'Select Products Included in Combo (2–6 SKUs) *')}{' '}
                <span className="font-mono text-[#00552B]">({form.productSlugs.length} {t('đã chọn', 'selected')})</span>
              </label>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={t('Lọc theo tên hoặc SKU...', 'Filter name or SKU...')}
                  className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {filteredCatalog.map((p) => {
                const picked = form.productSlugs.includes(p.slug);
                const price = p.variants?.[0]?.priceVnd || p.price_vnd;
                return (
                  <button
                    key={p.slug}
                    type="button"
                    onClick={() => toggleProductSlug(p.slug)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                      picked
                        ? 'bg-[#00552B]/10 border-[#00552B] text-[#003D25]'
                        : 'bg-white border-slate-200 hover:border-[#00552B]/40 text-slate-800'
                    }`}
                  >
                    <div className="w-9 h-10 rounded overflow-hidden shrink-0 bg-slate-100">
                      <MediaImage imageKey={p.image_key} alt={p.name_vi} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold truncate">{lang === 'vi' ? p.name_vi : p.name_en}</p>
                      <p className="text-[10px] font-mono text-slate-500 tabular-nums">
                        {p.sku} · {formatPrice(price)}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                        picked ? 'bg-[#00552B] text-white' : 'border border-slate-300 bg-white'
                      }`}
                    >
                      {picked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Pricing Calculation */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8F5EF] border border-[#00552B]/15 rounded-lg px-4 py-2.5 text-xs">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="accent-[#00552B]"
                  />
                  <span>{t('Đang hiển thị công khai', 'Active on Storefront')}</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                    className="accent-[#00552B]"
                  />
                  <span>{t('Ghim nổi bật', 'Featured')}</span>
                </label>
              </div>
              <div className="flex items-center gap-3 font-mono tabular-nums">
                <span className="text-slate-500 line-through">{formatPrice(formRawVnd)}</span>
                <span className="font-bold text-sm text-[#00552B]">{formatPrice(formDiscountedVnd)}</span>
                <span className="text-[11px] text-emerald-700 font-semibold">(-{form.discount_pct}%)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              {t('Hủy', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-[#00552B] hover:bg-[#003D25] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? t('Đang lưu...', 'Saving...') : t('Lưu Combo', 'Save Combo')}</span>
            </button>
          </div>
        </form>
      )}

      {/* Existing Combos Grid */}
      {loading ? (
        <div className="p-10 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
          {t('Đang tải danh sách Combo...', 'Loading combos...')}
        </div>
      ) : combos.length === 0 ? (
        <div className="p-10 text-center space-y-3 bg-white rounded-xl border border-slate-200">
          <p className="text-sm text-slate-600">{t('Chưa có Combo nào được cấu hình.', 'No combos configured yet.')}</p>
          <button
            type="button"
            onClick={openCreate}
            className="px-4 py-2 bg-[#00552B] text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            {t('Tạo Combo đầu tiên', 'Create First Combo')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {combos.map((combo) => {
            const matchedProducts = combo.productSlugs.map((slug) => productBySlug[slug]).filter(Boolean);
            const rawVnd = matchedProducts.reduce((s, p) => s + (p.variants?.[0]?.priceVnd || p.price_vnd || 0), 0);
            const finalVnd = Math.round(rawVnd * (1 - Number(combo.discount_pct || 0) / 100));

            return (
              <div
                key={combo.id}
                className={`bg-white rounded-xl border p-4 flex flex-col justify-between space-y-4 ${
                  combo.active ? 'border-slate-200' : 'border-slate-200 opacity-65 bg-slate-50'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-mono font-bold text-[#00552B] inline-flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {combo.badge_text || `${combo.promo_code} · -${combo.discount_pct}%`}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleComboFlag(combo, 'is_featured')}
                        title={t('Nổi bật', 'Featured')}
                        className={`p-1 rounded cursor-pointer ${
                          combo.is_featured ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-slate-500'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleComboFlag(combo, 'active')}
                        className={`px-2 py-0.5 rounded font-semibold cursor-pointer ${
                          combo.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {combo.active ? t('Bật', 'On') : t('Tắt', 'Off')}
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{lang === 'vi' ? combo.title_vi : combo.title_en}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {lang === 'vi' ? combo.desc_vi : combo.desc_en}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {matchedProducts.map((p) => (
                      <div
                        key={p.slug}
                        className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shrink-0"
                      >
                        <div className="w-6 h-7 rounded overflow-hidden bg-white">
                          <MediaImage imageKey={p.image_key} alt={p.name_vi} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[10px] font-medium text-slate-700 max-w-[100px] truncate">
                          {lang === 'vi' ? p.name_vi : p.name_en}
                        </span>
                      </div>
                    ))}
                    {matchedProducts.length === 0 && (
                      <span className="text-[11px] text-amber-600">
                        {t('Chưa khớp SKU sản phẩm nào', 'No matching active SKUs')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="font-mono tabular-nums">
                    <span className="text-[11px] line-through text-slate-400 mr-2">{formatPrice(rawVnd)}</span>
                    <span className="text-sm font-bold text-[#00552B]">{formatPrice(finalVnd)}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(combo)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#00552B] text-slate-700 hover:text-[#00552B] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{t('Sửa', 'Edit')}</span>
                    </button>
                    {confirmDeleteId === combo.id ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(combo.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        {t('Xác nhận xóa', 'Confirm')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(combo.id)}
                        aria-label={t('Xóa Combo', 'Delete combo')}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
