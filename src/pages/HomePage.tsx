import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Box,
  Brain,
  Candy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Disc3,
  Flame,
  Gamepad2,
  Gift,
  Globe2,
  HelpCircle,
  LayoutGrid,
  PackageCheck,
  PackageOpen,
  Pause,
  Play,
  ScrollText,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Sprout,
  Trophy,
} from 'lucide-react';
import type { GameKey } from '../lib/gamesCatalog';
import { AdaptiveLogo } from '../components/AdaptiveLogo';
import { MediaImage } from '../components/MediaImage';
import { VietnamOriginMap } from '../components/VietnamOriginMap';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { localizeCoffeeType, localizeJournalCategory } from '../lib/i18nHelpers';
import { getPromoVoucherImage } from '../lib/media';
import { parseHeroMetrics, parseHeroSlides } from '../lib/heroBanners';
import { fetchJournalWithFallback, fetchProductsWithFallback, fetchPromotionsWithFallback } from '../lib/staticFallback';

interface HomeGameShowcaseItem {
  key: GameKey;
  titleVi: string;
  titleEn: string;
  shortVi: string;
  shortEn: string;
  badgeVi: string;
  badgeEn: string;
  descVi: string;
  descEn: string;
  highlightVi: string;
  highlightEn: string;
  rewardVi: string;
  rewardEn: string;
  accentGradient: string;
  iconBg: string;
  icon: React.ReactNode;
}

const HOME_GAMES_SHOWCASE: HomeGameShowcaseItem[] = [
  {
    key: 'candysaga',
    titleVi: 'ROAR Candy Saga · Phiên Bản Sấm Chớp',
    titleEn: 'ROAR Candy Saga · Lightning Edition',
    shortVi: 'Candy Saga',
    shortEn: 'Candy Saga',
    badgeVi: 'HOT · MATCH-3 CHUẨN SAGA',
    badgeEn: 'HOT · SAGA MATCH-3',
    descVi: 'Nối kẹo 8 hướng & đổi chéo đầy chiến thuật. Kích hoạt tia laser sọc ngang/dọc, kẹo bọc nổ 2 nhịp, bom màu cầu vồng, phá lớp băng & Sugar Crush bùng nổ!',
    descEn: '8-direction & diagonal swap match-3 action. Trigger sweeping striped lasers, double-blast wrapped candies, color bombs, jelly shatter & Sugar Crush finale!',
    highlightVi: '10+ màn độ khó tăng dần · Gợi ý & lưu tiến trình từng màn',
    highlightEn: '10+ progressive stages · Smart hints & saved stage progress',
    rewardVi: 'Điểm thưởng + Mã giảm giá + Quà ROAR COFFEE',
    rewardEn: 'Bonus points + Vouchers + ROAR COFFEE gifts',
    accentGradient: 'from-[#3B102F] via-[#1B0D2B] to-[#081F15]',
    iconBg: 'bg-pink-500/20 text-pink-300 border-pink-400/40',
    icon: <Candy className="w-5 h-5" />,
  },
  {
    key: 'cubeaway',
    titleVi: 'ROAR Cube Away 3D · Giải Mã Khối Rubik',
    titleEn: 'ROAR Cube Away 3D · Rubik Puzzle',
    shortVi: 'Cube Away 3D',
    shortEn: 'Cube Away 3D',
    badgeVi: '3D TƯƠNG TÁC 360°',
    badgeEn: '360° 3D PUZZLE',
    descVi: 'Xoay tự do khối Rubik 3D không đế trong không gian 360°. Rung lắc khi chạm, dùng Búa đập hoặc Đảo hướng, bùng nổ pháo hoa rực rỡ khi hoàn thành màn!',
    descEn: 'Rotate the floating 3D Rubik cluster freely in 360°. Tactile hover shake, Hammer & Flip boosters, and celebratory fireworks on every clear!',
    highlightVi: 'Rung lắc xúc giác · Combo liên hoàn & pháo hoa chiến thắng',
    highlightEn: 'Tactile hover shake · Chain combos & victory fireworks',
    rewardVi: 'Lưu cấp độ tự động + Quà tặng & Điểm thành viên',
    rewardEn: 'Auto level save + Member points & vouchers',
    accentGradient: 'from-[#0A2D24] via-[#071D17] to-[#17211D]',
    iconBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    icon: <Box className="w-5 h-5" />,
  },
  {
    key: 'blockblast',
    titleVi: 'ROAR Block Blast · Xếp Khối Nổ Combo',
    titleEn: 'ROAR Block Blast · Combo Puzzle',
    shortVi: 'Block Blast',
    shortEn: 'Block Blast',
    badgeVi: 'COMBO LIÊN HOÀN',
    badgeEn: 'CHAIN COMBOS',
    descVi: 'Kéo thả khối hạt cà phê vào bảng 8×8, xóa đồng thời nhiều hàng & cột để tích combo x2-x5 với hiệu ứng rung màn hình, chữ khen thưởng và pháo hoa.',
    descEn: 'Drag coffee-block shapes onto an 8×8 grid, clear multiple lines at once to stack x2-x5 combos with screen shake, praise ribbons & fireworks.',
    highlightVi: 'Độ khó tăng dần theo màn · Lưu điểm cao & level',
    highlightEn: 'Progressive stages · Saved high scores & levels',
    rewardVi: 'Điểm tích lũy + Ưu đãi đơn hàng ROAR',
    rewardEn: 'Loyalty points + ROAR order perks',
    accentGradient: 'from-[#2A210B] via-[#1B170A] to-[#081F15]',
    iconBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    icon: <LayoutGrid className="w-5 h-5" />,
  },
  {
    key: 'wheel',
    titleVi: 'Vòng Quay May Mắn ROAR Reserve',
    titleEn: 'ROAR Reserve Lucky Wheel',
    shortVi: 'Vòng Quay',
    shortEn: 'Lucky Wheel',
    badgeVi: 'QUAY LÀ TRÚNG',
    badgeEn: 'INSTANT WIN',
    descVi: 'Quay vòng quay 8 ô phần thưởng mỗi ngày để nhận ngay mã giảm giá trực tiếp, cộng điểm thành viên hoặc quà cà phê đặc sản.',
    descEn: 'Spin the 8-slice prize wheel daily to win instant checkout promo codes, loyalty points, or specialty coffee gifts.',
    highlightVi: '1 lượt miễn phí mỗi ngày + đổi điểm quay thêm',
    highlightEn: '1 free daily spin + bonus point spins',
    rewardVi: 'Voucher giảm giá & Quà cà phê thật 100%',
    rewardEn: 'Real checkout vouchers & coffee prizes',
    accentGradient: 'from-[#004A26] via-[#00311A] to-[#111915]',
    iconBg: 'bg-[#C6A667]/25 text-[#F6DFA4] border-[#C6A667]/45',
    icon: <Disc3 className="w-5 h-5" />,
  },
  {
    key: 'shake',
    titleVi: 'Lắc Điện Thoại Săn Lộc Cao Nguyên',
    titleEn: 'Shake & Win Highland Drops',
    shortVi: 'Lắc Điện Thoại',
    shortEn: 'Shake & Win',
    badgeVi: 'CẢM BIẾN LẮC MOBILE',
    badgeEn: 'MOTION SHAKE',
    descVi: 'Lắc nhẹ điện thoại hoặc bấm nút lắc túi cà phê để rơi ra những gói quà bí mật và điểm thưởng ngẫu nhiên mỗi ngày.',
    descEn: 'Shake your phone or tap to rattle the coffee pouch and drop surprise reward packets and daily bonus points.',
    highlightVi: 'Hỗ trợ cảm biến chuyển động & chạm nhanh',
    highlightEn: 'Supports mobile motion sensor & quick tap',
    rewardVi: 'Quà rơi ngẫu nhiên & Điểm thưởng ngay',
    rewardEn: 'Instant drop rewards & bonus points',
    accentGradient: 'from-[#0D3226] via-[#082119] to-[#141E1A]',
    iconBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    icon: <Smartphone className="w-5 h-5" />,
  },
  {
    key: 'fortune',
    titleVi: 'Xin Xăm Gu Cà Phê Đầu Ngày',
    titleEn: 'Daily Coffee Fortune Stick',
    shortVi: 'Xin Xăm',
    shortEn: 'Fortune Stick',
    badgeVi: 'QUẺ VUI & GỢI Ý GU',
    badgeEn: 'FORTUNE & PAIRING',
    descVi: 'Lắc ống xăm tre rút quẻ may mắn theo 7 cá tính hương vị ROAR kèm lời khuyên thưởng thức và quà tặng ẩn bên trong.',
    descEn: 'Shake the bamboo cylinder to draw your daily fortune paired with ROAR tasting notes and hidden gift rewards.',
    highlightVi: 'Quẻ thơ tiếng Việt/Anh + Gợi ý sản phẩm hợp gu',
    highlightEn: 'Bilingual fortune notes + Smart coffee pairing',
    rewardVi: 'Điểm thưởng + Mã ưu đãi hợp gu',
    rewardEn: 'Bonus points + Tailored promo code',
    accentGradient: 'from-[#2C1E0B] via-[#1C1308] to-[#0A1E15]',
    iconBg: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    icon: <ScrollText className="w-5 h-5" />,
  },
  {
    key: 'quiz',
    titleVi: 'Trắc Nghiệm Gu 7 Cá Tính Cà Phê',
    titleEn: '7 Roast Personalities Taste Quiz',
    shortVi: 'Gu 7 Cá Tính',
    shortEn: 'Taste Quiz',
    badgeVi: 'KHÁM PHÁ GU VỊ',
    badgeEn: 'TASTE DISCOVERY',
    descVi: 'Trả lời vài câu hỏi ngắn về thói quen uống cà phê để tìm ra dòng hạt hợp khẩu vị nhất trong 7 cá tính ROAR và nhận quà.',
    descEn: 'Answer quick flavor-preference questions to discover your signature match across ROAR’s 7 coffee personalities and claim a gift.',
    highlightVi: 'Gợi ý chính xác sản phẩm & thêm giỏ 1 chạm',
    highlightEn: 'Personalized roast match + 1-tap add to cart',
    rewardVi: 'Điểm thưởng + Voucher trải nghiệm vị mới',
    rewardEn: 'Points + First-tasting voucher',
    accentGradient: 'from-[#1D2B12] via-[#121D0B] to-[#0B1C14]',
    iconBg: 'bg-lime-500/20 text-lime-300 border-lime-400/40',
    icon: <HelpCircle className="w-5 h-5" />,
  },
  {
    key: 'memory',
    titleVi: 'Lật Thẻ Trí Nhớ Hạt Đặc Sản',
    titleEn: 'Specialty Coffee Memory Match',
    shortVi: 'Lật Thẻ',
    shortEn: 'Memory Match',
    badgeVi: 'RÈN TRÍ NHỚ',
    badgeEn: 'BRAIN CHALLENGE',
    descVi: 'Lật tìm các cặp thẻ dòng cà phê & dụng cụ pha chế trong thời gian ngắn nhất để mở khóa màn khó hơn và nhận thưởng.',
    descEn: 'Flip and match pairs of specialty roast and brewing cards against the clock to unlock higher tiers and earn points.',
    highlightVi: 'Nhiều cấp độ tăng dần · Lưu kỷ lục điểm',
    highlightEn: 'Multi-level progression · Saved best score',
    rewardVi: 'Điểm thành viên & Quà chinh phục',
    rewardEn: 'Member points & milestone prizes',
    accentGradient: 'from-[#0E2B35] via-[#0A1E26] to-[#0B1F16]',
    iconBg: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    icon: <Brain className="w-5 h-5" />,
  },
  {
    key: 'harvest',
    titleVi: 'Hứng Hạt Chín Mùa Thu Hoạch Cao Nguyên',
    titleEn: 'Highland Cherry Harvest Catch',
    shortVi: 'Hứng Hạt',
    shortEn: 'Harvest',
    badgeVi: 'PHẢN XẠ NHANH',
    badgeEn: 'ARCADE CATCH',
    descVi: 'Di chuyển giỏ mây hứng những trái cà phê chín mọng từ núi cao Lâm Đồng & Đắk Lắk, né vật cản để đạt điểm kỷ lục.',
    descEn: 'Slide the woven basket to catch ripe highland coffee cherries from Lam Dong & Dak Lak while dodging obstacles.',
    highlightVi: 'Điều khiển mượt trên cả chạm mobile & bàn phím',
    highlightEn: 'Smooth touch & keyboard arcade controls',
    rewardVi: 'Điểm thưởng theo thành tích & Quà mùa vụ',
    rewardEn: 'Score-based points & harvest rewards',
    accentGradient: 'from-[#2A1D0D] via-[#1B1208] to-[#081F15]',
    iconBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40',
    icon: <Sprout className="w-5 h-5" />,
  },
  {
    key: 'mystery',
    titleVi: 'Mở Hộp Bí Ẩn ROAR Treasure Box',
    titleEn: 'ROAR Mystery Treasure Box',
    shortVi: 'Hộp Bí Ẩn',
    shortEn: 'Mystery Box',
    badgeVi: 'RƯƠNG QUÀ BÍ MẬT',
    badgeEn: 'MYSTERY PRIZES',
    descVi: 'Chọn 1 trong 3 chiếc rương đồng-vàng để giải mã phần thưởng bất ngờ từ điểm tích lũy đến voucher giảm sâu.',
    descEn: 'Pick one of three brass-and-gold chests to unbox surprise perks ranging from bonus points to deep checkout discounts.',
    highlightVi: 'Mở rương hồi hộp · Trúng thưởng minh bạch',
    highlightEn: 'Instant chest reveal · Verified rewards',
    rewardVi: 'Voucher bí mật & Điểm thưởng ROAR',
    rewardEn: 'Mystery vouchers & ROAR points',
    accentGradient: 'from-[#2E2212] via-[#1A140B] to-[#0A1C14]',
    iconBg: 'bg-[#C6A667]/25 text-[#F6DFA4] border-[#C6A667]/45',
    icon: <PackageOpen className="w-5 h-5" />,
  },
];

