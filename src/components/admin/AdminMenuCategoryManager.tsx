import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  FolderTree,
  Menu as MenuIcon,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';

export interface CmsMenuItem {
  id: string;
  location: 'header' | 'footer_explore' | 'footer_support';
  labelVi: string;
  labelEn: string;
  path: string;
  visible: boolean;
  openInNewTab?: boolean;
}

export interface CmsCategoryItem {
  id: string;
  slug: string;
  nameVi: string;
  nameEn: string;
  type: 'product' | 'journal';
  descriptionVi: string;
  descriptionEn: string;
  visible: boolean;
}

export const DEFAULT_CMS_MENUS: CmsMenuItem[] = [
  { id: 'm-home', location: 'header', labelVi: 'Trang chủ', labelEn: 'Home', path: '/', visible: true },
  { id: 'm-shop', location: 'header', labelVi: 'Sản phẩm', labelEn: 'Shop', path: '/shop', visible: true },
  { id: 'm-roasted', location: 'header', labelVi: 'Cà phê Rang xay', labelEn: 'Roasted Coffee', path: '/coffee/roasted', visible: true },
  { id: 'm-beans', location: 'header', labelVi: 'Hạt rang (kg)', labelEn: 'Roasted Beans', path: '/coffee/roasted-beans', visible: true },
  { id: 'm-green', location: 'header', labelVi: 'Cà phê Nhân xanh', labelEn: 'Green Coffee', path: '/coffee/green-coffee', visible: true },
  { id: 'm-instant', location: 'header', labelVi: 'Hòa tan', labelEn: 'Instant Coffee', path: '/coffee/instant', visible: true },
  { id: 'm-personalities', location: 'header', labelVi: '7 Cá tính', labelEn: '7 Personalities', path: '/personalities', visible: true },
  { id: 'm-origins', location: 'header', labelVi: 'Vùng nguyên liệu', labelEn: 'Origins', path: '/origins', visible: true },
  { id: 'm-journal', location: 'header', labelVi: 'Nhật ký', labelEn: 'Journal', path: '/journal', visible: true },
  { id: 'm-promotions', location: 'header', labelVi: 'Ưu đãi', labelEn: 'Promotions', path: '/promotions', visible: true },
  { id: 'm-about', location: 'header', labelVi: 'Về ROAR', labelEn: 'About', path: '/about', visible: true },
  // Footer Explore
  { id: 'fe-shop', location: 'footer_explore', labelVi: 'Cửa hàng cà phê', labelEn: 'Coffee Shop', path: '/shop', visible: true },
  { id: 'fe-green', location: 'footer_explore', labelVi: 'Cà phê nhân xanh S14/S16/S18', labelEn: 'Green Coffee S14/S16/S18', path: '/coffee/green-beans', visible: true },
  { id: 'fe-b2b', location: 'footer_explore', labelVi: 'Hợp tác B2B & Xuất khẩu', labelEn: 'B2B & Export', path: '/partners', visible: true },
  { id: 'fe-journal', location: 'footer_explore', labelVi: 'Nhật ký & Kiến thức', labelEn: 'Journal & Guides', path: '/journal', visible: true },
  // Footer Support
  { id: 'fs-account', location: 'footer_support', labelVi: 'Tài khoản & Ví ROAR', labelEn: 'Account & ROAR Wallet', path: '/account', visible: true },
  { id: 'fs-track', location: 'footer_support', labelVi: 'Tra cứu đơn hàng', labelEn: 'Track Order', path: '/orders/track', visible: true },
  { id: 'fs-contact', location: 'footer_support', labelVi: 'Liên hệ & Showroom', labelEn: 'Contact & Showroom', path: '/contact', visible: true },
];

