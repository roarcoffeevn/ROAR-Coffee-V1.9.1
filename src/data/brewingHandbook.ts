export interface BrewingArticleSpec {
  dose: string;
  water: string;
  temp: string;
  time: string;
  grindVi: string;
  grindEn: string;
}

export interface BrewingHandbookArticle {
  id: number;
  slug: string;
  topic: 'phin' | 'espresso' | 'manual' | 'science' | 'instant';
  topicVi: string;
  topicEn: string;
  titleVi: string;
  titleEn: string;
  excerptVi: string;
  excerptEn: string;
  readMinutes: number;
  coverImageKey: string;
  spec: BrewingArticleSpec;
  introVi: string[];
  introEn: string[];
  stepsVi: string[];
  stepsEn: string[];
  baristaTipVi: string;
  baristaTipEn: string;
  primaryProductSlug: string;
  secondaryProductSlug: string;
  upsellHeadlineVi: string;
  upsellHeadlineEn: string;
  upsellReasonVi: string;
  upsellReasonEn: string;
}

export const BREWING_HANDBOOK_TOPICS: Array<{
  id: 'all' | BrewingHandbookArticle['topic'];
  vi: string;
  en: string;
}> = [
  { id: 'all', vi: 'Tất cả 15 cẩm nang', en: 'All 15 Guides' },
  { id: 'phin', vi: 'Pha Phin & Gu Việt', en: 'Vietnamese Phin' },
  { id: 'espresso', vi: 'Espresso & Quầy Bar', en: 'Espresso & Bar' },
  { id: 'manual', vi: 'Pour-Over & Pha Thủ Công', en: 'Manual & Cold Brew' },
  { id: 'science', vi: 'Nước, Cỡ Xay & Bảo Quản', en: 'Water, Grind & Care' },
  { id: 'instant', vi: 'Pha Nhanh & Tiện Lợi', en: 'Instant & Travel' },
];

