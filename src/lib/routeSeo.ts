import type { Lang } from '../i18n/I18nContext';
import { stripLocalePrefix } from '../i18n/I18nContext';

interface RouteSeoMeta {
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  noIndex?: boolean;
}

const DEFAULT_SEO: RouteSeoMeta = {
  titleVi: 'ROAR COFFEE® — Khơi Bản Lĩnh. Đậm Chất Riêng. | Cà Phê Việt Nam',
  titleEn: 'ROAR COFFEE® — Igniting Courage. Defining Character. | Vietnam Coffee',
  descVi:
    'ROAR COFFEE — Thương hiệu cà phê Việt Nam cao cấp: Cà phê rang xay, 27 SKUs nhân xanh S14/S16/S18 (Natural, Honey, CBU Washed), Hòa tan & B2B Export.',
  descEn:
    'ROAR COFFEE — Distinctive Vietnamese coffee brand: roasted blends, 27-SKU green coffee matrix (NAT, HON, CBU), instant coffee, gift vouchers & B2B export.',
};

const STATIC_ROUTE_SEO: Record<string, RouteSeoMeta> = {
  '/': DEFAULT_SEO,
  '/shop': {
    titleVi: 'Cửa Hàng Cà Phê Chính Thức | ROAR COFFEE®',
    titleEn: 'Official Coffee Storefront | ROAR COFFEE®',
    descVi:
      'Khám phá trọn bộ cà phê rang xay, cà phê hạt rang 5 mức giá kg, cà phê nhân xanh B2B, hòa tan Silver/Gold và Gift Voucher ROAR COFFEE.',
    descEn:
      'Shop roasted ground coffee, 5-tier volume roasted beans, B2B green coffee, instant collections, and ROAR digital gift vouchers.',
  },
  '/coffee/roasted': {
    titleVi: 'Cà Phê Rang Xay & Phối Trộn 7 Cá Tính | ROAR COFFEE®',
    titleEn: 'Roasted Coffee & Seven Personalities Blends | ROAR COFFEE®',
    descVi:
      'Tuyển chọn Robusta House Blend, Arabica Selection, Espresso và Espresso Gold rang mộc theo 7 cá tính hương vị ROAR COFFEE.',
    descEn:
      'Explore Robusta House Blend, Arabica Selection, Espresso and Espresso Gold freshly roasted for Vietnam brewing rituals.',
  },
  '/category/roasted-coffee': {
    titleVi: 'Cà Phê Rang Xay & Phối Trộn 7 Cá Tính | ROAR COFFEE®',
    titleEn: 'Roasted Coffee & Seven Personalities Blends | ROAR COFFEE®',
    descVi:
      'Tuyển chọn Robusta House Blend, Arabica Selection, Espresso và Espresso Gold rang mộc theo 7 cá tính hương vị ROAR COFFEE.',
    descEn:
      'Explore Robusta House Blend, Arabica Selection, Espresso and Espresso Gold freshly roasted for Vietnam brewing rituals.',
  },
  '/coffee/roasted-beans': {
    titleVi: 'Cà Phê Hạt Rang Giá Theo Kg (5 Mức Sản Lượng) | ROAR COFFEE®',
    titleEn: 'Roasted Coffee Beans (5-Tier Kg Volume Pricing) | ROAR COFFEE®',
    descVi:
      'Bảng giá sỉ & lẻ cà phê hạt rang Robusta, Arabica và Espresso nguyên chất theo 5 nấc sản lượng từ 1kg đến ≥100kg cho quán và văn phòng.',
    descEn:
      '5-tier volume kg pricing (1kg to ≥100kg) on fresh roasted whole beans for cafes, HORECA partners, and offices.',
  },
  '/category/roasted-beans': {
    titleVi: 'Cà Phê Hạt Rang Giá Theo Kg (5 Mức Sản Lượng) | ROAR COFFEE®',
    titleEn: 'Roasted Coffee Beans (5-Tier Kg Volume Pricing) | ROAR COFFEE®',
    descVi:
      'Bảng giá sỉ & lẻ cà phê hạt rang Robusta, Arabica và Espresso nguyên chất theo 5 nấc sản lượng từ 1kg đến ≥100kg cho quán và văn phòng.',
    descEn:
      '5-tier volume kg pricing (1kg to ≥100kg) on fresh roasted whole beans for cafes, HORECA partners, and offices.',
  },
  '/coffee/green-coffee': {
    titleVi: 'Cà Phê Nhân Xanh Cao Nguyên B2B | ROAR COFFEE®',
    titleEn: 'Vietnamese Green Coffee Beans B2B Catalog | ROAR COFFEE®',
    descVi:
      'Nguồn cung cà phê nhân xanh Robusta, Arabica, Culi sàng S14, S16, S18 sơ chế Natural, Honey và Washed CBU chuẩn COA.',
    descEn:
      'Commercial green coffee beans across Robusta, Arabica, and Culi in S14/S16/S18 grades and NAT/HON/CBU processing.',
  },
  '/category/green-coffee': {
    titleVi: 'Cà Phê Nhân Xanh Cao Nguyên B2B | ROAR COFFEE®',
    titleEn: 'Vietnamese Green Coffee Beans B2B Catalog | ROAR COFFEE®',
    descVi:
      'Nguồn cung cà phê nhân xanh Robusta, Arabica, Culi sàng S14, S16, S18 sơ chế Natural, Honey và Washed CBU chuẩn COA.',
    descEn:
      'Commercial green coffee beans across Robusta, Arabica, and Culi in S14/S16/S18 grades and NAT/HON/CBU processing.',
  },
  '/coffee/green-beans': {
    titleVi: 'Ma Trận 27 SKUs Cà Phê Nhân Xanh Xuất Khẩu | ROAR COFFEE®',
    titleEn: '27-SKU Green Coffee Export Matrix | ROAR COFFEE®',
    descVi:
      'Tra cứu và xuất báo giá 27 cấu hình cà phê nhân xanh Việt Nam (3 dòng hạt × 3 cỡ sàng × 3 phương pháp sơ chế) đóng bao 30–1000kg.',
    descEn:
      'Inspect specs, request samples, and export quotes for 27 standardized Vietnamese green coffee lots (S14–S18, NAT/HON/CBU).',
  },
  '/green-coffee': {
    titleVi: 'Ma Trận 27 SKUs Cà Phê Nhân Xanh Xuất Khẩu | ROAR COFFEE®',
    titleEn: '27-SKU Green Coffee Export Matrix | ROAR COFFEE®',
    descVi:
      'Tra cứu và xuất báo giá 27 cấu hình cà phê nhân xanh Việt Nam (3 dòng hạt × 3 cỡ sàng × 3 phương pháp sơ chế) đóng bao 30–1000kg.',
    descEn:
      'Inspect specs, request samples, and export quotes for 27 standardized Vietnamese green coffee lots (S14–S18, NAT/HON/CBU).',
  },
  '/coffee/instant': {
    titleVi: 'Cà Phê Hòa Tan Silver & Gold | ROAR COFFEE®',
    titleEn: 'ROAR Instant Coffee — Silver & Gold | ROAR COFFEE®',
    descVi:
      'Giải pháp cà phê hòa tan tiện lợi giữ trọn hậu vị Robusta & Arabica Việt Nam: dòng Silver đậm đà và Gold êm thanh.',
    descEn:
      'Convenient Silver & Gold instant coffee sachets crafted for rich Vietnamese character anytime, anywhere.',
  },
  '/category/instant': {
    titleVi: 'Cà Phê Hòa Tan Silver & Gold | ROAR COFFEE®',
    titleEn: 'ROAR Instant Coffee — Silver & Gold | ROAR COFFEE®',
    descVi:
      'Giải pháp cà phê hòa tan tiện lợi giữ trọn hậu vị Robusta & Arabica Việt Nam: dòng Silver đậm đà và Gold êm thanh.',
    descEn:
      'Convenient Silver & Gold instant coffee sachets crafted for rich Vietnamese character anytime, anywhere.',
  },
  '/coffee/pepper': {
    titleVi: 'Tiêu Đen & Tiêu Sọ Tây Nguyên Nguyên Chất | ROAR COFFEE®',
    titleEn: 'Highland Black & White Pepper Jars & Grinders | ROAR COFFEE®',
    descVi:
      'Đặc sản Tiêu Đen Xay 45g/90g, Tiêu Đen Sọ 45g/90g và Tiêu Hạt Cối Xay 70g tuyển chọn từ nông trại đất đỏ bazan Tây Nguyên.',
    descEn:
      'Pure Central Highlands black & white pepper jars (45g/90g) and 70g built-in grinder bottles sourced from Dak Lak & Gia Lai.',
  },
  '/category/pepper': {
    titleVi: 'Tiêu Đen & Tiêu Sọ Tây Nguyên Nguyên Chất | ROAR COFFEE®',
    titleEn: 'Highland Black & White Pepper Jars & Grinders | ROAR COFFEE®',
    descVi:
      'Đặc sản Tiêu Đen Xay 45g/90g, Tiêu Đen Sọ 45g/90g và Tiêu Hạt Cối Xay 70g tuyển chọn từ nông trại đất đỏ bazan Tây Nguyên.',
    descEn:
      'Pure Central Highlands black & white pepper jars (45g/90g) and 70g built-in grinder bottles sourced from Dak Lak & Gia Lai.',
  },
  '/pepper': {
    titleVi: 'Tiêu Đen & Tiêu Sọ Tây Nguyên Nguyên Chất | ROAR COFFEE®',
    titleEn: 'Highland Black & White Pepper Jars & Grinders | ROAR COFFEE®',
    descVi:
      'Đặc sản Tiêu Đen Xay 45g/90g, Tiêu Đen Sọ 45g/90g và Tiêu Hạt Cối Xay 70g tuyển chọn từ nông trại đất đỏ bazan Tây Nguyên.',
    descEn:
      'Pure Central Highlands black & white pepper jars (45g/90g) and 70g built-in grinder bottles sourced from Dak Lak & Gia Lai.',
  },
  '/coffee/gift-vouchers': {
    titleVi: 'Thẻ Quà Tặng Điện Tử ROAR E-Voucher | ROAR COFFEE®',
    titleEn: 'ROAR Digital Gift E-Vouchers | ROAR COFFEE®',
    descVi:
      'Gửi tặng E-Voucher cà phê ROAR qua Email hoặc SMS/Zalo với lời chúc riêng và mã sử dụng trừ trực tiếp khi thanh toán.',
    descEn:
      'Send instant ROAR coffee gift vouchers via Email or SMS/Zalo with personalized messages and direct checkout redemption.',
  },
  '/category/gift-vouchers': {
    titleVi: 'Thẻ Quà Tặng Điện Tử ROAR E-Voucher | ROAR COFFEE®',
    titleEn: 'ROAR Digital Gift E-Vouchers | ROAR COFFEE®',
    descVi:
      'Gửi tặng E-Voucher cà phê ROAR qua Email hoặc SMS/Zalo với lời chúc riêng và mã sử dụng trừ trực tiếp khi thanh toán.',
    descEn:
      'Send instant ROAR coffee gift vouchers via Email or SMS/Zalo with personalized messages and direct checkout redemption.',
  },
  '/about': {
    titleVi: 'Về ROAR COFFEE® — Câu Chuyện Thương Hiệu & Triết Lý Rang Xay',
    titleEn: 'About ROAR COFFEE® — Brand Story, Origins & Coffee Mastery',
    descVi:
      'Tìm hiểu ý nghĩa RO (Robusta) + AR (Arabica) = ROAR, 3 trụ cột bản sắc Việt và hành trình nâng tầm cà phê Việt Nam.',
    descEn:
      'Discover RO (Robusta) + AR (Arabica) = ROAR, our three brand pillars, and our mission elevating Vietnamese coffee.',
  },
  '/personalities': {
    titleVi: '7 Cá Tính Hương Vị ROAR COFFEE® | Chọn Gu Cà Phê Của Bạn',
    titleEn: 'Seven ROAR Coffee Personalities | Find Your Flavor Profile',
    descVi:
      'Khám phá 7 biểu tượng hương vị từ Hổ đậm bản lĩnh, Sư tử chuẩn Phin, Cáo Espresso, Đại bàng Gold đến Báo đen Signature Reserve.',
    descEn:
      'Explore the seven signature flavor archetypes from bold Tiger and Lion Phin blends to Eagle Gold and Black Panther Reserve.',
  },
  '/origins': {
    titleVi: 'Bản Đồ 10+ Vùng Nguyên Liệu Cà Phê Việt Nam | ROAR COFFEE®',
    titleEn: '10+ Vietnamese Highland Coffee Origins Map | ROAR COFFEE®',
    descVi:
      'Bản đồ tương tác vùng trồng Robusta Tây Nguyên và Arabica Cầu Đất, Sơn La, Khe Sanh với thông số độ cao và niên vụ.',
    descEn:
      'Interactive highland origin map covering Buon Ma Thuot, Dak Nong, Cau Dat 1,500m, Son La and Khe Sanh.',
  },
  '/regions': {
    titleVi: 'Bản Đồ 10+ Vùng Nguyên Liệu Cà Phê Việt Nam | ROAR COFFEE®',
    titleEn: '10+ Vietnamese Highland Coffee Origins Map | ROAR COFFEE®',
    descVi:
      'Bản đồ tương tác vùng trồng Robusta Tây Nguyên và Arabica Cầu Đất, Sơn La, Khe Sanh với thông số độ cao và niên vụ.',
    descEn:
      'Interactive highland origin map covering Buon Ma Thuot, Dak Nong, Cau Dat 1,500m, Son La and Khe Sanh.',
  },
  '/farm-to-cup': {
    titleVi: 'Quy Trình Từ Nông Trại Đến Tách Cà Phê & Chuẩn COA | ROAR COFFEE®',
    titleEn: 'From Farm to Cup Traceability & Quality Control | ROAR COFFEE®',
    descVi:
      'Kiểm soát chất lượng từ thu hái chín đỏ, sơ chế Natural/Honey/CBU Washed, kiểm ẩm ≤12.5% đến rang mộc chuẩn COA.',
    descEn:
      'Full traceability from ripe cherry harvesting and NAT/HON/CBU processing to moisture COA verification and small-batch roasting.',
  },
  '/quality': {
    titleVi: 'Tiêu Chuẩn Chất Lượng Rang Mộc & COA | ROAR COFFEE®',
    titleEn: 'COA Quality Control & Pure Roasting Standards | ROAR COFFEE®',
    descVi:
      'Cam kết 100% cà phê rang mộc không tẩm ướp, kiểm nghiệm độ ẩm ≤12.5%, sàng lọc tạp chất và công bố COA theo từng lô.',
    descEn:
      'Pure roast commitment with zero flavorings, ≤12.5% moisture verification, screen grading and lot-level COA transparency.',
  },
  '/signature-reserve': {
    titleVi: 'ROAR Signature Reserve — Lô Đặc Sản Giới Hạn | ROAR COFFEE®',
    titleEn: 'ROAR Signature Reserve — Limited Micro-Lot Collection | ROAR COFFEE®',
    descVi:
      'Bộ sưu tập cà phê đặc sản tuyển chọn theo mùa vụ cao nguyên và dòng Báo Đen Signature Reserve dành cho người sành cà phê.',
    descEn:
      'Curated limited highland micro-lots and the flagship Black Panther Signature Reserve collection.',
  },
  '/brewing': {
    titleVi: 'Hướng Dẫn Pha Chế Phin, Espresso & Pour-Over | ROAR COFFEE®',
    titleEn: 'Phin, Espresso & Pour-Over Brewing Guide | ROAR COFFEE®',
    descVi:
      'Công thức tỷ lệ, nhiệt độ nước và cỡ xay chuẩn cho Phin Việt Nam, máy Espresso, Cold Brew và V60 cùng ROAR COFFEE.',
    descEn:
      'Dial-in brew ratios, grind guidance, and water temperatures for Vietnamese Phin, Espresso, Cold Brew, and Pour-Over.',
  },
  '/brewing-handbook': {
    titleVi: 'Cẩm Nang Pha Chế Cà Phê (15 Bài Chuyên Sâu) | ROAR COFFEE®',
    titleEn: '15-Chapter Coffee Brewing Handbook | ROAR COFFEE®',
    descVi:
      'Thư viện 15 bài hướng dẫn kỹ thuật chiết xuất Phin, Espresso, Moka, Pour-over, Cold Brew và quản lý chất lượng nước pha cà phê.',
    descEn:
      'In-depth 15-chapter extraction library covering Phin, Espresso, Moka Pot, V60, Cold Brew and barista water chemistry.',
  },
  '/cam-nang-pha-che': {
    titleVi: 'Cẩm Nang Pha Chế Cà Phê (15 Bài Chuyên Sâu) | ROAR COFFEE®',
    titleEn: '15-Chapter Coffee Brewing Handbook | ROAR COFFEE®',
    descVi:
      'Thư viện 15 bài hướng dẫn kỹ thuật chiết xuất Phin, Espresso, Moka, Pour-over, Cold Brew và quản lý chất lượng nước pha cà phê.',
    descEn:
      'In-depth 15-chapter extraction library covering Phin, Espresso, Moka Pot, V60, Cold Brew and barista water chemistry.',
  },
  '/journal': {
    titleVi: 'Tạp Chí Cà Phê & Kiến Thức Rang Xay | ROAR COFFEE®',
    titleEn: 'ROAR Coffee Journal & Sourcing Dispatches | ROAR COFFEE®',
    descVi:
      'Bài viết chuyên sâu về văn hóa cà phê Việt Nam, phân tích Robusta vs Arabica, kỹ thuật rang và xu hướng F&B.',
    descEn:
      'Editorial dispatches on Vietnamese coffee culture, Robusta & Arabica sensory profiles, roasting craft and F&B insights.',
  },
  '/promotions': {
    titleVi: 'Ưu Đãi & Mã Giảm Giá Thành Viên ROAR CLUB | ROAR COFFEE®',
    titleEn: 'Promotions & ROAR CLUB Member Vouchers | ROAR COFFEE®',
    descVi:
      'Tổng hợp mã giảm giá, freeship, quà tặng thành viên và ưu đãi nạp Ví ROAR mới nhất.',
    descEn:
      'Active promo codes, free shipping milestones, welcome perks and ROAR Wallet bonus offers.',
  },
  '/play': {
    titleVi: 'ROAR Play & Win — Mini-Game Săn Quà Cà Phê & Voucher | ROAR COFFEE®',
    titleEn: 'ROAR Play & Win — Interactive Coffee Games & Real Gifts | ROAR COFFEE®',
    descVi:
      'Chơi 7 mini-game tương tác Vòng Quay, Lắc Điện Thoại, Xin Xăm Cà Phê, Đoán Gu, Lật Thẻ, Thu Hoạch Cao Nguyên và Rương Bí Ẩn để nhận điểm ROAR, voucher và quà tặng cà phê thật.',
    descEn:
      'Play 7 interactive coffee mini-games including Lucky Wheel, Shake & Win, Fortune Stick, Flavour Quiz, Memory Match, Highland Harvest and Mystery Chests to win points, vouchers and real coffee gifts.',
  },
  '/games': {
    titleVi: 'ROAR Play & Win — Mini-Game Săn Quà Cà Phê & Voucher | ROAR COFFEE®',
    titleEn: 'ROAR Play & Win — Interactive Coffee Games & Real Gifts | ROAR COFFEE®',
    descVi:
      'Chơi 7 mini-game tương tác tại ROAR COFFEE để nhận điểm ROAR, mã giảm giá và sản phẩm cà phê tặng kèm.',
    descEn:
      'Play 7 interactive ROAR COFFEE mini-games to earn points, vouchers and physical coffee gift prizes.',
  },
  '/roar-play': {
    titleVi: 'ROAR Play & Win — Mini-Game Săn Quà Cà Phê & Voucher | ROAR COFFEE®',
    titleEn: 'ROAR Play & Win — Interactive Coffee Games & Real Gifts | ROAR COFFEE®',
    descVi:
      'Chơi 7 mini-game tương tác tại ROAR COFFEE để nhận điểm ROAR, mã giảm giá và sản phẩm cà phê tặng kèm.',
    descEn:
      'Play 7 interactive ROAR COFFEE mini-games to earn points, vouchers and physical coffee gift prizes.',
  },
  '/partners': {
    titleVi: 'Đối Tác Bán Sỉ & HORECA (Quán, Khách Sạn, Văn Phòng) | ROAR COFFEE®',
    titleEn: 'Wholesale & HORECA Coffee Partner Program | ROAR COFFEE®',
    descVi:
      'Cung ứng cà phê hạt rang giá sỉ 5 nấc sản lượng, rang gia công theo gu quán và đào tạo barista cho đối tác HORECA.',
    descEn:
      'Commercial wholesale supply, 5-tier roasted bean pricing, custom profile roasting and barista support for HORECA.',
  },
  '/b2b': {
    titleVi: 'Cổng Thương Mại B2B & Đối Tác Sỉ | ROAR COFFEE®',
    titleEn: 'B2B Commercial Supply & Wholesale Portal | ROAR COFFEE®',
    descVi:
      'Giải pháp cung ứng cà phê hạt rang và nhân xanh B2B toàn quốc với hợp đồng dài hạn và báo giá theo sản lượng.',
    descEn:
      'Nationwide B2B coffee supply for cafes, distributors and corporate buyers with volume contract pricing.',
  },
  '/oem-export': {
    titleVi: 'Gia Công OEM, Nhãn Riêng (Private Label) & Xuất Khẩu | ROAR COFFEE®',
    titleEn: 'OEM Roasting, Private Label & Coffee Export | ROAR COFFEE®',
    descVi:
      'Dịch vụ gia công rang xay OEM, đóng gói nhãn riêng và xuất khẩu cà phê Việt Nam theo điều kiện EXW / FOB / CIF.',
    descEn:
      'End-to-end OEM coffee roasting, private label packaging and international export under EXW, FOB and CIF terms.',
  },
  '/farm-membership': {
    titleVi: 'Hợp Tác Nông Hộ & Nguồn Cung Bền Vững | ROAR COFFEE®',
    titleEn: 'Farm Membership & Sustainable Sourcing Network | ROAR COFFEE®',
    descVi:
      'Chương trình đồng hành cùng nông hộ Tây Nguyên thu hái chín đỏ, sơ chế sạch và truy xuất nguồn gốc minh bạch.',
    descEn:
      'Partnering with Vietnamese highland growers for ripe cherry harvesting, clean processing and full traceability.',
  },
  '/contact': {
    titleVi: 'Liên Hệ Tư Vấn Bán Lẻ & B2B | ROAR COFFEE®',
    titleEn: 'Contact Retail Support & B2B Desk | ROAR COFFEE®',
    descVi:
      'Liên hệ ROAR COFFEE để được tư vấn chọn vị cà phê, báo giá sỉ HORECA, yêu cầu mẫu nhân xanh hoặc hợp tác OEM.',
    descEn:
      'Reach ROAR COFFEE retail care, B2B wholesale desk, green bean sample fulfillment or OEM export specialists.',
  },
  '/orders/track': {
    titleVi: 'Tra Cứu Đơn Hàng & Tiến Độ Vận Chuyển | ROAR COFFEE®',
    titleEn: 'Track Order & Real-Time Shipping ETA | ROAR COFFEE®',
    descVi:
      'Kiểm tra trạng thái giao hàng thời gian thực, ngày nhận dự kiến, mã QR thanh toán và in hóa đơn đơn hàng ROAR COFFEE.',
    descEn:
      'Check live shipping progress, estimated arrival dates, payment QR codes and printable invoices for your ROAR orders.',
  },
  '/track-order': {
    titleVi: 'Tra Cứu Đơn Hàng & Tiến Độ Vận Chuyển | ROAR COFFEE®',
    titleEn: 'Track Order & Real-Time Shipping ETA | ROAR COFFEE®',
    descVi:
      'Kiểm tra trạng thái giao hàng thời gian thực, ngày nhận dự kiến, mã QR thanh toán và in hóa đơn đơn hàng ROAR COFFEE.',
    descEn:
      'Check live shipping progress, estimated arrival dates, payment QR codes and printable invoices for your ROAR orders.',
  },
  '/privacy': {
    titleVi: 'Chính Sách Bảo Mật Thông Tin Khách Hàng | ROAR COFFEE®',
    titleEn: 'Privacy Policy & Data Protection | ROAR COFFEE®',
    descVi:
      'Quy định thu thập, lưu trữ, bảo mật dữ liệu thành viên, lịch sử đơn hàng và quyền kiểm soát thông tin tại ROAR COFFEE.',
    descEn:
      'How ROAR COFFEE collects, safeguards and manages member profile data, orders and privacy preferences.',
  },
  '/terms': {
    titleVi: 'Điều Khoản Sử Dụng & Quy Định Thương Mại | ROAR COFFEE®',
    titleEn: 'Terms & Conditions of Sale & B2B Trade | ROAR COFFEE®',
    descVi:
      'Điều khoản giao dịch bán lẻ, quy định sử dụng E-Voucher, Ví thành viên ROAR và điều kiện thương mại B2B.',
    descEn:
      'Commercial terms covering retail orders, ROAR Wallet, E-Vouchers, loyalty points and B2B green coffee contracts.',
  },
  '/shipping': {
    titleVi: 'Chính Sách Vận Chuyển, Freeship & Đổi Trả | ROAR COFFEE®',
    titleEn: 'Shipping Rates, Free Delivery & Returns Policy | ROAR COFFEE®',
    descVi:
      'Thông tin phí giao hàng toàn quốc, miễn phí vận chuyển từ 500.000đ, thời gian nhận hàng và quy trình đổi trả 7 ngày.',
    descEn:
      'Nationwide shipping timelines, 500k VND free-shipping threshold, 7-day return eligibility and B2B freight terms.',
  },
  '/cart': {
    titleVi: 'Giỏ Hàng | ROAR COFFEE®',
    titleEn: 'Shopping Cart | ROAR COFFEE®',
    descVi: 'Xem lại sản phẩm cà phê trong giỏ hàng của bạn tại ROAR COFFEE.',
    descEn: 'Review your selected coffee products in your ROAR COFFEE shopping cart.',
    noIndex: true,
  },
  '/checkout': {
    titleVi: 'Thanh Toán Đơn Hàng | ROAR COFFEE®',
    titleEn: 'Checkout | ROAR COFFEE®',
    descVi: 'Hoàn tất đơn hàng ROAR COFFEE qua VietQR, Ví ROAR, điểm thưởng hoặc COD.',
    descEn: 'Complete your ROAR COFFEE order via VietQR, ROAR Wallet, reward points or COD.',
    noIndex: true,
  },
  '/account': {
    titleVi: 'Tài Khoản & Ví Thành Viên ROAR CLUB | ROAR COFFEE®',
    titleEn: 'ROAR CLUB Member Portal & Wallet | ROAR COFFEE®',
    descVi: 'Quản lý hạng thành viên, Ví ROAR, điểm thưởng, lịch sử đơn hàng và E-Voucher.',
    descEn: 'Manage your ROAR CLUB tier, member wallet, loyalty points, order history and gift vouchers.',
    noIndex: true,
  },
};

