export type CategoryBannerKey =
  | 'all'
  | 'roasted'
  | 'roasted_beans'
  | 'green_bean'
  | 'instant'
  | 'pepper'
  | 'gift_voucher'
  | (string & {});

export interface CmsCategoryBanner {
  id?: string;
  categoryKey: CategoryBannerKey;
  eyebrowVi: string;
  eyebrowEn: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  imageUrl: string;
  ctaLabelVi: string;
  ctaLabelEn: string;
  ctaPath: string;
  visible: boolean;
}

export const CATEGORY_BANNER_OPTIONS: Array<{
  key: 'all' | 'roasted' | 'roasted_beans' | 'green_bean' | 'instant' | 'pepper' | 'gift_voucher';
  labelVi: string;
  labelEn: string;
  route: string;
}> = [
  { key: 'all', labelVi: 'Tất cả sản phẩm', labelEn: 'All Products', route: '/shop' },
  { key: 'roasted', labelVi: 'Cà phê Rang Xay', labelEn: 'Roasted Coffee', route: '/coffee/roasted' },
  { key: 'roasted_beans', labelVi: 'Cà phê Hạt Rang (kg)', labelEn: 'Roasted Beans (kg)', route: '/coffee/roasted-beans' },
  { key: 'green_bean', labelVi: 'Cà phê Nhân Xanh', labelEn: 'Green Coffee Beans', route: '/coffee/green-coffee' },
  { key: 'instant', labelVi: 'Cà phê Hòa Tan', labelEn: 'Instant Coffee', route: '/coffee/instant' },
  { key: 'pepper', labelVi: 'Tiêu Tây Nguyên', labelEn: 'Highland Pepper', route: '/coffee/pepper' },
  { key: 'gift_voucher', labelVi: 'Thẻ Quà Tặng Gift Voucher', labelEn: 'Gift Vouchers', route: '/coffee/gift-vouchers' },
];

export const CATEGORY_BANNER_META: Record<
  string,
  { labelVi: string; labelEn: string; route: string }
> = Object.fromEntries(CATEGORY_BANNER_OPTIONS.map((o) => [o.key, { labelVi: o.labelVi, labelEn: o.labelEn, route: o.route }]));