export const BREWING_HANDBOOK_ARTICLES: BrewingHandbookArticle[] = [
  {
    id: 1,
    slug: 'bi-quyet-pha-phin-truyen-thong-dam-vi-khong-chat',
    topic: 'phin',
    topicVi: 'Pha Phin & Gu Việt',
    topicEn: 'Vietnamese Phin',
    titleVi: 'Cẩm Nang Pha Phin Việt Nam Truyền Thống: Tỷ Lệ, Ủ Bloom & Kiểm Soát Nhiệt',
    titleEn: 'Traditional Vietnamese Phin Handbook: Ratio, Bloom & Thermal Control',
    excerptVi:
      'Làm chủ nhịp nhỏ giọt 1 giọt/giây với công thức 25g bột – 90ml nước ở 92–95°C, giúp cốt cà phê sánh mượt vị sô-cô-la mà không hề đắng khét.',
    excerptEn:
      'Master the 1-drop-per-second drawdown using 25g ground coffee and 90ml water at 92–95°C for syrupy cacao richness without harshness.',
    readMinutes: 5,
    coverImageKey: 'journal_phin_ritual',
    spec: {
      dose: '25g',
      water: '90ml (25ml bloom + 65ml)',
      temp: '92–95°C',
      time: '4:30 – 5:00',
      grindVi: 'Vừa-thô (Medium-Coarse)',
      grindEn: 'Medium-Coarse',
    },
    introVi: [
      'Một ly cà phê Phin đạt chuẩn không nằm ở việc ép nắp thật chặt hay dùng nước sôi 100°C. Nhiệt quá cao sẽ trích ly quá mức các hợp chất chát, còn bột quá mịn dễ làm tắc lỗ phin khiến cà phê bị ngâm lâu và chua gắt.',
      'Chìa khóa của ROAR Barista Lab nằm ở bước tráng ấm phin, giai đoạn ủ nở (bloom) 30 giây để khí CO2 thoát ra tự nhiên và chọn cà phê rang mộc đồng đều hạt.',
    ],
    introEn: [
      'Great Vietnamese Phin coffee never relies on boiling 100°C water or crushing the gravity press. Excessive heat over-extracts astringent compounds while overly fine grinds stall drawdown.',
      'ROAR Barista Lab emphasizes pre-warming the vessel, a disciplined 30-second bloom to vent CO2, and pure evenly roasted ground coffee.',
    ],
    stepsVi: [
      'Tráng nóng toàn bộ thân phin, nắp gài và ly thủy tinh bằng nước nóng rồi đổ bỏ.',
      'Cho 25g cà phê xay vừa-thô vào phin, lắc nhẹ theo chiều ngang cho mặt bột phẳng đều.',
      'Đặt nắp gài lên bề mặt bột, xoay nhẹ nửa vòng để cố định mà không nén chặt tay.',
      'Rót chậm 25ml nước 92–95°C theo vòng tròn từ tâm ra ngoài, đậy nắp ủ nở (bloom) đúng 30 giây.',
      'Rót tiếp 65ml nước nóng còn lại, đậy nắp và chờ hoàn tất trong 4 phút 30 giây để thu được ~45ml cốt sánh đậm.',
    ],
    stepsEn: [
      'Pre-warm the Phin body, press, and serving glass with hot water, then discard.',
      'Dose 25g medium-coarse coffee and gently shake sideways to level the bed.',
      'Rest the gravity press lightly on top without forcing it down.',
      'Pour 25ml of 92–95°C water in slow concentric circles and bloom covered for 30 seconds.',
      'Add the remaining 65ml water and allow 4:30–5:00 total drawdown for ~45ml rich concentrate.',
    ],
    baristaTipVi: 'Nếu phin nhỏ giọt nhanh dưới 3 phút, hãy tăng nhẹ độ mịn cối xay ở lần pha sau thay vì đè mạnh nắp gài.',
    baristaTipEn: 'If drawdown finishes under 3 minutes, tighten your grind setting slightly on the next brew instead of pressing harder.',
    primaryProductSlug: 'roar-phin-heritage',
    secondaryProductSlug: 'roar-dam-bold',
    upsellHeadlineVi: 'Phối trộn sinh ra dành riêng cho Phin truyền thống',
    upsellHeadlineEn: 'Engineered Specifically for Vietnamese Phin',
    upsellReasonVi:
      'ROAR COFFEE PHIN (biểu tượng Sư Tử) có cỡ xay chuẩn phin, kết hợp độ dày Robusta Tây Nguyên cùng hậu ngọt dịu của hạt Culi giúp từng giọt cà phê sánh đặc và thơm ca cao rang.',
    upsellReasonEn:
      'ROAR COFFEE PHIN (Lion crest) arrives calibrated for Phin extraction, marrying highland Robusta body with sweet rounded Culi aromatics.',
  },
  {
    id: 2,
    slug: 'ca-phe-sua-da-sai-gon-phin-va-espresso',
    topic: 'phin',
    topicVi: 'Pha Phin & Gu Việt',
    topicEn: 'Vietnamese Phin',
    titleVi: 'Cà Phê Sữa Đá Sài Gòn Chuẩn Vị: Cân Bằng Cốt Đậm & Sữa Đặc Không Bị Loãng',
    titleEn: 'Saigon Cà Phê Sữa Đá: Balancing Intense Concentrate & Condensed Milk',
    excerptVi:
      'Bí quyết chọn dòng rang đậm tạo hậu vị sô-cô-la quyện sữa, tỷ lệ 30ml sữa đặc – 45ml cốt Phin và cách đánh bọt mịn trước khi cho đá viên già.',
    excerptEn:
      'Pair dark-roast cacao body with 30ml sweetened condensed milk and 45ml Phin concentrate over dense ice for authentic Saigon texture.',
    readMinutes: 4,
    coverImageKey: '/assets/roasted-ground/roar-dam-bold.jpg',
    spec: {
      dose: '25g',
      water: '85ml nước nóng + 30ml sữa đặc',
      temp: '93°C',
      time: '4:30',
      grindVi: 'Vừa (Chuẩn Phin)',
      grindEn: 'Medium Phin',
    },
    introVi: [
      'Cà phê sữa đá ngon phải giữ được hương cà phê nổi bật xuyên qua lớp vị ngọt béo của sữa đặc và tan đá chậm đến ngụm cuối cùng. Nếu nền cà phê quá nhạt hoặc nhiều vị chua, sữa sẽ làm ly nước bị ngấy và tách lớp.',
      'Vì thế, nền Robusta chín mọng rang Full City+ chính là linh hồn giúp ly sữa đá dậy mùi đường nâu cháy và ca cao đen quyến rũ.',
    ],
    introEn: [
      'Great Cà Phê Sữa Đá keeps roasted coffee aromatics alive beneath creamy condensed milk even as ice melts. Light or overly acidic roasts taste flat when paired with dairy.',
      'Ripe highland Robusta roasted to Full City+ delivers dark cacao and caramelized sugar depth that shines over ice.',
    ],
    stepsVi: [
      'Cho 25–30ml sữa đặc có đường vào đáy ly thủy tinh chịu nhiệt.',
      'Pha 25g cà phê với 85ml nước nóng 93°C để chiết xuất trực tiếp ~45ml nước cốt xuống lớp sữa đặc.',
      'Dùng thìa khuấy tròn đều tay hoặc đánh nhẹ 10 giây khi cà phê còn nóng để tạo lớp bọt nâu mịn.',
      'Cho đầy đá viên già (đá đặc ít bọt khí) vào ly, khuấy nhẹ 2 vòng và thưởng thức ngay.',
    ],
    stepsEn: [
      'Spoon 25–30ml sweetened condensed milk into a heat-safe glass.',
      'Brew 25g coffee with 85ml water at 93°C directly over the milk to yield ~45ml hot concentrate.',
      'Whisk or stir vigorously for 10 seconds while hot to aerate a creamy mahogany foam.',
      'Fill with dense solid ice cubes, give two gentle stirs, and serve immediately.',
    ],
    baristaTipVi: 'Ưu tiên dùng đá viên già đặc ruột thay vì đá bào nhỏ để giữ trọn vị đậm trong suốt 20–30 phút thưởng thức.',
    baristaTipEn: 'Use large solid ice cubes rather than crushed ice to minimize rapid dilution.',
    primaryProductSlug: 'roar-dam-bold',
    secondaryProductSlug: 'roar-phin-heritage',
    upsellHeadlineVi: 'Nền cốt đậm bản lĩnh cho ly Sữa Đá hoàn hảo',
    upsellHeadlineEn: 'Bold Base Built for Iced Milk Coffee',
    upsellReasonVi:
      'ROAR COFFEE ĐẬM (biểu tượng Hổ) mang hồ sơ rang đậm chuẩn mực từ Robusta Đắk Lắk, kết hợp với sữa đặc tạo hậu vị ngọt bùi sô-cô-la kéo dài.',
    upsellReasonEn:
      'ROAR COFFEE ĐẬM (Tiger crest) delivers bold Đắk Lắk Robusta intensity engineered to cut cleanly through condensed milk and ice.',
  },
  {
    id: 3,
    slug: 'chiet-xuat-espresso-9-bar-tuyet-hao',
    topic: 'espresso',
    topicVi: 'Espresso & Quầy Bar',
    topicEn: 'Espresso & Bar',
    titleVi: 'Nghệ Thuật Chiết Xuất Espresso 9 Bar: Tỷ Lệ 1:2, Kênh Nước & Crema Hổ Phách',
    titleEn: '9-Bar Espresso Extraction: 1:2 Ratio, Channeling Control & Tiger Crema',
    excerptVi:
      'Hướng dẫn căn chỉnh máy xay từ 18g bột đầu vào để thu về 36g Espresso trong 26–29 giây với lớp crema dày mịn vân hổ phách.',
    excerptEn:
      'Dial in an 18g dose to 36g beverage yield in 26–29 seconds at 92°C for balanced sweetness and dense tiger-striped crema.',
    readMinutes: 6,
    coverImageKey: 'journal_phin_espresso',
    spec: {
      dose: '18g',
      water: '36g chiết xuất (Ratio 1:2)',
      temp: '92°C · 9 bar',
      time: '26–29 giây',
      grindVi: 'Mịn Espresso (Fine)',
      grindEn: 'Fine Espresso',
    },
    introVi: [
      'Chiết xuất Espresso là cuộc đối thoại chính xác giữa áp suất 9 bar, độ mịn bột cà phê và tính ổn định nhiệt. Chỉ cần sai lệch 3–4 giây chiết xuất, ly Espresso có thể chuyển từ ngọt cân bằng sang chua gắt hoặc đắng khô.',
      'Hãy luôn sử dụng cân điện tử độ chia 0.1g ở cả đầu vào (dose) lẫn đầu ra (yield) thay vì ước lượng theo thể tích bọt crema.',
    ],
    introEn: [
      'Espresso extraction balances 9-bar pressure, particle uniformity, and thermal stability. A 4-second swing shifts a shot from syrupy sweetness to sourness or bitter dryness.',
      'Always weigh both dry dose and liquid yield on a 0.1g scale rather than judging by crema volume.',
    ],
    stepsVi: [
      'Xả nước nóng (purge) grouphead 2 giây và lau khô hoàn toàn rổ lọc 58mm.',
      'Cân chính xác 18g cà phê xay mịn vào tay pha, dùng kim WDT đánh tơi để phá vỡ vón cục.',
      'Nén phẳng (tamp) một lực dứt khoát và giữ cổ tay thẳng vuông góc mặt rổ lọc.',
      'Khóa tay pha và bấm nút chiết xuất ngay lập tức; đặt ly lên cân bấm giờ.',
      'Dừng máy khi cân đạt 36g trong khoảng thời gian 26–29 giây; dòng chảy mượt như mật ong ấm là đạt chuẩn.',
    ],
    stepsEn: [
      'Purge the group head for 2 seconds and wipe the 58mm basket completely dry.',
      'Dose 18g finely ground coffee and distribute evenly with a WDT tool to eliminate clumps.',
      'Tamp level with consistent vertical pressure.',
      'Lock the portafilter in and start extraction immediately over a timer scale.',
      'Stop at 36g liquid yield within 26–29 seconds—looking for a warm, syrupy honey stream.',
    ],
    baristaTipVi: 'Nếu dòng chảy tách thành nhiều tia mảnh hoặc bắn tia nhỏ (channeling), hãy chú ý khâu đánh tơi bột WDT trước khi nén.',
    baristaTipEn: 'Spitting or uneven streams indicate channeling—focus on even WDT distribution before tamping.',
    primaryProductSlug: 'roar-espresso',
    secondaryProductSlug: 'roar-espresso-gold',
    upsellHeadlineVi: 'Công thức Espresso cân bằng cho máy pha gia đình & quán',
    upsellHeadlineEn: 'Precision Espresso Blend for Home & Cafe Bars',
    upsellReasonVi:
      'ROAR COFFEE ESPRESSO (biểu tượng Cáo) cân chỉnh độ rang Medium-Dark hòa quyện Arabica thanh hương và Robusta dày crema, rất dễ lấy chuẩn 1:2.',
    upsellReasonEn:
      'ROAR COFFEE ESPRESSO (Fox crest) pairs Medium-Dark Arabica lift with structured Robusta crema for forgiving, sweet 1:2 extractions.',
  },
  {
    id: 4,
    slug: 'latte-art-va-danh-sua-microfoam-cho-barista',
    topic: 'espresso',
    topicVi: 'Espresso & Quầy Bar',
    topicEn: 'Espresso & Bar',
    titleVi: 'Đánh Sữa Microfoam Mịn Bóng & Nền Espresso Cho Latte / Cappuccino Chuẩn Quán',
    titleEn: 'Silky Microfoam Steaming & Espresso Base for Café Latte Art',
    excerptVi:
      'Kỹ thuật nạp khí (stretching) dưới 38°C và xoáy lốc đồng nhất đến 60–65°C kết hợp cùng nền Espresso Gold ngọt caramel quyện sữa.',
    excerptEn:
      'Master aeration below 38°C and vortex texturing to 60–65°C paired with caramel-sweet Espresso Gold.',
    readMinutes: 5,
    coverImageKey: '/assets/roasted-ground/roar-espresso-gold.jpg',
    spec: {
      dose: '18.5g Espresso + 180ml sữa tươi thanh trùng',
      water: '36g shot',
      temp: 'Sữa 60–65°C',
      time: '27 giây shot + 15 giây đánh sữa',
      grindVi: 'Mịn Espresso',
      grindEn: 'Fine Espresso',
    },
    introVi: [
      'Để vẽ Latte Art sắc nét và ly Cappuccino ngọt vị tự nhiên không cần thêm đường, bọt sữa phải đạt cấu trúc microfoam bóng như sơn ướt (wet paint), đồng thời lớp crema Espresso phải đủ dẻo và đậm mùi hạt rang bơ đường.',
      'Đừng đánh sữa quá 68°C vì protein và đường lactose trong sữa sẽ bị biến tính gây mùi khét và mất độ ngọt dịu.',
    ],
    introEn: [
      'Crisp latte art and naturally sweet milk drinks require glossy wet-paint microfoam poured into a viscous, caramel-rich espresso base.',
      'Never steam milk past 68°C, as scalding denatures proteins and strips away natural lactose sweetness.',
    ],
    stepsVi: [
      'Rót 180ml sữa tươi nguyên kem lạnh (4°C) vào ca đánh sữa inox đến ngay dưới vạch chân vòi rót.',
      'Xả sạch hơi nước ngưng tụ trong vòi đánh sữa trước khi nhúng đầu vòi hơi lệch tâm nhẹ.',
      'Mở van hết cỡ, hạ nhẹ ca để đầu vòi chạm sát mặt sữa tạo tiếng rít giấy mảnh (nạp khí) trong 3–4 giây đầu.',
      'Nâng ca lên 1cm để vòi tạo vòng xoáy lốc cuộn toàn bộ bọt thô xuống đáy đến khi thân ca ấm 60–65°C thì tắt van.',
      'Lắc tròn ca cho sữa bóng đều và rót vào tâm ly Espresso đã chiết xuất sẵn.',
    ],
    stepsEn: [
      'Pour 180ml cold whole milk (4°C) into a chilled stainless pitcher just below the spout notch.',
      'Purge condensation from the steam wand, then position the tip slightly off-center.',
      'Open steam fully and introduce gentle micro-sips of air for the first 3–4 seconds.',
      'Submerge tip 1cm to create a continuous vortex until the pitcher feels hot (60–65°C), then shut off.',
      'Swirl to polish and pour steadily into the center of your freshly pulled espresso.',
    ],
    baristaTipVi: 'Sữa tươi thanh trùng lạnh sâu và cà phê hạt S18 rang mới 7–21 ngày là cặp đôi lý tưởng nhất cho microfoam và crema.',
    baristaTipEn: 'Cold pasteurized milk plus beans rested 7–21 days post-roast give the silkiest latte integration.',
    primaryProductSlug: 'roar-espresso-gold',
    secondaryProductSlug: 'roasted-beans-arabica-s18-cbu',
    upsellHeadlineVi: 'Lựa chọn hàng đầu cho quầy Latte & Cappuccino',
    upsellHeadlineEn: 'Flagship Blend for Café Milk Beverages',
    upsellReasonVi:
      'ROAR COFFEE ESPRESSO GOLD (biểu tượng Đại Bàng) tuyển chọn hạt S18 chế biến ướt CBU & Honey, mang nốt mật ong, hạnh nhân rang và crema óng vàng hòa quyện sữa tuyệt đối.',
    upsellReasonEn:
      'ROAR COFFEE ESPRESSO GOLD (Eagle crest) blends S18 Washed CBU & Honey lots with wild honey and toasted almond notes that shine in milk.',
  },
  {
    id: 5,
    slug: 'pour-over-v60-giot-vang-cao-nguyen',
    topic: 'manual',
    topicVi: 'Pour-Over & Pha Thủ Công',
    topicEn: 'Manual & Cold Brew',
    titleVi: 'Cẩm Nang Pour-Over V60: Ba Lần Rót Xoắn Ốc & Tôn Vinh Hương Hoa Arabica',
    titleEn: 'V60 Pour-Over Guide: Spiral Pulses for Floral Arabica Clarity',
    excerptVi:
      'Tỷ lệ vàng 1:16 (15g – 240ml) ở 91°C với 3 nhịp rót chuẩn xác giúp tách cà phê giấy lọc tỏa hương hoa nhài, cam chín và hậu vị ngọt thanh.',
    excerptEn:
      'Brew a crisp 1:16 ratio (15g to 240ml at 91°C) in three controlled pours to unlock jasmine florals and bright citrus finish.',
    readMinutes: 6,
    coverImageKey: 'journal_caudat_arabica',
    spec: {
      dose: '15g',
      water: '240ml (1:16)',
      temp: '90–92°C',
      time: '2:35 – 2:55',
      grindVi: 'Vừa (như muối biển mịn)',
      grindEn: 'Medium (table salt)',
    },
    introVi: [
      'Phễu V60 với các đường gân xoắn ốc bên trong giúp dòng khí thoát ra dễ dàng, tạo tốc độ chiết xuất nhanh và trong trẻo bậc nhất trong thế giới pha thủ công. Đây là sân khấu hoàn hảo cho những dòng Arabica vùng cao Cầu Đất – Đà Lạt.',
      'Chỉ với một chiếc ấm cổ ngỗng (gooseneck kettle) và cân bấm giờ, bạn có thể tận hưởng trải nghiệm chậm rãi đầy thư giãn mỗi sáng.',
    ],
    introEn: [
      'The V60’s spiral ribs lift the paper filter to keep airflow open, delivering crystalline clarity that celebrates high-altitude Cầu Đất Arabica.',
      'With a gooseneck kettle and a timer scale, you gain a calm morning ritual with vibrant aromatics.',
    ],
    stepsVi: [
      'Gấp mép giấy lọc V60 đặt vào phễu, tráng kỹ bằng nước nóng để khử mùi giấy và làm ấm bình hứng, sau đó đổ bỏ nước tráng.',
      'Cho 15g cà phê xay vừa vào phễu, ấn nhẹ tạo một hõm nông ở chính giữa.',
      'Rót 45ml nước 91°C thấm đều bột, lắc nhẹ phễu để ủ nở (bloom) trong 40 giây.',
      'Lần rót 1 (0:40 – 1:15): rót xoắn ốc từ tâm ra ngoài nhẹ nhàng đến mốc 145ml.',
      'Lần rót 2 (1:25 – 1:55): rót đều giữ mực nước ổn định đến mốc tổng 240ml, lắc tròn nhẹ 1 vòng rồi chờ rút cạn vào khoảng 2:45.',
    ],
    stepsEn: [
      'Fold the filter seam, seat it in the dripper, rinse thoroughly with hot water, and discard rinse water.',
      'Add 15g medium-ground coffee and create a shallow central well.',
      'Pour 45ml of 91°C water, swirl gently, and bloom for 40 seconds.',
      'First pulse (0:40–1:15): pour in steady concentric spirals up to 145ml.',
      'Second pulse (1:25–1:55): top steadily to 240ml, give one gentle Rao spin, and finish drawdown near 2:45.',
    ],
    baristaTipVi: 'Tránh rót thẳng vào thành giấy lọc vì nước sẽ đi tắt xuống bình mà không qua tầng cà phê (bypass).',
    baristaTipEn: 'Avoid pouring directly onto exposed filter paper walls so water extracts evenly through the coffee bed.',
    primaryProductSlug: 'arabica-selection',
    secondaryProductSlug: 'roasted-beans-arabica-s18-cbu',
    upsellHeadlineVi: 'Arabica cao nguyên cho tín đồ Pour-Over',
    upsellHeadlineEn: 'High-Altitude Arabica Tailored for Filter Brews',
    upsellReasonVi:
      'ROAR COFFEE ARABICA SELECTION mang 100% Arabica tuyển chọn từ Cầu Đất – Lâm Đồng, tỏa hương hoa trắng, cam vàng và mật ong trong trẻo khi pha V60.',
    upsellReasonEn:
      'ROAR COFFEE ARABICA SELECTION showcases pure Cầu Đất Arabica bursting with white florals, citrus peel, and clean honey sweetness.',
  },
  {
    id: 6,
    slug: 'cold-brew-u-lanh-16-gio-it-chua-muot-ma',
    topic: 'manual',
    topicVi: 'Pour-Over & Pha Thủ Công',
    topicEn: 'Manual & Cold Brew',
    titleVi: 'Cold Brew Ủ Lạnh 16 Giờ: Công Thức 1:10 & Biến Tấu Cam Vàng Giải Nhiệt',
    titleEn: '16-Hour Cold Brew Guide: 1:10 Ratio & Citrus Tonic Twist',
    excerptVi:
      'Ủ chậm trong nước mát 14–16 giờ giúp giảm tới 60% vị đắng chát và axit gắt, giữ trọn độ ngọt mượt mà bảo quản được tới 5 ngày trong tủ lạnh.',
    excerptEn:
      'Slow cold extraction for 14–16 hours cuts harsh bitterness by up to 60%, leaving velvety sweetness fresh for up to 5 days.',
    readMinutes: 4,
    coverImageKey: 'journal_coldbrew_gifting',
    spec: {
      dose: '60g',
      water: '600ml nước lọc mát (1:10)',
      temp: '4–8°C (Ngăn mát)',
      time: '14–16 giờ',
      grindVi: 'Thô (Coarse)',
      grindEn: 'Coarse',
    },
    introVi: [
      'Khác với cà phê đá truyền thống pha nóng rồi làm lạnh, Cold Brew dùng nước nguội để ngâm chiết chậm suốt 14–16 giờ. Quá trình này không giải phóng các axit béo gây chát ở nhiệt độ cao, tạo nên kết cấu mượt như trà ủ lạnh.',
      'Bạn có thể pha sẵn một bình 600ml vào cuối tuần để thưởng thức suốt cả tuần làm việc bận rộn.',
    ],
    introEn: [
      'Unlike iced hot coffee, Cold Brew extracts gently in cold water over 14–16 hours without releasing high-heat bitter compounds, producing silky, tea-like smoothness.',
      'A single weekend batch keeps effortlessly chilled for busy weekday mornings.',
    ],
    stepsVi: [
      'Xay thô 60g cà phê (cỡ hạt thô hơn muối hột một chút) cho vào bình thủy tinh hoặc túi lọc Cold Brew.',
      'Rót từ từ 600ml nước lọc tinh khiết mát, dùng thìa khuấy nhẹ đảm bảo toàn bộ bột thấm ướt đều.',
      'Đậy kín nắp bình và đặt vào ngăn mát tủ lạnh (4–8°C) trong 14 đến 16 giờ.',
      'Lọc qua phễu giấy lọc V60 hoặc rây mịn để tách sạch bã, thu về cốt Cold Brew trong trẻo.',
      'Rót ra ly cùng đá viên lớn, thêm 1 lát cam vàng tươi hoặc 10ml si-rô mật ong nếu thích vị thanh mát.',
    ],
    stepsEn: [
      'Grind 60g coffee coarse and place into a glass carafe or brew mesh.',
      'Pour 600ml filtered cold water slowly and stir gently until every particle is saturated.',
      'Seal tightly and steep in the refrigerator (4–8°C) for 14 to 16 hours.',
      'Strain through a paper filter or fine sieve for crystal-clear concentrate.',
      'Serve over a large ice sphere with a fresh orange peel twist.',
    ],
    baristaTipVi: 'Cà phê hạt xay thô ngay trước khi ủ giúp Cold Brew thơm mùi trái cây rõ nét gấp nhiều lần bột xay sẵn để lâu.',
    baristaTipEn: 'Grinding whole beans coarsely right before steeping preserves vibrant fruit aromatics.',
    primaryProductSlug: 'roasted-beans-arabica-s18',
    secondaryProductSlug: 'arabica-selection',
    upsellHeadlineVi: 'Hạt rang S18 xay thô chuyên dụng cho Cold Brew',
    upsellHeadlineEn: 'Whole Beans Ideal for Coarse Cold Brew Grinds',
    upsellReasonVi:
      'CÀ PHÊ HẠT RANG ARABICA S18 giữ nguyên cấu trúc hạt nguyên bản, cho phép bạn tự xay cỡ thô hoàn hảo để ủ Cold Brew ngọt dịu suốt 16 giờ.',
    upsellReasonEn:
      'ROAR ARABICA S18 Whole Beans let you dial a clean coarse grind tailored for sweet, aromatic 16-hour cold extraction.',
  },
  {
    id: 7,
    slug: 'chemex-trong-treo-va-giay-loc-day',
    topic: 'manual',
    topicVi: 'Pour-Over & Pha Thủ Công',
    topicEn: 'Manual & Cold Brew',
    titleVi: 'Pha Chemex Cho 2–4 Người: Giấy Lọc Dày & Kết Cấu Hương Vị Trong Trẻo',
    titleEn: 'Chemex Brewing for 2–4 Guests: Thick Paper Filters & Tea-Like Purity',
    excerptVi:
      'Công thức 30g cà phê – 500ml nước với giấy lọc bonded đặc trưng giữ lại toàn bộ dầu cặn, làm nổi bật độ ngọt sạch và hương hoa trái tinh tế.',
    excerptEn:
      'A 30g-to-500ml Chemex workflow using thick bonded filters to trap oils and showcase pristine floral sweetness.',
    readMinutes: 5,
    coverImageKey: '/assets/roasted-beans/arabica-s18-cbu.jpg',
    spec: {
      dose: '30g',
      water: '500ml (1:16.6)',
      temp: '92°C',
      time: '3:45 – 4:15',
      grindVi: 'Vừa-thô (Medium-Coarse)',
      grindEn: 'Medium-Coarse',
    },
    introVi: [
      'Chemex nổi tiếng vừa là bình thủy tinh biểu tượng trưng bày, vừa sở hữu loại giấy lọc dày hơn 20–30% so với giấy V60 thông thường. Nhờ độ dày này, Chemex giữ lại phần lớn tinh dầu cafestol và hạt mịn, tạo ra tách cà phê trong sáng như trà hoa.',
      'Phương pháp này cực kỳ lý tưởng khi bạn muốn pha cùng lúc 2–3 tách cho buổi họp nhóm hoặc tiếp khách tại studio.',
    ],
    introEn: [
      'Chemex bonded paper filters are 20–30% thicker than standard cones, trapping bitter fines and oils for remarkably clean, luminous cups.',
      'It is the ideal brewer when hosting 2–4 colleagues or enjoying unhurried weekend brunches.',
    ],
    stepsVi: [
      'Đặt giấy lọc Chemex sao cho phần 3 lớp giấy nằm hướng về phía vòi rót để thoát khí tốt.',
      'Tráng ướt toàn bộ giấy lọc bằng nước nóng để làm ấm bình rồi đổ nước tráng qua vòi.',
      'Cho 30g cà phê xay vừa-thô vào phễu giấy, rót 60ml nước 92°C ủ bloom 45 giây.',
      'Rót theo nhịp chậm đều đến mốc 250ml, sau đó rót thêm hai đợt nhẹ nhàng đến tổng 500ml.',
      'Nhấc bỏ giấy lọc khi nước vừa rút xong (khoảng 4 phút), xoay nhẹ cổ bình và rót thưởng thức.',
    ],
    stepsEn: [
      'Seat the Chemex filter with the triple-folded side facing the pouring spout for air venting.',
      'Rinse the thick filter thoroughly with hot water and discard via the spout.',
      'Add 30g medium-coarse coffee and bloom with 60ml of 92°C water for 45 seconds.',
      'Pour slowly in steady spirals to 250ml, then pulse twice smoothly up to 500ml.',
      'Remove the filter around 4 minutes, swirl the carafe, and pour.',
    ],
    baristaTipVi: 'Cà phê chế biến ướt CBU luôn phát huy tối đa ưu thế "clean cup" khi đi qua lớp giấy lọc dày của Chemex.',
    baristaTipEn: 'Washed (CBU) Arabica lots shine brightest through thick Chemex paper clarity.',
    primaryProductSlug: 'roasted-beans-arabica-s18-cbu',
    secondaryProductSlug: 'arabica-selection',
    upsellHeadlineVi: 'Hạt rang Arabica S18 CBU cho độ sạch vị tối đa',
    upsellHeadlineEn: 'Washed CBU Arabica S18 for Crystal Clarity',
    upsellReasonVi:
      'CÀ PHÊ HẠT RANG ARABICA S18 CBU được chế biến ướt sạch vị từ hạt sàng 18 đồng đều, khi pha Chemex sẽ bung tỏa trọn vẹn hương hoa cam và hậu ngọt mát.',
    upsellReasonEn:
      'ROAR ARABICA S18 CBU combines Grade 18 uniformity with clean Washed processing for sparkling Chemex florals.',
  },
  {
    id: 8,
    slug: 'aeropress-linh-hoat-khi-du-lich-va-van-phong',
    topic: 'manual',
    topicVi: 'Pour-Over & Pha Thủ Công',
    topicEn: 'Manual & Cold Brew',
    titleVi: 'AeroPress Inverted & Chuẩn: Ly Cà Phê Đậm Gọn Trong 2 Phút Nơi Công Sở',
    titleEn: 'AeroPress Standard & Inverted: Clean Rich Cups in 2 Minutes',
    excerptVi:
      'Kết hợp giữa ngâm ủ và áp suất nhẹ giúp AeroPress tạo nên tách cà phê vừa đậm vị như Espresso nhẹ vừa sạch bã, dễ rửa chỉ trong 10 giây.',
    excerptEn:
      'Combining immersion and gentle air pressure, AeroPress delivers full-bodied clarity in two minutes with effortless cleanup.',
    readMinutes: 5,
    coverImageKey: '/assets/roasted-beans/robusta-s18-honey.jpg',
    spec: {
      dose: '16g',
      water: '220ml',
      temp: '90°C',
      time: '1:50 – 2:10',
      grindVi: 'Vừa-mịn (Medium-Fine)',
      grindEn: 'Medium-Fine',
    },
    introVi: [
      'AeroPress là dụng cụ pha chế đa năng nhất cho dân văn phòng và những chuyến công tác: không cần điện, không dễ vỡ, chỉ mất 2 phút để có tách cà phê cân bằng hoàn hảo hoặc một shot cô đặc để pha đá.',
      'Cách pha đảo ngược (Inverted) giúp bạn kiểm soát chính xác thời gian ngâm ủ mà không bị nhỏ giọt sớm xuống ly.',
    ],
    introEn: [
      'Durable and compact, the AeroPress is a powerhouse for desks and travel—brewing rich single cups or iced concentrates in two minutes.',
      'Using the inverted setup prevents early dripping so every drop steeps evenly.',
    ],
    stepsVi: [
      'Lắp pít-tông vào ống AeroPress khoảng 1.5cm và dựng ngược trên cân điện tử.',
      'Cho 16g cà phê xay vừa-mịn, rót 50ml nước 90°C khuấy nhẹ 5 vòng rồi đợi 20 giây.',
      'Rót tiếp đến mốc 220ml, đặt nắp có giấy lọc đã tráng ướt lên và vặn khóa chặt.',
      'Đến mốc 1:30, úp nhanh ống AeroPress lên chiếc ly chắc chắn và nhấn đều tay xuống trong 25–30 giây.',
    ],
    stepsEn: [
      'Insert the plunger 1.5cm into the chamber and stand inverted on your scale.',
      'Add 16g medium-fine coffee, pour 50ml of 90°C water, stir gently 5 times, and steep 20s.',
      'Top up to 220ml and twist on the cap holding a pre-wetted paper filter.',
      'At 1:30, flip smoothly onto a sturdy mug and press steadily for 25–30 seconds.',
    ],
    baristaTipVi: 'Muốn uống đậm hơn với đá? Dùng 18g cà phê và 110ml nước, nhấn thẳng lên ly đá viên.',
    baristaTipEn: 'Want iced concentrate? Brew 18g coffee with 110ml water and press straight over ice.',
    primaryProductSlug: 'roasted-beans-robusta-s18-honey',
    secondaryProductSlug: 'roar-espresso',
    upsellHeadlineVi: 'Vị mật ong ngọt dày cho công thức AeroPress',
    upsellHeadlineEn: 'Honey-Processed Richness for AeroPress',
    upsellReasonVi:
      'CÀ PHÊ HẠT RANG ROBUSTA S18 HONEY lưu giữ lớp đường tự nhiên quanh hạt khi phơi, mang lại độ ngọt caramel và thân vị tròn đầy dưới lực nén AeroPress.',
    upsellReasonEn:
      'ROAR ROBUSTA S18 HONEY retains natural mucilage sweetness that amplifies body and caramel finish in AeroPress immersion.',
  },
  {
    id: 9,
    slug: 'french-press-giu-tron-tinh-dau-tu-nhien',
    topic: 'manual',
    topicVi: 'Pour-Over & Pha Thủ Công',
    topicEn: 'Manual & Cold Brew',
    titleVi: 'French Press Cổ Điển: Giữ Trọn Lớp Dầu Cà Phê & Body Dày Ấm',
    titleEn: 'Classic French Press: Preserving Natural Coffee Oils & Full Body',
    excerptVi:
      'Không qua giấy lọc, lưới thép mịn của French Press giữ nguyên tinh dầu và kết cấu dày ấm — lý tưởng cho buổi sáng se lạnh cùng bánh mì nướng.',
    excerptEn:
      'Paper-free metal mesh keeps natural coffee oils intact for warm, comforting body without excessive silt.',
    readMinutes: 4,
    coverImageKey: '/assets/roasted-ground/robusta-house-blend.jpg',
    spec: {
      dose: '20g',
      water: '300ml (1:15)',
      temp: '93°C',
      time: '4:00',
      grindVi: 'Thô đều (Coarse)',
      grindEn: 'Even Coarse',
    },
    introVi: [
      'French Press là một trong những cách pha dễ thành công nhất cho người mới bắt đầu. Lưới lọc kim loại giữ lại toàn bộ tinh dầu thơm tự nhiên trong hạt cà phê — thứ thường bị giấy lọc giữ lại — cho cảm giác miệng dày dặn và ấm áp.',
      'Bí quyết để ly French Press không bị nhiều cặn mịn ở đáy ly là dùng cỡ xay thô đồng nhất và hớt nhẹ lớp váng trên bề mặt trước khi ấn pít-tông.',
    ],
    introEn: [
      'French Press is wonderfully forgiving and rewards you with full natural oils for a plush, velvety mouthfeel.',
      'Grind consistently coarse and skim the top crust at 4 minutes to keep the final sip remarkably clean.',
    ],
    stepsVi: [
      'Tráng ấm bình French Press thủy tinh bằng nước nóng.',
      'Cho 20g cà phê xay thô vào bình và rót đều 300ml nước 93°C thấm ướt toàn bộ bột.',
      'Đặt nắp hờ (chưa ấn pít-tông) và để cà phê ngâm tự nhiên đúng 4 phút.',
      'Dùng 2 chiếc thìa hớt bỏ lớp bọt vàng và bã nổi trên bề mặt để giảm cặn mịn.',
      'Chờ thêm 30 giây cho bã lắng đáy, ấn nhẹ pít-tông xuống vừa chạm mặt bã rồi rót ra tách.',
    ],
    stepsEn: [
      'Pre-warm the glass French Press carafe with hot water.',
      'Add 20g coarse coffee and pour 300ml of 93°C water evenly over the grounds.',
      'Rest the lid on top without plunging and steep for 4 full minutes.',
      'Break the surface crust gently and spoon away floating foam and coarse particles.',
      'Wait 30 seconds for fines to settle, plunge gently, and decant immediately.',
    ],
    baristaTipVi: 'Rót hết cà phê ra tách sau khi ấn pít-tông; không để cà phê ngâm tiếp trong bình bã quá lâu vì sẽ bị đắng chát.',
    baristaTipEn: 'Decant all coffee right after plunging so over-extraction never creeps into your second cup.',
    primaryProductSlug: 'robusta-house-blend',
    secondaryProductSlug: 'roasted-beans-culi-s18',
    upsellHeadlineVi: 'Hương vị House Blend tròn ấm cho French Press',
    upsellHeadlineEn: 'Warm House Blend Tailored for Immersion',
    upsellReasonVi:
      'ROAR COFFEE ROBUSTA HOUSE BLEND phối trộn hạt chín chọn lọc mang đến nốt sô-cô-la sữa và hạt rang bùi rất hợp với cấu trúc ngâm ủ của French Press.',
    upsellReasonEn:
      'ROAR COFFEE ROBUSTA HOUSE BLEND delivers comforting roasted nut and dark cocoa body ideal for French Press immersion.',
  },
  {
    id: 10,
    slug: 'moka-pot-espresso-tai-gia-khong-khet',
    topic: 'espresso',
    topicVi: 'Espresso & Quầy Bar',
    topicEn: 'Espresso & Bar',
    titleVi: 'Cẩm Nang Ấm Moka Pot Bialetti Tại Nhà: Bí Quyết Không Bị Khét Đáy',
    titleEn: 'Home Moka Pot Mastery: Stovetop Pressure Without Metallic Burn',
    excerptVi:
      'Đổ nước ấm sẵn vào khoang dưới trước khi bắc bếp và nhấc ấm ngay khi dòng chảy chuyển màu vàng nhạt giúp Moka Pot thơm dày mà không khét.',
    excerptEn:
      'Pre-heating bottom chamber water and cutting heat as extraction turns pale gold keeps stovetop Moka Pot shots sweet and clean.',
    readMinutes: 5,
    coverImageKey: '/assets/roasted-beans/robusta-s18-cbu.jpg',
    spec: {
      dose: '16–18g (đầy phẳng phễu)',
      water: 'Đến dưới van an toàn (~150ml)',
      temp: 'Nước mồi 75–80°C',
      time: '3:00 trên lửa nhỏ',
      grindVi: 'Vừa-mịn (hơi thô hơn Espresso)',
      grindEn: 'Medium-Fine (coarser than Espresso)',
    },
    introVi: [
      'Nhiều người pha ấm Moka Pot bị vị khét kim loại vì đổ nước lạnh vào đáy ấm rồi đun lâu trên bếp, làm phần bột cà phê bên trên bị nướng cháy trước khi nước kịp sôi đẩy lên.',
      'Chỉ với 2 thao tác đơn giản: châm nước nóng sẵn 75–80°C và làm mát đáy ấm dưới vòi nước ngay khi cà phê vừa dâng đầy, bạn sẽ có tách cà phê sánh đậm gần như Espresso tại gia.',
    ],
    introEn: [
      'Stovetop Moka Pots turn bitter when cold water sits over flame too long, baking the dry coffee grounds before extraction begins.',
      'Pre-warming the base water to 75–80°C and cooling the pot base once pale blonde foam appears yields sweet, syrupy crema.',
    ],
    stepsVi: [
      'Đun nước nóng khoảng 75–80°C rót vào khoang dưới đến ngay dưới chân van đồng an toàn.',
      'Đổ bột cà phê xay vừa-mịn đầy phẳng miệng phễu lọc (tuyệt đối không nén chặt bằng tamper).',
      'Dùng khăn lót tay vặn chặt thân trên và thân dưới lại với nhau.',
      'Đặt lên bếp lửa nhỏ mở nắp trên để quan sát; khi dòng cà phê chảy ra chuyển sang màu vàng nhạt sủi bọt nhẹ, lập tức nhấc khỏi bếp và xả nhẹ nước mát vào đáy ấm để ngắt áp suất.',
    ],
    stepsEn: [
      'Fill the lower chamber with 75–80°C hot water just below the brass safety valve.',
      'Fill the funnel basket level with medium-fine coffee—never tamp it down.',
      'Use a towel to screw the top and bottom chambers securely together.',
      'Heat gently on low with the lid open; as soon as the stream lightens to honey-blonde foam, remove from heat and chill the base briefly.',
    ],
    baristaTipVi: 'Không dùng cỡ xay mịn như máy Espresso cho ấm Moka Pot để tránh áp suất tăng quá cao và tắc lưới lọc.',
    baristaTipEn: 'Keep the grind slightly coarser than machine espresso so steam pressure flows freely without stalling.',
    primaryProductSlug: 'roasted-beans-robusta-s18-cbu',
    secondaryProductSlug: 'roar-espresso',
    upsellHeadlineVi: 'Hạt rang sạch vị CBU bền nhiệt cho Moka Pot',
    upsellHeadlineEn: 'Clean-Cup Washed CBU Beans for Stovetop Heat',
    upsellReasonVi:
      'CÀ PHÊ HẠT RANG ROBUSTA S18 CBU trải qua chế biến ướt loại bỏ hoàn toàn tạp chất, chịu nhiệt bếp đun cực tốt để cho tách Moka Pot sạch hậu và thơm sô-cô-la.',
    upsellReasonEn:
      'ROAR ROBUSTA S18 CBU Washed beans resist high stovetop temperatures cleanly, delivering smooth cocoa sweetness.',
  },
  {
    id: 11,
    slug: 'syphon-nghe-thuat-ap-suat-chan-khong',
    topic: 'manual',
    topicVi: 'Pour-Over & Pha Thủ Công',
    topicEn: 'Manual & Cold Brew',
    titleVi: 'Pha Syphon Chân Không: Trình Diễn Áp Suất Nhiệt & Hậu Vị Ngọt Sâu',
    titleEn: 'Vacuum Syphon Brewing: Theater, Thermal Stability & Sweet Clarity',
    excerptVi:
      'Sức hấp dẫn thị giác của bình cầu Syphon kết hợp cùng kỹ thuật khuấy chữ thập 50 giây cho hương thơm bùng nổ mà vẫn giữ độ sạch vị hoàn hảo.',
    excerptEn:
      'Vacuum suction draws brewed coffee cleanly through cloth/paper, delivering vivid aromatics and round sweetness.',
    readMinutes: 5,
    coverImageKey: '/assets/roasted-ground/signature-reserve.jpg',
    spec: {
      dose: '20g',
      water: '300ml',
      temp: '91–93°C',
      time: '1:45 ngâm + rút xuống',
      grindVi: 'Vừa (Medium)',
      grindEn: 'Medium',
    },
    introVi: [
      'Syphon (Siphon) là cuộc trình diễn khoa học tuyệt đẹp trên quầy bar: hơi nước giãn nở đẩy nước lên bầu trên để ngâm chiết ở nhiệt độ cao ổn định, rồi chân không kéo dòng cà phê trong vắt trở lại bầu dưới khi tắt nguồn nhiệt.',
      'Chính sự kết hợp giữa chiết xuất toàn phần (full immersion) và màng lọc vải/giấy giúp Syphon bộc lộ tầng hương phức hợp của những phối trộn đỉnh cao.',
    ],
    introEn: [
      'The vacuum Syphon merges full-immersion extraction with dramatic theater, pushing water upward via vapor pressure before pulling clean coffee down through filtration.',
      'This unique thermal stability reveals layered complexity in flagship blends.',
    ],
    stepsVi: [
      'Móc lọc vải đã ngâm sạch vào đáy bầu trên, rót 300ml nước nóng vào bầu thủy tinh dưới và bật đèn cồn/halogen.',
      'Khi nước sôi nhẹ và dâng gần hết lên bầu trên, hạ nhẹ nguồn nhiệt để giữ nhiệt ổn định quanh 92°C.',
      'Cho 20g cà phê xay vừa vào bầu trên, khuấy nhẹ theo hình chữ thập cho bột ngập nước hoàn toàn.',
      'Ủ đúng 50 giây, khuấy nhẹ thêm 3 vòng rồi tắt nguồn nhiệt và lau nhẹ đáy bầu dưới bằng khăn ẩm cho cà phê rút xuống hoàn toàn.',
    ],
    stepsEn: [
      'Anchor the clean cloth filter in the upper chamber, add 300ml hot water below, and ignite the burner.',
      'Once water rises completely to the upper globe, lower heat to steady the slurry near 92°C.',
      'Add 20g medium ground coffee and gently fold in with a paddle.',
      'Steep for 50 seconds, give three gentle swirls, extinguish heat, and let vacuum drawdown complete.',
    ],
    baristaTipVi: 'Luôn bảo quản màng lọc vải Syphon trong nước sạch ngăn mát tủ lạnh và luộc nhẹ bằng nước sôi trước mỗi lần dùng.',
    baristaTipEn: 'Store cloth filters submerged in cold water in the fridge and boil briefly prior to brewing.',
    primaryProductSlug: 'signature-reserve',
    secondaryProductSlug: 'roasted-beans-culi-s18',
    upsellHeadlineVi: 'Tuyệt phẩm Signature Reserve cho khoảnh khắc Syphon tinh hoa',
    upsellHeadlineEn: 'Flagship Blend Worthy of Syphon Rituals',
    upsellReasonVi:
      'ROAR COFFEE SIGNATURE RESERVE (60% Robusta – 20% Culi – 20% Arabica CBU) bung mở đa tầng hương thảo mộc, sô-cô-la đen và mật ong trọn vẹn nhất dưới áp suất Syphon.',
    upsellReasonEn:
      'ROAR COFFEE SIGNATURE RESERVE (60% Robusta · 20% Culi · 20% Washed Arabica) unfolds extraordinary multi-layered aromatics in Syphon extraction.',
  },
  {
    id: 12,
    slug: 'ca-phe-muoi-va-bac-xiu-xu-huong-quan-viet',
    topic: 'phin',
    topicVi: 'Pha Phin & Gu Việt',
    topicEn: 'Vietnamese Phin',
    titleVi: 'Công Thức Cà Phê Muối Huế & Bạc Xỉu 3 Tầng Cho Thực Đơn Quán Cà Phê',
    titleEn: 'Salted Cream Coffee & 3-Layer Bạc Xỉu Recipes for Modern Cafés',
    excerptVi:
      'Hướng dẫn đánh lớp kem muối biển mặn béo chuẩn quán (tỷ lệ whipping – rich – sữa tươi – muối tinh) rót trên nền cốt Phin/Espresso đậm đà.',
    excerptEn:
      'Step-by-step salted cream topping ratio paired with bold ROAR concentrate for high-margin café signature menus.',
    readMinutes: 6,
    coverImageKey: 'journal_tasting_archetypes',
    spec: {
      dose: '45ml cốt cà phê đậm',
      water: '35ml kem muối + 25ml sữa đặc',
      temp: 'Phục vụ lạnh với đá',
      time: '3 phút chuẩn bị',
      grindVi: 'Vừa (Phin hoặc Espresso đôi)',
      grindEn: 'Phin or Double Espresso',
    },
    introVi: [
      'Cà phê muối và Bạc xỉu 3 tầng đang nằm trong nhóm đồ uống có biên lợi nhuận và tỷ lệ gọi món lặp lại cao nhất tại các quán cà phê Việt Nam hiện đại.',
      'Vị mặn tinh tế của muối biển làm dịu cảm nhận đắng gắt tự nhiên, đồng thời khuếch đại vị ngọt sô-cô-la và caramel vốn có trong hạt Robusta rang đậm.',
    ],
    introEn: [
      'Salted Cream Coffee and 3-layer Bạc Xỉu rank among the highest-repeat, best-margin signature beverages across Vietnamese coffee bars.',
      'A measured pinch of sea salt rounds off bitterness while amplifying roasted cacao sweetness.',
    ],
    stepsVi: [
      'Đánh lớp kem muối (mẻ 400ml cho quán): đánh bông nhẹ 200ml kem béo thực vật Rich’s + 100ml kem sữa tươi Whipping + 80ml sữa tươi không đường + 3.5g muối tinh trong 2–3 phút đến độ sệt chảy ruy-băng.',
      'Rót 20–25ml sữa đặc vào đáy ly, cho đá viên đến 2/3 ly.',
      'Rót từ từ 45ml cốt cà phê ROAR Đậm (hoặc 1 double shot Espresso) tạo tầng màu nâu hổ phách nổi bật.',
      'Phủ 35–40ml lớp kem muối sánh mịn lên trên cùng và rắc nhẹ một nhúm bột ca cao trang trí.',
    ],
    stepsEn: [
      'Whip salted cream batch: combine 200ml non-dairy creamer, 100ml whipping cream, 80ml unsweetened milk, and 3.5g fine sea salt until glossy ribbon texture.',
      'Pour 20–25ml condensed milk into a glass and fill 2/3 with ice.',
      'Float 45ml intense ROAR concentrate (or a double espresso) carefully for clean layering.',
      'Cap with 35–40ml salted cream and dust lightly with cacao powder.',
    ],
    baristaTipVi: 'Cốt cà phê cần đủ đậm để không bị lớp kem béo nuốt vị; các dòng Robusta CBU hoặc ROAR ĐẬM luôn cho kết quả cân bằng nhất.',
    baristaTipEn: 'Use a bold dark-roast concentrate so coffee aromatics stand tall beneath rich dairy foam.',
    primaryProductSlug: 'roar-dam-bold',
    secondaryProductSlug: 'roasted-beans-robusta-s18',
    upsellHeadlineVi: 'Tối ưu cost ly & giữ hương cà phê nổi bật trên nền kem béo',
    upsellHeadlineEn: 'High-Impact Roast Profile for Signature Milk Drinks',
    upsellReasonVi:
      'ROAR COFFEE ĐẬM (bán lẻ túi 250g/500g) hoặc Hạt rang ROBUSTA S18 (giá sỉ 5 bậc theo kg cho quán) đảm bảo cốt cà phê thơm dày đồng nhất xuyên suốt lớp kem muối.',
    upsellReasonEn:
      'ROAR COFFEE ĐẬM or 5-tier wholesale ROBUSTA S18 beans anchor salted cream signatures with zero flavor dilution.',
  },
  {
    id: 13,
    slug: 'nuoc-pha-va-nhiet-do-90-94c-trong-chiet-xuat',
    topic: 'science',
    topicVi: 'Nước, Cỡ Xay & Bảo Quản',
    topicEn: 'Water, Grind & Care',
    titleVi: 'Khoa Học Nước Pha (TDS 75–120 ppm) & Nhiệt Độ 90–94°C Quyết Định 98% Tách Cà Phê',
    titleEn: 'Water Chemistry (TDS 75–120 ppm) & 90–94°C Thermal Science',
    excerptVi:
      'Một tách Pour-Over chứa tới 98.5% là nước. Tìm hiểu cách khoáng chất Magie/Canxi và độ kiềm ảnh hưởng trực tiếp đến vị ngọt và hậu vị của cà phê.',
    excerptEn:
      'Brewed filter coffee is 98.5% water. Learn how dissolved minerals and 90–94°C thermal stability transform extraction.',
    readMinutes: 6,
    coverImageKey: 'journal_cbu_washed',
    spec: {
      dose: 'TDS 75–120 ppm',
      water: 'pH 6.8 – 7.2',
      temp: '90–94°C',
      time: 'Kiểm tra định kỳ lọc nước',
      grindVi: 'Mọi phương pháp',
      grindEn: 'All Brew Methods',
    },
    introVi: [
      'Nhiều người đầu tư hạt cà phê hảo hạng và máy pha đắt tiền nhưng lại bỏ qua yếu tố chiếm tới hơn 98% thể tích tách cà phê: nước pha. Nước quá cứng nhiều vôi (TDS > 200 ppm) sẽ làm tắt toàn bộ hương hoa trái và đóng cặn nồi hơi.',
      'Ngược lại, nước cất tinh khiết hoàn toàn (TDS ~ 0) lại thiếu các ion Magie (Mg2+) và Canxi (Ca2+) đóng vai trò "bắt giữ" phân tử hương vị cà phê, khiến tách pha bị nhạt nhẽo.',
    ],
    introEn: [
      'Over 98% of a filter coffee cup is water. Excessively hard water (TDS > 200 ppm) flattens delicate aromatics and scales boilers.',
      'Conversely, zero-mineral distilled water lacks Magnesium and Calcium ions needed to bind flavor molecules.',
    ],
    stepsVi: [
      'Sử dụng bút đo TDS cầm tay để kiểm tra nguồn nước sau bộ lọc của gia đình hoặc quán; lý tưởng nhất nằm trong khoảng 75–120 ppm.',
      'Duy trì nhiệt độ nước pha ở 90–92°C cho dòng Arabica rang sáng-vừa và 92–94°C cho dòng Robusta / Espresso truyền thống.',
      'Không đun đi đun lại cùng một ấm nước nhiều lần vì làm mất oxy hòa tan khiến cà phê kém tươi.',
      'Lắp bộ lọc làm mềm nước chuyên dụng cho máy Espresso nhằm bảo vệ nồi hơi và giữ độ ổn định hương vị cả năm.',
    ],
    stepsEn: [
      'Check filtered water with a simple TDS pen, aiming for 75–120 ppm balanced mineral content.',
      'Dial 90–92°C for bright Arabica filter roasts and 92–94°C for bolder Robusta & Phin profiles.',
      'Always heat fresh filtered water rather than re-boiling stagnant kettle water.',
      'Equip commercial espresso machines with dedicated remineralizing filtration to safeguard boilers and flavor.',
    ],
    baristaTipVi: 'Thử nghiệm pha cùng 1 loại hạt bằng 2 loại nước đóng chai khoáng nhẹ khác nhau, bạn sẽ cảm nhận rõ sự khác biệt ngay ở ngụm đầu tiên.',
    baristaTipEn: 'Side-by-side brew tests with two low-mineral bottled waters instantly reveal how water chemistry shapes sweetness.',
    primaryProductSlug: 'signature-reserve',
    secondaryProductSlug: 'roar-espresso-gold',
    upsellHeadlineVi: 'Thưởng thức trọn vẹn tầng hương tinh khiết khi đạt chuẩn nước pha',
    upsellHeadlineEn: 'Experience Peak Clarity with Flagship ROAR Lots',
    upsellReasonVi:
      'ROAR COFFEE SIGNATURE RESERVE và ESPRESSO GOLD được rang ở độ chính xác cao, bộc lộ trọn vẹn vị ngọt cân bằng nhất khi kết hợp cùng nguồn nước sạch TDS chuẩn.',
    upsellReasonEn:
      'ROAR SIGNATURE RESERVE and ESPRESSO GOLD unlock peak sweetness and aromatic nuance under clean, mineral-balanced water.',
  },
  {
    id: 14,
    slug: 'chon-co-xay-va-bao-quan-hat-rang-moi',
    topic: 'science',
    topicVi: 'Nước, Cỡ Xay & Bảo Quản',
    topicEn: 'Water, Grind & Care',
    titleVi: 'Cỡ Xay Chuẩn Cho Từng Dụng Cụ & Nghệ Thuật Bảo Quản Hạt Rang Mộc',
    titleEn: 'Grind Size Calibration Chart & Fresh Roasted Bean Storage',
    excerptVi:
      'Tại sao cối xay lưỡi dao làm cà phê chỗ khét chỗ nhạt? Cách phân biệt 5 mức cỡ xay từ Espresso mịn đến Cold Brew thô và bảo quản van 1 chiều.',
    excerptEn:
      'Understand burr uniformity across 5 grind tiers from Espresso to Cold Brew and how one-way valve bags protect aroma.',
    readMinutes: 5,
    coverImageKey: 'journal_s18_roastery',
    spec: {
      dose: '5 mức cỡ xay chuẩn',
      water: 'Nhiệt độ phòng 20–25°C',
      temp: 'Tránh nắng & ẩm',
      time: 'Ngon nhất 7–45 ngày sau rang',
      grindVi: 'Mịn -> Vừa -> Thô',
      grindEn: 'Fine · Medium · Coarse',
    },
    introVi: [
      'Cà phê sau khi xay tiếp xúc với oxy không khí sẽ mất tới 50% hợp chất hương thơm dễ bay hơi chỉ trong vòng 15–30 phút đầu tiên. Đó là lý do các Barista chuyên nghiệp luôn ưu tiên mua cà phê nguyên hạt rang mộc và xay ngay trước khi pha.',
      'Bên cạnh đó, hãy sử dụng cối xay bánh răng (burr grinder) thay vì máy xay lưỡi dao để kích thước hạt bột đồng đều.',
    ],
    introEn: [
      'Ground coffee loses up to half its volatile aromatics within minutes of oxygen exposure. Buying whole roasted beans and grinding right before brewing preserves vibrant flavor.',
      'Always favor conical or flat burr grinders over blade choppers for uniform extraction.',
    ],
    stepsVi: [
      'Mịn (Fine): Dùng cho Espresso máy 9 bar — sờ vào mịn hơn muối ăn một chút, có độ bám nhẹ.',
      'Vừa-mịn (Medium-Fine): Dùng cho AeroPress và ấm Moka Pot.',
      'Vừa (Medium) & Vừa-thô: Dùng cho Phễu giấy V60 (vừa) và Phin Việt Nam / Chemex (vừa-thô).',
      'Thô (Coarse): Dùng cho French Press và Cold Brew ủ lạnh 16 giờ.',
      'Bảo quản hạt rang trong túi zipper có van thoát khí 1 chiều đặt nơi khô mát; không cất hạt rang hàng ngày trong ngăn đá tủ lạnh gây ngưng tụ hơi ẩm.',
    ],
    stepsEn: [
      'Fine: For 9-bar Espresso—finer than table salt with slight cohesion.',
      'Medium-Fine: Ideal for AeroPress and stovetop Moka Pot.',
      'Medium to Medium-Coarse: V60 drippers (medium) and Vietnamese Phin or Chemex (medium-coarse).',
      'Coarse: French Press and 16-hour Cold Brew.',
      'Store roasted whole beans in one-way valve pouches away from sunlight and humidity—avoid daily freezer condensation.',
    ],
    baristaTipVi: 'Cà phê hạt rang vừa ra lò cần thời gian "nghỉ" (degas) từ 5–7 ngày để thoát bớt khí CO2 trước khi đạt đỉnh vị ngon.',
    baristaTipEn: 'Allow freshly roasted beans 5–7 days of resting (degassing) for smoother, fuller extraction.',
    primaryProductSlug: 'roasted-beans-robusta-s18',
    secondaryProductSlug: 'roasted-beans-culi-s18',
    upsellHeadlineVi: 'Nguồn hạt rang mộc S18 mới mỗi tuần — Mua theo Kg tiết kiệm',
    upsellHeadlineEn: 'Fresh Weekly S18 Whole Beans — Volume Tiers',
    upsellReasonVi:
      'CÀ PHÊ HẠT RANG ROBUSTA S18 & CULI S18 đóng gói túi van 1 chiều chuẩn công nghiệp, áp dụng giá ưu đãi tự động theo số lượng từ 1kg đến ≥100kg.',
    upsellReasonEn:
      'ROAR ROBUSTA S18 & CULI S18 ship in one-way aroma-valve bags with automatic 5-tier volume pricing from 1kg to 100kg+.',
  },
  {
    id: 15,
    slug: 'pha-ca-phe-hoa-tan-cao-cap-van-phong-du-lich',
    topic: 'instant',
    topicVi: 'Pha Nhanh & Tiện Lợi',
    topicEn: 'Instant & Travel',
    titleVi: 'Pha Cà Phê Hòa Tan Silver & Gold Đúng Cách: Sánh Đậm Như Pha Máy Trong 15 Giây',
    titleEn: 'Brewing Silver & Gold Instant Coffee: Café-Grade Richness in 15 Seconds',
    excerptVi:
      'Chỉ với 50ml nước nóng 85°C lắc nhẹ cùng đá viên hoặc sữa tươi, dòng hòa tan nguyên chất sấy lạnh ROAR mang lại hậu vị êm sâu không gắt cổ.',
    excerptEn:
      'Dissolve pure freeze-dried ROAR Instant in 50ml 85°C water—shake with ice or cold milk for velvety café texture in seconds.',
    readMinutes: 3,
    coverImageKey: 'instant_gold_chill',
    spec: {
      dose: '1–2 gói tiêu chuẩn',
      water: '50–70ml (uống đá) · 120ml (uống nóng)',
      temp: '80–85°C',
      time: '15 giây',
      grindVi: 'Hòa tan sấy lạnh / sấy phun mịn',
      grindEn: 'Freeze-Dried Micro-Granules',
    },
    introVi: [
      'Cà phê hòa tan thế hệ mới không còn đồng nghĩa với hương liệu nhân tạo hay vị ngọt gắt công nghiệp. Với công nghệ trích ly cô đặc và sấy lạnh ở nhiệt độ thấp, từng tinh thể cà phê ROAR giữ nguyên hương cà phê rang nguyên bản.',
      'Khi pha với lượng nước chuẩn 50–60ml và nhiệt độ vừa 85°C (tránh nước sôi 100°C làm mất hương đầu), bạn sẽ có ngay một ly Americano đá hoặc Cà phê sữa đá văn phòng cực kỳ mượt mà.',
    ],
    introEn: [
      'Modern specialty instant coffee preserves real roasted aromatics via low-temperature concentration and freeze-drying.',
      'Dissolving in 50–60ml water at 85°C—rather than 100°C boiling water—protects delicate top notes for instant desk or travel fuel.',
    ],
    stepsVi: [
      'Cho 1 gói (uống thanh nhẹ) hoặc 2 gói (uống đậm vị Việt) cà phê hòa tan ROAR vào ly hoặc bình lắc shaker.',
      'Rót 50ml nước ấm nóng 80–85°C, khuấy đều trong 10 giây cho tinh thể tan hoàn toàn.',
      'Nếu thích bọt crema bồng bềnh kiểu Shakerato, cho thêm 3–4 viên đá và lắc mạnh 10 giây trước khi rót ra ly đá.',
      'Hoặc rót thẳng 120ml sữa tươi thanh trùng lạnh lên nền cà phê đã hòa tan để có ngay ly Iced Latte nhanh gọn.',
    ],
    stepsEn: [
      'Empty 1 stick (smooth) or 2 sticks (intense) of ROAR Instant into a glass or cocktail shaker.',
      'Stir with 50ml hot water at 80–85°C for 10 seconds until completely dissolved.',
      'For Shakerato foam, shake briskly with 3 ice cubes for 10 seconds and strain over ice.',
      'Or top directly with 120ml cold milk for an effortless 15-second Iced Latte.',
    ],
    baristaTipVi: 'Luôn dùng nước 80–85°C thay vì nước sôi sùng sục giúp cà phê hòa tan giữ mùi thơm êm và không bị chua ở hậu vị.',
    baristaTipEn: 'Keep water around 80–85°C instead of boiling so freeze-dried aromatics stay sweet and rounded.',
    primaryProductSlug: 'instant-gold-collection',
    secondaryProductSlug: 'instant-silver-collection',
    upsellHeadlineVi: 'Bộ Sưu Tập Hòa Tan Cao Cấp Cho Nhịp Sống Năng Động',
    upsellHeadlineEn: 'Instant Gold & Silver Built for Busy Schedules',
    upsellReasonVi:
      'ROAR COFFEE HÒA TAN GOLD (sấy lạnh đậm hương tinh hoa) & SILVER (cân bằng thanh lịch cho văn phòng) tiện lợi mang theo mọi chuyến bay và cuộc họp.',
    upsellReasonEn:
      'ROAR INSTANT GOLD (freeze-dried richness) & SILVER (everyday balance) bring effortless ROAR character to flights, desks, and travel.',
  },
];
