export interface HeroSlideConfig {
  id: string;
  imageKey: string;
  badgeVi: string;
  badgeEn: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  captionVi: string;
  captionEn: string;
  primaryCtaVi: string;
  primaryCtaEn: string;
  primaryTo: string;
  secondaryCtaVi: string;
  secondaryCtaEn: string;
  secondaryTo: string;
  tabLabelVi: string;
  tabLabelEn: string;
  surfaceClass: string;
  visible?: boolean;
}

export interface HeroMetricConfig {
  id: string;
  value: string;
  dot: string;
  titleVi: string;
  titleEn: string;
  subVi: string;
  subEn: string;
  to: string;
  visible?: boolean;
}

export const DEFAULT_HERO_SLIDES: HeroSlideConfig[] = [
  {
    id: 'flagship',
    imageKey: 'hero_roar_coffee',
    badgeVi: 'Thương hiệu Cà phê Việt Nam Cao Cấp',
    badgeEn: 'Distinctive Vietnamese Coffee Brand',
    titleVi: 'KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.',
    titleEn: 'IGNITING COURAGE. DEFINING CHARACTER.',
    descVi:
      'Kết tinh vùng nguyên liệu Việt Nam đích thực, nghệ thuật rang xay tinh tuyển, 7 cá tính thương hiệu riêng biệt và nền tảng thương mại cà phê nhân xanh S14/S16/S18 chuẩn quốc tế.',
    descEn:
      'Uniting authentic Vietnamese coffee origins, disciplined roast craftsmanship, seven distinctive brand personalities, and a commercial S14/S16/S18 green coffee portal.',
    captionVi: 'Hình ảnh minh họa nghệ thuật pha Phin Việt Nam — KHƠI BẢN LĨNH. ĐẬM CHẤT RIÊNG.',
    captionEn: 'Editorial concept of Vietnamese Phin extraction — IGNITING COURAGE. DEFINING CHARACTER.',
    primaryCtaVi: 'Khám phá cà phê',
    primaryCtaEn: 'Explore Coffee',
    primaryTo: '/shop',
    secondaryCtaVi: 'Trở thành đối tác',
    secondaryCtaEn: 'Become a Partner',
    secondaryTo: '/partners',
    tabLabelVi: '01 · Bản sắc ROAR',
    tabLabelEn: '01 · ROAR Identity',
    surfaceClass: 'bg-[#003D25]',
  },
  {
    id: 'signature-reserve',
    imageKey: 'hero_signature_reserve_banner',
    badgeVi: 'Báo Đen · 60% Robusta · 20% Culi · 20% Arabica',
    badgeEn: 'Black Panther · 60% Robusta · 20% Culi · 20% Arabica',
    titleVi: 'ROAR SIGNATURE RESERVE — ĐẲNG CẤP TINH HOA',
    titleEn: 'ROAR SIGNATURE RESERVE — LUXURY EDITION',
    descVi:
      'Tuyệt phẩm phối trộn chỉ định từ nhân xanh chế biến ướt CBU, lớp crema dày mịn hổ phách và hộp quà đen huyền – vàng champagne cho những dấu ấn trang trọng.',
    descEn:
      'Precision-crafted flagship blend with specified Washed CBU green beans, rich tiger-striped crema, and obsidian-gold executive gifting.',
    captionVi: 'Chiết xuất Espresso Signature Reserve với lớp crema vàng hổ phách đặc trưng.',
    captionEn: 'Signature Reserve Espresso extraction with rich amber tiger-striped crema.',
    primaryCtaVi: 'Khám phá Signature Reserve',
    primaryCtaEn: 'Discover Signature Reserve',
    primaryTo: '/signature-reserve',
    secondaryCtaVi: 'Đặt mua phiên bản Reserve',
    secondaryCtaEn: 'Shop Reserve Edition',
    secondaryTo: '/product/signature-reserve',
    tabLabelVi: '02 · Signature Reserve',
    tabLabelEn: '02 · Signature Reserve',
    surfaceClass: 'bg-[#0D1913]',
  },
  {
    id: 'green-matrix',
    imageKey: 'hero_highland_harvest_banner',
    badgeVi: 'Nguồn hạt Cao nguyên · Chuẩn B2B & Xuất khẩu',
    badgeEn: 'Highland Harvest · B2B & Export Matrix',
    titleVi: '27 CẤU HÌNH NHÂN XANH S14 / S16 / S18',
    titleEn: '27 CONFIGURABLE GREEN COFFEE SKUS',
    descVi:
      'Minh bạch từng vùng trồng Tây Nguyên với 3 dòng hạt (Robusta, Arabica, Culi/Peaberry), 3 cỡ sàng và 3 phương pháp Natural, Honey, Washed (CBU) sẵn sàng gửi mẫu thử.',
    descEn:
      'Traceable Central Highlands sourcing across 3 bean types, 3 screen grades (S14, S16, S18), and Natural, Honey & Washed (CBU) processing with sample fulfillment.',
    captionVi: 'Mùa thu hoạch chín mọng trên cao nguyên Tây Nguyên — nền tảng của mọi mẻ rang chuẩn.',
    captionEn: 'Ripe highland coffee harvest across Vietnam Central Highlands — foundation of every roast.',
    primaryCtaVi: 'Mở ma trận nhân xanh 27 mã',
    primaryCtaEn: 'Open 27-SKU Matrix',
    primaryTo: '/coffee/green-beans',
    secondaryCtaVi: 'OEM & Xuất khẩu',
    secondaryCtaEn: 'OEM & Export',
    secondaryTo: '/oem-export',
    tabLabelVi: '03 · Nhân xanh B2B',
    tabLabelEn: '03 · Green Coffee B2B',
    surfaceClass: 'bg-[#003D25]',
  },
  {
    id: 'brewing-craft',
    imageKey: 'product_brewing_ritual',
    badgeVi: 'Từ Nông Trại Đến Tách Cà Phê',
    badgeEn: 'From Farm to Cup Craft',
    titleVi: 'NGHỆ THUẬT PHA PHIN & RANG XAY CHUẨN MỰC',
    titleEn: 'VIETNAMESE PHIN & ROASTERY DISCIPLINE',
    descVi:
      'Khám phá quy trình 8 bước khép kín từ canh tác, chế biến đến công thức pha Phin truyền thống, Espresso, Pour-over và Cold Brew tối ưu cho từng gu thưởng thức.',
    descEn:
      'Explore our 8-stage farm-to-cup workflow alongside calibrated recipes for Vietnamese Phin, Espresso, Pour-over, French Press, and Cold Brew.',
    captionVi: 'Nghi thức pha Phin Việt Nam chậm rãi, tôn vinh hương vị nguyên bản.',
    captionEn: 'Slow Vietnamese Phin ritual celebrating authentic highland terroir.',
    primaryCtaVi: 'Xem hướng dẫn pha chế',
    primaryCtaEn: 'Brewing Guide',
    primaryTo: '/brewing',
    secondaryCtaVi: 'Hành trình 8 bước',
    secondaryCtaEn: '8-Stage Journey',
    secondaryTo: '/farm-to-cup',
    tabLabelVi: '04 · Pha chế & Quy trình',
    tabLabelEn: '04 · Brew & Craft',
    surfaceClass: 'bg-[#062C1B]',
  },
];