export const DEFAULT_CMS_CATEGORIES: CmsCategoryItem[] = [
  {
    id: 'cat-roasted-ground',
    slug: 'roasted-coffee',
    nameVi: 'Cà phê Rang Xay & Phin',
    nameEn: 'Roasted & Phin Coffee',
    type: 'product',
    descriptionVi: 'Dòng cà phê rang xay chuẩn gu Việt & quốc tế',
    descriptionEn: 'Signature roasted Vietnamese & international profiles',
    visible: true,
  },
  {
    id: 'cat-whole-beans',
    slug: 'roasted-beans',
    nameVi: 'Hạt Rang Nguyên Chất (5 mốc kg)',
    nameEn: 'Whole Roasted Beans (5 kg tiers)',
    type: 'product',
    descriptionVi: '6 dòng hạt rang chuyên biệt cho quán & văn phòng',
    descriptionEn: '6 specialty roasted bean lines for cafes & offices',
    visible: true,
  },
  {
    id: 'cat-green-beans',
    slug: 'green-coffee',
    nameVi: 'Cà phê Nhân Xanh S14/S16/S18',
    nameEn: 'Green Coffee Beans S14/S16/S18',
    type: 'product',
    descriptionVi: '27 dòng nhân xanh tuyển chọn từ 10 vùng trồng Việt Nam',
    descriptionEn: '27 curated green bean lots across 10 Vietnamese origins',
    visible: true,
  },
  {
    id: 'cat-pepper',
    slug: 'pepper',
    nameVi: 'Tiêu Đen & Tiêu Sọ Tây Nguyên',
    nameEn: 'Highland Black & White Pepper',
    type: 'product',
    descriptionVi: '6 dòng tiêu xay, tiêu sọ & cối xay 70g Đắk Lắk – Gia Lai',
    descriptionEn: '6 highland ground, whole & built-in grinder pepper lines',
    visible: true,
  },
  {
    id: 'cat-gift-vouchers',
    slug: 'gift-vouchers',
    nameVi: 'Gift Voucher & Quà Tặng ROAR',
    nameEn: 'Gift Vouchers & Reserve Gifting',
    type: 'product',
    descriptionVi: 'Phiếu quà tặng 50k–1tr & bộ quà tặng cao cấp',
    descriptionEn: '50k–1M VND gift vouchers & luxury Reserve gift sets',
    visible: true,
  },
  {
    id: 'cat-journal-processing',
    slug: 'coffee-processing',
    nameVi: 'Sơ chế & Chế biến',
    nameEn: 'Coffee processing',
    type: 'journal',
    descriptionVi: 'Quy trình phơi giàn Natural, Honey & chế biến ướt CBU sạch vị',
    descriptionEn: 'Natural, Honey, and CBU Washed fermentation & drying protocols',
    visible: true,
  },
  {
    id: 'cat-journal-varieties',
    slug: 'coffee-varieties',
    nameVi: 'Giống & Phân loại hạt',
    nameEn: 'Coffee varieties',
    type: 'journal',
    descriptionVi: 'Hình thái Culi Peaberry, Robusta TR4/TR9, Arabica và tiêu chuẩn sàng S14–S18',
    descriptionEn: 'Culi Peaberry morphology, Robusta TR4/TR9, Arabica, and S14–S18 grading',
    visible: true,
  },
  {
    id: 'cat-journal-brewing',
    slug: 'brewing-techniques',
    nameVi: 'Kỹ thuật Pha chế',
    nameEn: 'Brewing techniques',
    type: 'journal',
    descriptionVi: 'Nghệ thuật pha Phin truyền thống, Ristretto/Espresso và kỹ thuật ủ Bloom',
    descriptionEn: 'Vietnamese Phin craft, Ristretto/Espresso dialing, and Pour Over bloom control',
    visible: true,
  },
  {
    id: 'cat-journal-knowledge',
    slug: 'coffee-knowledge',
    nameVi: 'Kiến thức Cà phê',
    nameEn: 'Coffee knowledge',
    type: 'journal',
    descriptionVi: 'Phản ứng Maillard, nhận biết cà phê rang mộc, 7 cá tính & giải pháp HORECA',
    descriptionEn: 'Maillard roast chemistry, 100% pure coffee verification, 7 personalities & HORECA',
    visible: true,
  },
  {
    id: 'cat-journal-origins',
    slug: 'coffee-origins',
    nameVi: 'Vùng Nguyên liệu',
    nameEn: 'Coffee origins',
    type: 'journal',
    descriptionVi: 'Đất đỏ bazan Đắk Lắk – Đắk Nông, Cầu Đất 1.500m, Sơn La, Điện Biên & Măng Đen',
    descriptionEn: 'Central Highlands basalt terroirs, Cầu Đất 1,500m, Sơn La, Điện Biên & Măng Đen',
    visible: true,
  },
];

