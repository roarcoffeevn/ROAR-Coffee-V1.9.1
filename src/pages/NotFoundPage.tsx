import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Compass, Coffee, Home, Search } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

export const NotFoundPage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title =
      lang === 'vi'
        ? '404 — Không tìm thấy trang | ROAR COFFEE®'
        : '404 — Page Not Found | ROAR COFFEE®';
  }, [lang]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (clean) {
      navigate(localePath(`/shop?q=${encodeURIComponent(clean)}`));
    } else {
      navigate(localePath('/shop'));
    }
  };

  const quickRoutes = [
    { to: '/shop', vi: 'Tất cả Sản phẩm Cà phê', en: 'All Coffee Products' },
    { to: '/coffee/roasted-beans', vi: 'Cà phê Hạt rang (5 mức kg)', en: 'Roasted Beans (5-Tier kg)' },
    { to: '/coffee/green-beans', vi: 'Ma trận 27 SKUs Nhân xanh B2B', en: '27-SKU Green Coffee Matrix' },
    { to: '/brewing-handbook', vi: 'Cẩm nang Pha chế (15 bài)', en: '15-Chapter Brewing Handbook' },
    { to: '/origins', vi: 'Bản đồ Vùng nguyên liệu', en: 'Highland Origins Map' },
    { to: '/orders/track', vi: 'Tra cứu Đơn hàng', en: 'Track Your Order' },
  ];

  return (
    <div className="max-w-[920px] mx-auto px-6 py-16 sm:py-24">
      <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-8 sm:p-12 space-y-8 shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-[#00552B] dark:text-[#C6A667]">
            <Compass className="w-4 h-4" />
            <span>HTTP 404 · ROAR COFFEE®</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] text-balance">
            {t('Trang bạn tìm không tồn tại hoặc đã được di chuyển.', 'We could not find that page.')}
          </h1>
          <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70 max-w-xl leading-relaxed">
            {t(
              'Có thể liên kết cũ đã thay đổi. Hãy tìm nhanh sản phẩm theo tên hoặc mã SKU, hoặc quay lại các phân khu chính của ROAR COFFEE bên dưới.',
              'The link may be outdated or mistyped. Search for any blend or SKU below, or jump directly to our core collections.'
            )}
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#202020]/45 dark:text-[#F1EFEA]/45 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Tìm kiếm cà phê, mã SKU (vd: RO-S18-HON, Espresso)...', 'Search coffee, SKU (e.g. RO-S18-HON, Espresso)...')}
              className="w-full bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#202020] dark:text-[#F1EFEA] focus:outline-none focus:border-[#00552B] dark:focus:border-[#C6A667]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#00552B] hover:bg-[#003D25] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
          >
            {t('Tìm trong Cửa hàng', 'Search Catalog')}
          </button>
        </form>

        <div className="space-y-3 pt-2 border-t border-[#202020]/10 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#202020]/60 dark:text-[#F1EFEA]/60">
            {t('Lối tắt nhanh', 'Suggested Destinations')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickRoutes.map((item) => (
              <Link
                key={item.to}
                to={localePath(item.to)}
                className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl bg-[#F8F5EF]/75 dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs font-semibold text-[#202020] dark:text-[#F1EFEA] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-[#00552B] dark:text-[#C6A667]" />
                  <span>{t(item.vi, item.en)}</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#202020]/45 dark:text-[#F1EFEA]/45" />
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            to={localePath('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#003D25] text-[#C6A667] text-xs font-bold rounded-lg hover:bg-[#00552B] transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{t('Về Trang chủ', 'Return Home')}</span>
          </Link>
          <Link
            to={localePath('/contact')}
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-[#202020]/20 dark:border-white/20 text-xs font-semibold rounded-lg hover:border-[#00552B]"
          >
            <span>{t('Liên hệ Hỗ trợ', 'Contact Support')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