function upsertMetaTag(attr: 'name' | 'property', key: string, content: string) {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLinkTag(rel: string, href: string, hreflang?: string) {
  if (typeof document === 'undefined') return;
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector(selector) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function upsertJsonLd(scriptId: string, payload: Record<string, unknown> | null) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(scriptId);
  if (!payload) {
    existing?.remove();
    return;
  }
  const el = (existing || document.createElement('script')) as HTMLScriptElement;
  el.id = scriptId;
  el.type = 'application/ld+json';
  el.textContent = JSON.stringify(payload);
  if (!existing) document.head.appendChild(el);
}

export function updateCustomSeoHead(opts: {
  title: string;
  description: string;
  pathname: string;
  type?: 'website' | 'product' | 'article';
  imageUrl?: string;
}) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const cleanPath = stripLocalePrefix(opts.pathname);
  const origin = window.location.origin;
  const canonicalUrl = `${origin}${opts.pathname}`;
  const viHref = `${origin}${cleanPath === '/' ? '/' : cleanPath}`;
  const enHref = `${origin}${cleanPath === '/' ? '/en' : `/en${cleanPath}`}`;

  document.title = opts.title;
  upsertMetaTag('name', 'description', opts.description);
  upsertMetaTag('property', 'og:type', opts.type || 'website');
  upsertMetaTag('property', 'og:title', opts.title);
  upsertMetaTag('property', 'og:description', opts.description);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('name', 'twitter:title', opts.title);
  upsertMetaTag('name', 'twitter:description', opts.description);
  if (opts.imageUrl) {
    upsertMetaTag('property', 'og:image', opts.imageUrl);
    upsertMetaTag('name', 'twitter:image', opts.imageUrl);
  }
  upsertLinkTag('canonical', canonicalUrl);
  upsertLinkTag('alternate', viHref, 'vi');
  upsertLinkTag('alternate', enHref, 'en');
  upsertLinkTag('alternate', viHref, 'x-default');
}