export const DEFAULT_CATEGORY_BANNERS: CmsCategoryBanner[] = [
  {
    id: 'cat-all',
    categoryKey: 'all',
    eyebrowVi: 'TOÀN BỘ HỆ SINH THÁI ROAR COFFEE®',
    eyebrowEn: 'COMPLETE ROAR COFFEE® CATALOG',
    titleVi: 'Tinh hoa Cà phê Việt từ Nông trại đến Quầy bar',
    titleEn: 'Vietnamese Coffee Mastery From Highland Farm to Bar',
    subtitleVi:
      'Khám phá trọn vẹn các dòng rang xay 7 cá tính, hạt rang 5 mốc giá kg cho quán, 27 cấu hình nhân xanh B2B và thẻ quà tặng sang trọng.',
    subtitleEn:
      'Explore signature roasted collections, 5-tier kg roasted beans for cafés, 27-SKU commercial green lots, instant blends, and executive gift vouchers.',
    imageUrl: 'hero_roar_coffee',
    ctaLabelVi: 'Trải nghiệm 7 Cá tính',
    ctaLabelEn: 'Explore 7 Personalities',
    ctaPath: '/personalities',
    visible: true,
  },
  {
    id: 'cat-roasted',
    categoryKey: 'roasted',
    eyebrowVi: 'RANG MỘC 100% · BẢN SẮC PHIN & ESPRESSO',
    eyebrowEn: '100% PURE ROAST · PHIN & ESPRESSO SIGNATURES',
    titleVi: 'Bộ Sưu Tập Cà Phê Rang Xay & Hộp Quà Signature Reserve',
    titleEn: 'Roasted Coffee Collections & Signature Reserve',
    subtitleVi:
      'Từ vị đậm bản lĩnh của Hổ & Sư Tử đến hương cân bằng của Cáo, Đại Bàng và tuyệt phẩm Báo Đen 60% Robusta – 20% Culi – 20% Arabica.',
    subtitleEn:
      'From the bold intensity of Tiger & Lion to balanced Espresso profiles of Fox & Eagle, crowned by Black Panther Signature Reserve.',
    imageUrl: 'hero_signature_reserve_banner',
    ctaLabelVi: 'Khám phá Signature Reserve',
    ctaLabelEn: 'Discover Signature Reserve',
    ctaPath: '/signature-reserve',
    visible: true,
  },
  {
    id: 'cat-roasted_beans',
    categoryKey: 'roasted_beans',
    eyebrowVi: 'CHUYÊN BIỆT CHO QUÁN CÀ PHÊ · HORECA · VĂN PHÒNG',
    eyebrowEn: 'DEDICATED TO CAFÉS · HORECA · WORKPLACES',
    titleVi: 'Cà Phê Hạt Rang S18 & Robusta CBU — Tối Ưu Chi Phí Theo 5 Bậc Kg',
    titleEn: 'Screen 18 Roasted Coffee Beans — Transparent 5-Tier Kg Pricing',
    subtitleVi:
      '6 mã hạt rang chuẩn sàng 18 đồng đều (Arabica Cầu Đất, Robusta CBU, Honey & House Blends). Tự động áp dụng giá ưu đãi từ 1kg đến 100kg+.',
    subtitleEn:
      '6 precision-roasted bean lines including Cầu Đất Arabica, CBU Washed Fine Robusta, and Honey lots with automatic tiered pricing from 1kg to 100kg+.',
    imageUrl: 'product_roasting_drum_clean',
    ctaLabelVi: 'Mở Cẩm nang Pha chế',
    ctaLabelEn: 'Open Brewing Handbook',
    ctaPath: '/brewing-handbook',
    visible: true,
  },
  {
    id: 'cat-green_bean',
    categoryKey: 'green_bean',
    eyebrowVi: 'THƯƠNG MẠI NHÂN XANH B2B · S14 / S16 / S18',
    eyebrowEn: 'COMMERCIAL GREEN COFFEE TRADE · S14 / S16 / S18',
    titleVi: '27 Cấu Hình Nhân Xanh Chuẩn Xuất Khẩu — Natural · Honey · CBU Washed',
    titleEn: '27 Standardized Green Coffee Lots — Natural · Honey · CBU Washed',
    subtitleVi:
      'Nguồn cung minh bạch độ ẩm 10.5–12.5%, tỷ lệ hạt đen vỡ và niên vụ mới nhất từ Đắk Lắk & Lâm Đồng. Hỗ trợ mẫu xanh đánh giá thử nếm.',
    subtitleEn:
      'Traceable highland Robusta, Arabica, and Culi green lots with verified moisture, screen grading, and defect tolerances. Pre-contract green samples available.',
    imageUrl: 'hero_highland_harvest_banner',
    ctaLabelVi: 'Mở Bảng Ma Trận 27 SKUs',
    ctaLabelEn: 'Open 27-SKU Matrix',
    ctaPath: '/coffee/green-beans',
    visible: true,
  },
  {
    id: 'cat-instant',
    categoryKey: 'instant',
    eyebrowVi: 'CHIẾT XUẤT SẤY LẠNH GIỮ TRỌN HƯƠNG RANG',
    eyebrowEn: 'FREEZE-DRIED AROMA RETENTION',
    titleVi: 'Bộ Sưu Tập Hòa Tan Silver & Gold — Chuẩn Gu Mọi Lúc Mọi Nơi',
    titleEn: 'Instant Coffee Silver & Gold — Café Quality in Seconds',
    subtitleVi:
      'Hòa tan tinh khiết tiện lợi cho nhịp sống bận rộn, công tác và văn phòng hiện đại mà vẫn giữ được hậu vị sô-cô-la và độ thơm đặc trưng của ROAR.',
    subtitleEn:
      'Crafted for modern offices, travel, and brisk mornings—delivering crisp espresso depth and lingering roasted aromatics in an instant pour.',
    imageUrl: 'instant_3in1_box_chill',
    ctaLabelVi: 'Xem Công thức Pha nhanh',
    ctaLabelEn: 'View Quick Brew Recipes',
    ctaPath: '/brewing-handbook',
    visible: true,
  },
  {
    id: 'cat-pepper',
    categoryKey: 'pepper',
    eyebrowVi: 'ĐẶC SẢN TÂY NGUYÊN · NGUYÊN CHẤT 100%',
    eyebrowEn: 'CENTRAL HIGHLANDS SPECIALTY · 100% PURE PEPPER',
    titleVi: 'Tiêu Đen & Tiêu Sọ Tây Nguyên — Hũ Thủy Tinh & Cối Xay Tiện Lợi',
    titleEn: 'Highland Black & White Pepper — Glass Jars & Built-In Grinders',
    subtitleVi:
      '6 dòng tiêu đặc sản Đắk Lắk – Gia Lai (Tiêu Đen Xay 45g/90g, Tiêu Đen Sọ 45g/90g, Tiêu Đen & Tiêu Sọ Hạt Cối Xay 70g) cay nồng chuẩn vị.',
    subtitleEn:
      '6 Dak Lak & Gia Lai peppercorn specialties including ground black pepper, whole white pepper, and convenient 70g built-in grinder jars.',
    imageUrl: 'pepper_black_grinder_jar',
    ctaLabelVi: 'Khám phá Vùng nguyên liệu',
    ctaLabelEn: 'Explore Highland Origins',
    ctaPath: '/origins',
    visible: true,
  },
  {
    id: 'cat-gift_voucher',
    categoryKey: 'gift_voucher',
    eyebrowVi: 'QUÀ TẶNG DOANH NGHIỆP & ĐẶC QUYỀN TRI ÂN',
    eyebrowEn: 'EXECUTIVE GIFTING & CURATED VOUCHERS',
    titleVi: 'Thẻ Quà Tặng ROAR Gift Voucher (50.000₫ – 1.000.000₫)',
    titleEn: 'ROAR COFFEE Gift Vouchers (50k – 1,000,000 VND)',
    subtitleVi:
      'Trao quyền tự do chọn gu cà phê đúng cá tính với phiên bản E-Voucher gửi nhanh hoặc Thẻ cứng ép kim vàng kèm hộp quà sang trọng.',
    subtitleEn:
      'Let recipients choose their exact roast and brew ritual with instant digital E-Vouchers or gold-foil physical cards inside our signature keepsake box.',
    imageUrl: '/assets/vouchers/gift-voucher-1m.jpg',
    ctaLabelVi: 'Quà tặng Doanh nghiệp B2B',
    ctaLabelEn: 'Corporate Gifting Portal',
    ctaPath: '/signature-reserve',
    visible: true,
  },
];