export const DEFAULT_HERO_METRICS: HeroMetricConfig[] = [
  {
    id: 'hm-1',
    value: '7',
    dot: 'bg-[#C6A667]',
    titleVi: 'Cá tính thương hiệu',
    titleEn: 'Brand Personalities',
    subVi: 'Hổ · Sư Tử · Cáo · Báo Đen · Sói',
    subEn: 'Tiger · Lion · Fox · Panther · Wolf',
    to: '/personalities',
  },
  {
    id: 'hm-2',
    value: '27+ SKUs',
    dot: 'bg-emerald-400',
    titleVi: 'Ma trận Nhân xanh B2B',
    titleEn: 'B2B Green Coffee Matrix',
    subVi: 'Robusta · Arabica · Culi S14–S18',
    subEn: 'Robusta · Arabica · Culi S14–S18',
    to: '/coffee/green-beans',
  },
  {
    id: 'hm-3',
    value: 'CBU',
    dot: 'bg-amber-300',
    titleVi: 'Chuẩn Chế Biến Ướt',
    titleEn: 'Washed CBU Standard',
    subVi: 'Full Washed · Honey · Natural',
    subEn: 'Full Washed · Honey · Natural',
    to: '/coffee/roasted-beans',
  },
  {
    id: 'hm-4',
    value: '6 S18',
    dot: 'bg-[#C6A667]',
    titleVi: 'Hạt rang 5 mức giá kg',
    titleEn: 'Roasted Beans 5-Tier kg',
    subVi: '1kg · 5–19kg · 20–99kg · ≥100kg',
    subEn: '1kg · 5–19kg · 20–99kg · ≥100kg',
    to: '/coffee/roasted-beans',
  },
  {
    id: 'hm-5',
    value: '10 Vùng',
    dot: 'bg-emerald-300',
    titleVi: 'Cao nguyên Việt Nam',
    titleEn: 'Vietnam Highland Origins',
    subVi: 'Cầu Đất 1.500m · Buôn Ma Thuột',
    subEn: 'Cau Dat 1,500m · Buon Ma Thuot',
    to: '/origins',
  },
  {
    id: 'hm-6',
    value: '100% Mộc',
    dot: 'bg-amber-400',
    titleVi: 'Rang mới chuẩn COA',
    titleEn: 'Fresh Roast · COA Verified',
    subVi: 'Không tẩm ướp · Ẩm ≤12.5%',
    subEn: 'Pure roast · Moisture ≤12.5%',
    to: '/farm-to-cup',
  },
  {
    id: 'hm-7',
    value: 'OEM / B2B',
    dot: 'bg-[#C6A667]',
    titleVi: 'Gia công & Xuất khẩu',
    titleEn: 'OEM Roasting & Export',
    subVi: 'HORECA · Nhãn riêng · Mẫu thử',
    subEn: 'HORECA · Private Label · Samples',
    to: '/partners',
  },
  {
    id: 'hm-8',
    value: '24/7 AI',
    dot: 'bg-emerald-400',
    titleVi: 'Barista & Báo giá nhanh',
    titleEn: 'AI Barista & Instant Quote',
    subVi: 'Tư vấn gu uống · Báo giá theo kg',
    subEn: 'Taste match · Live kg quotes',
    to: '/brewing',
  },
];