const QUICK_PAGES = [
  { labelVi: 'Trang chủ', labelEn: 'Home', path: '/' },
  { labelVi: 'Cửa hàng', labelEn: 'Shop', path: '/shop' },
  { labelVi: 'Cà phê Rang xay', labelEn: 'Roasted Coffee', path: '/coffee/roasted' },
  { labelVi: 'Hạt rang (kg)', labelEn: 'Roasted Beans', path: '/coffee/roasted-beans' },
  { labelVi: 'Cà phê Nhân xanh', labelEn: 'Green Coffee', path: '/coffee/green-coffee' },
  { labelVi: 'Ma trận Nhân xanh B2B (27 SKU)', labelEn: 'B2B Green Matrix', path: '/coffee/green-beans' },
  { labelVi: 'Hòa tan', labelEn: 'Instant Coffee', path: '/coffee/instant' },
  { labelVi: 'Tiêu Tây Nguyên', labelEn: 'Highland Pepper', path: '/coffee/pepper' },
  { labelVi: 'Gift Voucher', labelEn: 'Gift Voucher', path: '/coffee/gift-vouchers' },
  { labelVi: '7 Cá tính', labelEn: '7 Personalities', path: '/personalities' },
  { labelVi: 'Vùng nguyên liệu', labelEn: 'Origins', path: '/origins' },
  { labelVi: 'Cẩm nang Pha chế (15 chuyên đề)', labelEn: 'Brewing Handbook', path: '/brewing-handbook' },
  { labelVi: 'Tạp chí Cà phê (Tất cả)', labelEn: 'Journal (All)', path: '/journal' },
  { labelVi: 'Tạp chí: Sơ chế & Chế biến', labelEn: 'Journal: Processing', path: '/journal?category=Coffee%20processing' },
  { labelVi: 'Tạp chí: Giống & Phân loại hạt', labelEn: 'Journal: Varieties', path: '/journal?category=Coffee%20varieties' },
  { labelVi: 'Tạp chí: Kỹ thuật Pha chế', labelEn: 'Journal: Brewing', path: '/journal?category=Brewing%20techniques' },
  { labelVi: 'Tạp chí: Kiến thức Cà phê', labelEn: 'Journal: Knowledge', path: '/journal?category=Coffee%20knowledge' },
  { labelVi: 'Tạp chí: Vùng Nguyên liệu', labelEn: 'Journal: Origins', path: '/journal?category=Coffee%20origins' },
  { labelVi: 'Ưu đãi', labelEn: 'Promotions', path: '/promotions' },
  { labelVi: 'Về ROAR', labelEn: 'About', path: '/about' },
  { labelVi: 'Hợp tác B2B', labelEn: 'B2B Partner', path: '/partners' },
  { labelVi: 'Tài khoản & Ví ROAR', labelEn: 'Account & Wallet', path: '/account' },
  { labelVi: 'Liên hệ', labelEn: 'Contact', path: '/contact' },
];

interface AdminMenuCategoryManagerProps {
  settings: Record<string, string>;
  onSaved?: (nextSettings: Record<string, string>) => void;
}

