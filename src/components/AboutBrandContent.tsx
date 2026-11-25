import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Briefcase,
  Coffee,
  Compass,
  Flame,
  Gift,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from 'lucide-react';
import { AdaptiveLogo } from './AdaptiveLogo';
import { AdminPageEditLink } from './AdminPageEditBar';
import { MediaImage } from './MediaImage';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { fetchProductsWithFallback } from '../lib/staticFallback';

const ABOUT_SEO = {
  vi: {
    title: 'Giới thiệu ROAR Coffee | Thương hiệu cà phê Việt Nam',
    description:
      'Khám phá ROAR Coffee, thương hiệu cà phê Việt Nam lấy cảm hứng từ Robusta, Arabica và bản sắc cà phê Việt. Khơi bản lĩnh. Đậm chất riêng.',
  },
  en: {
    title: 'About ROAR Coffee | Vietnamese Coffee Brand',
    description:
      'Discover ROAR Coffee, a Vietnamese coffee brand inspired by Robusta, Arabica and the distinctive spirit of Vietnamese coffee culture.',
  },
};

export const AboutBrandContent: React.FC = () => {
  const { lang, t, localePath } = useI18n();
  const { theme, cmsPages, personalities, formatPrice } = useStore();
  const page = cmsPages['about'];
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetchProductsWithFallback(new URLSearchParams())
      .then((list) => {
        if (!active) return;
        setCatalogProducts(list.filter((p) => p.status !== 'draft'));
      })
      .finally(() => {
        if (active) setProductsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Bilingual SEO meta + Schema.org AboutPage JSON-LD
  useEffect(() => {
    const seo = lang === 'vi' ? ABOUT_SEO.vi : ABOUT_SEO.en;
    const prevTitle = document.title;
    document.title = seo.title;

    const setMeta = (selector: string, content: string) => {
      const el = document.querySelector(selector);
      const prev = el?.getAttribute('content') || '';
      if (el) el.setAttribute('content', content);
      return { el, prev };
    };

    const metaUpdates = [
      setMeta('meta[name="description"]', seo.description),
      setMeta('meta[property="og:title"]', seo.title),
      setMeta('meta[property="og:description"]', seo.description),
      setMeta('meta[name="twitter:title"]', seo.title),
      setMeta('meta[name="twitter:description"]', seo.description),
    ];

    const scriptId = 'roar-about-jsonld';
    let jsonLdScript = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!jsonLdScript) {
      jsonLdScript = document.createElement('script');
      jsonLdScript.id = scriptId;
      jsonLdScript.type = 'application/ld+json';
      document.head.appendChild(jsonLdScript);
    }
    jsonLdScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: seo.title,
      description: seo.description,
      inLanguage: lang === 'vi' ? 'vi-VN' : 'en-US',
      mainEntity: {
        '@type': 'Organization',
        name: 'ROAR COFFEE',
        slogan:
          lang === 'vi'
            ? 'Khơi bản lĩnh. Đậm chất riêng.'
            : 'Igniting Courage. Defining Character.',
        description: seo.description,
      },
    });

    return () => {
      document.title = prevTitle;
      for (const m of metaUpdates) {
        if (m.el && m.prev) m.el.setAttribute('content', m.prev);
      }
      const existingScript = document.getElementById(scriptId);
      if (existingScript) existingScript.remove();
    };
  }, [lang]);

  const ecosystemGroups = useMemo(() => {
    const nonVoucherRoasted = catalogProducts.filter(
      (p) => p.category === 'roasted' && p.sub_category !== 'Gift Voucher' && !p.slug.startsWith('gift-voucher-')
    );
    const roastedBeans = catalogProducts.filter((p) => p.category === 'roasted_beans');
    const instantList = catalogProducts.filter((p) => p.category === 'instant');
    const greenList = catalogProducts.filter((p) => p.category === 'green_bean');

    return [
      {
        id: 'roasted',
        to: '/coffee/roasted',
        tagVi: '01 · CÀ PHÊ RANG XAY & SIGNATURE RESERVE',
        tagEn: '01 · ROASTED COFFEE & SIGNATURE RESERVE',
        titleVi: 'Cà phê Rang xay & Phối trộn Đặc trưng',
        titleEn: 'Roasted Ground & Signature Reserve Blends',
        descVi:
          'Từ Phin truyền thống đậm đà đến Signature Reserve (60% Robusta · 20% Culi · 20% Arabica), Robusta House Blend và Arabica Selection cho thưởng thức tại nhà.',
        descEn:
          'From bold Vietnamese Phin heritage blends to Signature Reserve (60% Robusta · 20% Culi · 20% Arabica), Robusta House Blend, and Arabica Selection for daily rituals.',
        items: nonVoucherRoasted.slice(0, 5),
        fallbackImage: 'product_signature_reserve',
      },
      {
        id: 'roasted_beans',
        to: '/coffee/roasted-beans',
        tagVi: '02 · CÀ PHÊ HẠT RANG & HORECA / B2B',
        tagEn: '02 · ROASTED WHOLE BEANS & HORECA / B2B',
        titleVi: 'Cà phê Hạt rang theo Khối lượng (1kg – ≥100kg)',
        titleEn: 'Whole Roasted Beans by Volume Tier (1kg – ≥100kg)',
        descVi:
          'Đóng gói nguyên hạt rang mới cho quán cà phê, văn phòng và chuỗi F&B với chính sách giá minh bạch theo 5 bậc sản lượng: 1kg · 5–19kg · 20–49kg · 50–99kg · ≥100kg.',
        descEn:
          'Freshly roasted whole beans tailored for cafés, offices, and hospitality bars with transparent five-bracket volume pricing: 1kg · 5–19kg · 20–49kg · 50–99kg · ≥100kg.',
        items: roastedBeans.slice(0, 5),
        fallbackImage: 'product_roasting_drum_clean',
      },
      {
        id: 'instant',
        to: '/coffee/instant',
        tagVi: '03 · CÀ PHÊ HÒA TAN SILVER & GOLD',
        tagEn: '03 · INSTANT SILVER & GOLD COLLECTIONS',
        titleVi: 'Cà phê Hòa tan Tiện lợi & Tinh tuyển',
        titleEn: 'Silver & Gold Instant Collections',
        descVi:
          'Giải pháp thưởng thức nhanh gọn giữa nhịp sống hiện đại nhưng vẫn giữ được bản sắc hương vị Việt trong hai phiên bản Silver Collection và Gold Collection.',
        descEn:
          'Effortless daily preparation for fast-paced schedules while preserving unmistakable Vietnamese coffee character across Silver and Gold editions.',
        items: instantList.slice(0, 4),
        fallbackImage: 'product_instant_silver_gold',
      },
      {
        id: 'green_bean',
        to: '/coffee/green-beans',
        tagVi: '04 · CÀ PHÊ NHÂN XANH S14 / S16 / S18',
        tagEn: '04 · GREEN COFFEE BEANS (S14 / S16 / S18)',
        titleVi: 'Nhân xanh Tuyển chọn (Natural · Honey · CBU Washed)',
        titleEn: 'Graded Green Coffee (Natural · Honey · CBU Washed)',
        descVi:
          'Danh mục nhân xanh Robusta, Arabica và Culi phân sàng S14, S16, S18 phục vụ nhà rang xay độc lập, đối tác OEM và nhu cầu xuất khẩu chuyên nghiệp.',
        descEn:
          'Screen-graded Robusta, Arabica, and Culi green beans across S14, S16, and S18 sizes for independent roasters, OEM partners, and export buyers.',
        items: greenList.slice(0, 4),
        fallbackImage: 'product_green_coffee_beans',
      },
    ];
  }, [catalogProducts]);

  const cmsEyebrow = lang === 'vi' ? page?.eyebrow_vi : page?.eyebrow_en;
  const cmsBody = lang === 'vi' ? page?.body_vi : page?.body_en;
  const cmsCustomSections = page?.sections && page.sections.length > 0 ? page.sections : [];

  const journeyStages = [
    {
      num: '01',
      titleVi: 'Vùng trồng cà phê Việt Nam',
      titleEn: 'Vietnamese Coffee Origins',
      bodyVi:
        'Kết nối đặc trưng khí hậu và thổ nhưỡng từ các vùng cà phê tiêu biểu của Việt Nam để chọn đúng giống hạt phù hợp từng phong cách rang.',
      bodyEn:
        'Connecting diverse climates, elevations, and basalt plateaus across Vietnam to match each bean variety with its intended roast expression.',
      img: 'origin_central_highlands',
      altVi: 'Vùng nguyên liệu cà phê cao nguyên Việt Nam',
      altEn: 'Vietnamese highland coffee plantation',
      to: '/origins',
      linkLabelVi: 'Bản đồ vùng trồng',
      linkLabelEn: 'Explore Origin Map',
    },
    {
      num: '02',
      titleVi: 'Thu hái chọn lọc',
      titleEn: 'Selective Harvesting',
      bodyVi:
        'Chú trọng độ chín đồng đều của quả cà phê khi thu hoạch, tạo nền tảng vị ngọt tự nhiên và sự sạch sẽ cho hương vị về sau.',
      bodyEn:
        'Prioritizing ripe cherry maturity at harvest to build natural sweetness, balance, and clarity before roasting begins.',
      img: 'hero_highland_harvest_banner',
      altVi: 'Thu hái chọn lọc quả cà phê chín đỏ',
      altEn: 'Selective harvesting of ripe coffee cherries',
      to: '/farm-to-cup',
      linkLabelVi: 'Quy trình từ nông trại',
      linkLabelEn: 'Farm to Cup Flow',
    },
    {
      num: '03',
      titleVi: 'Phương pháp sơ chế chuẩn hóa',
      titleEn: 'Processing Precision',
      bodyVi:
        'Phân biệt và ứng dụng có chủ đích ba phương pháp sơ chế: Natural (phơi tự nhiên), Honey (bán ướt giữ nhớt) và CBU (chế biến ướt).',
      bodyEn:
        'Purposely matching three disciplined processing methods: Natural sun-dried, Honey mucilage-retained, and CBU Washed fermentation.',
      img: 'journal_coffee_processes',
      altVi: 'So sánh sơ chế Natural, Honey và CBU Washed',
      altEn: 'Comparison of Natural, Honey and CBU Washed processing',
      to: '/farm-to-cup',
      linkLabelVi: 'Tìm hiểu 3 phương pháp',
      linkLabelEn: 'Compare Methods',
    },
    {
      num: '04',
      titleVi: 'Kỹ thuật rang kiểm soát nhiệt',
      titleEn: 'Precision Roast Profiling',
      bodyVi:
        'Hồ sơ rang riêng cho từng dòng hạt và mục đích sử dụng — giữ được lực đậm truyền thống của Robusta lẫn tầng hương tinh tế của Arabica.',
      bodyEn:
        'Individualized thermal roast curves calibrated per bean density — balancing Robusta depth with Arabica aromatic complexity.',
      img: 'journal_s18_roastery',
      altVi: 'Rang kiểm soát nhiệt cho cà phê hạt sàng S18',
      altEn: 'Precision roastery profile for Screen 18 beans',
      to: '/coffee/roasted-beans',
      linkLabelVi: 'Xem dòng hạt rang',
      linkLabelEn: 'View Roasted Beans',
    },
    {
      num: '05',
      titleVi: 'Pha chế & Trải nghiệm thưởng thức',
      titleEn: 'Brewing & Sensory Ritual',
      bodyVi:
        'Từ Phin truyền thống, Espresso hiện đại đến Cold Brew ủ lạnh — mỗi ly cà phê là sự hòa quyện giữa kỷ luật kỹ thuật và gu riêng của người uống.',
      bodyEn:
        'From traditional Phin extraction and Espresso bars to cold-steeped brews — each cup unites technical discipline with personal character.',
      img: 'journal_phin_ritual',
      altVi: 'Chiết xuất phin cà phê Việt Nam chuẩn gu ROAR COFFEE',
      altEn: 'Traditional Vietnamese Phin coffee extraction ritual',
      to: '/brewing-handbook',
      linkLabelVi: 'Mở Cẩm nang pha chế',
      linkLabelEn: 'Brewing Handbook',
    },
  ];

  const commitments = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
      titleVi: 'Kỷ luật tuyển chọn nguyên liệu',
      titleEn: 'Disciplined Ingredient Selection',
      bodyVi:
        'Phân loại rõ ràng theo giống hạt (Robusta, Arabica, Culi), cỡ sàng (S14, S16, S18) và phương pháp sơ chế; minh bạch chứng thư COA theo từng lô khi cung ứng B2B.',
      bodyEn:
        'Clear classification by variety (Robusta, Arabica, Culi), screen size (S14, S16, S18), and processing method, with lot-level COA verification workflows for B2B buyers.',
    },
    {
      icon: <Flame className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
      titleVi: 'Tính nhất quán trong từng mẻ rang',
      titleEn: 'Roast Batch Consistency',
      bodyVi:
        'Kiểm soát chặt biểu đồ nhiệt, tỷ lệ phối trộn và độ tươi của hạt sau rang để khách hàng cá nhân lẫn quán đối tác luôn nhận được hương vị ổn định.',
      bodyEn:
        'Controlled thermal profiles, blend ratios, and post-roast freshness help everyday drinkers and HORECA bars achieve repeatable extraction day after day.',
    },
    {
      icon: <Compass className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
      titleVi: 'Trung thực với nguồn gốc Việt Nam',
      titleEn: 'Honest Vietnamese Coffee Storytelling',
      bodyVi:
        'Không phóng đại tuyên bố. Chúng tôi tách bạch kiến thức địa lý vùng cà phê Việt Nam với thông tin sản phẩm thực tế, tôn trọng giá trị thật của người trồng và nhà rang.',
      bodyEn:
        'Zero exaggerated claims. We separate broader Vietnamese coffee geography from real catalog specifications, honoring growers, roasters, and informed buyers.',
    },
    {
      icon: <Users className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
      titleVi: 'Đồng hành bền vững cùng đối tác',
      titleEn: 'Responsible Long-Term Partnership',
      bodyVi:
        'Xây dựng niềm tin lâu dài từ chính sách giá theo sản lượng rõ ràng, tư vấn gu phối trộn phù hợp tệp khách và hỗ trợ vận hành tận tâm.',
      bodyEn:
        'Building enduring trust through transparent volume pricing tiers, sensory pairing guidance, and responsive fulfillment support.',
    },
  ];

  return (
    <div className="bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020] dark:text-[#F1EFEA] overflow-x-hidden">
      {/* SECTION 1 — WHO WE ARE & BRAND HERO */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-10 pb-14 lg:pt-14 lg:pb-20 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
                {cmsEyebrow ||
                  t(
                    '01 · CHÚNG TÔI LÀ AI? · KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.',
                    '01 · WHO WE ARE · IGNITING COURAGE. DEFINING CHARACTER.'
                  )}
              </p>
              <AdminPageEditLink slug="about" />
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#202020] dark:text-[#F1EFEA] leading-[1.12]">
              {t(
                'ROAR COFFEE — CÀ PHÊ VIỆT NAM. BẢN SẮC KHÁC BIỆT.',
                'ROAR COFFEE – VIETNAMESE COFFEE. DISTINCTIVE CHARACTER.'
              )}
            </h1>

            <div className="space-y-3.5 text-sm sm:text-base text-[#202020]/82 dark:text-[#F1EFEA]/82 leading-relaxed">
              {cmsBody ? (
                <p className="whitespace-pre-line font-medium text-[#202020] dark:text-[#F1EFEA]">
                  {cmsBody}
                </p>
              ) : null}
              <p>
                {t(
                  'ROAR COFFEE là thương hiệu cà phê Việt Nam được xây dựng trên nền tảng bản sắc cà phê Việt, niềm đam mê khám phá hương vị và tinh thần không ngừng khẳng định cá tính riêng.',
                  'ROAR COFFEE is a Vietnamese coffee brand built on the foundations of Vietnamese coffee identity, a passion for flavor exploration and the courage to express individuality.'
                )}
              </p>
              <p>
                {t(
                  'Lấy cảm hứng từ Robusta và Arabica, ROAR kết nối những giá trị đặc trưng của thế giới cà phê để phát triển một hệ sinh thái sản phẩm đa dạng — từ cà phê hạt, cà phê rang xay, cà phê hòa tan đến nhân xanh tuyển chọn và những dòng phối trộn mang dấu ấn riêng.',
                  'Inspired by Robusta and Arabica, ROAR brings together distinctive elements of the coffee world to develop a diverse product ecosystem — from coffee beans, roasted ground coffee, and instant blends to graded green coffee and signature reserves.'
                )}
              </p>
              <p>
                {t(
                  'Chúng tôi tin rằng một ly cà phê chất lượng không chỉ được tạo nên từ nguyên liệu tốt, mà còn từ sự am hiểu về giống cà phê, vùng trồng, phương pháp sơ chế, kỹ thuật rang và nghệ thuật pha chế.',
                  'We believe that quality coffee is shaped not only by good ingredients, but also by a genuine understanding of coffee varieties, origins, processing methods, roasting techniques and the art of brewing.'
                )}
              </p>
              <p>
                {t(
                  'ROAR COFFEE hướng đến việc kết hợp tinh thần thưởng thức cà phê truyền thống của Việt Nam với phong cách sống hiện đại, mang đến những trải nghiệm phù hợp với nhiều cá tính và nhu cầu thưởng thức khác nhau. Chúng tôi không chỉ muốn mang đến một sản phẩm cà phê — chúng tôi muốn kể câu chuyện về giá trị, bản sắc và cá tính của cà phê Việt Nam.',
                  'ROAR COFFEE seeks to connect Vietnam’s traditional coffee culture with contemporary lifestyles, creating experiences tailored to different tastes and preferences. We aim to offer more than coffee — we aim to express the value, identity and distinctive character of Vietnamese coffee.'
                )}
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono text-[#00552B] dark:text-[#C6A667]">
              <span>RO = Robusta</span>
              <span className="opacity-40">·</span>
              <span>AR = Arabica</span>
              <span className="opacity-40">·</span>
              <span>{t('7 Cá Tính Thương Hiệu', '7 Brand Personalities')}</span>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#202020]/10 dark:border-white/10 bg-[#003D25]">
              <MediaImage
                imageKey={page?.hero_image_key || 'hero_roar_coffee'}
                alt={t(
                  'Không gian thương hiệu và bao bì sản phẩm ROAR COFFEE Việt Nam',
                  'ROAR COFFEE Vietnamese brand flagship showcase'
                )}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 flex items-center justify-between gap-4">
              <AdaptiveLogo variant="horizontal" surface={theme === 'dark' ? 'dark' : 'light'} size="sm" />
              <div className="text-right space-y-0.5">
                <p className="text-xs font-bold text-[#00552B] dark:text-[#C6A667]">
                  {t('Khơi bản lĩnh. Đậm chất riêng.', 'Igniting Courage. Defining Character.')}
                </p>
                <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  {t('Thương hiệu Cà phê Việt Nam', 'Vietnamese Coffee Brand')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — OUR STORY | TWO COFFEE VARIETIES. ONE DISTINCTIVE SPIRIT. */}
      <section className="bg-white dark:bg-[#16221C] border-y border-[#202020]/10 dark:border-white/10 py-14 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="col-span-2 aspect-[16/9] rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10">
              <MediaImage
                imageKey="product_roasting_drum_clean"
                alt={t(
                  'Hạt cà phê Robusta và Arabica mới rang trong trống làm nguội tại ROAR COFFEE',
                  'Freshly roasted Robusta and Arabica beans in cooling drum'
                )}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-1.5">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#00552B] dark:text-[#C6A667]">RO</span>
              <p className="text-sm font-bold">{t('Robusta Việt Nam', 'Vietnamese Robusta')}</p>
              <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                {t(
                  'Sức mạnh nội lực, thể chất đậm đà và mối gắn kết sâu sắc với di sản cà phê Việt Nam.',
                  'Strength, bold body, structure, and deep roots in Vietnamese coffee heritage.'
                )}
              </p>
            </div>
            <div className="p-5 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-1.5">
              <span className="font-mono text-xl sm:text-2xl font-bold text-[#00552B] dark:text-[#C6A667]">AR</span>
              <p className="text-sm font-bold">{t('Arabica Tuyển chọn', 'Highland Arabica')}</p>
              <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                {t(
                  'Chiều sâu hương thơm phong phú, nét thanh tao và sự đa dạng trong trải nghiệm cảm quan.',
                  'Rich aromatic complexity, refined acidity, and expressive sensory nuance.'
                )}
              </p>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
              {t('02 · CÂU CHUYỆN THƯƠNG HIỆU', '02 · OUR STORY')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {t('HAI GIỐNG CÀ PHÊ. MỘT TINH THẦN BẢN LĨNH.', 'TWO COFFEE VARIETIES. ONE DISTINCTIVE SPIRIT.')}
            </h2>
            <div className="space-y-3.5 text-sm sm:text-base text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
              <p>
                {t(
                  'ROAR bắt đầu từ cảm hứng về hai giống cà phê quan trọng làm nên diện mạo ngành cà phê: Robusta và Arabica.',
                  'ROAR began with inspiration drawn from two foundational varieties of coffee: Robusta and Arabica.'
                )}
              </p>
              <p>
                {t(
                  'Robusta đại diện cho sức mạnh, cấu trúc vị đậm đà và mối liên hệ sâu sắc với văn hóa cà phê Việt Nam. Arabica mang đến sự phong phú về hương thơm, độ thanh và nét đa dạng trong từng lớp vị.',
                  'Robusta embodies strength, bold body, and an enduring connection to Vietnam’s coffee heritage. Arabica brings aromatic depth, elegance, and breadth to the sensory cup.'
                )}
              </p>
              <p>
                {t(
                  'RO và AR hòa quyện thành cái tên ROAR — đồng thời vang vọng nghĩa “tiếng gầm”: biểu tượng cho bản lĩnh, sự tự tin, cá tính độc lập và khát vọng khẳng định giá trị riêng.',
                  'RO and AR unite to form ROAR — a name that also carries the resonance of a lionhearted roar: courage, confidence, individuality, and the ambition to define your own standard.'
                )}
              </p>
              <p className="font-medium text-[#00552B] dark:text-[#C6A667]">
                {t(
                  'ROAR COFFEE kết hợp nguồn cảm hứng thuần khiết từ hạt cà phê với tinh thần sống bản lĩnh — đưa giá trị cà phê Việt Nam đến gần hơn với người thưởng thức qua những sản phẩm có chiều sâu và bản sắc rõ nét.',
                  'ROAR COFFEE pairs authentic coffee craftsmanship with fearless character, bringing Vietnamese coffee closer to drinkers who appreciate quality with unmistakable identity.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 — MISSION & VISION */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-8">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {t('03 · SỨ MỆNH & TẦM NHÌN', '03 · MISSION & VISION')}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t('Định Hướng Phát Triển Bền Vững & Bản Sắc Rõ Nét', 'Clear Purpose. Long-Horizon Ambition.')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-[#00552B] dark:text-[#C6A667]">
              <Flame className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                {t('Sứ mệnh · Mission', 'Mission')}
              </span>
            </div>
            <h3 className="text-xl font-bold">
              {t('Nâng tầm trải nghiệm cà phê Việt trong đời sống đương đại', 'Elevating the Vietnamese Coffee Experience')}
            </h3>
            <p className="text-sm text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
              {t(
                'Tôn trọng bản chất thật của hạt cà phê Việt Nam, chuyển hóa nguồn nguyên liệu tuyển chọn thành những dòng sản phẩm đồng nhất về chất lượng, phù hợp với nhịp sống hiện đại — từ tách cà phê sáng cá nhân đến chuỗi vận hành chuyên nghiệp của đối tác.',
                'Honoring the true nature of Vietnamese coffee beans by crafting consistent, thoughtfully roasted selections suited to modern life — from personal morning rituals to demanding hospitality bars.'
              )}
            </p>
          </div>

          <div className="bg-[#003D25] text-white rounded-2xl border border-[#C6A667]/25 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2.5 text-[#C6A667]">
              <Compass className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em]">
                {t('Tầm nhìn · Vision', 'Vision')}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">
              {t('Thương hiệu cà phê Việt Nam giàu bản lĩnh, vươn tầm khu vực', 'A Distinctive Vietnamese Coffee Brand Built for Reach')}
            </h3>
            <p className="text-sm text-[#F8F5EF]/82 leading-relaxed">
              {t(
                'Trở thành thương hiệu cà phê Việt Nam đại diện cho sự giao thoa giữa di sản truyền thống và tư duy đương đại: minh bạch chuẩn mực kỹ thuật, đa dạng hóa hệ sinh thái B2C–B2B và tự tin hiện diện bên cạnh những chuẩn mực cà phê quốc tế.',
                'Growing into a representative Vietnamese coffee brand where traditional depth meets modern craft — transparent in technical standards, versatile across retail and B2B partnerships, and confident on regional and international tables.'
              )}
            </p>
          </div>
        </div>

        {cmsCustomSections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {cmsCustomSections.map((sec, idx) => (
              <div
                key={`${sec.title_en}-${idx}`}
                className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 space-y-2"
              >
                <h3 className="text-base font-bold text-[#00552B] dark:text-[#C6A667]">
                  {lang === 'vi' ? sec.title_vi : sec.title_en}
                </h3>
                <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                  {lang === 'vi' ? sec.body_vi : sec.body_en}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 4 — THE VIETNAMESE COFFEE IDENTITY */}
      <section className="bg-white dark:bg-[#16221C] border-y border-[#202020]/10 dark:border-white/10 py-14 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
                {t('04 · BẢN SẮC CÀ PHÊ VIỆT', '04 · THE VIETNAMESE COFFEE IDENTITY')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                {t('GỐC RỄ TỪ VIỆT NAM. SÁNG TẠO CHO THẾ GIỚI.', 'ROOTED IN VIETNAM. CRAFTED FOR THE WORLD.')}
              </h2>
              <p className="text-sm sm:text-base text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
                {t(
                  'Việt Nam là một trong những cái nôi sản xuất và thưởng thức cà phê đặc biệt nhất thế giới — nơi hạt Robusta và Arabica không chỉ là nông sản mà đã trở thành một nét văn hóa đời sống bền bỉ.',
                  'Vietnam stands among the world’s most distinctive coffee nations — a land where coffee is far more than an agricultural crop, shaping everyday conversations, resilience, and local identity.'
                )}
              </p>
            </div>
            <div className="lg:col-span-5 text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
              {t(
                'ROAR COFFEE kế thừa trọn vẹn bốn biểu thức pha chế làm nên dấu ấn Việt Nam — kết hợp nhịp chậm của Phin truyền thống với độ chính xác của quầy Espresso hiện đại.',
                'ROAR COFFEE honors four living brewing traditions of Vietnam — uniting the patient rhythm of the Phin with the precision of contemporary Espresso extraction.'
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  titleVi: 'Cà phê Phin truyền thống',
                  titleEn: 'Traditional Vietnamese Phin',
                  bodyVi:
                    'Từng giọt cà phê nhỏ chậm qua phin nhôm hoặc đồng, giữ trọn độ sánh, hương rang ấm áp và khoảng lặng buổi sáng.',
                  bodyEn:
                    'Drop-by-drop gravity percolation delivering dense texture, warm roasted aroma, and a deliberate pause in the day.',
                },
                {
                  titleVi: 'Cà phê Đen đá',
                  titleEn: 'Vietnamese Iced Black Coffee',
                  bodyVi:
                    'Mạnh mẽ, dứt khoát và sảng khoái — làm nổi bật cấu trúc vị đắng thanh và hậu vị sô-cô-la đen của Robusta chất lượng cao.',
                  bodyEn:
                    'Unfiltered boldness over ice — spotlighting dark cacao bitterness and clean lingering depth from well-roasted Robusta.',
                },
                {
                  titleVi: 'Cà phê Sữa đá',
                  titleEn: 'Vietnamese Iced Milk Coffee',
                  bodyVi:
                    'Sự cân bằng kinh điển giữa cốt cà phê đậm lực và vị ngọt béo của sữa đặc, trở thành biểu tượng thưởng thức mang tầm quốc tế.',
                  bodyEn:
                    'The iconic harmony of concentrated dark roast coffee folded into velvety condensed milk and crisp ice.',
                },
                {
                  titleVi: 'Espresso & Phong cách đương đại',
                  titleEn: 'Espresso & Modern Coffee Bar',
                  bodyVi:
                    'Chiết xuất áp suất cao 9 bar với lớp crema dày mịn, kết nối khẩu vị truyền thống Việt với chuẩn quầy bar quốc tế.',
                  bodyEn:
                    'High-pressure extraction yielding rich crema — bridging classic Vietnamese character with global café menus.',
                },
              ].map((ritual, idx) => (
                <div
                  key={ritual.titleEn}
                  className="bg-[#F8F5EF] dark:bg-[#0E1512] rounded-xl border border-[#202020]/10 dark:border-white/10 p-5 space-y-2"
                >
                  <span className="font-mono text-xs font-semibold text-[#00552B] dark:text-[#C6A667]">
                    0{idx + 1}
                  </span>
                  <h3 className="text-base font-bold">{t(ritual.titleVi, ritual.titleEn)}</h3>
                  <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                    {t(ritual.bodyVi, ritual.bodyEn)}
                  </p>
                </div>
              ))}
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10 min-h-[240px]">
                <MediaImage
                  imageKey="product_brewing_ritual"
                  alt={t(
                    'Nghệ thuật pha cà phê Phin Việt Nam truyền thống cùng ROAR COFFEE',
                    'Traditional Vietnamese Phin brewing ritual with ROAR COFFEE'
                  )}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10 min-h-[240px]">
                <MediaImage
                  imageKey="journal_phin_espresso"
                  alt={t(
                    'Giao thoa giữa cà phê Phin Việt Nam và chiết xuất Espresso hiện đại',
                    'Vietnamese Phin culture meeting modern Espresso craftsmanship'
                  )}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5 — FROM HIGHLAND FARMS TO EVERY CUP */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
              {t('05 · HÀNH TRÌNH TỪ VÙNG TRỒNG ĐẾN LY CÀ PHÊ', '05 · FROM HIGHLAND FARMS TO EVERY CUP')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t('Năm Giai Đoạn Kiểm Soát Chất Lượng Của ROAR COFFEE', 'Five Disciplined Stages of Coffee Craftsmanship')}
            </h2>
          </div>
          <Link
            to={localePath('/farm-to-cup')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline whitespace-nowrap"
          >
            <span>{t('Xem trang Quy trình 8 bước chi tiết', 'View full 8-stage Farm to Cup')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {journeyStages.map((stage) => (
            <article
              key={stage.num}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#003D25]">
                <MediaImage
                  imageKey={stage.img}
                  alt={t(stage.altVi, stage.altEn)}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <span className="font-mono text-xs font-bold text-[#00552B] dark:text-[#C6A667]">
                    {stage.num}
                  </span>
                  <h3 className="text-base font-bold leading-snug">
                    {t(stage.titleVi, stage.titleEn)}
                  </h3>
                  <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                    {t(stage.bodyVi, stage.bodyEn)}
                  </p>
                </div>
                <Link
                  to={localePath(stage.to)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline pt-1"
                >
                  <span>{t(stage.linkLabelVi, stage.linkLabelEn)}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* SECTION 6 — OUR PRODUCT ECOSYSTEM (REAL CATALOG BACKED — NO FABRICATED PRICES OR MOCKS) */}
      <section className="bg-white dark:bg-[#16221C] border-y border-[#202020]/10 dark:border-white/10 py-14 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
                {t('06 · HỆ SINH THÁI SẢN PHẨM ROAR COFFEE', '06 · OUR PRODUCT ECOSYSTEM')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold">
                {t('Danh Mục Sản Phẩm Thực Tế Từ Cửa Hàng ROAR COFFEE', 'Live Official Portfolio Across Retail & B2B')}
              </h2>
              <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                {t(
                  'Toàn bộ liên kết và giá hiển thị dưới đây được đồng bộ trực tiếp từ danh mục sản phẩm đang mở bán của ROAR COFFEE.',
                  'Every product group, SKU link, and price below is synchronized directly from ROAR COFFEE’s active storefront catalog.'
                )}
              </p>
            </div>
            <Link
              to={localePath('/shop')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap min-h-[44px]"
            >
              <ShoppingBagIcon />
              <span>{t('Mở toàn bộ Cửa hàng', 'Open Full Catalog')}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ecosystemGroups.map((group) => (
              <div
                key={group.id}
                className="bg-[#F8F5EF] dark:bg-[#0E1512] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-5 sm:p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
                        {t(group.tagVi, group.tagEn)}
                      </p>
                      <h3 className="text-lg sm:text-xl font-bold leading-snug">
                        {t(group.titleVi, group.titleEn)}
                      </h3>
                    </div>
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10 shrink-0 bg-[#003D25]">
                      <MediaImage
                        imageKey={group.items[0]?.image_key || group.fallbackImage}
                        alt={t(group.titleVi, group.titleEn)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                    {t(group.descVi, group.descEn)}
                  </p>

                  {/* Real Catalog SKUs */}
                  <div className="space-y-2 pt-1 border-t border-[#202020]/10 dark:border-white/10">
                    {!productsLoaded ? (
                      <p className="text-xs text-[#202020]/55 dark:text-[#F1EFEA]/55 py-2">
                        {t('Đang đồng bộ danh mục sản phẩm thực tế...', 'Synchronizing active catalog...')}
                      </p>
                    ) : group.items.length === 0 ? (
                      <p className="text-xs text-[#202020]/60 dark:text-[#F1EFEA]/60 py-2">
                        {t(
                          'Xem chi tiết cấu hình sản phẩm trong trang danh mục chuyên biệt.',
                          'View specifications inside the dedicated collection page.'
                        )}
                      </p>
                    ) : (
                      group.items.map((prod) => (
                        <Link
                          key={prod.id}
                          to={localePath(`/product/${prod.slug}`)}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 hover:border-[#00552B] dark:hover:border-[#C6A667] transition-colors"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-[#202020]/10 dark:border-white/10">
                              <MediaImage
                                imageKey={prod.image_key}
                                alt={lang === 'vi' ? prod.name_vi : prod.name_en}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] truncate">
                                {lang === 'vi' ? prod.name_vi : prod.name_en}
                              </p>
                              <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 font-mono truncate">
                                {prod.sku}
                                {prod.screen_size ? ` · ${prod.screen_size}` : ''}
                                {prod.processing_method ? ` · ${prod.processing_method}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-semibold text-[#00552B] dark:text-[#C6A667] shrink-0 tabular-nums">
                            {prod.price_vnd > 0
                              ? formatPrice(prod.price_vnd, prod.price_usd)
                              : t('Xem chi tiết →', 'View →')}
                          </span>
                        </Link>
                      ))
                    )}
                  </div>
                </div>

                <Link
                  to={localePath(group.to)}
                  className="inline-flex items-center justify-between px-4 py-2.5 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/15 dark:border-white/15 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs font-semibold text-[#00552B] dark:text-[#C6A667] transition-colors min-h-[44px]"
                >
                  <span>{t('Khám phá toàn bộ dòng sản phẩm', 'Explore Full Collection')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — THE ROASTING & TASTING PHILOSOPHY */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
              {t('07 · TRIẾT LÝ RANG XAY & THƯỞNG THỨC', '07 · THE ROASTING & TASTING PHILOSOPHY')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
              {t(
                'Cân Bằng Giữa Sức Mạnh & Độ Tinh Tế Trong Từng Tầng Hương Vị',
                'Harmonizing Strength and Elegance Across Four Sensory Pillars'
              )}
            </h2>
            <p className="text-sm sm:text-base text-[#202020]/80 dark:text-[#F1EFEA]/80 leading-relaxed">
              {t(
                'Tại ROAR COFFEE, mỗi mẻ rang không chạy theo một mức lửa chung. Chúng tôi tinh chỉnh biểu đồ nhiệt riêng cho Phin truyền thống, máy pha Espresso chuyên nghiệp, Pour-over hay Cold Brew — giữ trọn bốn yếu tố cốt lõi của một ly cà phê chuẩn mực.',
                'At ROAR COFFEE, no roast follows a single generic curve. Thermal development is calibrated specifically for traditional Phin, commercial Espresso bars, Pour-over filters, or Cold Brew steeping.'
              )}
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-2">
              {[
                {
                  labelVi: 'Hương (Aroma)',
                  labelEn: 'Aroma',
                  descVi: 'Nốt sô-cô-la, caramel, hạt rang ấm hay hương hoa trái tinh tế ngay từ khi mở van một chiều.',
                  descEn: 'Warm cacao, toasted nut, caramel, or bright floral aromatics released the moment beans are ground.',
                },
                {
                  labelVi: 'Vị (Flavor)',
                  labelEn: 'Flavor',
                  descVi: 'Sự cân bằng giữa đắng đậm bản lĩnh, ngọt tự nhiên và chua thanh dễ chịu tùy tỷ lệ phối trộn.',
                  descEn: 'Structured interplay between assertive dark notes, natural sweetness, and gentle fruit acidity.',
                },
                {
                  labelVi: 'Thể chất (Body)',
                  labelEn: 'Body',
                  descVi: 'Độ sánh mịn, dày dặn nơi vòm miệng — nâng đỡ tốt khi uống đen đá lẫn khi kết hợp sữa.',
                  descEn: 'Tactile weight and mouthfeel engineered to shine both black over ice and alongside steamed or condensed milk.',
                },
                {
                  labelVi: 'Hậu vị (Aftertaste)',
                  labelEn: 'Aftertaste',
                  descVi: 'Dư vị sạch, sâu và lưu luyến kéo dài mà không gắt, khẳng định chất lượng hạt nhân đầu vào.',
                  descEn: 'A clean, resonant finish free of harshness — the clearest reflection of clean green bean selection.',
                },
              ].map((pillar) => (
                <div
                  key={pillar.labelEn}
                  className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-4 space-y-1.5"
                >
                  <h3 className="text-sm font-bold text-[#00552B] dark:text-[#C6A667]">
                    {t(pillar.labelVi, pillar.labelEn)}
                  </h3>
                  <p className="text-xs text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                    {t(pillar.descVi, pillar.descEn)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-6 grid grid-cols-2 gap-4">
            <div className="col-span-2 aspect-[16/9] rounded-2xl overflow-hidden border border-[#202020]/10 dark:border-white/10">
              <MediaImage
                imageKey="hero_signature_reserve_banner"
                alt={t(
                  'Chiết xuất Espresso ROAR COFFEE với lớp crema hổ phách dày mịn',
                  'ROAR COFFEE Espresso extraction with rich golden-amber crema'
                )}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-2 aspect-[21/9] rounded-xl overflow-hidden border border-[#202020]/10 dark:border-white/10">
              <MediaImage
                imageKey="journal_tasting_archetypes"
                alt={t(
                  'Thử nếm và đánh giá cảm quan 4 yếu tố Hương - Vị - Thể chất - Hậu vị',
                  'Sensory cupping flight evaluating aroma, flavor, body, and aftertaste'
                )}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8 — THE 7 ROAR COFFEE PERSONALITIES */}
      <section className="bg-[#003D25] text-white py-14 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C6A667]">
                {t('08 · 7 CÁ TÍNH THƯƠNG HIỆU ROAR COFFEE', '08 · THE 7 ROAR COFFEE PERSONALITIES')}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {t('Mỗi Gu Thưởng Thức Là Một Bản Sắc Cá Nhân', 'Seven Character Expressions. One Distinct Universe.')}
              </h2>
              <p className="text-sm text-[#F8F5EF]/80 leading-relaxed">
                {t(
                  'ROAR COFFEE chuyển hóa đa dạng gu thưởng thức thành 7 biểu tượng cá tính — giúp bạn chọn đúng dòng cà phê phản chiếu khí chất và khoảnh khắc của riêng mình.',
                  'ROAR COFFEE translates diverse flavor preferences into seven symbolic personalities — connecting your taste profile directly with the character of your cup.'
                )}
              </p>
            </div>
            <Link
              to={localePath('/personalities')}
              className="px-5 py-2.5 bg-[#C6A667] hover:bg-[#d4b67a] text-[#111111] text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <span>{t('Khám phá 7 Cá Tính', 'Explore All 7 Personalities')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {personalities.map((p) => (
              <Link
                key={p.id}
                to={localePath(`/personalities/${p.slug}`)}
                className="group bg-[#0B2C1D] hover:bg-[#103826] border border-white/10 hover:border-[#C6A667]/50 rounded-xl p-4 flex items-center gap-3.5 transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#C6A667]/30 bg-black/20">
                  <MediaImage
                    imageKey={p.custom_image_url || p.image_key}
                    alt={lang === 'vi' ? p.animal_vi : p.animal_en}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-[#C6A667] transition-colors truncate">
                    {lang === 'vi' ? p.animal_vi : p.animal_en}
                  </h3>
                  <p className="text-[11px] text-[#F8F5EF]/75 line-clamp-2 leading-snug">
                    {lang === 'vi' ? p.traits_vi : p.traits_en}
                  </p>
                  <p className="text-[11px] font-mono text-[#C6A667] truncate">
                    {lang === 'vi' ? p.product_association_vi : p.product_association_en}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — WHO WE SERVE */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-14 lg:py-20 space-y-8">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
            {t('09 · KHÁCH HÀNG & ĐỐI TÁC CỦA CHÚNG TÔI', '09 · WHO WE SERVE')}
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t('Phục Vụ Trọn Vẹn Từ Tách Cà Phê Cá Nhân Đến Chuỗi Vận Hành B2B', 'Built for Everyday Drinkers, Hospitality Bars & Global Trade')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <Coffee className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
              titleVi: 'Người yêu cà phê cá nhân',
              titleEn: 'Individual Coffee Lovers',
              bodyVi:
                'Thưởng thức cà phê Phin, rang xay, hòa tan Silver & Gold và hạt nguyên chất chuẩn gu ngay tại nhà hoặc văn phòng.',
              bodyEn:
                'Daily home and studio rituals across Phin heritage blends, roasted whole beans, and convenient Silver & Gold instant boxes.',
              to: '/shop',
              ctaVi: 'Mua sắm bán lẻ',
              ctaEn: 'Shop Retail',
            },
            {
              icon: <Store className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
              titleVi: 'Quán cà phê & Chuỗi HORECA',
              titleEn: 'Cafés & HORECA Partners',
              bodyVi:
                'Nguồn hạt rang ổn định, hỗ trợ thử mẫu gu Espresso hoặc Phin máy cùng biểu giá sỉ minh bạch từ 5kg đến ≥100kg.',
              bodyEn:
                'Consistent roasted bean supply with Espresso & Phin calibration plus transparent wholesale brackets from 5kg to ≥100kg.',
              to: '/coffee/roasted-beans',
              ctaVi: 'Xem hạt rang sỉ',
              ctaEn: 'Wholesale Beans',
            },
            {
              icon: <Gift className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
              titleVi: 'Doanh nghiệp & Quà tặng',
              titleEn: 'Corporate & Executive Gifting',
              bodyVi:
                'Bộ quà tặng Signature Reserve đẳng cấp và thẻ quà tặng E-Voucher điện tử linh hoạt cho đối tác, sự kiện, tri ân nhân sự.',
              bodyEn:
                'Signature Reserve presentation sets and digital E-Vouchers designed for executive appreciation and seasonal gifting.',
              to: '/signature-reserve',
              ctaVi: 'Khám phá Reserve',
              ctaEn: 'Explore Reserve',
            },
            {
              icon: <Briefcase className="w-5 h-5 text-[#00552B] dark:text-[#C6A667]" />,
              titleVi: 'Nhà phân phối, OEM & Xuất khẩu',
              titleEn: 'Distributors, OEM & Export',
              bodyVi:
                'Hợp tác gia công thương hiệu riêng (Private Label), cung ứng nhân xanh S14/S16/S18 (Natural, Honey, CBU) và kết nối xuất khẩu.',
              bodyEn:
                'Private-label OEM roasting, graded green coffee lots (S14/S16/S18 across Natural, Honey, CBU), and export trade inquiries.',
              to: '/partners',
              ctaVi: 'Cổng đối tác B2B',
              ctaEn: 'B2B Portal',
            },
          ].map((audience) => (
            <div
              key={audience.titleEn}
              className="bg-white dark:bg-[#16221C] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-lg bg-[#00552B]/8 dark:bg-[#C6A667]/15 flex items-center justify-center">
                  {audience.icon}
                </div>
                <h3 className="text-base font-bold">{t(audience.titleVi, audience.titleEn)}</h3>
                <p className="text-xs sm:text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                  {t(audience.bodyVi, audience.bodyEn)}
                </p>
              </div>
              <Link
                to={localePath(audience.to)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline"
              >
                <span>{t(audience.ctaVi, audience.ctaEn)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 10 — OUR COMMITMENT (STRICTLY GROUNDED, ZERO UNVERIFIED CLAIMS) */}
      <section className="bg-white dark:bg-[#16221C] border-y border-[#202020]/10 dark:border-white/10 py-14 lg:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-8">
          <div className="max-w-3xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
              {t('10 · CAM KẾT CỦA ROAR COFFEE', '10 · OUR COMMITMENT')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t('Cam Kết Từ Giá Trị Thật Trong Từng Lô Cà Phê', 'Grounded Quality & Honest Partnership')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {commitments.map((c) => (
              <div
                key={c.titleEn}
                className="bg-[#F8F5EF] dark:bg-[#0E1512] rounded-xl border border-[#202020]/10 dark:border-white/10 p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 flex items-center justify-center shrink-0">
                  {c.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold">{t(c.titleVi, c.titleEn)}</h3>
                  <p className="text-xs sm:text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75 leading-relaxed">
                    {t(c.bodyVi, c.bodyEn)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 11 — CALL TO ACTION */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-14 lg:pt-20 pb-8">
        <div className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-white/10 p-6 sm:p-10 space-y-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00552B] dark:text-[#C6A667]">
              {t('11 · KHÁM PHÁ CÙNG ROAR COFFEE', '11 · EXPLORE WITH ROAR COFFEE')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t('Chọn Lựa Trải Nghiệm Phù Hợp Với Gu Của Bạn', 'Step Inside the ROAR COFFEE Ecosystem')}
            </h2>
            <p className="text-sm text-[#202020]/75 dark:text-[#F1EFEA]/75">
              {t(
                'Bắt đầu từ sản phẩm thưởng thức hàng ngày, bộ sưu tập 7 cá tính, cẩm nang pha chế hoặc kết nối hợp tác B2B trực tiếp.',
                'Discover daily coffee collections, explore the seven brand personalities, refine your brew with our handbook, or start a B2B conversation.'
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={localePath('/shop')}
              className="px-5 py-3 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <span>{t('Khám phá sản phẩm', 'Explore Products')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to={localePath('/personalities')}
              className="px-5 py-3 rounded-lg bg-[#C6A667] hover:bg-[#d4b67a] text-[#111111] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('Xem 7 cá tính cà phê', 'View 7 Personalities')}</span>
            </Link>
            <Link
              to={localePath('/brewing-handbook')}
              className="px-5 py-3 rounded-lg border border-[#202020]/15 dark:border-white/15 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Layers className="w-4 h-4" />
              <span>{t('Cẩm nang pha chế', 'Brewing Handbook')}</span>
            </Link>
            <Link
              to={localePath('/partners')}
              className="px-5 py-3 rounded-lg border border-[#202020]/15 dark:border-white/15 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Award className="w-4 h-4" />
              <span>{t('Liên hệ hợp tác B2B', 'B2B Partnership')}</span>
            </Link>
            <Link
              to={localePath('/contact')}
              className="px-5 py-3 rounded-lg border border-[#202020]/15 dark:border-white/15 hover:border-[#00552B] dark:hover:border-[#C6A667] text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <MapPin className="w-4 h-4" />
              <span>{t('Liên hệ ROAR COFFEE', 'Contact ROAR COFFEE')}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION 12 — CLOSING BRAND MESSAGE */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 pb-16 pt-4">
        <div className="bg-[#003D25] text-white rounded-2xl border border-[#C6A667]/30 px-6 py-10 sm:px-12 sm:py-14 text-center space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C6A667]">
            {t('12 · THÔNG ĐIỆP THƯƠNG HIỆU', '12 · CLOSING BRAND MESSAGE')}
          </p>
          <p className="max-w-3xl mx-auto text-base sm:text-xl font-medium text-[#F8F5EF]/95 leading-relaxed">
            {t(
              'ROAR COFFEE không chỉ mang đến một tách cà phê đậm đà. Chúng tôi mang đến cảm hứng sống bản lĩnh, sự trân trọng dành cho hạt cà phê Việt Nam và trải nghiệm thưởng thức mang dấu ấn riêng của chính bạn.',
              'ROAR COFFEE delivers more than a bold cup of coffee. We share a spirit of quiet courage, deep respect for Vietnamese coffee beans, and a personal ritual shaped by your own character.'
            )}
          </p>
          <p className="text-sm sm:text-base font-bold tracking-[0.14em] uppercase text-[#C6A667]">
            {t('ROAR COFFEE — KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.', 'ROAR COFFEE — IGNITING COURAGE. DEFINING CHARACTER.')}
          </p>
        </div>
      </section>
    </div>
  );
};

function ShoppingBagIcon() {
  return <Coffee className="w-4 h-4" />;
}