export function applyRouteSeo(pathname: string, lang: Lang): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const cleanPath = stripLocalePrefix(pathname);

  // Let detail pages manage their own fine-grained titles while keeping canonical & hreflang synced
  const origin = window.location.origin;
  const canonicalUrl = `${origin}${pathname}`;
  const viHref = `${origin}${cleanPath === '/' ? '/' : cleanPath}`;
  const enHref = `${origin}${cleanPath === '/' ? '/en' : `/en${cleanPath}`}`;
  upsertLinkTag('canonical', canonicalUrl);
  upsertLinkTag('alternate', viHref, 'vi');
  upsertLinkTag('alternate', enHref, 'en');
  upsertLinkTag('alternate', viHref, 'x-default');

  if (
    cleanPath.startsWith('/product/') ||
    cleanPath.startsWith('/journal/') ||
    cleanPath === '/about'
  ) {
    return;
  }

  let matched = STATIC_ROUTE_SEO[cleanPath];
  if (!matched && cleanPath.startsWith('/personalities/')) {
    matched = STATIC_ROUTE_SEO['/personalities'];
  } else if (!matched && (cleanPath.startsWith('/brewing-handbook/') || cleanPath.startsWith('/cam-nang-pha-che/'))) {
    matched = STATIC_ROUTE_SEO['/brewing-handbook'];
  } else if (!matched && cleanPath.startsWith('/admin')) {
    matched = {
      titleVi: 'Quản trị Hệ thống CMS | ROAR COFFEE®',
      titleEn: 'ROAR COFFEE® CMS Admin',
      descVi: 'Cổng quản trị nội dung, đơn hàng, thành viên và báo giá B2B ROAR COFFEE.',
      descEn: 'ROAR COFFEE administrative CMS for products, orders, members and B2B leads.',
      noIndex: true,
    };
  }

  const resolved = matched || DEFAULT_SEO;
  const title = lang === 'vi' ? resolved.titleVi : resolved.titleEn;
  const desc = lang === 'vi' ? resolved.descVi : resolved.descEn;

  document.title = title;
  upsertMetaTag('name', 'description', desc);
  upsertMetaTag('property', 'og:type', 'website');
  upsertMetaTag('property', 'og:title', title);
  upsertMetaTag('property', 'og:description', desc);
  upsertMetaTag('property', 'og:url', canonicalUrl);
  upsertMetaTag('name', 'twitter:title', title);
  upsertMetaTag('name', 'twitter:description', desc);
  upsertMetaTag('name', 'robots', resolved.noIndex ? 'noindex, nofollow' : 'index, follow');
}