export const AdminMenuCategoryManager: React.FC<AdminMenuCategoryManagerProps> = ({
  settings,
  onSaved,
}) => {
  const { t } = useI18n();
  const { apiFetch, showToast, refreshBootstrap } = useStore();

  const [subTab, setSubTab] = useState<'menus' | 'categories'>('menus');
  const [menuLocation, setMenuLocation] = useState<'header' | 'footer_explore' | 'footer_support'>('header');
  const [menus, setMenus] = useState<CmsMenuItem[]>(DEFAULT_CMS_MENUS);
  const [categories, setCategories] = useState<CmsCategoryItem[]>(DEFAULT_CMS_CATEGORIES);
  const [saving, setSaving] = useState(false);

  // New menu item form
  const [newMenuVi, setNewMenuVi] = useState('');
  const [newMenuEn, setNewMenuEn] = useState('');
  const [newMenuPath, setNewMenuPath] = useState('/shop');

  // New category form
  const [newCatVi, setNewCatVi] = useState('');
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatType, setNewCatType] = useState<'product' | 'journal'>('product');
  const [newCatDescVi, setNewCatDescVi] = useState('');

  useEffect(() => {
    try {
      if (settings.cms_menus_json) {
        const parsed = JSON.parse(settings.cms_menus_json);
        if (Array.isArray(parsed) && parsed.length > 0) setMenus(parsed);
      }
    } catch {
      // keep default
    }
    try {
      if (settings.cms_categories_json) {
        const parsed = JSON.parse(settings.cms_categories_json);
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed);
      }
    } catch {
      // keep default
    }
  }, [settings.cms_menus_json, settings.cms_categories_json]);

  const filteredMenus = menus.filter((m) => m.location === menuLocation);

  const moveMenuItem = (id: string, dir: -1 | 1) => {
    const locItems = menus.filter((m) => m.location === menuLocation);
    const otherItems = menus.filter((m) => m.location !== menuLocation);
    const idx = locItems.findIndex((m) => m.id === id);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= locItems.length) return;
    const copy = [...locItems];
    [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
    setMenus([...otherItems, ...copy]);
  };

  const addMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuVi.trim() || !newMenuPath.trim()) return;
    const item: CmsMenuItem = {
      id: `m-${Date.now()}`,
      location: menuLocation,
      labelVi: newMenuVi.trim(),
      labelEn: newMenuEn.trim() || newMenuVi.trim(),
      path: newMenuPath.trim(),
      visible: true,
    };
    setMenus((prev) => [...prev, item]);
    setNewMenuVi('');
    setNewMenuEn('');
    setNewMenuPath('/shop');
  };

  const addCategoryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatVi.trim()) return;
    const slug =
      newCatSlug.trim() ||
      newCatVi
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const item: CmsCategoryItem = {
      id: `cat-${Date.now()}`,
      slug: slug || `cat-${Date.now()}`,
      nameVi: newCatVi.trim(),
      nameEn: newCatEn.trim() || newCatVi.trim(),
      type: newCatType,
      descriptionVi: newCatDescVi.trim(),
      descriptionEn: newCatDescVi.trim(),
      visible: true,
    };
    setCategories((prev) => [...prev, item]);
    setNewCatVi('');
    setNewCatEn('');
    setNewCatSlug('');
    setNewCatDescVi('');
  };

  const moveCategory = (id: string, dir: -1 | 1) => {
    const idx = categories.findIndex((c) => c.id === id);
    const targetIdx = idx + dir;
    if (idx < 0 || targetIdx < 0 || targetIdx >= categories.length) return;
    const copy = [...categories];
    [copy[idx], copy[targetIdx]] = [copy[targetIdx], copy[idx]];
    setCategories(copy);
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const payload = {
        cms_menus_json: JSON.stringify(menus),
        cms_categories_json: JSON.stringify(categories),
      };
      const res = await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        onSaved?.({ ...settings, ...payload });
        await refreshBootstrap();
        showToast(
          t(
            'Đã lưu cấu trúc Menu & Danh mục toàn website!',
            'Saved website Menus & Categories structure!'
          )
        );
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || t('Không thể lưu cài đặt menu.', 'Failed to save menu settings.'));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10">
        <div>
          <h2 className="text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Quản lý Menu & Danh mục (Chuẩn WordPress)', 'Menus & Categories Manager')}
          </h2>
          <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-1">
            {t(
              'Sắp xếp thanh điều hướng Đầu trang, Chân trang và quản lý toàn bộ Danh mục sản phẩm / bài viết trên website.',
              'Configure Header & Footer navigation menus and manage all Product & Journal categories.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMenus(DEFAULT_CMS_MENUS);
              setCategories(DEFAULT_CMS_CATEGORIES);
              showToast(t('Đã khôi phục cấu trúc mặc định (bấm Lưu để áp dụng)', 'Reset to defaults (click Save to apply)'));
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-semibold hover:bg-[#202020]/5 dark:hover:bg-white/5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('Mặc định', 'Reset')}</span>
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={saveAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? t('Đang lưu...', 'Saving...') : t('Lưu thay đổi', 'Save Changes')}</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-[#202020]/10 dark:border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setSubTab('menus')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
            subTab === 'menus'
              ? 'bg-[#00552B] text-white'
              : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5 dark:hover:bg-white/5'
          }`}
        >
          <MenuIcon className="w-4 h-4" />
          <span>{t('Cấu trúc Menu', 'Navigation Menus')}</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('categories')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors ${
            subTab === 'categories'
              ? 'bg-[#00552B] text-white'
              : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:bg-[#202020]/5 dark:hover:bg-white/5'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>{t('Danh mục Website', 'Site Categories')} ({categories.length})</span>
        </button>
      </div>

      {/* TAB 1: MENUS */}
      {subTab === 'menus' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Add menu item panel (WordPress-style) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-3">
              <h3 className="text-sm font-bold">{t('Chọn vị trí Menu', 'Select Menu Location')}</h3>
              <div className="flex flex-col gap-1.5">
                {[
                  { id: 'header', vi: 'Menu Đầu Trang (Header)', en: 'Header Primary Menu' },
                  { id: 'footer_explore', vi: 'Chân trang — Khám phá', en: 'Footer — Explore' },
                  { id: 'footer_support', vi: 'Chân trang — Hỗ trợ', en: 'Footer — Support' },
                ].map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => setMenuLocation(loc.id as any)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      menuLocation === loc.id
                        ? 'bg-[#00552B]/10 dark:bg-[#C6A667]/20 text-[#00552B] dark:text-[#C6A667] border border-[#00552B]/30 dark:border-[#C6A667]/40'
                        : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/75 dark:text-[#F1EFEA]/75'
                    }`}
                  >
                    {t(loc.vi, loc.en)}
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={addMenuItem}
              className="bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-3"
            >
              <h3 className="text-sm font-bold">{t('Thêm mục vào Menu', 'Add Menu Item')}</h3>
              <div>
                <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  {t('Chọn nhanh trang có sẵn', 'Quick-pick existing page')}
                </label>
                <select
                  onChange={(e) => {
                    const p = QUICK_PAGES.find((x) => x.path === e.target.value);
                    if (p) {
                      setNewMenuVi(p.labelVi);
                      setNewMenuEn(p.labelEn);
                      setNewMenuPath(p.path);
                    }
                  }}
                  defaultValue=""
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
                >
                  <option value="">{t('-- Chọn trang --', '-- Select page --')}</option>
                  {QUICK_PAGES.map((p) => (
                    <option key={p.path} value={p.path}>
                      {p.labelVi} ({p.path})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  {t('Tên hiển thị (Tiếng Việt)', 'Label (Vietnamese)')}
                </label>
                <input
                  value={newMenuVi}
                  onChange={(e) => setNewMenuVi(e.target.value)}
                  placeholder="VD: Cà phê Đặc sản"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  {t('Tên hiển thị (English)', 'Label (English)')}
                </label>
                <input
                  value={newMenuEn}
                  onChange={(e) => setNewMenuEn(e.target.value)}
                  placeholder="e.g. Specialty Coffee"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  {t('Đường dẫn (URL / Route)', 'URL / Route')}
                </label>
                <input
                  value={newMenuPath}
                  onChange={(e) => setNewMenuPath(e.target.value)}
                  placeholder="/shop hoặc https://..."
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs font-mono"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Thêm vào Menu', 'Add to Menu')}</span>
              </button>
            </form>
          </div>

          {/* Right: Menu structure list */}
          <div className="lg:col-span-8 bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {t('Danh sách mục trong Menu', 'Menu Structure')} ({filteredMenus.length})
              </h3>
              <span className="text-[11px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
                {t('Dùng nút lên/xuống để sắp xếp thứ tự', 'Use arrows to reorder')}
              </span>
            </div>
            <div className="space-y-2">
              {filteredMenus.map((item, idx) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex flex-wrap items-center gap-3 ${
                    item.visible
                      ? 'border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF] dark:bg-[#0E1512]'
                      : 'border-dashed border-[#202020]/15 dark:border-white/10 opacity-55'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveMenuItem(item.id, -1)}
                      className="p-0.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      title={t('Lên trên', 'Move up')}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === filteredMenus.length - 1}
                      onClick={() => moveMenuItem(item.id, 1)}
                      className="p-0.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                      title={t('Xuống dưới', 'Move down')}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      value={item.labelVi}
                      onChange={(e) =>
                        setMenus((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, labelVi: e.target.value } : m))
                        )
                      }
                      className="px-2.5 py-1.5 rounded border border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C] text-xs font-semibold"
                    />
                    <input
                      value={item.labelEn}
                      onChange={(e) =>
                        setMenus((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, labelEn: e.target.value } : m))
                        )
                      }
                      className="px-2.5 py-1.5 rounded border border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C] text-xs"
                    />
                    <input
                      value={item.path}
                      onChange={(e) =>
                        setMenus((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, path: e.target.value } : m))
                        )
                      }
                      className="px-2.5 py-1.5 rounded border border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C] text-xs font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setMenus((prev) =>
                          prev.map((m) => (m.id === item.id ? { ...m, visible: !m.visible } : m))
                        )
                      }
                      className="p-1.5 rounded-lg hover:bg-[#202020]/10 dark:hover:bg-white/10 cursor-pointer"
                      title={item.visible ? t('Đang hiện (bấm để ẩn)', 'Visible') : t('Đang ẩn (bấm để hiện)', 'Hidden')}
                    >
                      {item.visible ? <Eye className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMenus((prev) => prev.filter((m) => m.id !== item.id))}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                      title={t('Xóa mục', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {subTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Add Category */}
          <form
            onSubmit={addCategoryItem}
            className="lg:col-span-4 bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-3 h-fit"
          >
            <h3 className="text-sm font-bold">{t('Thêm danh mục mới', 'Add New Category')}</h3>
            <div>
              <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {t('Loại danh mục', 'Category Type')}
              </label>
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as 'product' | 'journal')}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
              >
                <option value="product">{t('Danh mục Sản phẩm', 'Product Category')}</option>
                <option value="journal">{t('Danh mục Nhật ký / Blog', 'Journal Category')}</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {t('Tên danh mục (Tiếng Việt)', 'Name (Vietnamese)')}
              </label>
              <input
                value={newCatVi}
                onChange={(e) => setNewCatVi(e.target.value)}
                placeholder="VD: Cà phê Cold Brew"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {t('Tên danh mục (English)', 'Name (English)')}
              </label>
              <input
                value={newCatEn}
                onChange={(e) => setNewCatEn(e.target.value)}
                placeholder="e.g. Cold Brew Series"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {t('Đường dẫn tĩnh (Slug)', 'Slug')}
              </label>
              <input
                value={newCatSlug}
                onChange={(e) => setNewCatSlug(e.target.value)}
                placeholder="cold-brew (tự tạo nếu để trống)"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-[#202020]/65 dark:text-[#F1EFEA]/65">
                {t('Mô tả ngắn', 'Description')}
              </label>
              <textarea
                rows={2}
                value={newCatDescVi}
                onChange={(e) => setNewCatDescVi(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-[#F8F5EF] dark:bg-[#0E1512] text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white text-xs font-semibold hover:bg-[#004422] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Thêm danh mục', 'Add Category')}</span>
            </button>
          </form>

          {/* Right: Categories table */}
          <div className="lg:col-span-8 bg-white dark:bg-[#16221C] p-5 rounded-xl border border-[#202020]/10 dark:border-white/10 space-y-3">
            <h3 className="text-sm font-bold">
              {t('Tất cả danh mục', 'All Categories')} ({categories.length})
            </h3>
            <div className="space-y-2">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className={`p-3.5 rounded-lg border flex flex-wrap items-center gap-3 ${
                    cat.visible
                      ? 'border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF] dark:bg-[#0E1512]'
                      : 'border-dashed border-[#202020]/15 dark:border-white/10 opacity-55'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveCategory(cat.id, -1)}
                      className="p-0.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === categories.length - 1}
                      onClick={() => moveCategory(cat.id, 1)}
                      className="p-0.5 rounded hover:bg-[#202020]/10 disabled:opacity-25 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{cat.nameVi}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#00552B]/10 dark:bg-[#C6A667]/15 text-[#00552B] dark:text-[#C6A667]">
                        {cat.type === 'product' ? t('Sản phẩm', 'Product') : t('Nhật ký', 'Journal')}
                      </span>
                      <span className="font-mono text-[10px] text-[#202020]/50 dark:text-[#F1EFEA]/50">
                        /{cat.slug}
                      </span>
                    </div>
                    {cat.descriptionVi && (
                      <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-0.5">
                        {cat.descriptionVi}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCategories((prev) =>
                          prev.map((c) => (c.id === cat.id ? { ...c, visible: !c.visible } : c))
                        )
                      }
                      className="p-1.5 rounded-lg hover:bg-[#202020]/10 dark:hover:bg-white/10 cursor-pointer"
                    >
                      {cat.visible ? <Eye className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCategories((prev) => prev.filter((c) => c.id !== cat.id))}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