export function parseHeroSlides(rawJson?: string | null): HeroSlideConfig[] {
  if (!rawJson || !rawJson.trim()) return DEFAULT_HERO_SLIDES;
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return DEFAULT_HERO_SLIDES;
    return parsed
      .filter((item): item is Record<string, any> => Boolean(item && typeof item === 'object'))
      .map((item: any, idx: number) => {
        const fb = DEFAULT_HERO_SLIDES[idx] || DEFAULT_HERO_SLIDES[0];
        const rawImg = String(item.imageKey || item.imageUrl || '').trim();
        const normalizedImg =
          !rawImg || rawImg === '/assets/hero-phin.jpg' || rawImg === '/assets/hero-green.jpg'
            ? fb.imageKey
            : rawImg;
        const idxLabel = String(idx + 1).padStart(2, '0');
        const titleVi = item.titleVi ?? fb.titleVi;
        return {
          id: String(item.id || `slide-${idx + 1}`),
          imageKey: normalizedImg,
          badgeVi: item.badgeVi ?? item.eyebrowVi ?? fb.badgeVi,
          badgeEn: item.badgeEn ?? item.eyebrowEn ?? fb.badgeEn,
          titleVi,
          titleEn: item.titleEn ?? fb.titleEn,
          descVi: item.descVi ?? item.subtitleVi ?? fb.descVi,
          descEn: item.descEn ?? item.subtitleEn ?? fb.descEn,
          captionVi: item.captionVi ?? fb.captionVi,
          captionEn: item.captionEn ?? fb.captionEn,
          primaryCtaVi: item.primaryCtaVi ?? item.ctaLabelVi ?? fb.primaryCtaVi,
          primaryCtaEn: item.primaryCtaEn ?? item.ctaLabelEn ?? fb.primaryCtaEn,
          primaryTo: item.primaryTo ?? item.ctaPath ?? fb.primaryTo,
          secondaryCtaVi: item.secondaryCtaVi ?? fb.secondaryCtaVi,
          secondaryCtaEn: item.secondaryCtaEn ?? fb.secondaryCtaEn,
          secondaryTo: item.secondaryTo ?? fb.secondaryTo,
          tabLabelVi: item.tabLabelVi ?? `${idxLabel} · ${titleVi.slice(0, 22)}`,
          tabLabelEn: item.tabLabelEn ?? `${idxLabel} · ${(item.titleEn ?? fb.titleEn).slice(0, 22)}`,
          surfaceClass: item.surfaceClass || fb.surfaceClass || 'bg-[#003D25]',
          visible: typeof item.visible === 'boolean' ? item.visible : true,
        };
      });
  } catch {
    return DEFAULT_HERO_SLIDES;
  }
}

export function parseHeroMetrics(rawJson?: string | null): HeroMetricConfig[] {
  if (!rawJson || !rawJson.trim()) return DEFAULT_HERO_METRICS;
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return DEFAULT_HERO_METRICS;
    return parsed
      .filter((item): item is Record<string, any> => Boolean(item && typeof item === 'object'))
      .map((item: any, idx: number) => {
        const fb = DEFAULT_HERO_METRICS[idx] || DEFAULT_HERO_METRICS[0];
        return {
          id: String(item.id || `hm-${idx + 1}`),
          value: String(item.value ?? fb.value),
          dot: String(item.dot || fb.dot || 'bg-[#C6A667]'),
          titleVi: String(item.titleVi ?? item.labelVi ?? fb.titleVi),
          titleEn: String(item.titleEn ?? item.labelEn ?? fb.titleEn),
          subVi: String(item.subVi ?? fb.subVi),
          subEn: String(item.subEn ?? fb.subEn),
          to: String(item.to || fb.to || '/shop'),
          visible: typeof item.visible === 'boolean' ? item.visible : true,
        };
      });
  } catch {
    return DEFAULT_HERO_METRICS;
  }
}
