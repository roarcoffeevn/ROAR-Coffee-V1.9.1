import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, Monitor, Moon, Search, ShoppingBag, Sun, User, X, Phone, Mail } from 'lucide-react';
import { AdaptiveLogo } from './AdaptiveLogo';
import { PWAInstallButton } from './PWAInstallPrompt';
import { stripLocalePrefix, useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export const Header: React.FC = () => {
  const { lang, setLang, t, localePath } = useI18n();
  const { cartCount, setCartOpen, user, theme, themeMode, setThemeMode, toggleTheme, settings } = useStore();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const cleanPath = stripLocalePrefix(pathname);

  const [openMega, setOpenMega] = useState<'coffee' | 'discover' | 'partners' | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerExpanded, setDrawerExpanded] = useState<string | null>('coffee');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchOpen(false);
    setDrawerOpen(false);
    navigate(`${localePath('/shop')}?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const closeAll = () => {
    setOpenMega(null);
    setDrawerOpen(false);
  };

  return (
    <>
      <header
        onMouseLeave={() => setOpenMega(null)}
        className="sticky top-0 z-40 bg-[#F8F5EF]/95 dark:bg-[#0E1512]/95 backdrop-blur-md border-b border-[#202020]/10 dark:border-white/10 pt-safe transition-colors"
      >
        {/* Desktop Header */}
        <div className="hidden lg:flex max-w-[1280px] mx-auto px-6 h-[82px] items-center justify-between gap-8">
          <Link to={localePath('/')} onClick={closeAll} className="shrink-0 flex items-center">
            <AdaptiveLogo variant="horizontal" surface={theme === 'dark' ? 'dark' : 'light'} size="sm" />
          </Link>

          <nav aria-label="Primary navigation" className="flex items-center gap-7 text-sm font-medium text-[#202020] dark:text-[#F1EFEA]">
            <Link
              to={localePath('/')}
              onMouseEnter={() => setOpenMega(null)}
              className="whitespace-nowrap shrink-0 hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors py-2"
            >
              {t('Trang chủ', 'Home')}
            </Link>

            <div className="relative" onMouseEnter={() => setOpenMega('coffee')}>
              <Link
                to={localePath('/shop')}
                onClick={closeAll}
                className="flex items-center gap-1 whitespace-nowrap shrink-0 hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors py-2"
                aria-expanded={openMega === 'coffee'}
              >
                <span>{t('Cà phê', 'Coffee')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Link>
            </div>

            <div className="relative" onMouseEnter={() => setOpenMega('discover')}>
              <button
                type="button"
                onClick={() => setOpenMega(openMega === 'discover' ? null : 'discover')}
                className="flex items-center gap-1 whitespace-nowrap shrink-0 hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors py-2 cursor-pointer"
                aria-expanded={openMega === 'discover'}
              >
                <span>{t('Khám phá', 'Discover')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            <div className="relative" onMouseEnter={() => setOpenMega('partners')}>
              <button
                type="button"
                onClick={() => setOpenMega(openMega === 'partners' ? null : 'partners')}
                className="flex items-center gap-1 whitespace-nowrap shrink-0 hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors py-2 cursor-pointer"
                aria-expanded={openMega === 'partners'}
              >
                <span>{t('Hợp tác', 'Partners')}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            <Link
              to={localePath('/contact')}
              onMouseEnter={() => setOpenMega(null)}
              className="whitespace-nowrap shrink-0 hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors py-2"
            >
              {t('Liên hệ', 'Contact')}
            </Link>
          </nav>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setSearchOpen((s) => !s)}
              aria-label={t('Tìm kiếm sản phẩm', 'Search products')}
              className="p-2 text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                themeMode === 'system'
                  ? t('Giao diện theo hệ thống — bấm để chuyển Sáng', 'System Theme — click for Light Mode')
                  : themeMode === 'light'
                    ? t('Chế độ Sáng — bấm để chuyển Tối', 'Light Mode — click for Dark Mode')
                    : t('Chế độ Tối — bấm để theo hệ thống', 'Dark Mode — click for System Theme')
              }
              title={
                themeMode === 'system'
                  ? t('Theo thiết bị (Tự động Sáng/Tối)', 'System Auto (Matches device)')
                  : themeMode === 'light'
                    ? t('Chế độ Sáng', 'Light Mode')
                    : t('Chế độ Tối', 'Dark Mode')
              }
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#202020]/15 dark:border-white/15 text-[#202020] dark:text-[#C6A667] hover:bg-[#202020]/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs font-medium whitespace-nowrap"
            >
              {themeMode === 'system' ? (
                <Monitor className="w-3.5 h-3.5" />
              ) : themeMode === 'dark' ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5" />
              )}
              <span>
                {themeMode === 'system'
                  ? t('Hệ thống', 'Auto')
                  : themeMode === 'dark'
                    ? t('Tối', 'Dark')
                    : t('Sáng', 'Light')}
              </span>
            </button>

            <div className="flex items-center border border-[#202020]/15 dark:border-white/15 rounded-md overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => setLang('vi')}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  lang === 'vi'
                    ? 'bg-[#00552B] text-white'
                    : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#202020] dark:hover:text-white'
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 transition-colors cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#00552B] text-white'
                    : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#202020] dark:hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {user && (
              <Link
                to={`${localePath('/account')}?tab=notifications`}
                aria-label={t('Thông báo thành viên', 'Member notifications')}
                className="relative p-2 text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors"
              >
                <Bell className="w-4 h-4" />
                {(user.unreadNotifications ?? 0) > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-[#C6A667] text-[#111111] text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {user.unreadNotifications}
                  </span>
                )}
              </Link>
            )}

            <Link
              to={localePath('/account')}
              aria-label={t('Tài khoản thành viên', 'Member account')}
              className="p-2 text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors flex items-center gap-1.5"
            >
              <User className="w-4 h-4" />
              {user && <span className="text-xs font-medium max-w-[90px] truncate">{user.fullName.split(' ').slice(-1)[0]}</span>}
            </Link>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={t('Mở giỏ hàng', 'Open shopping cart')}
              className="relative p-2 text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00552B] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Compact Header (320px–430px & tablet) with centered vertical logo */}
        <div className="lg:hidden relative flex items-center justify-between h-[72px] px-2.5 sm:px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('Mở menu điều hướng', 'Open navigation menu')}
            className="w-10 h-10 flex items-center justify-center text-[#202020] dark:text-[#F1EFEA] cursor-pointer shrink-0 z-10"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link
            to={localePath('/')}
            onClick={closeAll}
            className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center py-1"
          >
            <AdaptiveLogo variant="vertical" surface={theme === 'dark' ? 'dark' : 'light'} darkTone="gold" size="xs" />
          </Link>

          <div className="flex items-center gap-1 shrink-0 z-10">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                themeMode === 'system'
                  ? t('Giao diện theo thiết bị', 'System Theme')
                  : themeMode === 'dark'
                    ? t('Chế độ Tối', 'Dark Mode')
                    : t('Chế độ Sáng', 'Light Mode')
              }
              title={
                themeMode === 'system'
                  ? t('Theo thiết bị (Tự động)', 'System Auto')
                  : themeMode === 'dark'
                    ? t('Chế độ Tối', 'Dark Mode')
                    : t('Chế độ Sáng', 'Light Mode')
              }
              className="w-8 h-8 flex items-center justify-center rounded border border-[#202020]/15 dark:border-white/15 text-[#202020] dark:text-[#C6A667] cursor-pointer"
            >
              {themeMode === 'system' ? (
                <Monitor className="w-3.5 h-3.5" />
              ) : themeMode === 'dark' ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
              className="px-2 py-1 text-[11px] font-semibold border border-[#202020]/15 dark:border-white/15 rounded text-[#00552B] dark:text-[#C6A667] cursor-pointer"
            >
              {lang === 'vi' ? 'EN' : 'VI'}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={t('Giỏ hàng', 'Cart')}
              className="relative w-9 h-9 flex items-center justify-center text-[#202020] dark:text-[#F1EFEA] cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#00552B] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Always-Visible Product Category Quick-Access Bar */}
        <div className="bg-[#003D25] text-[#F8F5EF] border-t border-white/10">
          <nav
            aria-label={t('Danh mục sản phẩm nhanh', 'Quick product categories')}
            className="max-w-[1280px] mx-auto px-4 sm:px-6 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1.5 text-xs"
          >
            {[
              { path: '/coffee/roasted', vi: 'Cà phê Rang Xay', en: 'Roasted Coffee' },
              { path: '/coffee/roasted-beans', vi: 'Cà phê Hạt Rang (kg)', en: 'Roasted Beans (kg)' },
              { path: '/coffee/green-coffee', vi: 'Cà phê Nhân Xanh', en: 'Green Coffee' },
              { path: '/coffee/instant', vi: 'Cà phê Hòa Tan', en: 'Instant Coffee' },
              { path: '/coffee/pepper', vi: 'Tiêu Tây Nguyên', en: 'Highland Pepper' },
              { path: '/coffee/gift-vouchers', vi: 'Gift Voucher', en: 'Gift Voucher' },
              { path: '/shop', vi: 'Tất cả sản phẩm', en: 'All Products' },
            ].map((cat) => {
              const active =
                cleanPath === cat.path ||
                (cat.path === '/coffee/green-coffee' && cleanPath === '/shop' && search.includes('category=green_bean')) ||
                (cat.path === '/shop' && cleanPath === '/shop' && !search.includes('category='));
              return (
                <Link
                  key={cat.path}
                  to={localePath(cat.path)}
                  onClick={closeAll}
                  className={`px-3 py-1 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[#C6A667] text-[#111111] font-bold'
                      : 'text-[#F8F5EF]/85 hover:text-white hover:bg-white/10 font-medium'
                  }`}
                >
                  {t(cat.vi, cat.en)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop Search Bar Dropdown */}
        {searchOpen && (
          <div className="hidden lg:block border-t border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C]">
            <form onSubmit={handleSearchSubmit} className="max-w-[1280px] mx-auto px-6 py-3 flex items-center gap-3">
              <Search className="w-4 h-4 text-[#202020]/50 dark:text-[#F1EFEA]/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(
                  'Tìm theo tên cà phê, SKU (vd: RO-S18), Barcode EAN-13, CBU, hoặc vùng nguyên liệu...',
                  'Search coffee name, SKU (e.g. RO-S18), Barcode, CBU, or origin...'
                )}
                className="flex-1 text-sm bg-transparent focus:outline-none text-[#202020] dark:text-[#F1EFEA]"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-medium bg-[#00552B] text-white rounded hover:bg-[#003D25] transition-colors cursor-pointer"
              >
                {t('Tìm kiếm', 'Search')}
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="p-1.5 text-[#202020]/60 dark:text-[#F1EFEA]/60 hover:text-[#202020] dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Desktop Mega Menus */}
        {openMega === 'coffee' && (
          <div className="hidden lg:block border-t border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C] shadow-lg">
            <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-4 gap-8">
              <div>
                <Link
                  to={localePath('/coffee/roasted')}
                  onClick={closeAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3 hover:underline"
                >
                  {t('Cà Phê Rang Xay →', 'Roasted Coffee →')}
                </Link>
                <ul className="space-y-2 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <li>
                    <Link to={localePath('/product/robusta-house-blend')} onClick={closeAll} className="hover:text-[#00552B]">
                      Robusta House Blend
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/product/arabica-selection')} onClick={closeAll} className="hover:text-[#00552B]">
                      Arabica Selection
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/product/roar-espresso')} onClick={closeAll} className="hover:text-[#00552B]">
                      {t('ROAR Espresso (Cá tính Cáo)', 'ROAR Espresso (Fox)')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/product/roar-espresso-gold')} onClick={closeAll} className="hover:text-[#00552B]">
                      {t('ROAR Espresso Gold (Đại Bàng)', 'ROAR Espresso Gold (Eagle)')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/signature-reserve')} onClick={closeAll} className="hover:text-[#00552B] font-medium">
                      Signature Reserve
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/coffee/roasted')} onClick={closeAll} className="hover:text-[#00552B]">
                      {t('Tất cả dòng rang xay', 'All Roasted Collections')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/coffee/roasted-beans')} onClick={closeAll} className="hover:text-[#00552B] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {t('Cà Phê Hạt Rang (Bảng giá kg / Sỉ)', 'Roasted Coffee Beans (Kg Tiers)')}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <Link
                  to={localePath('/coffee/green-coffee')}
                  onClick={closeAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3 hover:underline"
                >
                  {t('Cà Phê Nhân Xanh →', 'Green Coffee Beans →')}
                </Link>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <Link to={`${localePath('/coffee/green-coffee')}?type=Robusta`} onClick={closeAll} className="hover:text-[#00552B]">
                    Robusta
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?screen=S14`} onClick={closeAll} className="hover:text-[#00552B]">
                    {t('Cỡ sàng S14', 'Screen S14')}
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?type=Arabica`} onClick={closeAll} className="hover:text-[#00552B]">
                    Arabica
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?screen=S16`} onClick={closeAll} className="hover:text-[#00552B]">
                    {t('Cỡ sàng S16', 'Screen S16')}
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?type=Culi`} onClick={closeAll} className="hover:text-[#00552B]">
                    {t('Culi (Hạt tròn)', 'Culi / Peaberry')}
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?screen=S18`} onClick={closeAll} className="hover:text-[#00552B]">
                    {t('Cỡ sàng S18', 'Screen S18')}
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?proc=NAT`} onClick={closeAll} className="hover:text-[#00552B]">
                    {t('Sơ chế Khô (Natural)', 'Natural')}
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?proc=HON`} onClick={closeAll} className="hover:text-[#00552B]">
                    {t('Sơ chế Mật ong (Honey)', 'Honey')}
                  </Link>
                  <Link to={`${localePath('/coffee/green-coffee')}?proc=CBU`} onClick={closeAll} className="hover:text-[#00552B] col-span-2">
                    {t('Chế biến ướt (Washed / CBU)', 'Washed / CBU')}
                  </Link>
                  <Link
                    to={localePath('/coffee/green-beans')}
                    onClick={closeAll}
                    className="col-span-2 pt-2 mt-1 border-t border-[#202020]/10 dark:border-white/10 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
                  >
                    {t('Mở Ma trận Nhân xanh (27 SKU) →', 'Open 27-SKU Green Matrix →')}
                  </Link>
                </div>
              </div>

              <div>
                <Link
                  to={localePath('/coffee/instant')}
                  onClick={closeAll}
                  className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3 hover:underline"
                >
                  {t('Cà Phê Hòa Tan →', 'Instant Coffee →')}
                </Link>
                <ul className="space-y-2 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <li>
                    <Link to={localePath('/product/instant-silver-collection')} onClick={closeAll} className="hover:text-[#00552B]">
                      {t('Bộ sưu tập Hòa tan Silver', 'Silver Collection')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/product/instant-gold-collection')} onClick={closeAll} className="hover:text-[#00552B]">
                      {t('Bộ sưu tập Hòa tan Gold', 'Gold Collection')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/coffee/instant')} onClick={closeAll} className="hover:text-[#00552B]">
                      {t('Xem bộ sưu tập hòa tan', 'View Instant Coffee')}
                    </Link>
                  </li>
                  <li className="pt-2 border-t border-[#202020]/10 dark:border-white/10">
                    <Link to={localePath('/coffee/pepper')} onClick={closeAll} className="hover:text-[#00552B] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {t('Tiêu Đen & Tiêu Sọ Tây Nguyên', 'Highland Black & White Pepper')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/coffee/gift-vouchers')} onClick={closeAll} className="hover:text-[#00552B] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {t('Thẻ Quà Tặng Gift Voucher (50k–1tr)', 'ROAR Gift Vouchers (50k–1M)')}
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="bg-[#F8F5EF] dark:bg-[#0E1512] p-5 rounded-lg flex flex-col justify-between">
                <div>
                  <p className="text-xs text-[#00552B] dark:text-[#C6A667] font-semibold uppercase tracking-wider mb-1">
                    {t('Danh mục toàn diện', 'Full Catalog')}
                  </p>
                  <p className="text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
                    {t(
                      'Khám phá toàn bộ sản phẩm bán lẻ, nhân xanh 27 cấu hình B2B và ưu đãi thành viên.',
                      'Explore retail roasts, the 27-variant B2B green coffee matrix, and member offers.'
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <Link
                    to={localePath('/shop')}
                    onClick={closeAll}
                    className="inline-flex justify-center px-4 py-2 bg-[#00552B] text-white text-xs font-medium rounded hover:bg-[#003D25] transition-colors"
                  >
                    {t('Tất cả sản phẩm', 'All Products')}
                  </Link>
                  <Link
                    to={localePath('/promotions')}
                    onClick={closeAll}
                    className="inline-flex justify-center px-4 py-2 border border-[#00552B]/30 dark:border-[#C6A667]/40 text-[#00552B] dark:text-[#C6A667] text-xs font-medium rounded hover:bg-[#00552B]/5 transition-colors"
                  >
                    {t('Ưu đãi & Voucher', 'Promotions & Vouchers')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {openMega === 'discover' && (
          <div className="hidden lg:block border-t border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C] shadow-lg">
            <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3">
                  {t('Bản sắc & Câu chuyện', 'Brand & Identity')}
                </p>
                <ul className="space-y-2.5 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <li>
                    <Link to={localePath('/about')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Về ROAR COFFEE', 'About ROAR COFFEE')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/personalities')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('7 Cá Tính Thương Hiệu', 'Seven Personalities')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/signature-reserve')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      Signature Reserve
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3">
                  {t('Nguồn gốc & Chế tác', 'Origins & Craft')}
                </p>
                <ul className="space-y-2.5 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <li>
                    <Link to={localePath('/origins')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Bản đồ Vùng Nguyên Liệu', 'Coffee Origins Map')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/farm-to-cup')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Hành trình Từ Nông Trại Đến Tách Cà Phê', 'From Farm to Cup')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/brewing')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Hướng Dẫn Pha Chế', 'Brewing Guide')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/brewing-handbook')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {t('Cẩm Nang Pha Chế (15 chuyên đề)', 'Brewing Handbook (15 Guides)')}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3">
                  {t('Tri thức & Cộng đồng', 'Journal & Community')}
                </p>
                <ul className="space-y-2 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <li>
                    <Link to={localePath('/journal')} onClick={closeAll} className="font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
                      {t('Tất cả Tạp chí Cà Phê →', 'All Coffee Journal →')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee processing')}`} onClick={closeAll} className="text-[13px] hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('· Sơ chế & Chế biến', '· Coffee Processing')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee varieties')}`} onClick={closeAll} className="text-[13px] hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('· Giống & Phân loại hạt', '· Coffee Varieties')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Brewing techniques')}`} onClick={closeAll} className="text-[13px] hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('· Kỹ thuật Pha chế', '· Brewing Techniques')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee knowledge')}`} onClick={closeAll} className="text-[13px] hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('· Kiến thức Cà phê', '· Coffee Knowledge')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee origins')}`} onClick={closeAll} className="text-[13px] hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('· Vùng Nguyên liệu', '· Coffee Origins')}
                    </Link>
                  </li>
                  <li className="pt-1.5 border-t border-[#202020]/10 dark:border-white/10">
                    <Link to={localePath('/farm-membership')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Trang trại ROAR & Thành viên (Định hướng)', 'ROAR Coffee Farm & Membership')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/play')} onClick={closeAll} className="font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
                      {t('ROAR Play & Win — Săn Quà Cà Phê', 'ROAR Play & Win — Interactive Gifts')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {openMega === 'partners' && (
          <div className="hidden lg:block border-t border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C] shadow-lg">
            <div className="max-w-[1280px] mx-auto px-6 py-8 grid grid-cols-3 gap-8">
              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3">
                  {t('Thương mại Nội địa', 'Domestic Commercial')}
                </p>
                <ul className="space-y-2.5 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <li>
                    <Link to={`${localePath('/partners')}?tab=distributors`} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Nhà phân phối', 'Distributors')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/partners')}?tab=wholesale`} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Bán sỉ cà phê rang & nhân xanh', 'Wholesale')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/partners')}?tab=horeca`} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Quán cà phê · Nhà hàng · Khách sạn (HORECA)', 'HORECA')}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3">
                  {t('Sản xuất & Quốc tế', 'Manufacturing & Global')}
                </p>
                <ul className="space-y-2.5 text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85">
                  <li>
                    <Link to={localePath('/oem-export')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Gia công OEM & Nhãn riêng', 'OEM / Private Label')}
                    </Link>
                  </li>
                  <li>
                    <Link to={`${localePath('/oem-export')}#export`} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Xuất khẩu cà phê Việt Nam', 'Export')}
                    </Link>
                  </li>
                  <li>
                    <Link to={localePath('/coffee/green-beans')} onClick={closeAll} className="hover:text-[#00552B] dark:hover:text-[#C6A667]">
                      {t('Báo giá Nhân xanh S14/S16/S18', 'Green Coffee Quotations')}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider uppercase text-[#00552B] dark:text-[#C6A667] mb-3">
                  {t('Quà tặng Doanh nghiệp', 'Corporate Gifting')}
                </p>
                <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 mb-3">
                  {t(
                    'Hộp quà Signature Reserve & bộ sưu tập cá tính thiết kế riêng cho đối tác.',
                    'Signature Reserve presentation boxes tailored for executive and corporate gifting.'
                  )}
                </p>
                <Link
                  to={`${localePath('/signature-reserve')}#gifting`}
                  onClick={closeAll}
                  className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
                >
                  {t('Tìm hiểu Quà tặng Doanh nghiệp →', 'Explore Corporate Gifting →')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Slide-in Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/55" onClick={() => setDrawerOpen(false)} />
          <div className="relative w-[86%] max-w-[340px] bg-[#F8F5EF] dark:bg-[#0E1512] h-full flex flex-col shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between px-4 h-[68px] border-b border-[#202020]/10 dark:border-white/10">
              <AdaptiveLogo variant="horizontal" surface={theme === 'dark' ? 'dark' : 'light'} darkTone="gold" size="xs" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close drawer"
                className="w-10 h-10 flex items-center justify-center text-[#202020] dark:text-[#F1EFEA] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="p-4 border-b border-[#202020]/10 dark:border-white/10 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('Tìm sản phẩm, SKU...', 'Search coffee, SKU...')}
                className="flex-1 bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 rounded px-3 py-2 text-sm text-[#202020] dark:text-[#F1EFEA] focus:outline-none focus:border-[#00552B]"
              />
              <button type="submit" className="px-3 py-2 bg-[#00552B] text-white rounded text-xs font-medium cursor-pointer">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <nav className="flex-1 px-4 py-3 space-y-1 text-sm font-medium text-[#202020] dark:text-[#F1EFEA]">
              <Link to={localePath('/')} onClick={closeAll} className="block py-3 border-b border-[#202020]/8 dark:border-white/10">
                {t('Trang chủ', 'Home')}
              </Link>

              <div className="border-b border-[#202020]/8 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setDrawerExpanded(drawerExpanded === 'coffee' ? null : 'coffee')}
                  className="w-full py-3 flex items-center justify-between cursor-pointer"
                >
                  <span>{t('Cà phê', 'Coffee')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${drawerExpanded === 'coffee' ? 'rotate-180' : ''}`} />
                </button>
                {drawerExpanded === 'coffee' && (
                  <div className="pb-3 pl-3 space-y-2 text-[13px] font-normal text-[#202020]/80 dark:text-[#F1EFEA]/80">
                    <Link to={localePath('/coffee/roasted')} onClick={closeAll} className="block py-1">
                      {t('Cà phê rang xay', 'Roasted Coffee')}
                    </Link>
                    <Link to={localePath('/coffee/roasted-beans')} onClick={closeAll} className="block py-1 font-medium text-[#00552B] dark:text-[#C6A667]">
                      {t('Cà phê Hạt rang (Sỉ/Lẻ theo kg)', 'Roasted Coffee Beans (Kg)')}
                    </Link>
                    <Link to={localePath('/coffee/green-coffee')} onClick={closeAll} className="block py-1">
                      {t('Cà phê nhân xanh (Theo kg)', 'Green Coffee Beans (Per kg)')}
                    </Link>
                    <Link to={localePath('/coffee/green-beans')} onClick={closeAll} className="block py-1 text-[#00552B] dark:text-[#C6A667]">
                      {t('Ma trận Nhân xanh B2B (27 SKU)', 'B2B Green Matrix (27 SKUs)')}
                    </Link>
                    <Link to={localePath('/coffee/instant')} onClick={closeAll} className="block py-1">
                      {t('Cà phê hòa tan Silver & Gold', 'Instant Coffee Silver & Gold')}
                    </Link>
                    <Link to={localePath('/coffee/pepper')} onClick={closeAll} className="block py-1">
                      {t('Tiêu Đen & Tiêu Sọ Tây Nguyên', 'Highland Black & White Pepper')}
                    </Link>
                    <Link to={localePath('/coffee/gift-vouchers')} onClick={closeAll} className="block py-1">
                      {t('Thẻ quà tặng Gift Voucher', 'Gift Vouchers (50k–1M)')}
                    </Link>
                    <Link to={localePath('/signature-reserve')} onClick={closeAll} className="block py-1 font-medium text-[#00552B]">
                      Signature Reserve
                    </Link>
                    <Link to={localePath('/shop')} onClick={closeAll} className="block py-1">
                      {t('Tất cả sản phẩm', 'All Products')}
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-b border-[#202020]/8 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setDrawerExpanded(drawerExpanded === 'discover' ? null : 'discover')}
                  className="w-full py-3 flex items-center justify-between cursor-pointer"
                >
                  <span>{t('Khám phá', 'Discover')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${drawerExpanded === 'discover' ? 'rotate-180' : ''}`} />
                </button>
                {drawerExpanded === 'discover' && (
                  <div className="pb-3 pl-3 space-y-2 text-[13px] font-normal text-[#202020]/80 dark:text-[#F1EFEA]/80">
                    <Link to={localePath('/about')} onClick={closeAll} className="block py-1">
                      {t('Về ROAR COFFEE', 'About ROAR COFFEE')}
                    </Link>
                    <Link to={localePath('/personalities')} onClick={closeAll} className="block py-1">
                      {t('7 Cá Tính Thương Hiệu', 'Seven Personalities')}
                    </Link>
                    <Link to={localePath('/origins')} onClick={closeAll} className="block py-1">
                      {t('Bản đồ Vùng Nguyên Liệu', 'Coffee Origins Map')}
                    </Link>
                    <Link to={localePath('/farm-to-cup')} onClick={closeAll} className="block py-1">
                      {t('Từ Nông Trại Đến Tách Cà Phê', 'From Farm to Cup')}
                    </Link>
                    <Link to={localePath('/brewing')} onClick={closeAll} className="block py-1">
                      {t('Hướng dẫn pha chế', 'Brewing Guide')}
                    </Link>
                    <Link to={localePath('/brewing-handbook')} onClick={closeAll} className="block py-1 font-medium text-[#00552B] dark:text-[#C6A667]">
                      {t('Cẩm nang pha chế (15 chuyên đề)', 'Brewing Handbook (15 Guides)')}
                    </Link>
                    <Link to={localePath('/journal')} onClick={closeAll} className="block py-1 font-medium">
                      {t('Tạp chí cà phê', 'Coffee Journal')}
                    </Link>
                    <div className="pl-3 space-y-1.5 text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 border-l border-[#00552B]/25 dark:border-[#C6A667]/25">
                      <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee processing')}`} onClick={closeAll} className="block py-0.5">
                        {t('Sơ chế & Chế biến', 'Coffee Processing')}
                      </Link>
                      <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee varieties')}`} onClick={closeAll} className="block py-0.5">
                        {t('Giống & Phân loại hạt', 'Coffee Varieties')}
                      </Link>
                      <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Brewing techniques')}`} onClick={closeAll} className="block py-0.5">
                        {t('Kỹ thuật Pha chế', 'Brewing Techniques')}
                      </Link>
                      <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee knowledge')}`} onClick={closeAll} className="block py-0.5">
                        {t('Kiến thức Cà phê', 'Coffee Knowledge')}
                      </Link>
                      <Link to={`${localePath('/journal')}?category=${encodeURIComponent('Coffee origins')}`} onClick={closeAll} className="block py-0.5">
                        {t('Vùng Nguyên liệu', 'Coffee Origins')}
                      </Link>
                    </div>
                    <Link to={localePath('/farm-membership')} onClick={closeAll} className="block py-1">
                      {t('Trang trại ROAR & Thành viên', 'ROAR Farm & Membership')}
                    </Link>
                    <Link to={localePath('/play')} onClick={closeAll} className="block py-1 font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {t('ROAR Play & Win — Săn Quà', 'ROAR Play & Win — Gifts')}
                    </Link>
                  </div>
                )}
              </div>

              <div className="border-b border-[#202020]/8 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setDrawerExpanded(drawerExpanded === 'partners' ? null : 'partners')}
                  className="w-full py-3 flex items-center justify-between cursor-pointer"
                >
                  <span>{t('Hợp tác', 'Partners')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${drawerExpanded === 'partners' ? 'rotate-180' : ''}`} />
                </button>
                {drawerExpanded === 'partners' && (
                  <div className="pb-3 pl-3 space-y-2 text-[13px] font-normal text-[#202020]/80 dark:text-[#F1EFEA]/80">
                    <Link to={localePath('/partners')} onClick={closeAll} className="block py-1">
                      {t('Phân phối, Bán sỉ & Quán (HORECA)', 'Distributors, Wholesale & HORECA')}
                    </Link>
                    <Link to={localePath('/oem-export')} onClick={closeAll} className="block py-1">
                      {t('Gia công OEM, Nhãn riêng & Xuất khẩu', 'OEM / Private Label / Export')}
                    </Link>
                  </div>
                )}
              </div>

              <Link to={localePath('/contact')} onClick={closeAll} className="block py-3 border-b border-[#202020]/8 dark:border-white/10">
                {t('Liên hệ', 'Contact')}
              </Link>
            </nav>

            <div className="p-4 border-t border-[#202020]/10 dark:border-white/10 space-y-3 bg-white dark:bg-[#16221C]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 shrink-0">{t('Giao diện', 'Theme')}</span>
                <div className="flex gap-1">
                  {([
                    { mode: 'system' as const, vi: 'Hệ thống', en: 'Auto', Icon: Monitor },
                    { mode: 'light' as const, vi: 'Sáng', en: 'Light', Icon: Sun },
                    { mode: 'dark' as const, vi: 'Tối', en: 'Dark', Icon: Moon },
                  ]).map(({ mode, vi, en, Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setThemeMode(mode)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded font-medium cursor-pointer transition-colors ${
                        themeMode === mode
                          ? 'bg-[#00552B] text-white dark:bg-[#C6A667] dark:text-[#111111]'
                          : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] border border-[#202020]/10 dark:border-white/10'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{t(vi, en)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70">{t('Ngôn ngữ', 'Language')}</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setLang('vi')}
                    className={`px-3 py-1 text-xs rounded font-medium cursor-pointer ${
                      lang === 'vi' ? 'bg-[#00552B] text-white' : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]'
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`px-3 py-1 text-xs rounded font-medium cursor-pointer ${
                      lang === 'en' ? 'bg-[#00552B] text-white' : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <Link
                to={localePath('/account')}
                onClick={closeAll}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#00552B] text-white rounded text-sm font-medium"
              >
                <User className="w-4 h-4" />
                <span>{user ? user.fullName : t('Đăng nhập / Thành viên', 'Member Sign In')}</span>
              </Link>

              <PWAInstallButton variant="drawer" />

              <div className="flex items-center justify-between text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 pt-1">
                <a
                  href={`mailto:${settings.contact_email || 'hello@roarcoffee.vn'}`}
                  className="flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" /> {settings.contact_email || 'hello@roarcoffee.vn'}
                </a>
                <Link to={localePath('/contact')} onClick={closeAll} className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {t('Hỗ trợ', 'Support')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