export const HomePage: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { personalities, settings, formatPrice, addToCart, showToast, theme } = useStore();

  const heroSlides = useMemo(
    () => parseHeroSlides(settings.cms_hero_slides_json).filter((s) => s.visible !== false),
    [settings.cms_hero_slides_json]
  );
  const heroMetrics = useMemo(
    () => parseHeroMetrics(settings.cms_hero_metrics_json).filter((m) => m.visible !== false),
    [settings.cms_hero_metrics_json]
  );

  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [giftVouchers, setGiftVouchers] = useState<Product[]>([]);
  const [giftOpen, setGiftOpen] = useState(false);
  const [gamesShowcaseOpen, setGamesShowcaseOpen] = useState(false);
  const [selectedShowcaseGame, setSelectedShowcaseGame] = useState<GameKey>('candysaga');
  const [articles, setArticles] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Quick interactive Green Coffee selector
  const [gcType, setGcType] = useState('RO');
  const [gcScreen, setGcScreen] = useState('S18');
  const [gcProc, setGcProc] = useState('HON');
  const [activePersonalitySlug, setActivePersonalitySlug] = useState<string>('tiger');

  useEffect(() => {
    fetchProductsWithFallback()
      .then((list) => {
        setFeaturedProducts(list.filter((p: Product) => p.category !== 'green_bean' && p.sub_category !== 'Gift Voucher').slice(0, 4));
        setGiftVouchers(list.filter((p: Product) => p.sub_category === 'Gift Voucher').sort((a: Product, b: Product) => a.price_vnd - b.price_vnd));
      })
      .catch(() => {});
    fetchJournalWithFallback()
      .then((list) => setArticles(list.slice(0, 3)))
      .catch(() => {});
    fetchPromotionsWithFallback()
      .then((list) => setPromotions(list.slice(0, 4)))
      .catch(() => {});
  }, []);

  const isCarouselPaused = heroPaused || userPaused;

  useEffect(() => {
    if (isCarouselPaused || heroSlides.length <= 1) return;
    const prefersReduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const timer = window.setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % heroSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [isCarouselPaused, heroSlides.length]);

  const safeHeroIdx = heroSlides.length > 0 ? heroIdx % heroSlides.length : 0;
  const activeSlide = heroSlides[safeHeroIdx];
  const selectedGreenSku = `${gcType}-${gcScreen}-${gcProc}`;
  const selectedGreenSlug = `green-${gcType.toLowerCase()}-${gcScreen.toLowerCase()}-${gcProc.toLowerCase()}`;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || heroSlides.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    if (Math.abs(delta) > 45) {
      setHeroIdx((prev) => (delta < 0 ? (prev + 1) % heroSlides.length : (prev - 1 + heroSlides.length) % heroSlides.length));
    }
    touchStartX.current = null;
  };

  return (
    <div className="bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] transition-colors">
      {/* 1. COMPACT DYNAMIC MULTI-SLIDE HERO BANNER CAROUSEL */}
      {activeSlide && (
      <section
        className={`relative ${activeSlide.surfaceClass} text-white overflow-hidden transition-colors duration-700`}
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-6 pb-5 lg:pt-8 lg:pb-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div key={activeSlide.id} className="lg:col-span-6 flex flex-col justify-center space-y-4 transition-all duration-500">
            <div className="flex items-center justify-between gap-3">
              <AdaptiveLogo variant="horizontal" surface="dark" size="sm" />
              <span className="font-mono text-[11px] text-[#C6A667]/90 border border-[#C6A667]/30 px-2 py-0.5 rounded tabular-nums">
                {String(safeHeroIdx + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
              </span>
            </div>

            <div className="space-y-2 min-h-[144px] sm:min-h-[162px] flex flex-col justify-center">
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#C6A667]">
                {lang === 'vi' ? activeSlide.badgeVi : activeSlide.badgeEn}
              </p>
              <h1 className="text-[clamp(1.65rem,2.9vw,2.55rem)] leading-[1.14] font-bold tracking-tight text-balance line-clamp-2">
                {lang === 'vi' ? activeSlide.titleVi : activeSlide.titleEn}
              </h1>
              <p className="text-xs sm:text-sm text-[#F8F5EF]/80 leading-relaxed max-w-xl line-clamp-3">
                {lang === 'vi' ? activeSlide.descVi : activeSlide.descEn}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to={localePath(activeSlide.primaryTo)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C6A667] text-[#111111] font-semibold text-xs sm:text-sm rounded hover:bg-[#d4b67a] transition-colors whitespace-nowrap"
              >
                <span>{lang === 'vi' ? activeSlide.primaryCtaVi : activeSlide.primaryCtaEn}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              {activeSlide.secondaryCtaVi && activeSlide.secondaryTo && (
                <Link
                  to={localePath(activeSlide.secondaryTo)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/30 text-white font-medium text-xs sm:text-sm rounded hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  <span>{lang === 'vi' ? activeSlide.secondaryCtaVi : activeSlide.secondaryCtaEn}</span>
                </Link>
              )}
            </div>

            {/* Dynamic Horizontal Running Carousel of Diverse Metrics */}
            {heroMetrics.length > 0 && (
              <div className="pt-3 border-t border-white/15">
                <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                  <div className="animate-metrics-marquee gap-2.5">
                    {[0, 1].map((dup) => (
                      <div key={dup} className="flex items-stretch gap-2.5 pr-2.5" aria-hidden={dup === 1}>
                        {heroMetrics.map((item, idx) => (
                          <Link
                            key={`${dup}-${item.id || idx}`}
                            to={localePath(item.to)}
                            className="group w-[178px] sm:w-[192px] shrink-0 p-2.5 rounded-lg bg-white/6 hover:bg-white/14 border border-white/12 hover:border-[#C6A667]/60 transition-all"
                          >
                            <div className="flex items-baseline justify-between gap-1">
                              <span className="font-mono text-sm sm:text-base font-bold text-[#C6A667] tabular-nums group-hover:scale-105 transition-transform origin-left">
                                {item.value}
                              </span>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse`} />
                            </div>
                            <span className="block text-[11px] font-semibold text-white leading-tight mt-0.5 truncate">
                              {lang === 'vi' ? item.titleVi : item.titleEn}
                            </span>
                            <span className="block text-[10px] text-[#F8F5EF]/70 mt-0.5 truncate">
                              {lang === 'vi' ? item.subVi : item.subEn}
                            </span>
                          </Link>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Uniform 4:3 Aspect Ratio Hero Media Frame */}
          <div className="lg:col-span-6 w-full">
            <div className="relative w-full aspect-[4/3] max-h-[370px] rounded-xl overflow-hidden border border-[#C6A667]/25 bg-black/25">
              {heroSlides.map((slide, idx) => (
                <div
                  key={slide.id}
                  aria-hidden={idx !== safeHeroIdx}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    idx === safeHeroIdx ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-[1.03] z-0 pointer-events-none'
                  }`}
                >
                  <MediaImage
                    imageKey={slide.imageKey}
                    alt={lang === 'vi' ? slide.titleVi : slide.titleEn}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              ))}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex items-end justify-between gap-3 p-4">
                <p className="text-[11px] sm:text-xs text-[#F8F5EF]/90 max-w-md line-clamp-2">
                  {lang === 'vi' ? activeSlide.captionVi : activeSlide.captionEn}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setUserPaused((p) => !p)}
                    aria-label={userPaused ? t('Tiếp tục chạy banner', 'Resume carousel') : t('Tạm dừng banner', 'Pause carousel')}
                    className="w-8 h-8 rounded-full bg-black/55 border border-white/25 text-white flex items-center justify-center hover:bg-[#C6A667] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    {userPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroIdx((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)}
                    aria-label={t('Banner trước', 'Previous banner')}
                    className="w-8 h-8 rounded-full bg-black/55 border border-white/25 text-white flex items-center justify-center hover:bg-[#C6A667] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeroIdx((prev) => (prev + 1) % heroSlides.length)}
                    aria-label={t('Banner tiếp theo', 'Next banner')}
                    className="w-8 h-8 rounded-full bg-black/55 border border-white/25 text-white flex items-center justify-center hover:bg-[#C6A667] hover:text-[#111111] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compact Hero Banner Selector Tabs with Dynamic Progress Track */}
        <div className="border-t border-white/10 bg-black/15">
          <div className="max-w-[1280px] mx-auto px-5 sm:px-6 py-2 grid grid-cols-2 lg:grid-cols-4 gap-2">
            {heroSlides.map((slide, idx) => {
              const active = idx === safeHeroIdx;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setHeroIdx(idx)}
                  className={`relative overflow-hidden text-left px-3 py-2 rounded-lg border text-[11px] sm:text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-[#C6A667] text-[#111111] border-[#C6A667] font-semibold'
                      : 'bg-white/5 text-white/75 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="block truncate">{lang === 'vi' ? slide.tabLabelVi : slide.tabLabelEn}</span>
                  {active && !isCarouselPaused && (
                    <span
                      key={`prog-${safeHeroIdx}`}
                      className="absolute inset-x-0 bottom-0 h-[2.5px] bg-[#003D25]/60 animate-hero-progress"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* INTERACTIVE CLICK-TO-EXPAND MINI-GAMES SHOWCASE LAUNCHER */}
      <section className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-5">
        {(() => {
          const activeShowcase =
            HOME_GAMES_SHOWCASE.find((g) => g.key === selectedShowcaseGame) || HOME_GAMES_SHOWCASE[0];
          const featuredQuickKeys: GameKey[] = ['candysaga', 'cubeaway', 'blockblast', 'wheel'];
          return (
            <div className="rounded-xl border border-[#00552B]/25 dark:border-[#C6A667]/35 bg-white dark:bg-[#16221C] shadow-xs overflow-hidden">
              {/* Compact Launcher Row — Click any game icon or the bar to expand details */}
              <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setGamesShowcaseOpen((v) => !v)}
                  aria-expanded={gamesShowcaseOpen}
                  className="flex-1 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer min-w-[230px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#00552B] to-[#00331A] text-[#C6A667] border border-[#C6A667]/40 flex items-center justify-center shrink-0 shadow-xs">
                      <Gamepad2 className="w-4.5 h-4.5" />
                      <Sparkles className="w-2.5 h-2.5 text-amber-300 absolute -top-1 -right-1" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#202020] dark:text-[#F1EFEA] truncate">
                        {t(
                          'ROAR Play & Win · 10 Mini-Game Săn Quà & Điểm Thưởng',
                          'ROAR Play & Win · 10 Interactive Reward Mini-Games'
                        )}
                      </p>
                      <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 truncate">
                        {t(
                          'Bấm vào icon game hoặc thanh này để xem chi tiết: Candy Saga, Cube Away 3D, Block Blast…',
                          'Click any game icon or this bar to preview Candy Saga, Cube Away 3D, Block Blast & more'
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] shrink-0">
                    <span className="hidden md:inline">
                      {gamesShowcaseOpen ? t('Thu gọn', 'Collapse') : t('Xem giới thiệu', 'Explore Games')}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${gamesShowcaseOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>

                {/* Quick-Click Interactive Game Icons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {featuredQuickKeys.map((gKey) => {
                    const gItem = HOME_GAMES_SHOWCASE.find((item) => item.key === gKey);
                    if (!gItem) return null;
                    const isFocused = gamesShowcaseOpen && selectedShowcaseGame === gItem.key;
                    return (
                      <button
                        key={gItem.key}
                        type="button"
                        onClick={() => {
                          if (isFocused) {
                            setGamesShowcaseOpen(false);
                          } else {
                            setSelectedShowcaseGame(gItem.key);
                            setGamesShowcaseOpen(true);
                          }
                        }}
                        title={lang === 'vi' ? gItem.titleVi : gItem.titleEn}
                        aria-label={lang === 'vi' ? gItem.shortVi : gItem.shortEn}
                        className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                          isFocused
                            ? 'bg-[#00552B] text-[#C6A667] border-[#00552B] dark:bg-[#C6A667] dark:text-[#111111] dark:border-[#C6A667] shadow-xs'
                            : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] border-[#202020]/12 dark:border-white/15 hover:border-[#00552B] dark:hover:border-[#C6A667]'
                        }`}
                      >
                        <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
                          {gItem.icon}
                        </span>
                        <span className="hidden sm:inline whitespace-nowrap">
                          {lang === 'vi' ? gItem.shortVi : gItem.shortEn}
                        </span>
                      </button>
                    );
                  })}
                  <Link
                    to={localePath(`/play?game=${selectedShowcaseGame}`)}
                    className="px-3 py-1.5 rounded-lg bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1 shrink-0 transition-colors whitespace-nowrap"
                  >
                    <span>{t('Chơi ngay', 'Play')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Expanded Interactive Game Gallery & Spotlight */}
              {gamesShowcaseOpen && (
                <div className="p-4 sm:p-5 border-t border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512]/70 space-y-4">
                  {/* Interactive 10-Game Selector Grid/Strip */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {HOME_GAMES_SHOWCASE.map((gItem) => {
                      const active = gItem.key === activeShowcase.key;
                      return (
                        <button
                          key={gItem.key}
                          type="button"
                          onClick={() => setSelectedShowcaseGame(gItem.key)}
                          className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-[#00552B] text-white border-[#00552B] dark:bg-[#C6A667] dark:text-[#111111] dark:border-[#C6A667] shadow-xs'
                              : 'bg-white dark:bg-[#16221C] text-[#202020]/80 dark:text-[#F1EFEA]/80 border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40'
                          }`}
                        >
                          <span className="shrink-0">{gItem.icon}</span>
                          <span>{lang === 'vi' ? gItem.shortVi : gItem.shortEn}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Game Interactive Spotlight Card */}
                  <div className="rounded-xl border border-[#202020]/10 dark:border-white/12 bg-white dark:bg-[#16221C] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    <div
                      className={`lg:col-span-5 bg-gradient-to-br ${activeShowcase.accentGradient} text-white p-5 sm:p-6 flex flex-col justify-between gap-5 relative overflow-hidden`}
                    >
                      <div className="flex items-center justify-between gap-2 relative z-10">
                        <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-[#C6A667]">
                          {lang === 'vi' ? activeShowcase.badgeVi : activeShowcase.badgeEn}
                        </span>
                        <Trophy className="w-4 h-4 text-[#C6A667]/85 shrink-0" />
                      </div>

                      <div className="flex items-center gap-4 relative z-10">
                        <div
                          className={`w-16 h-16 rounded-2xl border ${activeShowcase.iconBg} flex items-center justify-center shrink-0 shadow-lg [&_svg]:w-8 [&_svg]:h-8`}
                        >
                          {activeShowcase.icon}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-xl font-bold leading-snug text-white">
                            {lang === 'vi' ? activeShowcase.titleVi : activeShowcase.titleEn}
                          </h3>
                          <p className="text-xs text-white/75 mt-1">
                            {t('Lưu tiến trình tự động · Hỗ trợ Mobile & Desktop', 'Auto-saved progress · Mobile & Desktop ready')}
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-white/15 flex items-center justify-between gap-2 text-[11px] text-[#C6A667] relative z-10">
                        <span className="font-semibold truncate">ROAR COFFEE · Play &amp; Win</span>
                        <span className="font-mono tabular-nums text-white/75 shrink-0">
                          {HOME_GAMES_SHOWCASE.findIndex((g) => g.key === activeShowcase.key) + 1} / {HOME_GAMES_SHOWCASE.length}
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-7 p-5 sm:p-6 flex flex-col justify-between gap-4">
                      <div className="space-y-3">
                        <p className="text-sm text-[#202020]/85 dark:text-[#F1EFEA]/85 leading-relaxed">
                          {lang === 'vi' ? activeShowcase.descVi : activeShowcase.descEn}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <div className="p-3 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                              {t('Điểm nổi bật', 'Gameplay Highlights')}
                            </p>
                            <p className="text-xs font-medium text-[#202020] dark:text-[#F1EFEA] mt-1">
                              {lang === 'vi' ? activeShowcase.highlightVi : activeShowcase.highlightEn}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                              {t('Phần thưởng nhận được', 'Rewards')}
                            </p>
                            <p className="text-xs font-medium text-[#202020] dark:text-[#F1EFEA] mt-1">
                              {lang === 'vi' ? activeShowcase.rewardVi : activeShowcase.rewardEn}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-2">
                        <Link
                          to={localePath(`/play?game=${activeShowcase.key}`)}
                          className="px-4 py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
                        >
                          <Gamepad2 className="w-4 h-4 text-[#C6A667]" />
                          <span>
                            {t(
                              `Chơi ${activeShowcase.shortVi} Ngay`,
                              `Play ${activeShowcase.shortEn} Now`
                            )}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link
                          to={localePath('/play')}
                          className="px-4 py-2.5 rounded-lg border border-[#00552B]/30 dark:border-[#C6A667]/35 text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B]/5 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>{t('Mở sảnh 10 Mini-Game', 'Open All 10 Games')}</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      {/* COMPACT COLLAPSIBLE GIFT VOUCHER BAR (50k - 100k - 500k - 1M) */}
      {giftVouchers.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-5 sm:px-6 pt-3">
          <div className="rounded-xl border border-[#C6A667]/35 bg-white dark:bg-[#16221C] shadow-xs overflow-hidden">
            <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setGiftOpen((v) => !v)}
                className="flex-1 flex items-center justify-between gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer min-w-[240px]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-[#00552B] text-[#C6A667] flex items-center justify-center shrink-0">
                    <Gift className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#202020] dark:text-[#F1EFEA] truncate">
                      {t('Thẻ Quà Tặng ROAR Gift Voucher (50k · 100k · 500k · 1.000.000₫)', 'ROAR Gift Vouchers (50k · 100k · 500k · 1,000,000 VND)')}
                    </p>
                    <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 truncate">
                      {t('Bấm để mở danh sách Gift Voucher như sản phẩm · E-Voucher & Thẻ cứng ép kim', 'Click to expand Gift Voucher products · Digital E-Voucher & Foil Card')}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] shrink-0">
                  <span className="hidden sm:inline">{giftOpen ? t('Thu gọn', 'Collapse') : t('Xem Voucher', 'Expand')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${giftOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              <Link
                to={localePath('/account?tab=rewards')}
                className="px-3.5 py-2 rounded-lg bg-[#C6A667] hover:bg-[#b59454] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{t('Điểm danh nhận quà (+100đ)', 'Daily Check-in (+100 pts)')}</span>
              </Link>
            </div>

            {giftOpen && (
              <div className="p-4 sm:p-5 border-t border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/50 dark:bg-[#0E1512]/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {giftVouchers.map((gv) => (
                    <div
                      key={gv.id}
                      className="rounded-xl bg-white dark:bg-[#16221C] border border-[#00552B]/15 dark:border-[#C6A667]/25 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        <Link to={localePath(`/product/${gv.slug}`)} className="block relative aspect-[4/5] bg-[#0B120E] overflow-hidden">
                          <MediaImage
                            imageKey={gv.image_key}
                            alt={lang === 'en' ? gv.name_en : gv.name_vi}
                            brandMark="bottom-right"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-[#111111]/85 text-[#C6A667] font-mono text-[11px] font-bold shadow-sm">
                            {formatPrice(gv.price_vnd, gv.price_usd)}
                          </span>
                        </Link>
                        <div className="p-3 space-y-1.5">
                          <Link
                            to={localePath(`/product/${gv.slug}`)}
                            className="block text-xs font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] line-clamp-2"
                          >
                            {lang === 'en' ? gv.name_en : gv.name_vi}
                          </Link>
                          <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2 leading-relaxed">
                            {lang === 'en' ? gv.subtitle_en || gv.description_en : gv.subtitle_vi || gv.description_vi}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 pb-3 pt-1 flex items-center gap-2">
                        <Link
                          to={localePath(`/product/${gv.slug}`)}
                          className="flex-1 py-1.5 rounded-lg border border-[#00552B]/25 dark:border-[#C6A667]/30 text-center text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B]/5"
                        >
                          {t('Chi tiết', 'Details')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            const firstVar = gv.variants?.[0];
                            addToCart({
                              productId: gv.id,
                              slug: gv.slug,
                              sku: gv.sku,
                              nameVi: gv.name_vi,
                              nameEn: gv.name_en,
                              variantLabel: firstVar?.label || 'E-Voucher',
                              unitPriceVnd: gv.price_vnd,
                              unitPriceUsd: gv.price_usd,
                              quantity: 1,
                              imageKey: gv.image_key,
                            });
                            showToast(t(`Đã thêm ${gv.name_vi} vào giỏ`, `Added ${gv.name_en} to cart`));
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ShoppingBag className="w-3 h-3" />
                          <span>{t('Chọn mua', 'Add')}</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 2. BRAND INTRODUCTION (with Official Vertical Logo) */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 lg:py-20 border-b border-[#202020]/10 dark:border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden w-full bg-white dark:bg-[#14201A] p-8 sm:p-10 rounded-2xl border border-[#202020]/10 dark:border-[#C6A667]/20 shadow-sm flex flex-col items-center text-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-56 h-56 rounded-full bg-[#C6A667]/10 blur-3xl"
              />
              <div className="relative py-2">
                <AdaptiveLogo variant="vertical" surface={theme === 'dark' ? 'dark' : 'light'} size="lg" />
              </div>
              <div className="relative w-full mt-6 pt-5 border-t border-[#202020]/10 dark:border-white/10 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-mono text-base font-bold text-[#00552B] dark:text-[#C6A667]">10+</p>
                  <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-0.5">
                    {t('Vùng nguyên liệu', 'Origin Regions')}
                  </p>
                </div>
                <div className="border-x border-[#202020]/10 dark:border-white/10 px-2">
                  <p className="font-mono text-base font-bold text-[#00552B] dark:text-[#C6A667]">07</p>
                  <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-0.5">
                    {t('Cá tính độc bản', 'Personalities')}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-base font-bold text-[#00552B] dark:text-[#C6A667]">S14–S18</p>
                  <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-0.5">
                    {t('Chuẩn xuất khẩu', 'Export Grade')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-6 bg-[#00552B] dark:bg-[#C6A667]" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
                {t('Triết lý thương hiệu', 'Brand Positioning')}
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold leading-tight text-[#202020] dark:text-[#F1EFEA] text-balance">
              {t(
                'Bản sắc cà phê Việt Nam đương đại cho thị trường nội địa và quốc tế',
                'Authentic Vietnamese coffee heritage shaped for contemporary life and global trade'
              )}
            </h2>
            <p className="text-base text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
              {t(
                'ROAR COFFEE kết hợp nguồn gốc cà phê Việt Nam chân thực, tay nghề chế tác chuẩn mực, phong cách sống hiện đại và bảy cá tính độc bản. Từ tách cà phê hằng ngày đến chuỗi cung ứng nhân xanh thương mại S14/S16/S18, mọi điểm chạm đều nhất quán về chất lượng và sự minh bạch.',
                'ROAR COFFEE bridges authentic Vietnamese highland coffee origins, disciplined craft, modern lifestyles, and seven distinct character archetypes — spanning daily roasted rituals, luxury Reserve gifting, and institutional S14/S16/S18 green bean supply.'
              )}
            </p>
            <div className="pt-2">
              <Link
                to={localePath('/about')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#00552B]/25 dark:border-[#C6A667]/35 bg-[#00552B]/5 dark:bg-[#C6A667]/10 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:bg-[#00552B] hover:text-white dark:hover:bg-[#C6A667] dark:hover:text-[#111111] transition-colors"
              >
                <span>{t('Tìm hiểu câu chuyện ROAR COFFEE', 'Read the ROAR COFFEE Story')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2B. DIRECT SHOP-BY-CATEGORY DIRECTORY */}
      <section className="max-w-[1280px] mx-auto px-6 pt-14 pb-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
              {t('Danh mục sản phẩm chính thức', 'Browse by Coffee Category')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
              {t('Chọn Nhanh Theo Dòng Sản Phẩm', 'Direct Category Access')}
            </h2>
          </div>
          <Link to={localePath('/shop')} className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap">
            {t('Mở toàn bộ cửa hàng →', 'Open Full Catalog →')}
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            {
              to: '/coffee/roasted',
              titleVi: 'Cà phê Rang Xay',
              titleEn: 'Roasted Ground',
              subVi: '7 dòng chuẩn Phin & Espresso',
              subEn: '7 Phin & Espresso blends',
              img: '/assets/roasted-ground/robusta-house-blend.jpg',
            },
            {
              to: '/coffee/roasted-beans',
              titleVi: 'Cà phê Hạt Rang (kg)',
              titleEn: 'Roasted Beans (kg)',
              subVi: '6 mã S18 · Giá sỉ 5 bậc kg',
              subEn: '6 S18 SKUs · 5-tier kg pricing',
              img: '/assets/roasted-beans/robusta-s18.jpg',
            },
            {
              to: '/coffee/green-coffee',
              titleVi: 'Cà phê Nhân Xanh',
              titleEn: 'Green Coffee Beans',
              subVi: '27 mã S14/S16/S18 · Đặt theo kg',
              subEn: '27 S14/S16/S18 lots · Per kg',
              img: '/assets/green-beans/robusta-natural.jpg',
            },
            {
              to: '/coffee/instant',
              titleVi: 'Cà phê Hòa Tan',
              titleEn: 'Instant Coffee',
              subVi: 'Bộ sưu tập Silver & Gold',
              subEn: 'Silver & Gold collections',
              img: 'instant_gold_chill',
            },
            {
              to: '/coffee/gift-vouchers',
              titleVi: 'Gift Voucher ROAR',
              titleEn: 'Gift Vouchers',
              subVi: 'Thẻ quà 50k · 100k · 500k · 1tr',
              subEn: '50k · 100k · 500k · 1M VND',
              img: '/assets/vouchers/gift-voucher-500k.jpg',
            },
          ].map((cat) => (
            <Link
              key={cat.to}
              to={localePath(cat.to)}
              className="group bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between hover:border-[#00552B] dark:hover:border-[#C6A667] hover:-translate-y-0.5 transition-all"
            >
              <div className="aspect-[4/5] bg-[#0B120E] overflow-hidden relative">
                <MediaImage
                  imageKey={cat.img}
                  alt={t(cat.titleVi, cat.titleEn)}
                  brandMark="top-left"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded bg-[#111111]/85 text-[#C6A667] text-[11px] font-semibold inline-flex items-center gap-1">
                  <span>{t('Mở', 'View')}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <div className="p-3.5 space-y-1">
                <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] group-hover:text-[#00552B] dark:group-hover:text-[#C6A667] leading-snug">
                  {t(cat.titleVi, cat.titleEn)}
                </h3>
                <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 line-clamp-1">
                  {t(cat.subVi, cat.subEn)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. FEATURED COFFEE COLLECTIONS */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
              {t('Bộ sưu tập tiêu biểu', 'Featured Collections')}
            </p>
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
              {t('Cà Phê Rang Xay & Hòa Tan ROAR', 'Roasted & Instant Collections')}
            </h2>
          </div>
          <Link to={localePath('/shop')} className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap">
            {t('Xem tất cả sản phẩm →', 'View All Products →')}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/8 dark:border-white/10 overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 transition-transform"
            >
              <div>
                <Link to={localePath(`/product/${p.slug}`)} className="block aspect-[4/5] overflow-hidden bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <MediaImage
                    imageKey={p.image_key}
                    alt={lang === 'vi' ? p.name_vi : p.name_en}
                    brandMark="bottom-left"
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </Link>
                <div className="p-5 space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                    {p.sku} · {localizeCoffeeType(p.coffee_type, lang)}
                  </p>
                  <Link
                    to={localePath(`/product/${p.slug}`)}
                    className="block text-base font-bold text-[#202020] dark:text-[#F1EFEA] hover:text-[#00552B] dark:hover:text-[#C6A667] leading-snug"
                  >
                    {lang === 'vi' ? p.name_vi : p.name_en}
                  </Link>
                  <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2">
                    {lang === 'vi' ? p.subtitle_vi : p.subtitle_en}
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-3 border-t border-[#202020]/8 dark:border-white/10 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                  {formatPrice(p.price_vnd, p.price_usd)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const firstVar = p.variants[0];
                    addToCart({
                      productId: p.id,
                      slug: p.slug,
                      sku: p.sku,
                      nameVi: p.name_vi,
                      nameEn: p.name_en,
                      variantLabel: firstVar ? firstVar.label : 'Standard',
                      unitPriceVnd: firstVar ? firstVar.priceVnd : p.price_vnd,
                      unitPriceUsd: firstVar ? firstVar.priceUsd : p.price_usd,
                      quantity: 1,
                      imageKey: p.image_key,
                    });
                    showToast(t('Đã thêm vào giỏ hàng', 'Added to cart'));
                  }}
                  className="px-3 py-1.5 bg-[#00552B] text-white text-xs font-medium rounded hover:bg-[#003D25] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {t('Thêm vào giỏ', 'Add to Cart')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. SEVEN BRAND PERSONALITIES — ATELIER COLLECTOR SHOWCASE */}
      {(() => {
        const activeIdx = Math.max(
          0,
          personalities.findIndex((p) => p.slug === activePersonalitySlug)
        );
        const activePersonality = personalities[activeIdx] || personalities[0];
        const heritageSpirits = personalities.filter((p) => p.slug !== 'black-panther');
        const pantherSpirit = personalities.find((p) => p.slug === 'black-panther');

        const stepPersonality = (dir: -1 | 1) => {
          if (!personalities.length) return;
          const nextIdx = (activeIdx + dir + personalities.length) % personalities.length;
          setActivePersonalitySlug(personalities[nextIdx].slug);
        };

        const isActivePanther = activePersonality?.slug === 'black-panther';
        const activeStoryPreview = activePersonality
          ? (lang === 'vi' ? activePersonality.story_vi : activePersonality.story_en).split('\n\n')[0]
          : '';

        return (
          <section className="bg-[#EFECE4] dark:bg-[#0B120E] border-y border-[#202020]/10 dark:border-[#C6A667]/15 py-16 sm:py-20">
            <div className="max-w-[1280px] mx-auto px-6 space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
                    {t('01–07 · Bản Sắc Linh Vật ROAR', '01–07 · Seven Brand Archetypes')}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#202020] dark:text-[#F1EFEA] text-balance tracking-tight">
                    {t('Khám phá Linh Vật Bản Sắc ROAR COFFEE', 'Meet the Seven ROAR Characters')}
                  </h2>
                  <p className="text-sm text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">
                    {t(
                      'Mỗi mẻ rang là một khí chất riêng biệt — chọn hoặc lướt qua từng biểu tượng để khám phá câu chuyện và gu thưởng thức tương ứng.',
                      'Each roast profile embodies a distinct temperament — hover or select any crest to explore its story and paired coffee.'
                    )}
                  </p>
                </div>
                <Link
                  to={localePath('/personalities')}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
                >
                  <span>{t('Trải nghiệm đầy đủ', 'Explore All Seven')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {activePersonality && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
                  {/* Left: Editorial Spirit Spotlight */}
                  <div
                    className={`lg:col-span-5 rounded-2xl border p-6 sm:p-8 flex flex-col justify-between transition-colors duration-200 ${
                      isActivePanther
                        ? 'bg-[#101211] text-[#F8F5EF] border-[#C6A667]/40'
                        : 'bg-[#FAF8F3] dark:bg-[#121C17] text-[#202020] dark:text-[#F1EFEA] border-[#202020]/10 dark:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 pb-5 border-b border-current/10">
                      <div className="flex items-center gap-3">
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums tracking-wider ${
                            isActivePanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                          }`}
                        >
                          {String(activeIdx + 1).padStart(2, '0')} / {String(personalities.length).padStart(2, '0')}
                        </span>
                        <span className="text-xs opacity-40">·</span>
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${
                            isActivePanther ? 'text-[#C6A667]' : 'text-[#202020]/65 dark:text-[#F1EFEA]/65'
                          }`}
                        >
                          {activePersonality.is_future_collection === 1
                            ? t('Bộ sưu tập tương lai', 'Future Release')
                            : lang === 'vi'
                              ? activePersonality.product_association_vi
                              : activePersonality.product_association_en}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => stepPersonality(-1)}
                          aria-label={t('Linh vật trước', 'Previous archetype')}
                          className="w-8 h-8 rounded-lg border border-current/15 flex items-center justify-center hover:border-current/40 transition-colors cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => stepPersonality(1)}
                          aria-label={t('Linh vật tiếp theo', 'Next archetype')}
                          className="w-8 h-8 rounded-lg border border-current/15 flex items-center justify-center hover:border-current/40 transition-colors cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div key={activePersonality.slug} className="py-6 space-y-6 flex-1 flex flex-col justify-center">
                      <div
                        className={`relative aspect-square w-full max-w-[260px] mx-auto rounded-xl overflow-hidden border ${
                          isActivePanther
                            ? 'bg-[#090A09] border-[#C6A667]/35'
                            : 'bg-[#F3EFE5] border-[#202020]/10 dark:border-[#C6A667]/20'
                        }`}
                      >
                        <MediaImage
                          imageKey={activePersonality.custom_image_url || activePersonality.image_key}
                          alt={`${activePersonality.animal_en} — ${activePersonality.animal_vi}`}
                          className="w-full h-full object-cover scale-[1.09] transition-transform duration-200"
                        />
                      </div>

                      <div className="space-y-2.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">
                            {lang === 'vi'
                              ? activePersonality.animal_vi
                              : `${activePersonality.animal_en} · ${activePersonality.animal_vi}`}
                          </h3>
                          {lang === 'vi' && (
                            <span className="text-xs font-mono uppercase tracking-[0.14em] opacity-50">
                              {activePersonality.animal_en}
                            </span>
                          )}
                        </div>

                        <p
                          className={`text-xs font-medium tracking-wide ${
                            isActivePanther ? 'text-[#C6A667]' : 'text-[#00552B] dark:text-[#C6A667]'
                          }`}
                        >
                          {lang === 'vi' ? activePersonality.traits_vi : activePersonality.traits_en}
                        </p>

                        <p
                          className={`text-sm leading-relaxed line-clamp-3 pt-1 ${
                            isActivePanther ? 'text-[#F8F5EF]/80' : 'text-[#202020]/75 dark:text-[#F1EFEA]/75'
                          }`}
                        >
                          {activeStoryPreview}
                        </p>
                      </div>
                    </div>

                    <div className="pt-5 border-t border-current/10 flex flex-wrap items-center gap-3">
                      <Link
                        to={localePath(`/personalities/${activePersonality.slug}`)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 whitespace-nowrap ${
                          isActivePanther
                            ? 'bg-[#C6A667] text-[#111111]'
                            : 'bg-[#00552B] text-white dark:bg-[#C6A667] dark:text-[#111111]'
                        }`}
                      >
                        <span>
                          {t(`Khám phá bản sắc ${activePersonality.animal_vi}`, `Explore ${activePersonality.animal_en}`)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {activePersonality.is_future_collection !== 1 && (
                        <Link
                          to={localePath(
                            isActivePanther
                              ? '/signature-reserve'
                              : `/product/${activePersonality.associated_product_slug}`
                          )}
                          className="text-xs font-semibold underline-offset-4 hover:underline opacity-80 hover:opacity-100 whitespace-nowrap"
                        >
                          {t('Xem dòng cà phê gắn kết →', 'View paired coffee →')}
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Right: Balanced 6 Heritage Crests + Full-Width Flagship Reserve Plate */}
                  <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 sm:gap-4">
                      {heritageSpirits.map((m) => {
                        const globalIdx = personalities.findIndex((p) => p.slug === m.slug);
                        const isSelected = activePersonality.slug === m.slug;
                        return (
                          <Link
                            key={m.slug}
                            to={localePath(`/personalities/${m.slug}`)}
                            onMouseEnter={() => setActivePersonalitySlug(m.slug)}
                            onFocus={() => setActivePersonalitySlug(m.slug)}
                            className={`group rounded-xl border p-3.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 ${
                              isSelected
                                ? 'bg-white dark:bg-[#17251E] border-[#00552B]/60 dark:border-[#C6A667]/60 ring-1 ring-[#00552B]/25 dark:ring-[#C6A667]/25'
                                : 'bg-[#FAF8F3] dark:bg-[#121C17] border-[#202020]/10 dark:border-white/10 hover:border-[#00552B]/40 dark:hover:border-[#C6A667]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span
                                className={`font-mono text-[11px] font-semibold tabular-nums ${
                                  isSelected ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#202020]/45 dark:text-[#F1EFEA]/45'
                                }`}
                              >
                                {String((globalIdx >= 0 ? globalIdx : 0) + 1).padStart(2, '0')}
                              </span>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-[#202020]/45 dark:text-[#F1EFEA]/45">
                                {m.is_future_collection === 1 ? t('Sắp ra mắt', 'Upcoming') : m.animal_en}
                              </span>
                            </div>

                            <div className="aspect-square rounded-lg overflow-hidden bg-[#F3EFE5] border border-[#202020]/8 dark:border-[#C6A667]/15 mb-3">
                              <MediaImage
                                imageKey={m.custom_image_url || m.image_key}
                                alt={`${m.animal_en} — ${m.animal_vi}`}
                                className="w-full h-full object-cover scale-[1.09] group-hover:scale-[1.13] transition-transform duration-200"
                              />
                            </div>

                            <div className="space-y-1">
                              <h3 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA] leading-tight">
                                {lang === 'vi' ? m.animal_vi : `${m.animal_en} · ${m.animal_vi}`}
                              </h3>
                              <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 line-clamp-1">
                                {lang === 'vi' ? m.traits_vi : m.traits_en}
                              </p>
                              <p className="text-[10px] pt-1 font-semibold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667] truncate">
                                {lang === 'vi' ? m.product_association_vi : m.product_association_en}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>

                    {pantherSpirit && (
                      <Link
                        to={localePath(`/personalities/${pantherSpirit.slug}`)}
                        onMouseEnter={() => setActivePersonalitySlug(pantherSpirit.slug)}
                        onFocus={() => setActivePersonalitySlug(pantherSpirit.slug)}
                        className={`group rounded-xl border p-4 sm:p-5 bg-[#101211] text-[#F8F5EF] flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 transition-all duration-200 hover:-translate-y-0.5 ${
                          isActivePanther
                            ? 'border-[#C6A667] ring-1 ring-[#C6A667]/35'
                            : 'border-[#C6A667]/30 hover:border-[#C6A667]/70'
                        }`}
                      >
                        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-lg overflow-hidden bg-[#090A09] border border-[#C6A667]/30">
                          <MediaImage
                            imageKey={pantherSpirit.custom_image_url || pantherSpirit.image_key}
                            alt={`${pantherSpirit.animal_en} — ${pantherSpirit.animal_vi}`}
                            className="w-full h-full object-cover scale-[1.07] group-hover:scale-[1.11] transition-transform duration-200"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C6A667]">
                            <span className="font-mono tabular-nums">07</span>
                            <span className="opacity-45">·</span>
                            <span>
                              {lang === 'vi' ? pantherSpirit.product_association_vi : pantherSpirit.product_association_en}
                            </span>
                          </div>
                          <h3 className="text-lg sm:text-xl font-bold text-[#F8F5EF] tracking-tight">
                            {lang === 'vi'
                              ? `${pantherSpirit.animal_vi} (${pantherSpirit.animal_en})`
                              : `${pantherSpirit.animal_en} · ${pantherSpirit.animal_vi}`}
                          </h3>
                          <p className="text-xs text-[#F8F5EF]/75 leading-relaxed">
                            {lang === 'vi' ? pantherSpirit.traits_vi : pantherSpirit.traits_en}
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C6A667] whitespace-nowrap sm:self-center">
                          <span>{t('Signature Reserve', 'Signature Reserve')}</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* 5. GREEN COFFEE BEANS (B2B CONFIGURABLE MATRIX GATEWAY) */}
      <section className="max-w-[1280px] mx-auto px-6 py-16">
        <div className="bg-[#003D25] text-white rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C6A667]">
              {t('Thương mại B2B & Xuất khẩu', 'B2B Green Coffee Supply')}
            </p>
            <h2 className="text-3xl font-bold text-balance">
              {t('Cà Phê Nhân Xanh Việt Nam — 27 Cấu Hình Chuẩn Hóa', 'Vietnamese Green Coffee Beans — 27 Configurable Specifications')}
            </h2>
            <p className="text-sm text-[#F8F5EF]/80 leading-relaxed">
              {t(
                'Hệ thống cấu hình 3 dòng hạt (Robusta, Arabica, Culi/Peaberry) × 3 cỡ sàng (S14, S16, S18) × 3 phương pháp chế biến (Natural, Honey, Washed CBU). Dễ dàng tra cứu thông số, yêu cầu mẫu thử và nhận báo giá 30kg, 60kg, 69kg hoặc Big Bag 1.000kg.',
                'Configure across 3 classifications (Robusta, Arabica, Culi / Peaberry) × 3 screen sizes (S14, S16, S18) × 3 processing methods (Natural, Honey, Washed CBU). Request verified samples and quotations from 30kg bags to 1,000kg Big Bags.'
              )}
            </p>

            {/* Quick Interactive Matrix Builder */}
            <div className="bg-white/10 rounded-xl p-4 space-y-3 border border-white/15">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[#C6A667] block mb-1 font-medium">{t('Dòng hạt', 'Type')}</span>
                  <select
                    value={gcType}
                    onChange={(e) => setGcType(e.target.value)}
                    className="w-full bg-[#002D1B] border border-white/20 rounded px-2 py-2 text-white"
                  >
                    <option value="RO">Robusta (RO)</option>
                    <option value="AR">Arabica (AR)</option>
                    <option value="CU">{t('Culi / Hạt tròn (CU)', 'Culi / Peaberry (CU)')}</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#C6A667] block mb-1 font-medium">{t('Cỡ sàng', 'Screen')}</span>
                  <select
                    value={gcScreen}
                    onChange={(e) => setGcScreen(e.target.value)}
                    className="w-full bg-[#002D1B] border border-white/20 rounded px-2 py-2 text-white"
                  >
                    <option value="S14">S14</option>
                    <option value="S16">S16</option>
                    <option value="S18">S18</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#C6A667] block mb-1 font-medium">{t('Chế biến', 'Process')}</span>
                  <select
                    value={gcProc}
                    onChange={(e) => setGcProc(e.target.value)}
                    className="w-full bg-[#002D1B] border border-white/20 rounded px-2 py-2 text-white"
                  >
                    <option value="NAT">{t('Sơ chế Khô (Natural)', 'Natural')}</option>
                    <option value="HON">{t('Sơ chế Mật ong (Honey)', 'Honey')}</option>
                    <option value="CBU">{t('Chế biến ướt (CBU)', 'Washed (CBU)')}</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <span className="font-mono text-sm text-[#C6A667] font-semibold">SKU: {selectedGreenSku}</span>
                <div className="flex gap-2">
                  <Link
                    to={localePath(`/product/${selectedGreenSlug}`)}
                    className="px-4 py-2 bg-[#C6A667] text-[#111111] text-xs font-semibold rounded hover:bg-[#d4b67a] transition-colors"
                  >
                    {t('Xem thông số & Yêu cầu mẫu', 'Inspect Spec & Sample')}
                  </Link>
                  <Link
                    to={localePath('/coffee/green-beans')}
                    className="px-4 py-2 border border-white/25 text-white text-xs font-medium rounded hover:bg-white/10 transition-colors"
                  >
                    {t('Mở ma trận 27 mã', 'Full 27-SKU Matrix')}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 aspect-[4/3] rounded-xl overflow-hidden border border-white/15">
            <MediaImage
              imageKey="product_green_coffee_beans"
              alt="Natural, Honey, and Washed CBU green coffee sorting trays"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 6. VIETNAMESE COFFEE ORIGIN MAP */}
      <section className="max-w-[1280px] mx-auto px-6 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
              {t('Khám phá vùng nguyên liệu cà phê Việt Nam', 'Discover the Origins of Vietnamese Coffee')}
            </p>
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
              {t('10 Vùng Trồng Cà Phê Việt Nam — Bản Đồ Vệ Tinh & Địa Hình Thật', '10 Vietnamese Coffee Regions — Real Satellite & Terrain Map')}
            </h2>
          </div>
        </div>
        <VietnamOriginMap compact />
      </section>

      {/* 7 & 8. FROM FARM TO CUP + BREWING EXPERIENCE */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <Compass className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
            <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Hành trình Từ Nông Trại Đến Tách Cà Phê', 'From Farm to Cup Journey')}
            </h3>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {t(
                '8 giai đoạn khép kín: Canh tác · Thu hái chín · Chế biến Natural / Honey / CBU · Tuyển chọn nhân xanh · Rang chuẩn · Xay · Pha chế · Thưởng thức.',
                'Eight disciplined stages: Cultivation · Selective Harvesting · Natural / Honey / CBU Processing · Green Selection · Roasting · Grinding · Brewing · Enjoying.'
              )}
            </p>
          </div>
          <Link
            to={localePath('/farm-to-cup')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
          >
            <span>{t('Khám phá quy trình 8 bước', 'Explore the 8-Stage Process')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <Flame className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
            <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Nghệ thuật Pha Chế Chuẩn Mực', 'Coffee Brewing Guide')}
            </h3>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {t(
                'Công thức tham chiếu song ngữ cho Phin Việt Nam (20g · ủ 30s · 4–5 phút), Espresso (18g → 36g · 90–94°C), Pour-over, French Press và Cold Brew.',
                'Interactive bilingual recipes for Vietnamese Phin (20g · 30s bloom · 4–5m), Espresso (18g → 36g · 90–94°C), Pour-over, French Press, and Cold Brew.'
              )}
            </p>
          </div>
          <Link
            to={localePath('/brewing')}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
          >
            <span>{t('Mở hướng dẫn pha chế', 'Open Brewing Calculator & Guide')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 9. SIGNATURE RESERVE LUXURY SPOTLIGHT */}
      <section className="relative overflow-hidden bg-[#070807] text-[#F8F5EF] py-14 sm:py-20 border-y border-[#C6A667]/20">
        {/* Subtle atmospheric champagne & forest glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 78% 35%, rgba(198,166,103,0.11), transparent 55%), radial-gradient(circle at 15% 80%, rgba(0,85,43,0.14), transparent 50%)',
          }}
        />

        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Narrative & Blend Architecture */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="w-8 h-px bg-[#C6A667]" />
              <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#C6A667]">
                {t('Phiên bản Độc bản · Báo Đen', 'Flagship Reserve · Black Panther')}
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-white leading-[1.1] text-balance">
                ROAR COFFEE{' '}
                <span className="block text-[#C6A667] font-semibold mt-1">
                  SIGNATURE RESERVE
                </span>
              </h2>
            </div>

            <p className="text-sm sm:text-base text-[#F8F5EF]/78 leading-relaxed max-w-xl">
              {t(
                'Tuyệt phẩm sang trọng mang dấu ấn Báo Đen — phối trộn kiến trúc từ nhân xanh CBU chỉ định trong diện mạo hộp thiếc đen huyền và vàng champagne dành cho thưởng thức tinh tế và quà tặng cấp cao.',
                'Our flagship Black Panther edition — an architectural blend anchored by CBU-washed highland lots, presented in matte obsidian and champagne gold for refined rituals and executive gifting.'
              )}
            </p>

            {/* Precision 60 / 20 / 20 Blend Ratio Architecture */}
            <div className="space-y-3 pt-1 max-w-xl">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#F8F5EF]/55">
                <span>{t('Tỷ lệ Phối trộn Độc bản', 'Signature Blend Architecture')}</span>
                <span className="font-mono text-[#C6A667]">60 · 20 · 20</span>
              </div>

              <div className="h-1.5 rounded-full overflow-hidden flex gap-1 bg-white/5">
                <div className="h-full bg-[#C6A667] rounded-l-full" style={{ width: '60%' }} />
                <div className="h-full bg-[#8A7143]" style={{ width: '20%' }} />
                <div className="h-full bg-[#1C6B45] rounded-r-full" style={{ width: '20%' }} />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-1 border-t border-white/10">
                <div>
                  <div className="font-mono text-base sm:text-lg font-bold text-[#C6A667] tabular-nums">60%</div>
                  <div className="text-xs font-semibold text-white">Robusta S18</div>
                  <div className="text-[11px] text-[#F8F5EF]/55">{t('Nội lực đậm sánh', 'Commanding body')}</div>
                </div>
                <div>
                  <div className="font-mono text-base sm:text-lg font-bold text-[#D6C39A] tabular-nums">20%</div>
                  <div className="text-xs font-semibold text-white">Culi Peaberry</div>
                  <div className="text-[11px] text-[#F8F5EF]/55">{t('Hậu vị nhung lụa', 'Velvety depth')}</div>
                </div>
                <div>
                  <div className="font-mono text-base sm:text-lg font-bold text-[#67B58D] tabular-nums">20%</div>
                  <div className="text-xs font-semibold text-white">Arabica CBU</div>
                  <div className="text-[11px] text-[#F8F5EF]/55">{t('Hương hoa thanh lịch', 'Floral lift')}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to={localePath('/signature-reserve')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#C6A667] text-[#111111] text-sm font-bold rounded-lg hover:bg-[#d5b578] transition-colors shadow-lg shadow-[#C6A667]/10"
              >
                <span>{t('Khám phá Signature Reserve', 'Discover Signature Reserve')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={localePath('/product/signature-reserve')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#C6A667]/40 bg-white/[0.02] text-[#C6A667] text-sm font-medium rounded-lg hover:bg-[#C6A667]/10 hover:border-[#C6A667] transition-colors"
              >
                <span>{t('Đặt mua ngay', 'Shop Reserve Edition')}</span>
              </Link>
            </div>
          </div>

          {/* Right Unified Gallery Stage */}
          <div className="lg:col-span-6 space-y-3 sm:space-y-4">
            <div className="group relative aspect-[16/10] rounded-2xl overflow-hidden border border-[#C6A667]/30 bg-[#0D0F0E] shadow-2xl">
              <MediaImage
                imageKey="product_signature_reserve"
                alt="ROAR COFFEE Signature Reserve Obsidian & Gold Edition"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C6A667]">
                    Obsidian Canister · Champagne Foil
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {t('Hộp thiếc 250g & Hộp quà Cao cấp 500g', '250g Tin & 500g Luxury Gift Box')}
                  </p>
                </div>
                <span className="hidden sm:inline-block font-mono text-[11px] text-[#F8F5EF]/70 border border-white/15 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded">
                  Agtron ~48
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-3 sm:gap-4 items-stretch">
              <div className="col-span-4 sm:col-span-4 aspect-square rounded-xl overflow-hidden border border-[#C6A667]/30 bg-[#0B0B0B]">
                <MediaImage
                  imageKey="mascot_panther"
                  alt="Black Panther Crest — Signature Reserve"
                  className="w-full h-full object-cover scale-[1.05]"
                />
              </div>
              <div className="col-span-8 sm:col-span-8 rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col justify-between gap-2">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C6A667]">
                    {t('Hồ sơ Hương vị & Quà tặng', 'Tasting & Gifting Notes')}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-white leading-snug">
                    {t(
                      'Cacao đen nguyên chất · Vani ấm · Quả sung sấy · Hậu vị nhung lụa',
                      'Pure cacao nib · Warm vanilla bean · Dried fig · Silky cashmere finish'
                    )}
                  </p>
                  <p className="text-[11px] sm:text-xs text-[#F8F5EF]/65 leading-relaxed line-clamp-2">
                    {t(
                      'Phối trộn chuẩn mực cho Espresso, Phin sang trọng và quà tặng đối tác cao cấp.',
                      'Calibrated for velvety espresso, refined Phin service, and bespoke corporate gifting.'
                    )}
                  </p>
                </div>
                <Link
                  to={localePath('/product/signature-reserve')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C6A667] hover:underline pt-1"
                >
                  <span>{t('Xem chi tiết thông số & đặt hộp quà →', 'View full specs & gift sets →')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10 & 11. WHOLESALE / DISTRIBUTION + OEM & EXPORT */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-8 space-y-4">
          <PackageCheck className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
          <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Phân phối, Bán sỉ & Giải pháp HORECA', 'Wholesale, Distribution & HORECA')}
          </h3>
          <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
            {t(
              'Cung ứng ổn định cho chuỗi cà phê, nhà hàng, khách sạn, siêu thị và nhà phân phối với chính sách giá đối tác, mẫu thử và hỗ trợ kỹ thuật pha chế.',
              'Dedicated partner supply for cafes, hotels, restaurants, retailers, and distributors — featuring tiered partner pricing, sample kits, and barista consultation.'
            )}
          </p>
          <Link to={localePath('/partners')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
            <span>{t('Cổng đối tác B2B', 'Enter B2B Partner Portal')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-8 space-y-4">
          <Globe2 className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
          <h3 className="text-2xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Gia công OEM, Nhãn riêng & Xuất khẩu Quốc tế', 'OEM, Private Label & Global Export')}
          </h3>
          <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
            {t(
              'Hỗ trợ tìm nguồn nhân xanh, gia công rang xay, đóng gói nhãn hiệu riêng (Private Label) và tư vấn hồ sơ xuất khẩu theo năng lực xác thực từng dự án.',
              'End-to-end green coffee sourcing, contract roasting, private-label packaging, MOQ planning, and verified export documentation support for international buyers.'
            )}
          </p>
          <Link to={localePath('/oem-export')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
            <span>{t('Gửi yêu cầu OEM / Xuất khẩu', 'Submit OEM & Export Inquiry')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 12 & 13. MEMBER BENEFITS & ACTIVE PROMOTIONS */}
      <section className="bg-white dark:bg-[#131D18] border-y border-[#202020]/10 dark:border-white/10 py-16">
        <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-4">
            <Award className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA]">
              {t('Thành viên ROAR COFFEE & Điểm Thưởng', 'ROAR COFFEE Members & Rewards')}
            </h2>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {t(
                'Tích điểm trên mỗi đơn hàng hợp lệ (cấu hình tham chiếu 1 điểm / 10.000đ · 1 điểm = 100đ) và thăng hạng qua 4 cấp bậc: Thành viên, Bạc, Vàng và Reserve.',
                'Earn points across eligible purchases under configurable rules and unlock four membership tiers: ROAR Member, ROAR Silver, ROAR Gold, and ROAR Reserve.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link to={localePath('/account')} className="px-5 py-2.5 bg-[#00552B] text-white text-sm font-medium rounded hover:bg-[#003D25]">
                {t('Đăng ký / Đăng nhập', 'Join ROAR Members')}
              </Link>
              <Link to={localePath('/play')} className="px-5 py-2.5 bg-[#C6A667] text-[#111111] text-sm font-semibold rounded hover:bg-[#b59454]">
                {t('Chơi Mini-Game Nhận Quà →', 'Play & Win Gifts →')}
              </Link>
              <Link to={localePath('/promotions')} className="px-5 py-2.5 border border-[#00552B]/30 dark:border-[#C6A667]/40 text-[#00552B] dark:text-[#C6A667] text-sm font-medium rounded hover:bg-[#00552B]/5">
                {t('Xem tất cả ưu đãi', 'All Active Offers')}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-[#F8F5EF] dark:bg-[#1A2820] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] bg-[#0B120E] overflow-hidden">
                    <MediaImage
                      imageKey={getPromoVoucherImage(promo)}
                      alt={lang === 'vi' ? promo.title_vi : promo.title_en}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded bg-[#111111]/85 text-[#C6A667] font-mono text-[11px] font-bold tracking-wider">
                      {promo.code}
                    </span>
                    <span className="absolute bottom-2 right-2.5 px-2 py-0.5 rounded bg-black/70 text-white/90 font-mono text-[10px] tabular-nums">
                      {t('Hạn:', 'Valid until')} {promo.end_date}
                    </span>
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h3 className="text-base font-bold text-[#202020] dark:text-[#F1EFEA]">
                      {lang === 'vi' ? promo.title_vi : promo.title_en}
                    </h3>
                    <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed line-clamp-2">
                      {lang === 'vi' ? promo.description_vi : promo.description_en}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <Link
                    to={localePath('/shop')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
                  >
                    <span>{t('Mua sắm ngay', 'Shop Now')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 14. COFFEE JOURNAL */}
      <section className="max-w-[1280px] mx-auto px-6 py-16 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667]">
              {t('Tạp chí & Tri thức Cà phê', 'Coffee Journal')}
            </p>
            <h2 className="text-3xl font-bold text-[#202020] dark:text-[#F1EFEA] mt-1">
              {t('Góc nhìn chuyên sâu từ ROAR COFFEE', 'Editorial & Origin Science')}
            </h2>
          </div>
          <Link to={localePath('/journal')} className="text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline">
            {t('Đọc tất cả bài viết →', 'View Journal →')}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((a) => (
            <Link
              key={a.id}
              to={localePath(`/journal/${a.slug}`)}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col hover:-translate-y-0.5 transition-transform"
            >
              <div className="aspect-[4/5] bg-[#F8F5EF] dark:bg-[#0E1512] overflow-hidden">
                <MediaImage
                  imageKey={a.image_key}
                  alt={lang === 'vi' ? a.title_vi : a.title_en}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#202020]/55 dark:text-[#F1EFEA]/55">
                    <span>{localizeJournalCategory(a.category, lang)}</span>
                    <span>·</span>
                    <span>{a.read_minutes} {t('phút đọc', 'min read')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#202020] dark:text-[#F1EFEA] leading-snug">
                    {lang === 'vi' ? a.title_vi : a.title_en}
                  </h3>
                  <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 line-clamp-2">
                    {lang === 'vi' ? a.excerpt_vi : a.excerpt_en}
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#00552B] dark:text-[#C6A667] pt-2 inline-block">
                  {t('Đọc bài viết →', 'Read Article →')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