export function parseCategoryBanners(rawJson?: string | null): CmsCategoryBanner[] {
  if (!rawJson || !rawJson.trim()) return DEFAULT_CATEGORY_BANNERS;
  try {
    const parsed = JSON.parse(rawJson);
    if (!Array.isArray(parsed)) return DEFAULT_CATEGORY_BANNERS;
    return parsed
      .filter((item): item is Record<string, any> => Boolean(item && typeof item === 'object'))
      .map((item, idx) => {
        const key = String(item.categoryKey || 'all').trim() || 'all';
        const fb = DEFAULT_CATEGORY_BANNERS.find((d) => d.categoryKey === key) || DEFAULT_CATEGORY_BANNERS[0];
        return {
          id: String(item.id || `cat-${key}-${idx + 1}`),
          categoryKey: key,
          eyebrowVi: String(item.eyebrowVi ?? fb.eyebrowVi),
          eyebrowEn: String(item.eyebrowEn ?? fb.eyebrowEn),
          titleVi: String(item.titleVi ?? fb.titleVi),
          titleEn: String(item.titleEn ?? fb.titleEn),
          subtitleVi: String(item.subtitleVi ?? fb.subtitleVi),
          subtitleEn: String(item.subtitleEn ?? fb.subtitleEn),
          imageUrl: String(item.imageUrl ?? fb.imageUrl),
          ctaLabelVi: String(item.ctaLabelVi ?? fb.ctaLabelVi),
          ctaLabelEn: String(item.ctaLabelEn ?? fb.ctaLabelEn),
          ctaPath: String(item.ctaPath ?? fb.ctaPath),
          visible: typeof item.visible === 'boolean' ? item.visible : true,
        };
      });
  } catch {
    return DEFAULT_CATEGORY_BANNERS;
  }
}
