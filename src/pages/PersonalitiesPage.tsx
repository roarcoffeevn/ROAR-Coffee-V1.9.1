import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MediaImage } from '../components/MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';

export const PersonalitiesPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { lang, t, localePath } = useI18n();
  const { personalities, setCustomBreadcrumb } = useStore();

  const selected = slug ? personalities.find((p) => p.slug === slug) : null;

  useEffect(() => {
    if (!selected) {
      setCustomBreadcrumb(null);
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCustomBreadcrumb([
      { labelVi: '7 Cá Tính Thương Hiệu', labelEn: 'Seven Personalities', to: '/personalities' },
      { labelVi: selected.animal_vi, labelEn: selected.animal_en },
    ]);
    return () => setCustomBreadcrumb(null);
  }, [selected, setCustomBreadcrumb]);

  if (slug && selected) {
    const isPanther = selected.slug === 'black-panther';
    const currentIndex = personalities.findIndex((p) => p.slug === selected.slug);
    const prevPersonality =
      personalities.length > 1
        ? personalities[(currentIndex - 1 + personalities.length) % personalities.length]
        : null;
    const nextPersonality =
      personalities.length > 1
        ? personalities[(currentIndex + 1) % personalities.length]
        : null;
    const otherPersonalities = personalities.filter((p) => p.slug !== selected.slug);

    return (
      <div className={isPanther ? 'bg-[#0B0B0B] text-[#F8F5EF]' : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA]'}>
        <div className="max-w-[1100px] mx-auto px-6 py-14 space-y-10">
          <Link
            to={localePath('/personalities')}
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              isPanther ? 'text-[#C6A667] hover:underline' : 'text-[#00552B] dark:text-[#C6A667] hover:underline'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('Tất cả 7 Cá Tính ROAR', 'All Seven Personalities')}</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div
                className={`aspect-square rounded-2xl overflow-hidden border p-4 sm:p-5 ${
                  isPanther ? 'border-[#C6A667]/35 bg-[#111312]' : 'border-[#202020]/10 dark:border-[#C6A667]/20 bg-[#FAF8F3] dark:bg-[#141E19]'
                }`}
              >
                <div
                  className={`w-full h-full rounded-xl overflow-hidden border ${
                    isPanther ? 'bg-[#090A09] border-[#C6A667]/25' : 'bg-[#F3EFE5] border-[#202020]/8 dark:border-[#C6A667]/15'
                  }`}
                >
                  <MediaImage
                    imageKey={selected.custom_image_url || selected.image_key}
                    alt={`${selected.animal_en} — ${selected.animal_vi}`}
                    className="w-full h-full object-cover scale-[1.09]"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-5">
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                {t('7 Cá Tính – 7 Dấu Ấn Riêng', 'Seven Personalities. Seven Distinct Characters.')}
              </p>
              <h1 className="text-4xl font-bold">
                {lang === 'vi' ? selected.animal_vi : `${selected.animal_en} — ${selected.animal_vi}`}
              </h1>
              <p className={`text-sm font-medium ${isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                {lang === 'vi' ? selected.traits_vi : selected.traits_en}
              </p>
              <p className={`text-base leading-relaxed whitespace-pre-line ${isPanther ? 'text-[#F8F5EF]/85' : 'text-[#202020]/80 dark:text-[#F1EFEA]/80'}`}>
                {lang === 'vi' ? selected.story_vi : selected.story_en}
              </p>

              <div className={`p-5 rounded-xl border ${isPanther ? 'bg-[#141414] border-[#C6A667]/30' : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10'}`}>
                <span className="text-xs opacity-60 block mb-1">{t('Dòng sản phẩm liên kết', 'Product Association')}</span>
                <p className="text-base font-bold">
                  {lang === 'vi' ? selected.product_association_vi : selected.product_association_en}
                </p>
                {selected.is_future_collection === 1 ? (
                  <p className="text-xs opacity-70 mt-2">
                    {t(
                      'Thuộc bộ sưu tập tương lai. ROAR COFFEE chỉ công bố sản phẩm thương mại sau khi hoàn tất phê duyệt công thức.',
                      'Reserved for a future ROAR COFFEE release. No commercial SKU is launched prior to final formulation approval.'
                    )}
                  </p>
                ) : (
                  <Link
                    to={localePath(selected.slug === 'black-panther' ? '/signature-reserve' : `/product/${selected.associated_product_slug}`)}
                    className={`inline-flex items-center gap-1.5 mt-4 px-5 py-2.5 rounded text-xs font-semibold ${
                      isPanther ? 'bg-[#C6A667] text-[#111111]' : 'bg-[#00552B] text-white'
                    }`}
                  >
                    <span>{t('Khám phá sản phẩm gắn kết', 'Explore Associated Coffee')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Prev / Next Story Bar */}
          {(prevPersonality || nextPersonality) && (
            <div
              className={`pt-6 border-t flex flex-wrap items-center justify-between gap-4 ${
                isPanther ? 'border-[#C6A667]/20' : 'border-[#202020]/10 dark:border-white/10'
              }`}
            >
              {prevPersonality ? (
                <Link
                  to={localePath(`/personalities/${prevPersonality.slug}`)}
                  className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors ${
                    isPanther ? 'text-[#F8F5EF]/80 hover:text-[#C6A667]' : 'text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:text-[#00552B] dark:hover:text-[#C6A667]'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>
                    {t('Trước:', 'Previous:')}{' '}
                    <strong>{lang === 'vi' ? prevPersonality.animal_vi : prevPersonality.animal_en}</strong>
                  </span>
                </Link>
              ) : (
                <span />
              )}

              {nextPersonality && (
                <Link
                  to={localePath(`/personalities/${nextPersonality.slug}`)}
                  className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors ${
                    isPanther ? 'text-[#F8F5EF]/80 hover:text-[#C6A667]' : 'text-[#202020]/75 dark:text-[#F1EFEA]/75 hover:text-[#00552B] dark:hover:text-[#C6A667]'
                  }`}
                >
                  <span>
                    {t('Tiếp theo:', 'Next:')}{' '}
                    <strong>{lang === 'vi' ? nextPersonality.animal_vi : nextPersonality.animal_en}</strong>
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </Link>
              )}
            </div>
          )}

          {/* Remaining 6 Brand Personalities Grid */}
          {otherPersonalities.length > 0 && (
            <section className="pt-4 space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${
                      isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                    }`}
                  >
                    {t('KHÁM PHÁ THÊM', 'EXPLORE MORE')}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold mt-1">
                    {t('Các cá tính thương hiệu còn lại', 'Discover the Other ROAR Personalities')}
                  </h2>
                </div>
                <Link
                  to={localePath('/personalities')}
                  className={`text-xs font-semibold hover:underline ${
                    isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                  }`}
                >
                  {t('Xem tổng quan 7 cá tính →', 'View all 7 archetypes →')}
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {otherPersonalities.map((other) => {
                  const otherIsPanther = other.slug === 'black-panther';
                  const originalIdx = personalities.findIndex((x) => x.slug === other.slug);
                  const idxBadge = String(originalIdx + 1).padStart(2, '0');
                  return (
                    <Link
                      key={other.slug}
                      to={localePath(`/personalities/${other.slug}`)}
                      className={`group rounded-xl border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 ${
                        isPanther
                          ? 'bg-[#141615] border-[#C6A667]/25 hover:border-[#C6A667]/70 text-[#F8F5EF]'
                          : otherIsPanther
                            ? 'bg-[#111312] border-[#C6A667]/40 hover:border-[#C6A667] text-[#F8F5EF]'
                            : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/45 dark:hover:border-[#C6A667]/50 text-[#202020] dark:text-[#F1EFEA]'
                      }`}
                    >
                      <div className="aspect-square overflow-hidden bg-[#0E1310] relative">
                        <MediaImage
                          imageKey={other.custom_image_url || other.image_key}
                          alt={`${other.animal_en} — ${other.animal_vi}`}
                          className="w-full h-full object-cover scale-[1.08] group-hover:scale-[1.13] transition-transform duration-200"
                        />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/65 text-[#C6A667] font-mono text-[10px] font-bold tabular-nums">
                          {idxBadge}
                        </span>
                      </div>
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                        <div>
                          <p className="text-sm font-bold leading-snug group-hover:text-[#00552B] dark:group-hover:text-[#C6A667] transition-colors">
                            {lang === 'vi' ? other.animal_vi : other.animal_en}
                          </p>
                          <p className="text-[11px] opacity-65 line-clamp-2 mt-0.5">
                            {lang === 'vi' ? other.traits_vi : other.traits_en}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold pt-1 ${
                            isPanther || otherIsPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                          }`}
                        >
                          <span>{t('Xem câu chuyện', 'Read story')}</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-14 space-y-12">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
          {t('7 CÁ TÍNH – 7 DẤU ẤN RIÊNG', 'SEVEN PERSONALITIES. SEVEN DISTINCT CHARACTERS.')}
        </p>
        <h1 className="text-3xl sm:text-5xl font-bold text-[#202020] dark:text-[#F1EFEA] text-balance">
          {t('Bảy Biểu Tượng Cá Tính Của ROAR COFFEE', 'The Seven Archetypes of ROAR COFFEE')}
        </h1>
        <p className="text-base text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
          {t(
            'Mỗi tách cà phê phản chiếu một bản lĩnh riêng: từ sự quyết đoán của Hổ, khí chất Sư Tử, nét linh hoạt của Cáo, tầm nhìn Đại Bàng, sự kiên định của Sói, chiều sâu trí tuệ của Cú Mèo đến vẻ quý hiếm của Báo Đen.',
            'Every cup reflects a distinct character — uniting the boldness of the Tiger, the authority of the Lion, the agility of the Fox, the vision of the Eagle, the resilience of the Wolf, the quiet wisdom of the Owl, and the exclusivity of the Black Panther.'
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
        {personalities.map((m, idx) => {
          const isPanther = m.slug === 'black-panther';
          const indexLabel = String(idx + 1).padStart(2, '0');
          return (
            <div
              key={m.slug}
              className={`group rounded-2xl border overflow-hidden flex flex-col justify-between transition-[transform,border-color] duration-200 hover:-translate-y-0.5 ${
                isPanther
                  ? 'bg-[#101211] text-[#F8F5EF] border-[#C6A667]/35 md:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-12'
                  : 'bg-[#FAF8F3] dark:bg-[#121C17] text-[#202020] dark:text-[#F1EFEA] border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40'
              }`}
            >
              <div
                className={
                  isPanther
                    ? 'lg:col-span-4 aspect-square bg-[#090A09] overflow-hidden'
                    : 'aspect-square bg-[#F3EFE5] overflow-hidden border-b border-[#202020]/8 dark:border-[#C6A667]/15'
                }
              >
                <MediaImage
                  imageKey={m.custom_image_url || m.image_key}
                  alt={`${m.animal_en} — ${m.animal_vi}`}
                  className="w-full h-full object-cover scale-[1.09] group-hover:scale-[1.12] transition-transform duration-200"
                />
              </div>

              <div className={`${isPanther ? 'lg:col-span-8 p-8 flex flex-col justify-center' : 'p-6 flex-1 flex flex-col justify-between'} space-y-4`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-xs font-semibold tabular-nums ${isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                      {indexLabel} / {String(personalities.length).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] font-medium uppercase tracking-wider opacity-50">
                      {m.animal_en}
                    </span>
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wider ${isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'}`}>
                    {lang === 'vi' ? m.traits_vi : m.traits_en}
                  </p>
                  <h2 className="text-2xl font-bold tracking-tight">
                    {lang === 'vi' ? m.animal_vi : `${m.animal_en} · ${m.animal_vi}`}
                  </h2>
                  <p className={`text-sm leading-relaxed whitespace-pre-line line-clamp-5 ${isPanther ? 'text-[#F8F5EF]/80' : 'text-[#202020]/75 dark:text-[#F1EFEA]/75'}`}>
                    {lang === 'vi' ? m.story_vi : m.story_en}
                  </p>
                </div>

                <div className="pt-3 border-t border-current/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-medium opacity-80">
                    {t('Liên kết:', 'Association:')} <strong>{lang === 'vi' ? m.product_association_vi : m.product_association_en}</strong>
                  </span>
                  <Link
                    to={localePath(`/personalities/${m.slug}`)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold hover:underline ${
                      isPanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                    }`}
                  >
                    <span>{t('Xem câu chuyện', 'Read Story')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
