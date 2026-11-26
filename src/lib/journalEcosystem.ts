import type { Product } from '../context/StoreContext';

export interface JournalPillar {
  id: string;
  codeRange: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
}

export type JournalChartType =
  | 'coffee_history_timeline'
  | 'coffee_botany_anatomy'
  | 'species_comparison'
  | 'global_coffee_belt'
  | 'altitude_variety_matrix'
  | 'cherry_development_cycle'
  | 'processing_methods_diagram'
  | 'screen_size_mm_chart'
  | 'roast_thermal_curve'
  | 'sensory_cupping_wheel'
  | 'extraction_balance'
  | 'vietnam_terroir_elevation'
  | 'moisture_aw_stability'
  | 'roast_degree_spectrum'
  | 'degassing_co2_curve'
  | 'particle_grind_spectrum'
  | 'water_mineral_balance'
  | 'caffeine_safety_curve';

export interface JournalQuickLink {
  labelVi: string;
  labelEn: string;
  to: string;
  kind: 'origin' | 'product' | 'personality' | 'shop' | 'journal';
}

export interface JournalNodeMeta {
  code: string;
  pillarId: string;
  batch: number;
  titleVi: string;
  titleEn: string;
  slug: string;
  canonicalCategory:
    | 'Coffee processing'
    | 'Coffee varieties'
    | 'Brewing techniques'
    | 'Coffee knowledge'
    | 'Coffee origins';
  role: 'pillar' | 'supporting' | 'manifesto';
  searchIntentVi: string;
  searchIntentEn: string;
  relatedCodes: string[];
  nextCode?: string;
  relatedProductSlugs: string[];
  recommendationReasonVi?: string;
  recommendationReasonEn?: string;
  chartType?: JournalChartType;
  actionTipsVi?: string[];
  actionTipsEn?: string[];
  quickLinks?: JournalQuickLink[];
  glossaryVi?: Array<{ term: string; def: string }>;
  glossaryEn?: Array<{ term: string; def: string }>;
  references?: string[];
}

export interface CoffeeNeedPreset {
  id: string;
  labelVi: string;
  labelEn: string;
  descVi: string;
  descEn: string;
  productSlugs: string[];
  articleCodes: string[];
  shopCategory?: string;
}

export const JOURNAL_PILLARS: JournalPillar[] = [
  {
    id: '01',
    codeRange: 'B001–B010',
    nameVi: 'Nền tảng kiến thức cà phê',
    nameEn: 'Coffee Foundations',
    descVi: 'Lịch sử, thực vật học, giống loài, vùng trồng thế giới, sơ chế, phân cỡ sàng, rang và cảm quan.',
    descEn: 'History, botany, coffee species, global coffee belt, processing, screen grading, roasting, and sensory science.',
  },
  {
    id: '02',
    codeRange: 'B011–B014',
    nameVi: 'Vùng trồng & Bản sắc Việt Nam',
    nameEn: 'Terroir & Vietnamese Origins',
    descVi: 'Thổ nhưỡng Tây Nguyên – Tây Bắc, Robusta Việt Nam, mùa vụ thu hoạch và vai trò người nông dân.',
    descEn: 'Highland terroir, Vietnamese Robusta heritage, harvest timing, and farming communities.',
  },
  {
    id: '03',
    codeRange: 'B015–B018',
    nameVi: 'Chất lượng nguyên liệu & Fine Robusta',
    nameEn: 'Coffee Quality & Fine Robusta',
    descVi: 'Tiêu chí Fine Robusta, lỗi nhân xanh, độ ẩm và hoạt độ nước (Aw), quy trình cupping chuẩn.',
    descEn: 'Fine Robusta frameworks, green bean defects, moisture vs. water activity, and cupping protocol.',
  },
  {
    id: '04',
    codeRange: 'B019–B022',
    nameVi: 'Nghệ thuật rang & Phối trộn',
    nameEn: 'Roasting & Coffee Craft',
    descVi: 'Hồ sơ nhiệt rang (Roast Profile), Light–Medium–Dark, degassing CO2 và nghệ thuật phối vị.',
    descEn: 'Thermal roast curves, roast levels, CO2 degassing windows, and signature blend architecture.',
  },
  {
    id: '05',
    codeRange: 'B023–B026',
    nameVi: 'Khoa học pha chế',
    nameEn: 'Brewing Science',
    descVi: 'Cơ học pha Phin, chiết xuất Espresso 9 bar, ba biến số vàng và Cold Brew ủ lạnh.',
    descEn: 'Vietnamese Phin mechanics, 9-bar espresso physics, brew ratios, and cold extraction.',
  },
  {
    id: '06',
    codeRange: 'B027–B030',
    nameVi: 'Văn hóa Việt & Triết lý ROAR',
    nameEn: 'Vietnamese Culture & ROAR DNA',
    descVi: 'Di sản Cà phê Sữa Đá, đọc vị tách cà phê, đọc nhãn bao bì và triết lý Roots · Originality · Artistry.',
    descEn: 'Iced milk coffee heritage, sensory vocabulary, label literacy, and the ROAR philosophy.',
  },
  {
    id: '07',
    codeRange: 'B031–B034',
    nameVi: 'Chuyên sâu sơ chế & Bảo quản',
    nameEn: 'Processing & Preservation',
    descVi: 'Vi sinh lên men, Anaerobic / Carbonic Maceration, kiểm soát phơi sấy và kho nhân xanh.',
    descEn: 'Fermentation microbiology, emerging anaerobic protocols, drying kinetics, and green warehousing.',
  },
  {
    id: '08',
    codeRange: 'B035–B038',
    nameVi: 'Ma trận rang & Phát triển sản phẩm',
    nameEn: 'Advanced Roasting & Portfolio',
    descVi: 'Liên kết giống–sơ chế–mức rang, QC sau rang, cân bằng Robusta–Arabica và kiến trúc danh mục.',
    descEn: 'Variety-process roast matrix, post-roast QC, Robusta-Arabica synergy, and portfolio design.',
  },
  {
    id: '09',
    codeRange: 'B039–B042',
    nameVi: 'Ứng dụng pha chế & Quán cà phê',
    nameEn: 'Brewing Mastery & Café Ops',
    descVi: 'Phân bố cỡ xay, khoáng chất nước pha, cân bằng cà phê sữa và chuẩn hóa công thức quầy bar.',
    descEn: 'Particle distribution, water chemistry, milk-coffee balance, and repeatable café SOPs.',
  },
  {
    id: '10',
    codeRange: 'B043–B050',
    nameVi: 'Chuỗi giá trị, Bền vững & Tương lai',
    nameEn: 'Value Chain, Sustainability & Future',
    descVi: 'Chuỗi giá trị nông hộ, truy xuất nguồn gốc, thích ứng khí hậu, thương mại và tuyên ngôn B050.',
    descEn: 'Coffee value chain, lot traceability, climate resilience, market economics, and the B050 manifesto.',
  },
];

export const JOURNAL_CURRICULUM_B001_B050: JournalNodeMeta[] = [
  // Batch 1 (B001 - B005)
  {
    code: 'B001',
    pillarId: '01',
    batch: 1,
    titleVi: 'Hành Trình Cà Phê: Từ Ethiopia Đến Việt Nam',
    titleEn: 'The Journey of Coffee: From Ethiopia to Vietnam',
    slug: 'hanh-trinh-ca-phe-tu-ethiopia-den-viet-nam',
    canonicalCategory: 'Coffee knowledge',
    role: 'pillar',
    searchIntentVi: 'Nguồn gốc lịch sử cây cà phê thế giới và hành trình bén rễ tại Việt Nam',
    searchIntentEn: 'Global coffee history from Ethiopia to Yemen and how Vietnam became a coffee powerhouse',
    relatedCodes: ['B002', 'B003', 'B004', 'B012'],
    nextCode: 'B002',
    relatedProductSlugs: ['roar-phin-heritage', 'robusta-house-blend', 'signature-reserve'],
    recommendationReasonVi:
      'Để cảm nhận rõ sự tiếp nối giữa di sản pha chế Việt Nam và kỹ thuật rang hiện đại, bạn có thể tham khảo dòng Phin và Robusta House Blend sử dụng nguyên liệu Tây Nguyên.',
    recommendationReasonEn:
      'To connect Vietnamese coffee heritage with contemporary roasting craft, explore ROAR Phin and Robusta House Blend crafted from Central Highlands lots.',
    chartType: 'coffee_history_timeline',
    actionTipsVi: [
      'Đối chiếu trực tiếp sự khác biệt giữa Phin nhỏ giọt truyền thống (dòng Phin / Robusta House Blend) và Espresso áp suất cao.',
      'Khám phá Bản đồ Vùng Nguyên Liệu Việt Nam để thấy cây cà phê thích nghi từ miền Bắc đến cao nguyên Bazan.',
      'Đọc tiếp B003 để hiểu lý do vì sao Việt Nam trở thành cường quốc Robusta toàn cầu.',
    ],
    actionTipsEn: [
      'Compare slow gravity Vietnamese Phin brewing against pressurized modern Espresso extraction side by side.',
      'Browse the Vietnam Origins map to trace how coffee adapted across northern slopes and basalt highlands.',
      'Continue to B003 to understand the genetics behind Vietnam’s leading Robusta stature.',
    ],
    quickLinks: [
      { labelVi: 'Khám phá Vùng trồng Việt Nam', labelEn: 'Explore Vietnam Origins Map', to: '/origins', kind: 'origin' },
      { labelVi: 'Bộ sưu tập Cà phê Rang Xay', labelEn: 'Roasted Coffee Collection', to: '/coffee/roasted', kind: 'shop' },
      { labelVi: '7 Cá tính ROAR COFFEE®', labelEn: '7 ROAR Personalities', to: '/personalities', kind: 'personality' },
    ],
    glossaryVi: [
      { term: 'Coffea arabica', def: 'Loài cà phê có nguồn gốc tự nhiên từ vùng cao nguyên rừng Tây Nam Ethiopia.' },
      { term: 'Cà phê Phin', def: 'Phương pháp chiết xuất trọng lực nhỏ giọt đặc trưng gắn liền với lịch sử cà phê Việt Nam.' },
      { term: 'Terroir', def: 'Tổ hợp điều kiện đất, khí hậu, độ cao và canh tác định hình bản sắc vùng nguyên liệu.' },
    ],
    glossaryEn: [
      { term: 'Coffea arabica', def: 'The coffee species indigenous to the highland forests of southwestern Ethiopia.' },
      { term: 'Vietnamese Phin', def: 'Gravity-fed metal drip brewer central to Vietnamese daily coffee culture.' },
      { term: 'Terroir', def: 'Combined soil, climate, elevation, and human stewardship shaping origin character.' },
    ],
    references: [
      'International Coffee Organization (ICO) — Historical Coffee Production & Trade Archives',
      'World Coffee Research (WCR) — Global Coffee Genetic Diversity Overview',
      'Food and Agriculture Organization (FAO) — Coffee Commodity & Smallholder Reports',
    ],
  },
  {
    code: 'B002',
    pillarId: '01',
    batch: 1,
    titleVi: 'Cây Cà Phê: Cấu Tạo, Sinh Trưởng Và Vòng Đời',
    titleEn: 'Coffee Botany: Plant Structure, Growth & Life Cycle',
    slug: 'cay-ca-phe-cau-tao-sinh-truong-va-vong-doi',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Giải phẫu thực vật học cây cà phê từ hệ rễ, thân, lá, hoa đến vòng đời thu hoạch',
    searchIntentEn: 'Botanical anatomy of the coffee tree and physiological growth stages',
    relatedCodes: ['B001', 'B003', 'B006', 'B013'],
    nextCode: 'B003',
    relatedProductSlugs: ['roasted-beans-robusta-s18', 'roasted-beans-arabica-s18'],
    recommendationReasonVi:
      'Sự phát triển khỏe mạnh của hệ rễ và tán lá trên đất bazan hoặc sườn núi cao trực tiếp nuôi dưỡng mật độ nhân hạt trong các lô hạt rang Robusta S18 và Arabica S18.',
    recommendationReasonEn:
      'Healthy root and canopy physiology directly nourishes bean density across our Screen 18 Robusta and Arabica roasted bean lots.',
    chartType: 'coffee_botany_anatomy',
    actionTipsVi: [
      'Chú ý độ đồng đều kích thước hạt (S18) — dấu hiệu gián tiếp của cây khỏe và quả chín đồng đều trên cành.',
      'Xem tiếp B006 để đi sâu vào cấu trúc 5 lớp bên trong quả cà phê chín đỏ.',
      'Đối chiếu mùa nở hoa & thu hoạch Tây Nguyên tại trang Vùng Nguyên Liệu.',
    ],
    actionTipsEn: [
      'Inspect bean size uniformity (Screen 18) as an indicator of balanced tree nutrition and selective ripening.',
      'Read B006 next to examine all five anatomical layers inside a ripe cherry.',
      'Check harvest windows across Vietnamese highland provinces on the Origins page.',
    ],
    quickLinks: [
      { labelVi: 'Hạt rang S18 nguyên chất', labelEn: 'Grade S18 Whole Beans', to: '/coffee/roasted-beans', kind: 'shop' },
      { labelVi: 'Vùng trồng Tây Nguyên', labelEn: 'Central Highlands Terroir', to: '/origins', kind: 'origin' },
    ],
    glossaryVi: [
      { term: 'Rễ cọc (Taproot)', def: 'Trục rễ chính ăn sâu giúp cây đứng vững và tìm ẩm mùa khô, đi kèm tầng rễ tơ hấp thu dinh dưỡng.' },
      { term: 'Thụ phấn (Pollination)', def: 'Quá trình diễn ra sau mưa đầu mùa khi hoa cà phê bung nở rộ trong 2–4 ngày.' },
    ],
    glossaryEn: [
      { term: 'Taproot & Feeder Roots', def: 'Deep central anchor root paired with shallow feeder roots absorbing surface moisture and nutrients.' },
      { term: 'Blossom Flush', def: 'Synchronized flowering triggered after dry-season rains, lasting only a few days.' },
    ],
    references: [
      'World Coffee Research (WCR) — Coffee Botany & Agronomy Manuals',
      'FAO — Robusta & Arabica Good Agricultural Practices',
    ],
  },
  {
    code: 'B003',
    pillarId: '01',
    batch: 1,
    titleVi: 'Arabica, Robusta Và Những Loài Cà Phê Trên Thế Giới',
    titleEn: 'Arabica, Robusta & the World’s Coffee Species',
    slug: 'arabica-robusta-va-nhung-loai-ca-phe-tren-the-gioi',
    canonicalCategory: 'Coffee varieties',
    role: 'pillar',
    searchIntentVi: 'Phân biệt khoa học giữa Coffea arabica, Coffea canephora (Robusta), Liberica và Excelsa',
    searchIntentEn: 'Botanical differences among Coffea arabica, Coffea canephora, Coffea liberica, and Excelsa',
    relatedCodes: ['B002', 'B005', 'B008', 'B037'],
    nextCode: 'B004',
    relatedProductSlugs: [
      'roasted-beans-robusta-s18',
      'roasted-beans-arabica-s18',
      'roasted-beans-culi-s18',
      'signature-reserve',
    ],
    recommendationReasonVi:
      'Bạn có thể đối chiếu thực tế sự khác biệt giữa hai loài thông qua Robusta S18 (Coffea canephora), Arabica S18 (Coffea arabica) hoặc trải nghiệm cấu trúc phối trộn đa tầng trong Signature Reserve.',
    recommendationReasonEn:
      'Compare species characteristics firsthand across RO-S18 (Coffea canephora), AR-S18 (Coffea arabica), CU-S18 (peaberry selection), and Signature Reserve.',
    chartType: 'species_comparison',
    actionTipsVi: [
      'Pha thử song song 1 tách Arabica Selection (Pour-over) và 1 tách Robusta House Blend (Phin) để cảm nhận rõ ranh giới hương hoa vs. cacao đậm.',
      'Nhớ rằng Excelsa là một thứ (variety) của loài Coffea liberica chứ không phải loài tách rời hoàn toàn.',
      'Thử Signature Reserve (60% Robusta · 20% Culi · 20% Arabica CBU) nếu bạn muốn cân bằng cả hai thế giới.',
    ],
    actionTipsEn: [
      'Brew Arabica Selection (Pour-over) alongside Robusta House Blend (Phin) to taste floral acidity vs. dense cacao body firsthand.',
      'Remember that Excelsa is botanically classified as Coffea liberica var. dewevrei.',
      'Try Signature Reserve (60% Robusta · 20% Culi · 20% Washed Arabica) to experience structured multi-species balance.',
    ],
    quickLinks: [
      { labelVi: 'Thử Signature Reserve', labelEn: 'Explore Signature Reserve', to: '/product/signature-reserve', kind: 'product' },
      { labelVi: 'Danh mục Nhân xanh B2B', labelEn: '27-SKU Green Matrix', to: '/coffee/green-beans', kind: 'shop' },
    ],
    glossaryVi: [
      { term: 'Coffea canephora', def: 'Tên khoa học của loài Robusta, có bộ nhiễm sắc thể lưỡng bội (2n=22) và khả năng kháng sâu bệnh cao.' },
      { term: 'Coffea arabica', def: 'Loài tứ bội (2n=44), ưa khí hậu mát vùng cao, chiếm khoảng 55–60% sản lượng thương mại toàn cầu.' },
      { term: 'Coffea liberica var. dewevrei', def: 'Phân loại thực vật học hiện hành của cà phê Mít/Excelsa thuộc loài Liberica.' },
    ],
    glossaryEn: [
      { term: 'Coffea canephora', def: 'Diploid species (2n=22) encompassing Robusta, prized for disease resilience and fuller body.' },
      { term: 'Coffea arabica', def: 'Allotetraploid species (2n=44) thriving in cooler highlands and prized for aromatic complexity.' },
      { term: 'Coffea liberica var. dewevrei', def: 'Current botanical classification placing Excelsa as a variety within Coffea liberica.' },
    ],
    references: [
      'World Coffee Research — Arabica & Robusta Variety Catalogs',
      'Royal Botanic Gardens, Kew — Genus Coffea Taxonomy (Davis et al.)',
      'International Coffee Organization (ICO) — Global Export Mix Statistics',
    ],
  },
  {
    code: 'B004',
    pillarId: '01',
    batch: 1,
    titleVi: 'Bản Đồ Cà Phê Thế Giới: Các Quốc Gia Và Vùng Trồng',
    titleEn: 'The World Coffee Map: Countries & Growing Regions',
    slug: 'ban-do-ca-phe-the-gioi-cac-quoc-gia-va-vung-trong',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Tìm hiểu vành đai cà phê (Coffee Belt) và vị thế các quốc gia sản xuất lớn',
    searchIntentEn: 'Understanding the global Coffee Belt from Latin America to East Africa and Southeast Asia',
    relatedCodes: ['B001', 'B005', 'B011', 'B012'],
    nextCode: 'B005',
    relatedProductSlugs: ['robusta-house-blend', 'arabica-selection'],
    recommendationReasonVi:
      'Từ Vành đai Cà phê toàn cầu nhìn về Việt Nam, bạn có thể khám phá cách thổ nhưỡng Tây Nguyên và Lâm Đồng được thể hiện trong Robusta House Blend và Arabica Selection.',
    recommendationReasonEn:
      'See how Vietnam’s slice of the global Coffee Belt expresses itself in Robusta House Blend and Arabica Selection.',
    chartType: 'global_coffee_belt',
    actionTipsVi: [
      'Quan sát Vành đai 25° Bắc – 25° Nam để hiểu vì sao Việt Nam có lợi thế nhiệt đới gió mùa riêng biệt.',
      'Mở Bản đồ Vùng Nguyên Liệu ROAR để đối chiếu tọa độ Đắk Lắk, Đắk Nông, Gia Lai, Lâm Đồng và Sơn La.',
      'Đọc tiếp B005 & B011 để đi sâu vào ảnh hưởng của độ cao và đất đỏ bazan.',
    ],
    actionTipsEn: [
      'Trace the 25°N–25°S Coffee Belt to see how seasonal monsoons shape drying windows across continents.',
      'Open the interactive Vietnam Origins map to compare Đắk Lắk, Lâm Đồng, and Sơn La.',
      'Read B005 and B011 next to compare altitude vs. volcanic basalt soil.',
    ],
    quickLinks: [
      { labelVi: 'Bản đồ Vùng trồng Việt Nam', labelEn: 'Interactive Origin Map', to: '/origins', kind: 'origin' },
      { labelVi: 'Chọn cà phê theo gu', labelEn: 'Find Your Coffee', to: '/journal', kind: 'journal' },
    ],
    references: [
      'International Coffee Organization (ICO) — Coffee Market & Exporting Countries Report',
      'USDA Foreign Agricultural Service — Coffee: World Markets and Trade',
    ],
  },
  {
    code: 'B005',
    pillarId: '01',
    batch: 1,
    titleVi: 'Độ Cao Vùng Trồng Và Các Giống Cà Phê Trên Thế Giới',
    titleEn: 'Coffee Growing Altitude & Global Coffee Varieties',
    slug: 'do-cao-vung-trong-va-cac-giong-ca-phe-tren-the-gioi',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Tác động đa chiều của độ cao, nhiệt độ, giống cây và đất đến chất lượng hạt cà phê',
    searchIntentEn: 'How elevation interacts with latitude, temperature, and cultivar genetics in coffee quality',
    relatedCodes: ['B003', 'B004', 'B011', 'B012'],
    nextCode: 'B006',
    relatedProductSlugs: ['roasted-beans-arabica-s18', 'roasted-beans-robusta-s18', 'arabica-selection'],
    recommendationReasonVi:
      'Lưu ý rằng độ cao không phải yếu tố duy nhất quyết định chất lượng: Arabica Cầu Đất (~1.500m) mang thế mạnh khác biệt khi đặt cạnh Robusta Tây Nguyên (500–800m) được canh tác và thu hái chín kỹ.',
    recommendationReasonEn:
      'Elevation works alongside cultivar, shade, and picking discipline—compare highland Arabica S18 with well-tended Central Highlands Robusta S18.',
    chartType: 'altitude_variety_matrix',
    actionTipsVi: [
      'Khi đọc thông số vùng trồng, hãy xét đủ 4 biến: Độ cao × Vĩ độ × Giống cây × Quy trình sơ chế.',
      'Thử Arabica Cầu Đất 1.500m nếu bạn thích độ chua cam chanh thanh sáng và hương hoa.',
      'Khám phá thêm Sơn La & Điện Biên tại B047 để thấy vĩ độ cao phía Bắc bù trừ cho độ cao tuyệt đối.',
    ],
    actionTipsEn: [
      'Evaluate origins across four dimensions: elevation × latitude × cultivar × post-harvest craft.',
      'Sample 1,500m Cầu Đất Arabica if you enjoy crisp citrus brightness and floral aroma.',
      'Check B047 to learn how cooler northern latitudes in Sơn La mimic higher equatorial altitudes.',
    ],
    quickLinks: [
      { labelVi: 'Khám phá Arabica Cầu Đất', labelEn: 'Discover Cầu Đất Arabica', to: '/product/arabica-selection', kind: 'product' },
      { labelVi: 'Xem Bản đồ Vùng trồng', labelEn: 'View Origins Map', to: '/origins', kind: 'origin' },
    ],
    references: [
      'World Coffee Research — Environment & Cultivar Interaction Studies',
      'Specialty Coffee Association (SCA) — Terroir & Sensory Research',
    ],
  },

  // Batch 2 (B006 - B010)
  {
    code: 'B006',
    pillarId: '01',
    batch: 2,
    titleVi: 'Từ Hoa Đến Hạt: Hành Trình Hình Thành Chất Lượng',
    titleEn: 'From Flower to Coffee Bean: The Journey of Coffee Development',
    slug: 'tu-hoa-den-hat-hanh-trinh-hinh-thanh-chat-luong',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Cấu tạo giải phẫu quả cà phê chín và quá trình tích lũy tiền chất hương vị',
    searchIntentEn: 'Anatomy of the coffee cherry and biochemical maturation from blossom to harvest',
    relatedCodes: ['B002', 'B007', 'B013'],
    nextCode: 'B007',
    relatedProductSlugs: ['roasted-beans-robusta-s18-honey', 'roasted-beans-culi-s18'],
    recommendationReasonVi:
      'Cấu trúc các lớp vỏ thịt, lớp nhầy (mucilage) và vỏ trấu được minh họa rõ khi quan sát cách chế biến Honey trên RO-S18-HONEY hay hình thái hạt đơn trên CU-S18.',
    recommendationReasonEn:
      'Explore how fruit layers shape final lots in honey-processed RO-S18-HONEY and single-seed morphology CU-S18.',
    chartType: 'cherry_development_cycle',
    actionTipsVi: [
      'Ưu tiên các lô cà phê ghi rõ tỷ lệ hái chín đỏ (≥95%) vì đường tự nhiên chỉ đạt đỉnh ở 60 ngày cuối trước thu hoạch.',
      'Tìm hiểu cách lớp nhầy Mucilage quyết định hương vị ngọt caramel của dòng Robusta S18 Honey.',
      'Đọc tiếp B007 để hiểu cách thợ sơ chế xử lý 5 lớp vỏ này.',
    ],
    actionTipsEn: [
      'Look for lots emphasizing red-ripe selective harvesting, as soluble sugars peak late in cherry ripening.',
      'Explore how retained mucilage drives butterscotch sweetness in RO-S18-HONEY.',
      'Continue to B007 to see how Natural, Honey, and CBU Washed treat those cherry layers.',
    ],
    quickLinks: [
      { labelVi: 'Thử Robusta S18 Honey', labelEn: 'Try Robusta S18 Honey', to: '/product/roasted-beans-robusta-s18-honey', kind: 'product' },
      { labelVi: 'Tìm hiểu hạt Culi S18', labelEn: 'Discover Culi S18', to: '/product/roasted-beans-culi-s18', kind: 'product' },
    ],
    references: [
      'World Coffee Research — Cherry Ripening & Seed Anatomy',
      'Illy & Viani — Espresso Coffee: The Science of Quality',
    ],
  },
  {
    code: 'B007',
    pillarId: '01',
    batch: 2,
    titleVi: 'Natural, Washed (CBU) Và Honey: Khoa Học Sơ Chế Cà Phê',
    titleEn: 'Natural, Washed (CBU) & Honey: The Science of Coffee Processing',
    slug: 'phan-biet-natural-honey-va-cbu-washed',
    canonicalCategory: 'Coffee processing',
    role: 'pillar',
    searchIntentVi: 'So sánh cơ chế sinh hóa của Natural, Honey và Chế biến ướt CBU',
    searchIntentEn: 'Compare fermentation, mucilage sugar dynamics, and flavor tendencies across Natural, Honey, and Washed (CBU)',
    relatedCodes: ['B006', 'B031', 'B032', 'B033'],
    nextCode: 'B008',
    relatedProductSlugs: [
      'roasted-beans-robusta-s18-cbu',
      'roasted-beans-robusta-s18-honey',
      'roasted-beans-arabica-s18-cbu',
    ],
    recommendationReasonVi:
      'Khám phá sự khác biệt thực tế giữa các quy chuẩn sơ chế tại ROAR thông qua RO-S18-CBU (chế biến ướt), RO-S18-HONEY (mật ong) và AR-S18-CBU.',
    recommendationReasonEn:
      'Experience how post-harvest discipline shapes cup clarity across RO-S18-CBU, RO-S18-HONEY, and AR-S18-CBU.',
    chartType: 'processing_methods_diagram',
    actionTipsVi: [
      'Chọn Washed (CBU) nếu bạn thích ly cà phê vị sạch, hậu vị rõ nét và ổn định cho máy Espresso hoặc Pour-over.',
      'Chọn Honey nếu muốn độ ngọt caramel mật ong dịu êm, cân bằng giữa Natural và CBU.',
      'Chọn Natural nếu ưu tiên body dày đậm, sô-cô-la nồng cho Phin truyền thống.',
    ],
    actionTipsEn: [
      'Choose Washed (CBU) for sparkling clarity, clean sweetness, and bar-to-bar Espresso consistency.',
      'Choose Honey when seeking mellow caramel-honey balance between Natural and Washed.',
      'Choose Natural when wanting heavy cacao body for classic Vietnamese Phin.',
    ],
    quickLinks: [
      { labelVi: 'Danh mục Nhân xanh CBU/HON/NAT', labelEn: 'Green Matrix CBU/HON/NAT', to: '/coffee/green-beans', kind: 'shop' },
      { labelVi: 'Hạt rang S18 theo phương pháp sơ chế', labelEn: 'S18 Beans by Process', to: '/coffee/roasted-beans', kind: 'shop' },
    ],
    glossaryVi: [
      { term: 'CBU (Chế biến ướt)', def: 'Ký hiệu thương mại chính thức của ROAR COFFEE cho phương pháp Washed Process.' },
      { term: 'Mucilage', def: 'Lớp nhầy pectin giàu đường bao quanh vỏ thóc, quyết định cường độ ngọt khi làm Honey.' },
    ],
    glossaryEn: [
      { term: 'CBU (Washed Process)', def: 'ROAR COFFEE’s official commercial designation for clean water-washed coffee lots.' },
      { term: 'Mucilage', def: 'Sugar-rich pectin gel around the parchment retained during Honey drying.' },
    ],
    references: [
      'Specialty Coffee Association (SCA) — Post-Harvest Processing Handbooks',
      'ROAR COFFEE® — CBU Washed Technical Standard',
    ],
  },
  {
    code: 'B008',
    pillarId: '01',
    batch: 2,
    titleVi: 'Giải Mã Hạt Cà Phê: Cấu Trúc, Kích Thước Sàng & Phân Loại',
    titleEn: 'Coffee Bean Anatomy, Screen Size & Grading',
    slug: 'tieu-chuan-sang-s14-s16-s18-trong-thuong-mai',
    canonicalCategory: 'Coffee varieties',
    role: 'pillar',
    searchIntentVi: 'Hiểu đúng về kích thước sàng S14, S16, S18 (mm), hình thái Culi và tiêu chuẩn phân loại',
    searchIntentEn: 'How screen grading (S14/S16/S18), bean morphology, and defect sorting guide roasting without equating size with sensory score',
    relatedCodes: ['B003', 'B006', 'B016', 'B036'],
    nextCode: 'B009',
    relatedProductSlugs: [
      'roasted-beans-robusta-s18',
      'roasted-beans-culi-s18',
      'roasted-beans-arabica-s18',
    ],
    recommendationReasonVi:
      'Kích thước sàng S18 giúp tối ưu độ đồng đều truyền nhiệt trong trống rang, nhưng không thay thế khâu kiểm soát lỗi nhân xanh và thử nếm thực tế trên các dòng RO-S18, CU-S18, AR-S18.',
    recommendationReasonEn:
      'Screen 18 uniformity aids even heat conduction during roasting alongside strict green-bean grading across RO-S18, CU-S18, and AR-S18.',
    chartType: 'screen_size_mm_chart',
    actionTipsVi: [
      'Luôn nhớ: Cỡ sàng S18 (~7.1mm) đảm bảo hạt chín đều trong trống rang, không tự đồng nghĩa điểm vị luôn cao hơn S16.',
      'Kiểm tra độ đồng đều hạt sau khi mở túi — hạn chế hạt vỡ vụn hay quá chênh lệch kích thước.',
      'Đọc thêm B016 để biết cách phát hiện lỗi hạt nhân xanh trước khi mua sỉ.',
    ],
    actionTipsEn: [
      'Remember: Screen 18 (~7.1mm) improves roast heat-transfer uniformity rather than automatically guaranteeing cup score.',
      'Inspect roasted beans for uniform sizing and minimal broken fragments when opening a new bag.',
      'Read B016 next to learn primary and secondary green bean defect categories.',
    ],
    quickLinks: [
      { labelVi: 'Hạt rang chuẩn S18', labelEn: 'Grade S18 Roasted Beans', to: '/coffee/roasted-beans', kind: 'shop' },
      { labelVi: 'Ma trận 27 mã Nhân xanh S14–S18', labelEn: '27-SKU Green Matrix', to: '/coffee/green-beans', kind: 'shop' },
    ],
    glossaryVi: [
      { term: 'Screen 18 (7.1mm)', def: 'Lỗ sàng tròn đường kính 18/64 inch (~7.14mm) dùng phân loại hạt cỡ lớn đồng đều.' },
      { term: 'Culi (Peaberry)', def: 'Hạt đơn hình tròn tự nhiên (5–10% số quả) thay vì hai hạt mặt phẳng đối xứng.' },
    ],
    glossaryEn: [
      { term: 'Screen 18 (7.1mm)', def: 'Round sieve aperture measuring 18/64 inch (~7.14mm) isolating uniform large beans.' },
      { term: 'Peaberry (Culi)', def: 'Naturally occurring spherical single-seed bean inside roughly 5–10% of cherries.' },
    ],
    references: [
      'ISO 4150 / TCVN 4193 — Green Coffee Size Analysis (Manual & Machine Sieving)',
      'International Trade Centre (ITC) — The Coffee Exporter’s Guide',
    ],
  },
  {
    code: 'B009',
    pillarId: '01',
    batch: 2,
    titleVi: 'Khoa Học Rang Cà Phê: Phản Ứng Maillard & First Crack',
    titleEn: 'The Science of Coffee Roasting: Maillard & First Crack',
    slug: 'phan-ung-maillard-va-first-crack-trong-rang-ca-phe',
    canonicalCategory: 'Coffee knowledge',
    role: 'pillar',
    searchIntentVi: 'Biến đổi vật lý và phản ứng hóa học biến hạt nhân xanh thành hạt rang thơm',
    searchIntentEn: 'Thermal phases, Maillard chemistry, caramelization, and First Crack inside a roasting drum',
    relatedCodes: ['B008', 'B019', 'B020', 'B035'],
    nextCode: 'B010',
    relatedProductSlugs: ['roar-espresso', 'roar-espresso-gold', 'roar-dam-bold'],
    recommendationReasonVi:
      'Xem cách điều chỉnh thời gian phát triển nhiệt sau First Crack định hình phong cách rang từ vừa đến đậm trên các dòng Espresso, Espresso Gold và Đậm.',
    recommendationReasonEn:
      'See how post-crack thermal development shapes roast profiles across ROAR Espresso, Espresso Gold, and Bold.',
    chartType: 'roast_thermal_curve',
    actionTipsVi: [
      'Không đánh giá độ rang chỉ bằng màu vỏ ngoài: hạt có thể tối vỏ nhưng sống lõi nếu nhiệt khởi đầu quá gắt.',
      'Chờ cà phê rang mới nghỉ khí CO2 (degassing) 7–14 ngày với Espresso để chiết xuất ổn định.',
      'Xem tiếp B020 để phân biệt chi tiết Light, Medium và Dark Roast.',
    ],
    actionTipsEn: [
      'Avoid judging roast quality by exterior darkness alone—excess charge heat can scorch outside while leaving cores underdeveloped.',
      'Allow freshly roasted espresso beans 7–14 days of one-way valve degassing for even extraction.',
      'Continue to B020 for a direct comparison across Light, Medium, and Dark roast profiles.',
    ],
    quickLinks: [
      { labelVi: 'Thử ROAR Espresso Gold', labelEn: 'ROAR Espresso Gold', to: '/product/roar-espresso-gold', kind: 'product' },
      { labelVi: 'Thử ROAR Coffee Đậm', labelEn: 'ROAR Bold Edition', to: '/product/roar-dam-bold', kind: 'product' },
    ],
    glossaryVi: [
      { term: 'Phản ứng Maillard', def: 'Phản ứng giữa axit amin và đường ở 150–195°C tạo hương hạt dẻ, bánh mì nướng và sô-cô-la.' },
      { term: 'Development Time Ratio (DTR)', def: 'Tỷ lệ phần trăm thời gian hạt tiếp tục phát triển sau tiếng nổ First Crack.' },
    ],
    glossaryEn: [
      { term: 'Maillard Reaction', def: 'Non-enzymatic browning between amino acids and sugars (150–195°C) creating nutty cocoa aromatics.' },
      { term: 'Development Time Ratio (DTR)', def: 'Percentage of total roast duration spent after First Crack begins.' },
    ],
    references: [
      'SCA — Coffee Roasting & Sensory Chemistry Foundations',
      'Scott Rao — The Coffee Roaster’s Companion',
    ],
  },
  {
    code: 'B010',
    pillarId: '01',
    batch: 2,
    titleVi: 'Giải Mã Hương Vị Cà Phê: Từ Hương Thơm Đến Hậu Vị',
    titleEn: 'Coffee Sensory Science: From Aroma to Aftertaste',
    slug: 'giai-ma-huong-vi-ca-phe-tu-huong-thom-den-hau-vi',
    canonicalCategory: 'Coffee knowledge',
    role: 'pillar',
    searchIntentVi: 'Cách phân biệt các thuộc tính cảm quan: Fragrance/Aroma, Acidity, Sweetness, Body, Balance và Aftertaste',
    searchIntentEn: 'Understanding coffee sensory vocabulary from aroma and acidity to mouthfeel, balance, and aftertaste',
    relatedCodes: ['B009', 'B018', 'B028', 'B037'],
    nextCode: 'B011',
    relatedProductSlugs: ['signature-reserve', 'robusta-house-blend', 'arabica-selection'],
    recommendationReasonVi:
      'Để tự thực hành đối chiếu cấu trúc Body, Sweetness và Balance giữa đơn loài và phối trộn, bạn có thể thử lần lượt Arabica Selection, Robusta House Blend và Signature Reserve.',
    recommendationReasonEn:
      'Compare body, sweetness, and balance between single-species lots and structured blends across Arabica Selection, Robusta House Blend, and Signature Reserve.',
    chartType: 'sensory_cupping_wheel',
    actionTipsVi: [
      'Hãy thử nếm tách cà phê ở 3 mốc nhiệt độ: Nóng (~65°C), Ấm (~48°C) và Nguội (~35°C) — vị ngọt và chua hiện rõ nhất khi ấm.',
      'Tách biệt vị đắng sạch kiểu sô-cô-la đen khỏi vị chát se lưỡi (Astringency).',
      'Đọc tiếp B018 để tìm hiểu quy trình Cupping chuyên nghiệp của các Q-Grader.',
    ],
    actionTipsEn: [
      'Taste each coffee at hot (~65°C), warm (~48°C), and cool (~35°C)—sweetness and acidity bloom as heat drops.',
      'Distinguish clean dark-cacao bitterness from dry puckering astringency.',
      'Read B018 next to explore formal professional cupping protocol.',
    ],
    quickLinks: [
      { labelVi: 'Đối chiếu Signature Reserve', labelEn: 'Compare Signature Reserve', to: '/product/signature-reserve', kind: 'product' },
      { labelVi: 'Khám phá 7 Cá tính Hương vị', labelEn: '7 Flavor Archetypes', to: '/personalities', kind: 'personality' },
    ],
    glossaryVi: [
      { term: 'Fragrance vs. Aroma', def: 'Fragrance là hương bột khô vừa xay; Aroma là mùi hương bốc lên khi bột tiếp xúc nước nóng.' },
      { term: 'Body (Thể chất)', def: 'Cảm giác độ sánh, trọng lượng và kết cấu mượt của cà phê trên vòm miệng.' },
      { term: 'Aftertaste (Hậu vị)', def: 'Dư vị và hương thơm còn lưu lại sau khi nuốt tách cà phê.' },
    ],
    glossaryEn: [
      { term: 'Fragrance vs. Aroma', def: 'Fragrance comes from dry ground coffee; Aroma emerges once hot water saturates the grounds.' },
      { term: 'Body (Mouthfeel)', def: 'Perceived tactile weight and viscosity of brewed coffee on the palate.' },
      { term: 'Aftertaste', def: 'The lingering taste and retronasal aroma remaining after swallowing.' },
    ],
    references: [
      'Specialty Coffee Association (SCA) & World Coffee Research — Sensory Lexicon & Flavor Wheel',
      'Coffee Quality Institute (CQI) — Sensory Evaluation Standards',
    ],
  },

  // Batch 3 (B011 - B015): Terroir & Vietnam Origins + Fine Robusta
  {
    code: 'B011',
    pillarId: '02',
    batch: 3,
    titleVi: 'Terroir Tây Nguyên: Thổ Nhưỡng Đất Đỏ Bazan Đắk Lắk – Đắk Nông',
    titleEn: 'Red Basalt Terroir: What Shapes Central Highlands Coffee?',
    slug: 'tho-nhuong-dat-do-bazan-dak-lak-va-dak-nong',
    canonicalCategory: 'Coffee origins',
    role: 'pillar',
    searchIntentVi: 'Vai trò thổ nhưỡng đất đỏ bazan và mùa khô Tây Nguyên',
    searchIntentEn: 'Volcanic red basalt soil and seasonal wind-sun cycles across Dak Lak and Dak Nong',
    relatedCodes: ['B004', 'B005', 'B012', 'B015'],
    nextCode: 'B012',
    relatedProductSlugs: ['roasted-beans-robusta-s18', 'roasted-beans-culi-s18', 'robusta-house-blend'],
    recommendationReasonVi:
      'Dải cao nguyên đất đỏ bazan Đắk Lắk – Đắk Nông là nguồn gốc tạo nên thân vị sô-cô-la đậm sánh trong Robusta S18, Culi S18 và Robusta House Blend.',
    recommendationReasonEn:
      'Deep volcanic basalt soils in Đắk Lắk and Đắk Nông nourish the chocolate-rich density of Robusta S18, Culi S18, and Robusta House Blend.',
    actionTipsVi: [
      'Ưu tiên lô hạt vụ mới thu hoạch vào mùa khô (tháng 11 – tháng 1) để đảm bảo phơi sấy tự nhiên sạch mùi ẩm.',
      'Trải nghiệm dòng Robusta S18 Honey từ Krông Năng nếu muốn khám phá vị ngọt mật ong đặc sắc trên nền đất bazan.',
      'Xem bản đồ vùng nguyên liệu Tây Nguyên chi tiết tại trang Origins.',
    ],
    actionTipsEn: [
      'Prioritize dry-season harvest lots (November–January) for cleaner sun-dried consistency.',
      'Sample Honey-processed Robusta S18 from Krông Năng to taste basalt richness with natural sweetness.',
      'Inspect elevation and harvest notes on the interactive Origins map.',
    ],
    quickLinks: [
      { labelVi: 'Bản đồ Tây Nguyên ROAR', labelEn: 'Highland Origins Map', to: '/origins', kind: 'origin' },
      { labelVi: 'Robusta S18 Tây Nguyên', labelEn: 'Highland Robusta S18', to: '/product/roasted-beans-robusta-s18', kind: 'product' },
    ],
    references: [
      'WASI (Western Highlands Agriculture & Forestry Science Institute) — Basalt Soil Fertility Studies',
      'ICO — Vietnam Coffee Origin Profile',
    ],
  },
  {
    code: 'B012',
    pillarId: '02',
    batch: 3,
    titleVi: 'Hành Trình Arabica Cầu Đất 1.500m & Tiểu Vùng Cao Nguyên Việt Nam',
    titleEn: 'Vietnamese Terroirs: Cầu Đất 1,500m & Central Highlands Heritage',
    slug: 'hanh-trinh-arabica-cau-dat-1500m',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Khám phá vùng trồng Arabica Cầu Đất Lâm Đồng ở độ cao 1.500m',
    searchIntentEn: 'How Cau Dat elevation and cool mist craft floral Vietnamese Arabica',
    relatedCodes: ['B005', 'B011', 'B015', 'B047'],
    nextCode: 'B013',
    relatedProductSlugs: ['arabica-selection', 'roasted-beans-arabica-s18', 'roasted-beans-arabica-s18-cbu'],
    recommendationReasonVi:
      'Cảm nhận sự thanh tao của sương mù Cầu Đất 1.500m qua ba cấp độ trải nghiệm: Arabica Selection, hạt rang AR-S18 và phiên bản chế biến ướt sạch vị AR-S18-CBU.',
    recommendationReasonEn:
      'Experience Cầu Đất 1,500m terroir across Arabica Selection, AR-S18 whole beans, and clean full-washed AR-S18-CBU.',
    actionTipsVi: [
      'Pha Pour-over ở 92–93°C với Arabica Cầu Đất để giữ hương hoa nhài và vị cam chín rõ nét.',
      'So sánh AR-S18 thường với AR-S18-CBU để thấy sự khác biệt về độ trong trẻo khi sơ chế ướt.',
      'Đọc tiếp B047 để mở rộng hành trình sang các vùng Arabica phía Bắc như Sơn La & Điện Biên.',
    ],
    actionTipsEn: [
      'Brew Cầu Đất Arabica with Pour-over at 92–93°C to preserve jasmine blossom and citrus notes.',
      'Compare standard AR-S18 against AR-S18-CBU to taste full-washed clarity.',
      'Read B047 to explore northern highland Arabica in Sơn La and Điện Biên.',
    ],
    quickLinks: [
      { labelVi: 'Thử Arabica Selection', labelEn: 'Try Arabica Selection', to: '/product/arabica-selection', kind: 'product' },
      { labelVi: 'Thử Arabica S18 CBU', labelEn: 'Try Arabica S18 CBU', to: '/product/roasted-beans-arabica-s18-cbu', kind: 'product' },
    ],
    references: [
      'Vietnam Coffee-Cocoa Association (VICOFA) — Lâm Đồng Arabica Regional Data',
      'ROAR Sourcing Team — Cầu Đất Harvest Standards',
    ],
  },
  {
    code: 'B013',
    pillarId: '02',
    batch: 3,
    titleVi: 'Mùa Vụ Cà Phê: Từ Thu Hoạch Chọn Lọc Đến Chất Lượng Lô Hàng',
    titleEn: 'Coffee Harvest Seasons: From Selective Picking to Lot Quality',
    slug: 'mua-vu-ca-phe-thu-hoach-chon-loc-va-chat-luong',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Thời điểm thu hoạch chín đỏ và tác động đến phẩm chất nhân xanh',
    searchIntentEn: 'How harvest timing and selective red-cherry picking shape bean sweetness',
    relatedCodes: ['B006', 'B011', 'B014', 'B016'],
    nextCode: 'B014',
    relatedProductSlugs: ['roasted-beans-robusta-s18-honey', 'roasted-beans-robusta-s18-cbu'],
    recommendationReasonVi:
      'Các lô Honey và CBU chất lượng cao tại ROAR bắt buộc thu hái chọn lọc quả chín đỏ theo nhiều đợt trong mùa vụ tháng 11–1.',
    recommendationReasonEn:
      'ROAR Honey and CBU lots depend on multi-pass selective red-cherry harvesting between November and January.',
    actionTipsVi: [
      'Phân biệt hái tuốt (strip picking) với hái chọn lọc nhiều lượt (selective picking) — lý do giải thích sự chênh lệch giá và độ sạch vị.',
      'Thời tiết nắng khô đúng mùa thu hoạch là yếu tố sống còn cho phơi giàn.',
      'Đọc tiếp B014 để hiểu bài toán kinh tế và công sức của người trồng cà phê.',
    ],
    actionTipsEn: [
      'Contrast single-pass strip picking against multi-pass selective picking to understand flavor cleanliness and cost.',
      'Dry harvest sunlight prevents mold risks during initial cherry drying.',
      'Continue to B014 to explore how fair picking premiums support farmer quality.',
    ],
    quickLinks: [
      { labelVi: 'Robusta S18 Honey (Hái chín)', labelEn: 'Red-Ripe Robusta S18 Honey', to: '/product/roasted-beans-robusta-s18-honey', kind: 'product' },
      { labelVi: 'Vùng trồng Việt Nam', labelEn: 'Harvest Calendars', to: '/origins', kind: 'origin' },
    ],
    references: [
      'SCA — Harvest Best Practices & Ripeness Brix Studies',
      'FAO — Seasonal Crop Calendars in Southeast Asia',
    ],
  },
  {
    code: 'B014',
    pillarId: '02',
    batch: 3,
    titleVi: 'Người Trồng Cà Phê: Nền Tảng Của Một Ly Cà Phê Tốt',
    titleEn: 'Coffee Farmers: The Foundation of Every Great Cup',
    slug: 'nguoi-trong-ca-phe-nen-tang-cua-mot-ly-ca-phe-tot',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Vai trò nông hộ canh tác bền vững trong chuỗi giá trị cà phê',
    searchIntentEn: 'Farming stewardship, picking wages, and sustainable coffee livelihoods',
    relatedCodes: ['B013', 'B043', 'B045'],
    nextCode: 'B015',
    relatedProductSlugs: ['robusta-house-blend', 'signature-reserve'],
    recommendationReasonVi:
      'Mỗi tách Robusta House Blend hay Signature Reserve sạch vị đều bắt đầu từ quyết định chăm cây bền vững và giữ kỷ luật thu hái của người nông dân.',
    recommendationReasonEn:
      'Every clean cup of Robusta House Blend or Signature Reserve rests on skilled farm stewardship.',
    actionTipsVi: [
      'Hiểu rằng chi phí nhân công hái chín chọn lọc cao hơn hái tuốt 30–50% nhưng tạo ra chất lượng khác biệt rõ rệt.',
      'Ủng hộ các đơn vị minh bạch nguồn vùng trồng và cam kết chất lượng lô hàng.',
      'Đọc tiếp B043 & B045 để nhìn rõ cấu trúc chuỗi giá trị nông hộ.',
    ],
    actionTipsEn: [
      'Recognize that selective hand-picking requires 30–50% more labor than strip picking—directly funding better cups.',
      'Support roasters committed to transparent regional sourcing and fair quality incentives.',
      'Follow into B043 and B045 to map the complete farmer-to-cup value chain.',
    ],
    quickLinks: [
      { labelVi: 'Khám phá Chuỗi giá trị (B043)', labelEn: 'Read Value Chain (B043)', to: '/journal/chuoi-gia-tri-ca-phe-tu-nong-dan-den-nguoi-thuong-thuc', kind: 'journal' },
      { labelVi: 'Bản đồ vùng trồng ROAR', labelEn: 'ROAR Origin Regions', to: '/origins', kind: 'origin' },
    ],
    references: [
      'ICO — Coffee Smallholder Income & Living Wage Studies',
      'Global Coffee Platform — Sustainable Coffee Farming Indicators',
    ],
  },
  {
    code: 'B015',
    pillarId: '03',
    batch: 3,
    titleVi: 'Giải Mã Các Giống Cà Phê Chủ Lực Tại Việt Nam & Fine Robusta',
    titleEn: 'Vietnam Coffee Cultivars & Redefining Fine Robusta Standards',
    slug: 'robusta-tr4-tr9-va-arabica-catimor-bourbon-viet-nam',
    canonicalCategory: 'Coffee varieties',
    role: 'pillar',
    searchIntentVi: 'Đặc tính giống Robusta TR4, TR9, Catimor và tiêu chí đánh giá Fine Robusta',
    searchIntentEn: 'Agronomic traits of Vietnam cultivars and objective frameworks for evaluating Fine Robusta',
    relatedCodes: ['B003', 'B008', 'B016', 'B047'],
    nextCode: 'B016',
    relatedProductSlugs: ['roasted-beans-robusta-s18-cbu', 'roasted-beans-arabica-s18'],
    recommendationReasonVi:
      'Các dòng Robusta TR4/TR9 chọn lọc kích thước sàng 18 kết hợp chế biến ướt CBU mở ra tiêu chuẩn Fine Robusta sạch vị cho máy Espresso.',
    recommendationReasonEn:
      'Clonal TR4/TR9 Robusta graded to Screen 18 and washed via CBU sets a clean-cup Fine Robusta benchmark for Espresso.',
    actionTipsVi: [
      'Không đánh đồng "Robusta" nói chung với cà phê đắng gắt: lỗi vị đến từ hái xanh và phơi đất, không phải lỗi của loài cây.',
      'Thử pha Espresso 100% RO-S18-CBU ở 90°C để kiểm chứng độ ngọt hậu và độ sánh mịn.',
      'Đọc tiếp B016 & B018 để nắm quy chuẩn lỗi nhân xanh và chấm điểm Fine Robusta.',
    ],
    actionTipsEn: [
      'Separate species genetics from processing defects: harshness stems from unripe fruit and poor drying, not Robusta itself.',
      'Pull an Espresso shot using 100% RO-S18-CBU at 90°C to test clean cacao sweetness.',
      'Continue to B016 and B018 for defect grading and formal cupping protocols.',
    ],
    quickLinks: [
      { labelVi: 'Robusta S18 CBU (Fine Robusta)', labelEn: 'Fine Robusta S18 CBU', to: '/product/roasted-beans-robusta-s18-cbu', kind: 'product' },
      { labelVi: 'Ma trận Nhân xanh B2B', labelEn: 'B2B Green Coffee Matrix', to: '/coffee/green-beans', kind: 'shop' },
    ],
    references: [
      'CQI & Uganda/Vietnam Fine Robusta Standards & Protocols',
      'WASI — TR4, TR9 & TRS1 Clonal Robusta Evaluation',
    ],
  },

  // Batch 4 (B016 - B020): Green Defects, Moisture/Aw, Cupping, Roast Calibration
  {
    code: 'B016',
    pillarId: '03',
    batch: 4,
    titleVi: 'Lỗi Hạt Cà Phê Nhân Xanh: Nhìn Hạt Đoán Chất Lượng',
    titleEn: 'Green Coffee Defects: Reading Quality Through the Bean',
    slug: 'loi-hat-ca-phe-nhan-xanh-nhin-hat-doan-chat-luong',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Nhận diện lỗi sơ cấp và thứ cấp trong phân loại nhân xanh',
    searchIntentEn: 'Primary and secondary green bean defects and their sensory impact',
    relatedCodes: ['B008', 'B017', 'B018', 'B033'],
    nextCode: 'B017',
    relatedProductSlugs: ['roasted-beans-robusta-s18', 'green-ro-s18-cbu'],
    recommendationReasonVi:
      'Tách sạch hạt đen, hạt mốc, hạt sâu đục trên dây chuyền bắn màu & sàng S18 giúp các lô RO-S18 và nhân xanh B2B giữ vị sạch đồng nhất.',
    recommendationReasonEn:
      'Color-sorting and Screen 18 grading remove black, moldy, and insect-damaged beans across RO-S18 and B2B green lots.',
    actionTipsVi: [
      'Khi kiểm tra mẫu nhân xanh trên 350g, hãy soi kỹ hạt đen toàn phần (Full Black) và hạt chua (Full Sour) — chỉ vài hạt cũng đủ làm hỏng cả mẻ rang.',
      'Các quầy quán mua hạt rang có thể kiểm tra nhanh bằng cách nhai thử 1–2 hạt rang vỡ đôi: mùi mốc hoặc gỗ mục là dấu hiệu lỗi nhân xanh.',
      'Đọc tiếp B017 về độ ẩm an toàn 10.5–12% giúp ngăn nấm mốc khi lưu kho.',
    ],
    actionTipsEn: [
      'Inspect 350g green samples for Category 1 defects like Full Black or Full Sour—even a few ruin an entire roast batch.',
      'On roasted beans, smell freshly cracked fragments; papery or musty notes betray pre-roast green bean defects.',
      'Read B017 next to see how 10.5–12.0% moisture and water activity prevent storage spoilage.',
    ],
    quickLinks: [
      { labelVi: 'Thông số Nhân xanh RO-S18-CBU', labelEn: 'Green Lot RO-S18-CBU', to: '/product/green-ro-s18-cbu', kind: 'product' },
      { labelVi: 'Hạt rang Robusta S18', labelEn: 'Roasted Robusta S18', to: '/product/roasted-beans-robusta-s18', kind: 'product' },
    ],
    references: [
      'SCA — Green Arabica Coffee Classification System (GACCS)',
      'ISO 10470 / TCVN 4193 — Green Coffee Defect Reference Chart',
    ],
  },
  {
    code: 'B017',
    pillarId: '03',
    batch: 4,
    titleVi: 'Độ Ẩm Và Hoạt Độ Nước (Aw) Khi Lên Men & Phơi Giàn Nhân Xanh',
    titleEn: 'Moisture Content & Water Activity in Green Coffee Stabilization',
    slug: 'nhiet-do-va-do-am-len-men-hat-nhan-xanh',
    canonicalCategory: 'Coffee processing',
    role: 'supporting',
    searchIntentVi: 'Kiểm soát độ ẩm 10–12% và hoạt độ nước để bảo quản nhân xanh ổn định',
    searchIntentEn: 'Controlling fermentation temperature and 10.5–12.0% moisture for year-round stability',
    relatedCodes: ['B007', 'B016', 'B033', 'B034'],
    nextCode: 'B018',
    relatedProductSlugs: ['roasted-beans-robusta-s18-cbu', 'roasted-beans-arabica-s18-cbu'],
    recommendationReasonVi:
      'Khóa độ ẩm 10.5–12.0% và hoạt độ nước dưới 0.60 Aw trên giàn phơi nâng cao giúp các lô RO-S18-CBU và AR-S18-CBU giữ trọn hương thơm suốt niên vụ.',
    recommendationReasonEn:
      'Locking green moisture to 10.5–12.0% and water activity under 0.60 Aw protects cup freshness in RO-S18-CBU and AR-S18-CBU.',
    actionTipsVi: [
      'Đừng chỉ đo phần trăm độ ẩm (% Moisture); hoạt độ nước (Aw) mới là chỉ số dự báo khả năng phát triển vi sinh vật và lão hóa.',
      'Với xưởng rang, nhân xanh quá khô (<9.5%) dễ cháy cạnh khi mới đổ trống, còn quá ẩm (>12.5%) sẽ lì nhiệt và giảm mùi.',
      'Xem tiếp B034 để tìm hiểu cách lưu kho với bao lót kín khí nhiều lớp.',
    ],
    actionTipsEn: [
      'Pair moisture % readings with Water Activity (Aw < 0.60) to predict true shelf stability.',
      'Roasters should adjust initial drum charge gently when beans drop below 10% moisture to avoid tipping.',
      'Read B034 for hermetic warehouse storage best practices.',
    ],
    quickLinks: [
      { labelVi: 'Khám phá Arabica S18 CBU', labelEn: 'Arabica S18 CBU', to: '/product/roasted-beans-arabica-s18-cbu', kind: 'product' },
      { labelVi: 'Đọc Bảo quản kho nhân xanh (B034)', labelEn: 'Green Storage (B034)', to: '/journal/bao-quan-ca-phe-nhan-xanh-tu-kho-hang-den-on-dinh-lau-dai', kind: 'journal' },
    ],
    references: [
      'WCR & Cropster — Water Activity vs. Moisture Content in Green Coffee',
      'ISO 6673 — Green Coffee Determination of Loss in Mass at 105°C',
    ],
  },
  {
    code: 'B018',
    pillarId: '03',
    batch: 4,
    titleVi: 'Cupping: Cách Chuyên Gia Đánh Giá Chất Lượng Cà Phê',
    titleEn: 'Coffee Cupping: How Professionals Evaluate Coffee',
    slug: 'cupping-cach-chuyen-gia-danh-gia-chat-luong-ca-phe',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Quy trình thử nếm chuẩn hóa và chấm điểm cảm quan khách quan',
    searchIntentEn: 'Standardized sensory evaluation workflows without subjective bias',
    relatedCodes: ['B010', 'B028', 'B036'],
    nextCode: 'B019',
    relatedProductSlugs: ['signature-reserve', 'arabica-selection', 'robusta-house-blend'],
    recommendationReasonVi:
      'Bạn có thể áp dụng chính quy trình thử nếm 3 bát tại nhà để đối chiếu Signature Reserve, Arabica Selection và Robusta House Blend theo chuẩn Q-Grader.',
    recommendationReasonEn:
      'Practice side-by-side home cupping across Signature Reserve, Arabica Selection, and Robusta House Blend.',
    actionTipsVi: [
      'Chuẩn bị tỷ lệ cố định 8.25g bột rang xay vừa cho 150ml nước 93°C (tỷ lệ ~1:18) để mọi mẫu đều công bằng.',
      'Húp nhẹ có âm thanh (slurp) giúp phun sương cà phê phủ đều lên lưỡi và đưa hương lên khoang mũi sau.',
      'Luôn thử nếm mù (blind cupping) không nhìn nhãn bao bì để loại bỏ thiên kiến thương hiệu.',
    ],
    actionTipsEn: [
      'Use an exact 8.25g coffee to 150ml 93°C water ratio across every bowl for fair comparison.',
      'Aspirate (slurp) briskly from the cupping spoon to coat the entire palate and activate retronasal aroma.',
      'Taste blind without labels whenever benchmarking different lots.',
    ],
    quickLinks: [
      { labelVi: 'Ôn lại Từ vựng Cảm quan (B010)', labelEn: 'Review Sensory Lexicon (B010)', to: '/journal/giai-ma-huong-vi-ca-phe-tu-huong-thom-den-hau-vi', kind: 'journal' },
      { labelVi: 'Khám phá Signature Reserve', labelEn: 'Signature Reserve', to: '/product/signature-reserve', kind: 'product' },
    ],
    references: [
      'SCA — Coffee Standards & Cupping Protocols (Coffee Value Assessment)',
      'CQI — Q Arabica & Q Robusta Cupping Standards',
    ],
  },
  {
    code: 'B019',
    pillarId: '04',
    batch: 4,
    titleVi: 'Hồ Sơ Rang & Cân Bằng Nhiệt Trong Chiết Xuất Hạt Rang S18',
    titleEn: 'Roast Profiles & S18 Bean Calibration for Espresso Bars',
    slug: 'bi-quyet-chon-hat-rang-s18-cho-quan-espresso',
    canonicalCategory: 'Coffee knowledge',
    role: 'pillar',
    searchIntentVi: 'Cách chọn hạt rang S18 và hồ sơ nhiệt phù hợp mô hình quán',
    searchIntentEn: 'Screen 18 roasted bean calibration and thermal roast profile alignment',
    relatedCodes: ['B008', 'B009', 'B020', 'B022'],
    nextCode: 'B020',
    relatedProductSlugs: ['roasted-beans-robusta-s18-cbu', 'roasted-beans-arabica-s18', 'roar-espresso-gold'],
    recommendationReasonVi:
      'Hạt rang chuẩn S18 đồng nhất kết hợp bảng giá 5 bậc theo kg giúp quán Espresso ổn định hương vị lẫn biên lợi nhuận từng ly.',
    recommendationReasonEn:
      'Screen 18 batch consistency paired with transparent 5-tier kg pricing protects both espresso flavor and café margins.',
    actionTipsVi: [
      'Với quán phục vụ nhiều cà phê sữa máy/đá, thử nền 70% Robusta S18 CBU + 30% Arabica S18.',
      'Với quán chuyên Americano/Latte hiện đại, thử 50% Arabica S18 CBU + 50% Robusta S18 Honey.',
      'Tận dụng nấc giá sỉ 5kg – 20kg – 50kg – 100kg tự động trên trang hạt rang ROAR để tối ưu chi phí.',
    ],
    actionTipsEn: [
      'For high-volume iced milk espresso menus, test 70% Robusta S18 CBU + 30% Arabica S18.',
      'For smooth modern Lattes and Americanos, try 50% Arabica S18 CBU + 50% Robusta S18 Honey.',
      'Combine kg quantities in the cart to unlock automatic 5-tier wholesale pricing.',
    ],
    quickLinks: [
      { labelVi: 'Bảng giá Hạt rang 5 nấc kg', labelEn: '5-Tier Wholesale Beans', to: '/coffee/roasted-beans', kind: 'shop' },
      { labelVi: 'ROAR Espresso Gold', labelEn: 'ROAR Espresso Gold', to: '/product/roar-espresso-gold', kind: 'product' },
    ],
    references: [
      'ROAR HORECA Advisory — Café Recipe Calibration Guide',
      'Cropster / Ikawa — Roast Profile Repeatability Foundations',
    ],
  },
  {
    code: 'B020',
    pillarId: '04',
    batch: 4,
    titleVi: 'Light, Medium, Dark Roast: Ba Cấp Độ Rang Khác Nhau Thế Nào?',
    titleEn: 'Light, Medium & Dark Roast: Understanding Roast Levels',
    slug: 'light-medium-dark-roast-ba-cap-do-rang-khac-nhau-the-nao',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'So sánh độ hòa tan, màu Agtron và ứng dụng pha chế theo từng mức rang',
    searchIntentEn: 'Comparing solubility, density loss, and flavor balance across roast levels',
    relatedCodes: ['B009', 'B019', 'B035', 'B025'],
    nextCode: 'B021',
    relatedProductSlugs: ['roar-dam-bold', 'roar-phin-heritage', 'roar-espresso', 'arabica-selection'],
    recommendationReasonVi:
      'ROAR phân tách rõ mức rang cho từng gu: rang Vừa cho Arabica Selection, rang Vừa-Đậm cho Espresso và rang Đậm cho ROAR Đậm.',
    recommendationReasonEn:
      'ROAR matches roast curves to intended brew styles—from Medium in Arabica Selection to Dark in ROAR Bold.',
    chartType: 'roast_thermal_curve',
    actionTipsVi: [
      'Hạt rang Sáng (Light) giữ độ đặc chắc nên cần nước nóng hơn (~93–95°C) và cỡ xay mịn hơn một chút so với rang Đậm.',
      'Hạt rang Đậm (Dark) cấu trúc xốp giòn dễ chiết xuất hơn nên hãy hạ nhiệt nước về 88–90°C để không kéo ra vị đắng khét.',
      'Đính chính hiểu lầm phổ biến: Rang đậm KHÔNG hề có nhiều caffeine hơn rang sáng tính theo từng hạt.',
    ],
    actionTipsEn: [
      'Light roasts stay denser and less porous—brew slightly hotter (93–95°C) and slightly finer.',
      'Dark roasts extract very rapidly—lower brew water to 88–90°C to avoid drawing harsh ash.',
      'Myth check: Dark roasting does not increase caffeine per bean compared to light roasting.',
    ],
    quickLinks: [
      { labelVi: 'ROAR Đậm (Dark Roast)', labelEn: 'ROAR Bold (Dark)', to: '/product/roar-dam-bold', kind: 'product' },
      { labelVi: 'Arabica Selection (Medium)', labelEn: 'Arabica Selection (Medium)', to: '/product/arabica-selection', kind: 'product' },
    ],
    references: [
      'Agtron / SCA — Roast Color Classification Standards',
      'Coffee Chemistry — Solubility & Porosity Changes Across Roast Levels',
    ],
  },

  // Batch 5 (B021 - B025): Degassing, Blending + Deep Brewing Science
  {
    code: 'B021',
    pillarId: '04',
    batch: 5,
    titleVi: 'Cà Phê Sau Khi Rang: Degassing CO2, Độ Tươi Và Thời Điểm Pha',
    titleEn: 'After Roasting: Degassing, Freshness & Brewing Window',
    slug: 'ca-phe-sau-khi-rang-degassing-co2-va-thoi-diem-pha',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Hiểu về thời gian nghỉ CO2 và túi van một chiều sau rang',
    searchIntentEn: 'CO2 release curves, one-way valve storage, and optimal extraction windows',
    relatedCodes: ['B009', 'B024', 'B025', 'B029'],
    nextCode: 'B022',
    relatedProductSlugs: ['roar-espresso', 'arabica-selection', 'roar-phin-heritage'],
    recommendationReasonVi:
      'Toàn bộ túi cà phê ROAR đều trang bị van thoát khí 1 chiều giúp khí CO2 thoát ra mà không lọt oxy ngược vào, giữ đỉnh hương vị dài lâu.',
    recommendationReasonEn:
      'Every ROAR pouch features a one-way degassing valve letting excess CO2 escape while blocking oxygen ingress.',
    actionTipsVi: [
      'Không pha Espresso ngay 1–2 ngày sau rang: lượng CO2 quá lớn đẩy nước ra ngoài gây crema bọt to nhưng tách vị rỗng và chua gắt.',
      'Cửa sổ vàng: 5–14 ngày sau rang cho Phin/Pour-over và 10–25 ngày cho máy pha Espresso.',
      'Không bao giờ bỏ hạt cà phê vào ngăn mát tủ lạnh hàng ngày vì hơi ẩm ngưng tụ và ám mùi thực phẩm.',
    ],
    actionTipsEn: [
      'Avoid pulling espresso 24 hours post-roast—trapped CO2 creates channeling and hollow, bubbly shots.',
      'Prime sweet spot: days 5–14 for Filter/Phin and days 10–25 for pressurized Espresso.',
      'Never store daily-use coffee inside a refrigerator where condensation accelerates staling.',
    ],
    quickLinks: [
      { labelVi: 'Đọc Nhãn & Rang mộc (B029)', labelEn: 'Label Literacy (B029)', to: '/journal/nhan-dien-ca-phe-rang-moc-100-phan-tram', kind: 'journal' },
      { labelVi: 'Mua hạt rang mới mỗi tuần', labelEn: 'Weekly Fresh Roasted Beans', to: '/coffee/roasted-beans', kind: 'shop' },
    ],
    references: [
      'Smrke et al. (ZHAW) — Carbon Dioxide Degassing Kinetics in Roasted Coffee',
      'SCA — Freshness & Packaging Permeability Guidelines',
    ],
  },
  {
    code: 'B022',
    pillarId: '04',
    batch: 5,
    titleVi: 'Nghệ Thuật Phối Trộn: Khi Nhiều Loại Hạt Tạo Nên Một Bản Sắc',
    titleEn: 'The Art of Coffee Blending: Creating a Signature Profile',
    slug: 'nghe-thuat-phoi-tron-ca-phe-tao-nen-mot-ban-sac',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Nguyên lý kết hợp Robusta, Culi và Arabica trong một công thức phối trộn',
    searchIntentEn: 'Balancing body, sweetness, and aromatic lift through intentional multi-origin blending',
    relatedCodes: ['B003', 'B010', 'B037', 'B030'],
    nextCode: 'B023',
    relatedProductSlugs: ['signature-reserve', 'robusta-house-blend', 'roar-espresso'],
    recommendationReasonVi:
      'Signature Reserve là ví dụ điển hình cho nghệ thuật phối trộn có chủ đích: 60% Robusta tạo nền dày, 20% Culi tăng chiều sâu và 20% Arabica CBU mở tầng hương thanh tao.',
    recommendationReasonEn:
      'Signature Reserve demonstrates intentional blending: 60% Robusta structure, 20% Culi depth, and 20% Washed Arabica lift.',
    actionTipsVi: [
      'Hiểu sự khác biệt giữa phối trộn trước khi rang (Pre-roast blend) và phối trộn sau khi rang riêng từng dòng (Post-roast blend).',
      'Khi phối tại nhà, hãy cân tỷ lệ theo khối lượng gam (vd: 12g Robusta + 6g Arabica) thay vì ước lượng muỗng.',
      'Đọc tiếp B037 để tìm hiểu cơ chế hóa học tạo nên sự cộng hưởng Robusta–Arabica.',
    ],
    actionTipsEn: [
      'Distinguish pre-roast blending (roasting together) from post-roast blending (individual curves combined later).',
      'Weigh home blends by gram rather than scoops since Robusta and Arabica densities differ.',
      'Continue to B037 for deeper insight into Robusta-Arabica synergy.',
    ],
    quickLinks: [
      { labelVi: 'Khám phá Signature Reserve', labelEn: 'Signature Reserve Blend', to: '/product/signature-reserve', kind: 'product' },
      { labelVi: 'Khoa học phối trộn (B037)', labelEn: 'Blending Science (B037)', to: '/journal/phoi-tron-robusta-va-arabica-khoa-hoc-cua-su-can-bang', kind: 'journal' },
    ],
    references: [
      'ROAR Master Roaster Notes — Signature Reserve Architecture',
      'Rob Hoos — Modulating the Flavor Profile of Coffee',
    ],
  },
  {
    code: 'B023',
    pillarId: '05',
    batch: 5,
    titleVi: 'Cà Phê Phin: Nghệ Thuật & Khoa Học Chiết Xuất Đậm Sâu Không Chát',
    titleEn: 'Vietnamese Phin: The Science Behind Clean, Syrupy Extraction',
    slug: 'nghe-thuat-pha-phin-viet-nam-chuan-roar',
    canonicalCategory: 'Brewing techniques',
    role: 'pillar',
    searchIntentVi: 'Hướng dẫn chuẩn pha Phin: tỷ lệ bột/nước, ủ bloom 30s và tốc độ nhỏ giọt',
    searchIntentEn: 'Mastering Vietnamese Phin thermodynamics, bloom timing, and grind calibration',
    relatedCodes: ['B010', 'B025', 'B027', 'B041'],
    nextCode: 'B024',
    relatedProductSlugs: ['roar-phin-heritage', 'roar-dam-bold', 'robusta-house-blend'],
    recommendationReasonVi:
      'Bột rang mộc xay chuẩn Phin của ROAR COFFEE PHIN và ROAR ĐẬM được cân chỉnh độ hạt giúp giữ tốc độ nhỏ giọt 1 giọt/giây sạch vị.',
    recommendationReasonEn:
      'ROAR Phin and ROAR Bold are pre-calibrated in grind distribution for clean 1-drop-per-second gravity brewing.',
    chartType: 'extraction_balance',
    actionTipsVi: [
      'Luôn tráng nóng cả Phin và ly bằng nước sôi trước khi cho 25g bột cà phê vào.',
      'Đừng nén nắp gài quá chặt — lực nén nhẹ vừa đủ giữ phẳng mặt bột là chìa khóa tránh nghẹt dòng chảy.',
      'Nếu Phin chảy xong dưới 2 phút (nhạt chua), hãy xoay nhẹ nắp gài hoặc chỉnh cối xay mịn thêm 1 nấc.',
    ],
    actionTipsEn: [
      'Pre-heat both the metal Phin and glass so brew temperature stays steady.',
      'Rest the gravity press gently rather than forcing it down—over-tamping stalls drainage and extracts harshness.',
      'If drawdown finishes under 2 minutes, grind slightly finer; if over 6 minutes, grind slightly coarser.',
    ],
    quickLinks: [
      { labelVi: 'ROAR COFFEE PHIN (Sư Tử)', labelEn: 'ROAR Phin (Lion)', to: '/product/roar-phin-heritage', kind: 'product' },
      { labelVi: 'Văn hóa Cà phê Sữa Đá (B027)', labelEn: 'Iced Milk Coffee (B027)', to: '/journal/ca-phe-sua-da-bieu-tuong-van-hoa-ca-phe-viet', kind: 'journal' },
    ],
    references: [
      'ROAR Head Barista — Vietnamese Phin Extraction Calibration SOP',
      'SCA Brewing Handbook — Gravity Percolation Physics',
    ],
  },
  {
    code: 'B024',
    pillarId: '05',
    batch: 5,
    titleVi: 'Espresso, Ristretto & Lungo: Khoa Học Chiết Xuất Áp Suất 9 Bar',
    titleEn: 'Espresso Extraction: Understanding Ristretto, Espresso & Lungo Ratios',
    slug: 'kien-truc-tang-huong-espresso-crema-va-ristretto',
    canonicalCategory: 'Brewing techniques',
    role: 'pillar',
    searchIntentVi: 'Cơ chế áp suất, nhiệt độ và tỷ lệ 1:1.5 – 1:2 – 1:3 trong máy pha Espresso',
    searchIntentEn: 'How extraction yield, 9-bar pressure, and brew ratios shape espresso structure',
    relatedCodes: ['B019', 'B025', 'B039', 'B042'],
    nextCode: 'B025',
    relatedProductSlugs: ['roar-espresso', 'roar-espresso-gold', 'roasted-beans-robusta-s18-cbu'],
    recommendationReasonVi:
      'Thử nghiệm ngay ba tỷ lệ Ristretto (1:1.5), Espresso (1:2) và Lungo (1:3) trên ROAR Espresso (Cáo) hoặc Espresso Gold (Đại Bàng).',
    recommendationReasonEn:
      'Dial in Ristretto (1:1.5), Espresso (1:2), and Lungo (1:3) recipes on ROAR Espresso and Espresso Gold.',
    chartType: 'extraction_balance',
    actionTipsVi: [
      'Bắt đầu mọi buổi sáng với công thức gốc: 18g bột → 36g nước cốt trong 26–30 giây ở 92°C.',
      'Dùng cân điện tử đặt dưới tách để dừng máy theo khối lượng gam thay vì nhìn vạch thể tích bọt crema.',
      'Khi pha Latte/Cappuccino nóng, hãy thử kéo Ristretto 1:1.5 để vị sô-cô-la cắt qua lớp sữa ngọt béo rõ nét hơn.',
    ],
    actionTipsEn: [
      'Baseline every morning calibration at 18g dry dose → 36g yield in 26–30 seconds at 92°C.',
      'Weigh liquid output on a scale rather than judging volume by fluffy crema height.',
      'Pull a 1:1.5 Ristretto when pairing with steamed milk so cocoa notes shine cleanly.',
    ],
    quickLinks: [
      { labelVi: 'ROAR Espresso (Cáo)', labelEn: 'ROAR Espresso (Fox)', to: '/product/roar-espresso', kind: 'product' },
      { labelVi: 'ROAR Espresso Gold (Đại Bàng)', labelEn: 'ROAR Espresso Gold', to: '/product/roar-espresso-gold', kind: 'product' },
    ],
    references: [
      'Illy & Viani — Espresso Coffee: The Science of Quality',
      'Barista Hustle — Espresso Yield & Extraction Dynamics',
    ],
  },
  {
    code: 'B025',
    pillarId: '05',
    batch: 5,
    titleVi: 'Tỷ Lệ Bloom, Cỡ Xay & Nhiệt Độ Nước: Ba Biến Số Quyết Định Ly Cà Phê',
    titleEn: 'Brew Ratio, Grind Size & Water Temperature: Three Levers of Extraction',
    slug: 'ty-le-bloom-chiet-xuat-va-can-bang-do-chua-ngot',
    canonicalCategory: 'Brewing techniques',
    role: 'supporting',
    searchIntentVi: 'Cách sửa lỗi ly cà phê chua gắt hoặc đắng khé qua 3 biến số pha chế',
    searchIntentEn: 'Tuning bloom, grind particle size, and temperature to fix sour or bitter brews',
    relatedCodes: ['B023', 'B024', 'B039', 'B040'],
    nextCode: 'B026',
    relatedProductSlugs: ['arabica-selection', 'roar-espresso', 'ca-phe-hat-arabica-200g'],
    recommendationReasonVi:
      'Làm chủ 3 biến số pha chế giúp bạn khai thác tối đa hương hoa nhài và cam chín từ Arabica Selection hay túi hạt 200g tự xay tại nhà.',
    recommendationReasonEn:
      'Mastering bloom, grind size, and temperature unlocks bright floral clarity from Arabica Selection and 200g whole-bean pouches.',
    chartType: 'extraction_balance',
    actionTipsVi: [
      'Chỉ thay đổi MỘT biến số duy nhất ở mỗi lần chỉnh sửa (ưu tiên chỉnh Cỡ Xay trước, sau đó mới tới Nhiệt độ hoặc Tỷ lệ).',
      'Nước pha Pour-over chuẩn tỷ lệ 1:15 đến 1:16 (vd: 16g bột cho 250ml nước).',
      'Đọc tiếp B040 để biết chất lượng nước sinh hoạt ảnh hưởng tới 98.5% thành phần tách cà phê như thế nào.',
    ],
    actionTipsEn: [
      'Change only ONE variable per test brew—adjust Grind Size first before touching temperature or ratio.',
      'Use 1:15 to 1:16 as a universal Pour-over starting ratio (16g coffee to 250g water).',
      'Read B040 next to explore how water minerals shape 98.5% of your brewed cup.',
    ],
    quickLinks: [
      { labelVi: 'Hóa học Nước pha cà phê (B040)', labelEn: 'Water Chemistry (B040)', to: '/journal/nuoc-pha-ca-phe-do-cung-khoang-chat-va-huong-vi', kind: 'journal' },
      { labelVi: 'Túi 200g Arabica tự xay tại nhà', labelEn: '200g Arabica Whole Bean', to: '/product/ca-phe-hat-arabica-200g', kind: 'product' },
    ],
    references: [
      'SCA — Coffee Brewing Control Chart & Extraction Yield Standards',
      'Jonathan Gagné — The Physics of Filter Coffee',
    ],
  },

  // Batch 6 (B026 - B030): Cold Brew, Vietnamese Culture & ROAR Philosophy
  {
    code: 'B026',
    pillarId: '05',
    batch: 6,
    titleVi: 'Cold Brew 16 Giờ & Xu Hướng Thưởng Thức Cà Phê Ủ Lạnh',
    titleEn: '16-Hour Cold Brew & Low-Acidity Cold Extraction Culture',
    slug: 'van-hoa-cold-brew-va-qua-tang-ca-phe-cao-cap',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Sự khác biệt hóa học giữa ủ lạnh 16 giờ và pha nóng rót đá',
    searchIntentEn: 'Time-driven cold extraction solubility versus flash-chilled hot brewing',
    relatedCodes: ['B025', 'B005', 'B010', 'B050'],
    nextCode: 'B027',
    relatedProductSlugs: ['arabica-selection', 'roasted-beans-arabica-s18-cbu', 'signature-reserve', 'gift-voucher-500k'],
    recommendationReasonVi:
      'Ủ lạnh 14–16 giờ bằng hạt xay thô từ Arabica Selection hoặc AR-S18-CBU mang đến ly Cold Brew mượt mà, ít chua gắt; đồng thời Signature Reserve & Gift Voucher là lựa chọn quà tặng đẳng cấp.',
    recommendationReasonEn:
      'Cold steeping coarse Arabica Selection or AR-S18-CBU yields silky low-acidity Cold Brew alongside elevated corporate gifting.',
    actionTipsVi: [
      'Dùng tỷ lệ 1:10 (50g bột xay thô như muối biển với 500ml nước mát 4–8°C) để ủ trực tiếp uống ngay không cần pha loãng nhiều.',
      'Thử thêm một lát cam vàng tươi hoặc 10ml mật ong hoa cà phê vào ly Cold Brew buổi chiều.',
      'Tham khảo hộp thiếc Signature Reserve hoặc Gift Voucher cho quà tặng đối tác tinh tế.',
    ],
    actionTipsEn: [
      'Use a 1:10 ratio (50g sea-salt coarse grounds in 500ml chilled water at 4–8°C) for a ready-to-pour cup.',
      'Garnish afternoon Cold Brew with fresh orange zest or tonic water for zero-syrup refreshment.',
      'Explore Signature Reserve canisters or ROAR Gift Vouchers for executive gifting.',
    ],
    quickLinks: [
      { labelVi: 'Thử Arabica S18 CBU cho Cold Brew', labelEn: 'Arabica S18 CBU for Cold Brew', to: '/product/roasted-beans-arabica-s18-cbu', kind: 'product' },
      { labelVi: 'Thẻ Quà Tặng ROAR 500.000₫', labelEn: 'ROAR 500K Gift Voucher', to: '/product/gift-voucher-500k', kind: 'product' },
    ],
    references: [
      'Fuller & Rao — Extraction Kinetics of Cold vs. Hot Brewed Coffee (Scientific Reports)',
      'ROAR Lifestyle Desk — Modern Office & Gifting Trends',
    ],
  },
  {
    code: 'B027',
    pillarId: '06',
    batch: 6,
    titleVi: 'Cà Phê Sữa Đá: Một Biểu Tượng Của Văn Hóa Cà Phê Việt',
    titleEn: 'Vietnamese Iced Milk Coffee: An Icon of Coffee Culture',
    slug: 'ca-phe-sua-da-bieu-tuong-van-hoa-ca-phe-viet',
    canonicalCategory: 'Brewing techniques',
    role: 'supporting',
    searchIntentVi: 'Cân bằng giữa cà phê Phin đậm, sữa đặc và đá lạnh',
    searchIntentEn: 'The heritage and sensory physics of Cà Phê Sữa Đá',
    relatedCodes: ['B023', 'B041', 'B012'],
    nextCode: 'B028',
    relatedProductSlugs: ['roar-phin-heritage', 'roar-dam-bold', 'ca-phe-muoi-hop-10-goi'],
    recommendationReasonVi:
      'Để tạo nên ly Cà phê Sữa Đá chuẩn vị không bị loãng vị khi đá tan, cốt Phin cần đủ độ sánh từ nền Robusta như ROAR Phin hoặc ROAR Đậm.',
    recommendationReasonEn:
      'A classic Cà Phê Sữa Đá needs bold Phin concentration from ROAR Phin or ROAR Bold to stay balanced as ice melts.',
    actionTipsVi: [
      'Tỷ lệ vàng tại nhà: 45–50ml cốt Phin đậm + 25–30g sữa đặc có đường + đầy ly đá viên già.',
      'Khuấy hòa tan cốt cà phê nóng với sữa đặc TRƯỚC khi cho đá để tạo nhũ tương sánh mịn và bọt nâu đẹp mắt.',
      'Thử biến tấu nhanh gọn buổi sáng với Cà phê Muối Hòa Tan ROAR (10 gói × 18g).',
    ],
    actionTipsEn: [
      'Home balance benchmark: 45–50ml concentrated Phin extract + 25–30g sweetened condensed milk + dense ice.',
      'Stir hot espresso/Phin extract thoroughly into condensed milk BEFORE adding ice for silky emulsion.',
      'Try ROAR Salted Instant Coffee for a quick 10-second coastal café twist.',
    ],
    quickLinks: [
      { labelVi: 'Công thức Pha Phin Chuẩn (B023)', labelEn: 'Phin Brewing Science (B023)', to: '/journal/nghe-thuat-pha-phin-viet-nam-chuan-roar', kind: 'journal' },
      { labelVi: 'ROAR Đậm (Gu Sữa Đá)', labelEn: 'ROAR Bold Edition', to: '/product/roar-dam-bold', kind: 'product' },
    ],
    references: [
      'Vietnamese Coffee Cultural Heritage Archives',
      'ROAR Head Barista — Condensed Milk & Robusta Pairing Notes',
    ],
  },
  {
    code: 'B028',
    pillarId: '06',
    batch: 6,
    titleVi: 'Đọc Vị Cà Phê: Hương, Vị, Body Và Hậu Vị Trong Thực Hành',
    titleEn: 'Reading Coffee: Aroma, Flavor, Body & Aftertaste in Practice',
    slug: 'doc-vi-ca-phe-huong-vi-body-va-hau-vi-trong-thuc-hanh',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Thực hành gọi tên hương vị trên tách cà phê hằng ngày',
    searchIntentEn: 'Practical palate training for distinguishing sweetness, acidity, body, and finish',
    relatedCodes: ['B010', 'B018', 'B030'],
    nextCode: 'B029',
    relatedProductSlugs: ['signature-reserve', 'arabica-selection', 'robusta-house-blend'],
    recommendationReasonVi:
      'Áp dụng khung đọc vị 4 bước trên ba tách Arabica Selection, Robusta House Blend và Signature Reserve để rèn vị giác chuyên nghiệp.',
    recommendationReasonEn:
      'Apply this 4-step tasting drill across Arabica Selection, Robusta House Blend, and Signature Reserve.',
    actionTipsVi: [
      'Đi từ nhóm lớn đến chi tiết: Ví dụ từ "Ngọt" → "Ngọt đường nâu / Caramel" hoặc từ "Hạt" → "Hạt dẻ rang / Hạnh nhân".',
      'Giữ tách cà phê đen không đường ít nhất ở 3 ngụm đầu tiên để nhận diện đầy đủ hậu vị sạch hay chát.',
      'Đọc lại B010 kết hợp B018 nếu bạn muốn tập chấm điểm so sánh.',
    ],
    actionTipsEn: [
      'Move from broad categories to specific descriptors: Sweet → Caramel, or Nutty → Toasted Hazelnut.',
      'Take your first three sips black before adding milk or sugar to map true mouthfeel and aftertaste.',
      'Pair with B010 Sensory Lexicon and B018 Cupping Protocol.',
    ],
    quickLinks: [
      { labelVi: 'Giải mã Hương vị (B010)', labelEn: 'Sensory Science (B010)', to: '/journal/giai-ma-huong-vi-ca-phe-tu-huong-thom-den-hau-vi', kind: 'journal' },
      { labelVi: 'Thử bộ đôi Robusta & Arabica', labelEn: 'Shop Roasted Selection', to: '/coffee/roasted', kind: 'shop' },
    ],
    references: [
      'WCR & SCA — Sensory Lexicon Practical Tasting Guide',
      'CQI — Palate Calibration Methodology',
    ],
  },
  {
    code: 'B029',
    pillarId: '06',
    batch: 6,
    titleVi: 'Cách Chọn Cà Phê: Đọc Nhãn, Nhận Diện Rang Mộc 100% & Chọn Đúng Gu',
    titleEn: 'How to Choose Coffee: Reading Labels & Identifying 100% Pure Roasts',
    slug: 'nhan-dien-ca-phe-rang-moc-100-phan-tram',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Cách kiểm tra độ tơi, bloom và nhãn thông số khi mua cà phê rang mộc',
    searchIntentEn: 'Reading roast specs, processing designations, and spotting pure unflavored coffee',
    relatedCodes: ['B021', 'B028', 'B030'],
    nextCode: 'B030',
    relatedProductSlugs: ['robusta-house-blend', 'arabica-selection', 'roasted-beans-robusta-s18'],
    recommendationReasonVi:
      'Mọi sản phẩm ROAR COFFEE® đều minh bạch vùng nguyên liệu, mã phẩm cấp sàng S18 và phương pháp sơ chế (CBU/Honey/Natural), cam kết rang mộc 100%.',
    recommendationReasonEn:
      'Every ROAR COFFEE® product transparently specifies origin, S18 grading, and CBU/Honey/Natural processing—100% pure roast.',
    actionTipsVi: [
      'Luôn tìm 4 thông tin trên bao bì: Loài hạt (Arabica/Robusta), Vùng trồng, Mức rang và Ngày rang.',
      'Bột cà phê rang mộc 100% tơi xốp nhẹ và nở bọt CO2 mịn khi châm nước 93°C (hiện tượng Bloom), không bết dính hay đen kịt.',
      'Dùng công cụ "Chọn cà phê phù hợp" ngay trên đầu trang Tạp chí để lọc nhanh theo dụng cụ pha.',
    ],
    actionTipsEn: [
      'Look for four transparency anchors on every bag: Species/Blend, Origin Region, Roast Level, and Roast Date.',
      'Pure 100% ground coffee stays dry and fluffy while blooming smoothly at 93°C without greasy paste.',
      'Use our interactive "Find Your Coffee" tool on the main Journal page to match your brewer.',
    ],
    quickLinks: [
      { labelVi: 'Công cụ Chọn cà phê phù hợp', labelEn: 'Find Your Coffee Matcher', to: '/journal', kind: 'journal' },
      { labelVi: 'Robusta House Blend 100% Mộc', labelEn: '100% Pure Robusta House Blend', to: '/product/robusta-house-blend', kind: 'product' },
    ],
    references: [
      'ROAR Quality Assurance — Pure Roast Standards',
      'Vietnam Food Safety & Coffee Labeling Regulations',
    ],
  },
  {
    code: 'B030',
    pillarId: '06',
    batch: 6,
    titleVi: '7 Cá Tính ROAR COFFEE®: Bản Lĩnh Trong Từng Hạt Cà Phê',
    titleEn: 'Character in Every Bean: The 7 ROAR Personalities & Philosophy',
    slug: '7-ca-tinh-roar-va-gu-thuong-thuc-cua-ban',
    canonicalCategory: 'Coffee knowledge',
    role: 'pillar',
    searchIntentVi: 'Kết nối 7 hình tượng linh thú ROAR với gu pha chế và triết lý Roots · Originality · Artistry',
    searchIntentEn: 'Connecting ROAR’s Seven Personalities to Roots, Originality, and Artistry',
    relatedCodes: ['B001', 'B022', 'B028', 'B050'],
    nextCode: 'B031',
    relatedProductSlugs: ['signature-reserve', 'roar-dam-bold', 'roar-phin-heritage', 'roar-espresso', 'roar-espresso-gold'],
    recommendationReasonVi:
      'Mỗi biểu tượng linh thú gắn liền với một dòng sản phẩm chủ lực: Hổ (Đậm), Sư Tử (Phin), Cáo (Espresso), Đại Bàng (Espresso Gold) và Báo Đen (Signature Reserve).',
    recommendationReasonEn:
      'Each ROAR archetype anchors a dedicated roast line—from Tiger (Bold) and Lion (Phin) to Black Panther (Signature Reserve).',
    actionTipsVi: [
      'Khám phá trang 7 Cá Tính để đọc câu chuyện và tìm biểu tượng phản ánh đúng nhịp sống của bạn.',
      'Chọn Hổ/Sư Tử cho buổi sáng Phin đậm bản lĩnh; Cáo/Đại Bàng cho nhịp Espresso hiện đại; Báo Đen cho những cột mốc trọng đại.',
      'Đọc tiếp B050 để kết nối toàn bộ hệ thống tri thức với tuyên ngôn thương hiệu ROAR.',
    ],
    actionTipsEn: [
      'Visit the 7 Personalities showcase to match your daily temperament to its signature roast curve.',
      'Choose Tiger/Lion for classic Phin command, Fox/Eagle for agile Espresso, or Black Panther for flagship gifting.',
      'Read B050 to see how all 50 guides unite behind Roots · Originality · Artistry.',
    ],
    quickLinks: [
      { labelVi: 'Trang 7 Cá Tính ROAR', labelEn: '7 ROAR Personalities Page', to: '/personalities', kind: 'personality' },
      { labelVi: 'ROAR Signature Reserve', labelEn: 'Signature Reserve', to: '/product/signature-reserve', kind: 'product' },
    ],
    references: [
      'ROAR COFFEE® Brand Constitution — Roots · Originality · Artistry',
    ],
  },

  // Batch 7 (B031 - B035): Fermentation Science, Anaerobic, Storage & Roasting Matrix
  {
    code: 'B031',
    pillarId: '07',
    batch: 7,
    titleVi: '24 Giờ Vàng Trong Chế Biến Ướt CBU & Khoa Học Lên Men Cà Phê',
    titleEn: 'Cherry to CBU Green Bean: Fermentation Science & Clean-Cup Control',
    slug: 'quy-trinh-tach-vo-xat-nhot-cbu-khep-kin',
    canonicalCategory: 'Coffee processing',
    role: 'pillar',
    searchIntentVi: 'Cơ chế phân hủy lớp nhớt pectin và kiểm soát pH trong bể lên men CBU',
    searchIntentEn: 'Controlling microbial fermentation, float sorting, and parchment rinsing in CBU lots',
    relatedCodes: ['B007', 'B017', 'B032', 'B033'],
    nextCode: 'B032',
    relatedProductSlugs: ['roasted-beans-robusta-s18-cbu', 'roasted-beans-arabica-s18-cbu'],
    recommendationReasonVi:
      'Kỷ luật 24 giờ vàng ngay tại trạm sơ chế ướt CBU tạo nên vị sạch trong trẻo cho RO-S18-CBU và AR-S18-CBU.',
    recommendationReasonEn:
      'Same-day 24-hour discipline in CBU wet mills builds spotless clarity in RO-S18-CBU and AR-S18-CBU.',
    actionTipsVi: [
      'Quả hái buổi chiều phải được tách vỏ ngay trong tối cùng ngày để tránh phát nhiệt ủ đống làm chua hỏng.',
      'Theo dõi độ pH giảm từ ~5.5 xuống 4.0–4.2 để xác định đúng điểm dừng rửa sạch nhớt thay vì chỉ canh đồng hồ cứng nhắc.',
      'Đọc tiếp B032 để khám phá hướng lên men yếm khí (Anaerobic) hiện đại.',
    ],
    actionTipsEn: [
      'Pulp harvested cherries the same evening to prevent overnight sack heating and acetic sourness.',
      'Track fermentation tank pH (dropping from ~5.5 toward 4.0–4.2) rather than relying solely on fixed clock timers.',
      'Read B032 next to examine anaerobic and carbonic maceration protocols.',
    ],
    quickLinks: [
      { labelVi: 'Robusta S18 CBU', labelEn: 'Robusta S18 CBU', to: '/product/roasted-beans-robusta-s18-cbu', kind: 'product' },
      { labelVi: 'So sánh Natural/Honey/CBU (B007)', labelEn: 'Process Comparison (B007)', to: '/journal/phan-biet-natural-honey-va-cbu-washed', kind: 'journal' },
    ],
    references: [
      'CQI Processing Handbook — Controlled Wet Fermentation & pH Tracking',
      'ROAR COFFEE® Quality Control — 24h CBU Standard Operating Protocol',
    ],
  },
  {
    code: 'B032',
    pillarId: '07',
    batch: 7,
    titleVi: 'Anaerobic, Carbonic Maceration & Các Phương Pháp Sơ Chế Mới',
    titleEn: 'Anaerobic, Carbonic Maceration & Emerging Coffee Processes',
    slug: 'anaerobic-carbonic-maceration-va-phuong-phap-so-che-moi',
    canonicalCategory: 'Coffee processing',
    role: 'supporting',
    searchIntentVi: 'Nguyên lý lên men yếm khí kín oxy và bài toán quản trị rủi ro',
    searchIntentEn: 'Principles and quality-control risks behind sealed anaerobic coffee fermentation',
    relatedCodes: ['B007', 'B031', 'B033'],
    nextCode: 'B033',
    relatedProductSlugs: ['roasted-beans-robusta-s18-honey', 'roasted-beans-arabica-s18-cbu'],
    recommendationReasonVi:
      'Hiểu bản chất lên men có kiểm soát giúp bạn nhận ra giá trị của tính sạch ổn định trên các lô Honey và CBU chuẩn mực trước khi thử các mẻ thử nghiệm yếm khí.',
    recommendationReasonEn:
      'Understanding controlled fermentation highlights why foundational Honey and CBU discipline precedes experimental anaerobic lots.',
    actionTipsVi: [
      'Lên men yếm khí tốt cho hương trái cây nhiệt đới sạch, nhưng nếu mất kiểm soát sẽ sinh mùi rượu nồng hoặc dấm (acetic).',
      'Luôn vệ sinh bồn chứa inox chuẩn thực phẩm và gắn van xả CO2 một chiều khi thử nghiệm yếm khí.',
      'Ưu tiên uống hằng ngày bằng các dòng CBU và Honey cân bằng để vị giác luôn thoải mái.',
    ],
    actionTipsEn: [
      'Well-managed anaerobic fermentation highlights clean tropical aromatics, whereas sloppy control creates harsh vinegar taints.',
      'Food-grade stainless tanks with one-way CO2 airlocks are essential for repeatable anaerobic trials.',
      'Anchor daily espresso menus on consistent CBU and Honey lots for reliable hospitality service.',
    ],
    quickLinks: [
      { labelVi: 'Quy trình CBU khép kín (B031)', labelEn: 'CBU Fermentation Science (B031)', to: '/journal/quy-trinh-tach-vo-xat-nhot-cbu-khep-kin', kind: 'journal' },
      { labelVi: 'Hạt rang Honey S18', labelEn: 'Honey S18 Beans', to: '/product/roasted-beans-robusta-s18-honey', kind: 'product' },
    ],
    references: [
      'Lucia Solis — Coffee Fermentation Microbiology Lectures',
      'SCA — Experimental Coffee Processing Safety & QA',
    ],
  },
  {
    code: 'B033',
    pillarId: '07',
    batch: 7,
    titleVi: 'Chuẩn Chế Biến Ướt CBU & Kỹ Thuật Phơi Sấy Bảo Vệ Nhân Xanh',
    titleEn: 'Understanding CBU Washed Architecture & Moisture Stabilization',
    slug: 'understanding-cbu-washed-process-in-vietnam',
    canonicalCategory: 'Coffee processing',
    role: 'supporting',
    searchIntentVi: 'Cách hệ thống ROAR ký hiệu CBU cho nhân xanh chế biến ướt S14–S18',
    searchIntentEn: 'Commercial CBU washed nomenclature and raised-bed moisture control across S14–S18 lots',
    relatedCodes: ['B007', 'B017', 'B031', 'B034'],
    nextCode: 'B034',
    relatedProductSlugs: ['roasted-beans-robusta-s18-cbu', 'roasted-beans-arabica-s18-cbu', 'green-ro-s18-cbu'],
    recommendationReasonVi:
      'Ký hiệu CBU được ROAR áp dụng xuyên suốt từ hệ thống 27 mã nhân xanh B2B đến các lô hạt rang S18 phục vụ quán.',
    recommendationReasonEn:
      'CBU unifies ROAR’s 27-SKU green coffee matrix and our commercial S18 roasted bean portfolio.',
    actionTipsVi: [
      'Khi đặt hàng nhân xanh B2B tại ROAR, hãy đọc mã 3 phần: [Loài: RO/AR/CU] - [Sàng: S14/S16/S18] - [Sơ chế: NAT/HON/CBU].',
      'Phơi chậm trong 10–14 ngày ở lớp mỏng 3–5cm giúp nước rút đều từ nhân ra vỏ thóc.',
      'Đọc tiếp B034 để tối ưu khâu bảo quản bao đay lót PE kín khí.',
    ],
    actionTipsEn: [
      'Decode ROAR B2B SKUs in 3 tokens: [Species: RO/AR/CU] - [Screen: S14/S16/S18] - [Process: NAT/HON/CBU].',
      'Spread parchment in thin 3–5cm layers on raised beds for gentle 10–14 day drying.',
      'Continue to B034 for warehouse humidity and hermetic liner guidelines.',
    ],
    quickLinks: [
      { labelVi: 'Ma trận 27 mã Nhân xanh B2B', labelEn: '27-SKU B2B Green Matrix', to: '/coffee/green-beans', kind: 'shop' },
      { labelVi: 'Lô nhân xanh RO-S18-CBU', labelEn: 'RO-S18-CBU Green Lot', to: '/product/green-ro-s18-cbu', kind: 'product' },
    ],
    references: [
      'ROAR COFFEE® — Commercial Green Grading & CBU Specification',
      'International Trade Centre — Green Coffee Drying Guidelines',
    ],
  },
  {
    code: 'B034',
    pillarId: '07',
    batch: 7,
    titleVi: 'Bảo Quản Cà Phê Nhân Xanh: Từ Kho Hàng Đến Độ Ổn Định Lâu Dài',
    titleEn: 'Green Coffee Storage: From Warehouse to Year-Round Stability',
    slug: 'bao-quan-ca-phe-nhan-xanh-tu-kho-hang-den-on-dinh-lau-dai',
    canonicalCategory: 'Coffee processing',
    role: 'supporting',
    searchIntentVi: 'Nhiệt độ, độ ẩm tương đối và bao bì bảo quản nhân xanh',
    searchIntentEn: 'Relative humidity, hermetic liners, and lipid preservation in green bean warehousing',
    relatedCodes: ['B017', 'B033', 'B036'],
    nextCode: 'B035',
    relatedProductSlugs: ['green-ro-s18-cbu', 'green-ar-s16-cbu'],
    recommendationReasonVi:
      'Kho bảo quản đạt chuẩn nhiệt độ và độ ẩm giúp lô nhân xanh RO-S18-CBU và AR-S16-CBU giữ trọn sức sống đến tận cuối mùa vụ.',
    recommendationReasonEn:
      'Temperature- and humidity-controlled storage protects sweetness and vibrancy in RO-S18-CBU and AR-S16-CBU lots year-round.',
    actionTipsVi: [
      'Duy trì kho nhân xanh ở nhiệt độ 18–22°C và độ ẩm tương đối (RH) 55–65%; luôn kê pallet cách sàn tối thiểu 15cm và cách tường 40cm.',
      'Bao lót nhiều lớp cản khí (Hermetic liners) giúp giữ mùi hương tươi lâu gấp đôi bao đay truyền thống.',
      'Tránh tuyệt đối lưu trữ cà phê gần gia vị, hóa chất hoặc hàng nông sản nặng mùi.',
    ],
    actionTipsEn: [
      'Target 18–22°C and 55–65% RH in green warehouses, keeping pallets raised 15cm off floors and away from walls.',
      'Hermetic high-barrier inner liners preserve cup freshness far longer than standard jute sacks alone.',
      'Never store green beans near strong spices, fuels, or aromatic goods.',
    ],
    quickLinks: [
      { labelVi: 'Xem Nhân xanh AR-S16-CBU', labelEn: 'Green Lot AR-S16-CBU', to: '/product/green-ar-s16-cbu', kind: 'product' },
      { labelVi: 'Độ ẩm & Aw (B017)', labelEn: 'Moisture & Aw (B017)', to: '/journal/nhiet-do-va-do-am-len-men-hat-nhan-xanh', kind: 'journal' },
    ],
    references: [
      'Coffee Quality Institute — Green Coffee Storage & Packaging Studies',
      'GrainPro / Ecotact — Hermetic Coffee Preservation Trials',
    ],
  },
  {
    code: 'B035',
    pillarId: '08',
    batch: 7,
    titleVi: 'Ma Trận Rang Cà Phê: Giống, Sơ Chế Và Chiến Lược Nhiệt',
    titleEn: 'Coffee Roasting Matrix: Variety, Processing & Roast Level',
    slug: 'ma-tran-rang-ca-phe-giong-so-che-va-chien-luoc-nhiet',
    canonicalCategory: 'Coffee knowledge',
    role: 'pillar',
    searchIntentVi: 'Liên hệ giữa mật độ hạt, độ ẩm tồn dư và tốc độ tăng nhiệt RoR',
    searchIntentEn: 'Aligning drum charge temperature and Rate of Rise with bean density and process',
    relatedCodes: ['B009', 'B019', 'B020', 'B036'],
    nextCode: 'B036',
    relatedProductSlugs: ['roasted-beans-robusta-s18-honey', 'roasted-beans-arabica-s18-cbu'],
    recommendationReasonVi:
      'Mỗi cặp giống × sơ chế cần một chiến lược nhiệt riêng: Arabica CBU mật độ cao chịu nhiệt khởi đầu mạnh hơn lô Honey nhiều đường dễ caramel hóa.',
    recommendationReasonEn:
      'Each species × process pair calls for its own thermal curve—dense CBU Arabica absorbs higher charge heat than sugar-rich Honey.',
    chartType: 'roast_thermal_curve',
    actionTipsVi: [
      'Với hạt Honey và Natural giàu đường bề mặt, hạ nhiệt nạp trống (Charge Temp) vừa phải để tránh cháy xém góc hạt.',
      'Với hạt Arabica CBU vùng cao mật độ đặc chắc, cung cấp đủ năng lượng truyền nhiệt trong giai đoạn Drying để lõi hạt chín cùng vỏ.',
      'Giữ đường Rate of Rise (RoR) giảm dần đều đặn để tách vị không bị bẹt hoặc khé.',
    ],
    actionTipsEn: [
      'Use gentler initial charge heat for sugar-coated Honey and Natural beans to prevent surface scorching.',
      'Dense high-altitude CBU Arabica benefits from strong convective energy early so cores keep pace with exteriors.',
      'Maintain a steadily declining Rate of Rise (RoR) curve to avoid baked or roasty defects.',
    ],
    quickLinks: [
      { labelVi: 'Maillard & First Crack (B009)', labelEn: 'Maillard & First Crack (B009)', to: '/journal/phan-ung-maillard-va-first-crack-trong-rang-ca-phe', kind: 'journal' },
      { labelVi: 'Hạt rang S18 theo sơ chế', labelEn: 'Shop S18 Beans', to: '/coffee/roasted-beans', kind: 'shop' },
    ],
    references: [
      'Scott Rao — Coffee Roasting Best Practices (RoR & Density Modulation)',
      'ROAR Roastery Engineering — Batch Matrix Guidelines',
    ],
  },

  // Batch 8 (B036 - B040): Post-Roast QC, Blending Science, Portfolio, Particle Distribution, Water Chemistry
  {
    code: 'B036',
    pillarId: '08',
    batch: 8,
    titleVi: 'Từ Hạt Đến Tách: Kiểm Soát Chất Lượng Sau Rang',
    titleEn: 'Post-Roast Quality Control: From Bean to Cup',
    slug: 'tu-hat-den-tach-kiem-soat-chat-luong-sau-rang',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Đo màu Agtron, kiểm tra tỷ lệ hao hụt và thử nếm đối chứng theo mẻ',
    searchIntentEn: 'Color tracking, weight loss ratios, and batch-to-batch cupping QA',
    relatedCodes: ['B018', 'B021', 'B035'],
    nextCode: 'B037',
    relatedProductSlugs: ['signature-reserve', 'roar-espresso-gold'],
    recommendationReasonVi:
      'Mọi mẻ Signature Reserve và Espresso Gold đều trải qua bước kiểm tra màu Agtron cả hạt lẫn bột xay cùng thử nếm đối chứng trước khi đóng gói.',
    recommendationReasonEn:
      'Every Signature Reserve and Espresso Gold batch undergoes whole-bean and ground Agtron color verification plus QA cupping.',
    actionTipsVi: [
      'Đo hai chỉ số Agtron: Whole Bean (bề mặt) và Ground (lõi hạt). Chênh lệch >12–15 điểm báo hiệu rang quá nhanh hoặc ngoài cháy trong sống.',
      'Theo dõi tỷ lệ hao hụt trọng lượng (Weight Loss): thường đạt 12–14% cho Light-Medium và 15–18% cho Medium-Dark.',
      'Lưu mẫu đối chứng (Retention sample) mỗi lô để truy xuất nhanh nếu cần kiểm tra lại.',
    ],
    actionTipsEn: [
      'Check both Whole-Bean and Ground Agtron scores; a >12–15 point gap signals uneven core-to-surface development.',
      'Track batch weight loss: typically 12–14% for Light-Medium and 15–18% for Medium-Dark profiles.',
      'Retain a sealed sample from every roast lot for rapid reference.',
    ],
    quickLinks: [
      { labelVi: 'Quy trình Cupping chuẩn (B018)', labelEn: 'Cupping Protocol (B018)', to: '/journal/cupping-cach-chuyen-gia-danh-gia-chat-luong-ca-phe', kind: 'journal' },
      { labelVi: 'Signature Reserve', labelEn: 'Signature Reserve', to: '/product/signature-reserve', kind: 'product' },
    ],
    references: [
      'Agtron Inc. — M-Basic Color Spectrometry Standards',
      'ROAR Quality Assurance — Batch Release Checklist',
    ],
  },
  {
    code: 'B037',
    pillarId: '08',
    batch: 8,
    titleVi: 'Phối Trộn Robusta Và Arabica: Khoa Học Của Sự Cân Bằng',
    titleEn: 'Robusta & Arabica Blending: The Science of Balance',
    slug: 'phoi-tron-robusta-va-arabica-khoa-hoc-cua-su-can-bang',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Cách tỷ lệ phối trộn tạo tương tác giữa crema, thể chất và hương hoa trái',
    searchIntentEn: 'Engineering crema stability, sweetness, and aromatic clarity across Robusta-Arabica ratios',
    relatedCodes: ['B003', 'B022', 'B030', 'B038'],
    nextCode: 'B038',
    relatedProductSlugs: ['signature-reserve', 'roar-espresso', 'roar-espresso-gold'],
    recommendationReasonVi:
      'Sự kết hợp khoa học giữa Robusta và Arabica được thể hiện trọn vẹn trên Signature Reserve, ROAR Espresso và ROAR Espresso Gold.',
    recommendationReasonEn:
      'Balanced Robusta-Arabica synergy comes alive in Signature Reserve, ROAR Espresso, and Espresso Gold.',
    actionTipsVi: [
      'Tỷ lệ 80/20 hoặc 70/30 (Robusta trội hơn): Tuyệt vời cho Cà phê Sữa Đá và Espresso gu đậm truyền thống.',
      'Tỷ lệ 50/50 hoặc 60/40: Cân bằng đa năng cho menu cả Americano nóng/lạnh lẫn Cappuccino.',
      'Thêm 10–20% hạt Culi S18 vào công thức giúp kéo dài hậu vị sô-cô-la mà không cần tăng độ đậm rang quá khét.',
    ],
    actionTipsEn: [
      'Use 70–80% Robusta blends for bold Iced Milk Coffee and thick amber Espresso crema.',
      'Use 50/50 ratios for versatile café menus covering both Iced Americano and steamed Latte.',
      'Incorporating 10–20% Culi Peaberry deepens cocoa finish without resorting to overly dark scorching.',
    ],
    quickLinks: [
      { labelVi: 'Signature Reserve (60·20·20)', labelEn: 'Signature Reserve (60·20·20)', to: '/product/signature-reserve', kind: 'product' },
      { labelVi: 'ROAR Espresso (Fox)', labelEn: 'ROAR Espresso', to: '/product/roar-espresso', kind: 'product' },
    ],
    references: [
      'Illy & Viani — Espresso Blend Chemistry & Crema Stability',
      'ROAR Editorial — Harmonizing Coffea canephora and Coffea arabica',
    ],
  },
  {
    code: 'B038',
    pillarId: '08',
    batch: 8,
    titleVi: 'Xây Dựng Dải Sản Phẩm Cà Phê: Từ Nguyên Liệu Đến Khẩu Vị',
    titleEn: 'Building a Coffee Product Portfolio: From Green Bean to Taste Profile',
    slug: 'xay-dung-dai-san-pham-ca-phe-tu-nguyen-lieu-den-khau-vi',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Cách phân tầng danh mục theo cỡ sàng, sơ chế và gu pha chế thực tế',
    searchIntentEn: 'Structuring B2B green coffee matrices and retail lines around real brewing methods',
    relatedCodes: ['B008', 'B029', 'B037', 'B042'],
    nextCode: 'B039',
    relatedProductSlugs: ['robusta-house-blend', 'arabica-selection', 'signature-reserve', 'instant-gold-collection'],
    recommendationReasonVi:
      'Cấu trúc danh mục ROAR COFFEE được thiết kế phủ trọn 4 nhu cầu thật: Rang xay/Phin hằng ngày, Hạt rang S18 cho quán, Nhân xanh 27 mã B2B và Hòa tan Gold/Silver tiện lợi.',
    recommendationReasonEn:
      'ROAR COFFEE’s catalog structures four real consumption layers: retail ground/Phin, S18 bar beans, 27-SKU B2B green lots, and Gold/Silver instant sticks.',
    actionTipsVi: [
      'Đừng tạo 10 SKU na ná nhau: mỗi sản phẩm cần phục vụ rõ 1 phương pháp pha hoặc 1 tệp khẩu vị cụ thể.',
      'Phân tách rõ dòng phổ thông hằng ngày (House Blend), dòng chuyên biệt (Specialty Selection) và dòng quà tặng (Signature Reserve).',
      'Xem trang Cửa hàng ROAR để tham khảo cách sắp xếp danh mục theo nhu cầu pha chế.',
    ],
    actionTipsEn: [
      'Give every SKU a distinct brewing purpose or flavor niche rather than launching overlapping blends.',
      'Separate daily ritual lines (House Blend), single-species exploration (Arabica Selection), and flagship gifting (Signature Reserve).',
      'Explore the ROAR Shop to see how product tiers align with customer habits.',
    ],
    quickLinks: [
      { labelVi: 'Toàn bộ Cửa hàng ROAR', labelEn: 'Full ROAR Catalog', to: '/shop', kind: 'shop' },
      { labelVi: 'Bộ sưu tập Hòa tan Gold', labelEn: 'Instant Gold Collection', to: '/product/instant-gold-collection', kind: 'product' },
    ],
    references: [
      'ROAR Product Architecture — Consumer & HORECA Portfolio Design',
    ],
  },
  {
    code: 'B039',
    pillarId: '09',
    batch: 8,
    titleVi: 'Chọn Cỡ Xay Phù Hợp & Giải Phẫu Hạt Culi (Peaberry)',
    titleEn: 'Grind Particle Calibration & Culi Peaberry Morphology',
    slug: 'culi-peaberry-morphology-explained',
    canonicalCategory: 'Coffee varieties',
    role: 'supporting',
    searchIntentVi: 'Vì sao cùng một loại hạt nhưng cỡ xay và hình thái hạt quyết định tốc độ chiết xuất',
    searchIntentEn: 'Understanding grind size distribution and spherical peaberry behavior during milling and extraction',
    relatedCodes: ['B008', 'B025', 'B040', 'B024'],
    nextCode: 'B040',
    relatedProductSlugs: ['roasted-beans-culi-s18', 'roar-espresso'],
    recommendationReasonVi:
      'Hạt Culi tròn (Peaberry) có độ cứng và mật độ cao hơn hạt dẹt — khi xay chuẩn cỡ cho Phin hoặc Espresso sẽ cho tách cà phê cô đọng sâu sắc.',
    recommendationReasonEn:
      'Dense spherical Culi Peaberry beans reward burr precision with concentrated cocoa richness in Phin and Espresso.',
    actionTipsVi: [
      'Dùng máy xay đĩa (Burr Grinder) thay vì máy xay lưỡi dao (Blade) để tránh bột vừa có tảng lớn vừa có quá nhiều bụi mịn (fines).',
      'Thử bản đồ cỡ xay nhanh: Mịn như muối tinh (Espresso) → Mịn vừa (Moka Pot) → Vừa như cát biển (Pour-over / Phin) → Thô (Cold Brew / French Press).',
      'Khi xay hạt Culi S18, đừng ngạc nhiên nếu cần siết mịn hơn nhẹ 0.5 nấc so với Robusta dẹt cùng mức rang.',
    ],
    actionTipsEn: [
      'Upgrade from blade choppers to flat or conical burr grinders to minimize bitter micro-fines and sour boulders.',
      'Reference grind texture: Table salt (Espresso) → Kosher salt (Phin / Pour-over) → Coarse sea salt (Cold Brew).',
      'Expect to dial burr spacing slightly tighter when calibrating dense spherical Culi S18 lots.',
    ],
    quickLinks: [
      { labelVi: 'Hạt rang Culi S18', labelEn: 'Roasted Culi S18', to: '/product/roasted-beans-culi-s18', kind: 'product' },
      { labelVi: 'Ba biến số pha chế (B025)', labelEn: '3 Extraction Levers (B025)', to: '/journal/ty-le-bloom-chiet-xuat-va-can-bang-do-chua-ngot', kind: 'journal' },
    ],
    glossaryVi: [
      { term: 'Culi (Peaberry)', def: 'Hạt đơn hình tròn chiếm trọn khoang quả, phân loại theo hình thái học chứ không phải loài cây riêng.' },
      { term: 'Fines & Boulders', def: 'Bụi siêu mịn (gây đắng) và mảnh hạt quá to (gây chua) sinh ra khi lưỡi xay bị cùn hoặc không đồng đều.' },
    ],
    glossaryEn: [
      { term: 'Peaberry (Culi)', def: 'Single spherical bean inside a cherry—a natural morphology classification.' },
      { term: 'Fines & Boulders', def: 'Microscopic dust and oversized fragments produced by inconsistent burr milling.' },
    ],
    references: [
      'Maxwell Colonna-Dashwood & Christopher Hendon — Grind Distribution Studies',
      'ROAR Agronomy Desk — Peaberry Morphology Notes',
    ],
  },
  {
    code: 'B040',
    pillarId: '09',
    batch: 8,
    titleVi: 'Nước Pha Cà Phê: Độ Cứng, Khoáng Chất Và Ảnh Hưởng Đến Hương Vị',
    titleEn: 'Coffee Brewing Water: Hardness, Minerals & Flavor',
    slug: 'nuoc-pha-ca-phe-do-cung-khoang-chat-va-huong-vi',
    canonicalCategory: 'Brewing techniques',
    role: 'supporting',
    searchIntentVi: 'Vai trò của Magie, Canxi và kiềm đệm Bicarbonate trong nước pha chế',
    searchIntentEn: 'How total hardness and alkalinity buffer coffee acidity and aroma extraction',
    relatedCodes: ['B025', 'B039', 'B042'],
    nextCode: 'B041',
    relatedProductSlugs: ['arabica-selection', 'roar-espresso-gold'],
    recommendationReasonVi:
      'Một tách Espresso chiếm 90% là nước và một tách Pour-over chiếm tới 98.5% là nước — tối ưu nguồn nước sạch giúp Arabica Selection và Espresso Gold bung tỏa trọn vẹn.',
    recommendationReasonEn:
      'Water makes up 90% of espresso and 98.5% of filter coffee—clean mineral balance lets Arabica Selection and Espresso Gold shine.',
    actionTipsVi: [
      'Tránh dùng nước cất hoàn toàn (TDS ~0 ppm) vì thiếu ion Mg²⁺/Ca²⁺ giúp kéo hợp chất thơm ra khỏi bột cà phê.',
      'Tránh nước giếng/nước máy quá cứng giàu Bicarbonate vì sẽ trung hòa hết vị chua trái cây làm tách cà phê phẳng lì và đóng cặn máy Espresso.',
      'Mức nước lý tưởng theo SCA: TDS 75–150 ppm, độ pH trung tính ~7.0, sạch hoàn toàn mùi Clo.',
    ],
    actionTipsEn: [
      'Skip distilled 0-ppm water: magnesium and calcium ions are needed to bind and carry flavor compounds.',
      'Avoid overly alkaline hard water that flattens citrus vibrancy and scales espresso boilers.',
      'Aim for SCA target ranges: 75–150 ppm TDS, neutral pH ~7.0, and zero residual chlorine odor.',
    ],
    quickLinks: [
      { labelVi: 'Thử Arabica Selection', labelEn: 'Arabica Selection', to: '/product/arabica-selection', kind: 'product' },
      { labelVi: 'Cân chỉnh Quầy Bar (B042)', labelEn: 'Café Bar SOPs (B042)', to: '/journal/vietnamese-phin-and-espresso-precision', kind: 'journal' },
    ],
    references: [
      'Christopher Hendon & Maxwell Colonna-Dashwood — Water for Coffee',
      'SCA — Water Quality Handbook for Specialty Coffee',
    ],
  },

  // Batch 9 (B041 - B045): Milk Coffee, Café SOPs, Value Chain, Traceability, Sustainability
  {
    code: 'B041',
    pillarId: '09',
    batch: 9,
    titleVi: 'Từ Cà Phê Đen Đến Cà Phê Sữa: Cách Cân Bằng Hương Vị',
    titleEn: 'From Black Coffee to Milk Coffee: Balancing Flavor',
    slug: 'tu-ca-phe-den-den-ca-phe-sua-cach-can-bang-huong-vi',
    canonicalCategory: 'Brewing techniques',
    role: 'supporting',
    searchIntentVi: 'Tương tác giữa chất béo/protein trong sữa và độ đắng caramel của cà phê',
    searchIntentEn: 'Pairing roast intensity and extraction ratio with condensed or steamed dairy',
    relatedCodes: ['B023', 'B024', 'B027'],
    nextCode: 'B042',
    relatedProductSlugs: ['roar-phin-heritage', 'roar-dam-bold', 'roar-espresso', 'ca-phe-hoa-tan-3in1-hop-10-goi'],
    recommendationReasonVi:
      'Chất béo và protein trong sữa làm dịu vị đắng nhưng cũng dễ "nuốt chửng" cà phê nhạt — hãy chọn cốt Phin đậm hoặc Double Espresso từ ROAR.',
    recommendationReasonEn:
      'Milk fats and proteins soften bitterness while masking weak brews—pair dairy with strong Phin or Double Espresso from ROAR.',
    actionTipsVi: [
      'Với Latte/Flat White (sữa tươi đánh nóng 55–62°C): không đun sữa quá 70°C vì sẽ làm biến tính protein gây mùi khét trứng và mất vị ngọt lactose.',
      'Với Cà phê Sữa Đá: dùng nền Robusta hoặc blend có Robusta trội để hương cacao không bị chìm khi đá tan.',
      'Thử thêm một chút muối biển (hoặc gói Cà phê Muối ROAR) để cảm nhận hiệu ứng ức chế vị đắng tự nhiên của ion Natri.',
    ],
    actionTipsEn: [
      'Steam fresh milk between 55–62°C—never boil past 70°C, which breaks down sweetness and creates cooked notes.',
      'Pair condensed milk and ice with bold Robusta-forward blends so cacao character persists.',
      'Add a pinch of sea salt—or try ROAR Salted Coffee—to let sodium ions naturally heighten sweetness.',
    ],
    quickLinks: [
      { labelVi: 'ROAR Espresso cho Latte', labelEn: 'ROAR Espresso for Milk Drinks', to: '/product/roar-espresso', kind: 'product' },
      { labelVi: 'Hòa tan 3in1 Tiện lợi', labelEn: '3in1 Instant Sticks', to: '/product/ca-phe-hoa-tan-3in1-hop-10-goi', kind: 'product' },
    ],
    references: [
      'SCA — Milk Chemistry & Espresso Pairing Foundations',
      'ROAR Barista Lab — Dairy & Non-Dairy Balance Notes',
    ],
  },
  {
    code: 'B042',
    pillarId: '09',
    batch: 9,
    titleVi: 'Cân Chỉnh Quầy Bar: Phin Truyền Thống & Espresso Chuẩn Quán',
    titleEn: 'Brewing Consistency for Cafés: Phin Precision Meets Espresso SOPs',
    slug: 'vietnamese-phin-and-espresso-precision',
    canonicalCategory: 'Brewing techniques',
    role: 'pillar',
    searchIntentVi: 'Chuẩn hóa định lượng, nhiệt độ và thời gian phục vụ cho quầy cà phê',
    searchIntentEn: 'Standardizing recipes and temperature stability across Phin and Espresso bars',
    relatedCodes: ['B019', 'B023', 'B024', 'B040'],
    nextCode: 'B043',
    relatedProductSlugs: ['roasted-beans-robusta-s18', 'roasted-beans-robusta-s18-cbu', 'roar-espresso-gold'],
    recommendationReasonVi:
      'Dán bảng quy trình SOP ngay sau quầy bar kết hợp sử dụng hạt rang đồng đều RO-S18-CBU và Espresso Gold giúp 100 ly bán ra trong ngày đồng nhất chất lượng.',
    recommendationReasonEn:
      'Pairing clear bar SOPs with uniform RO-S18-CBU and Espresso Gold beans keeps the 100th cup identical to the first.',
    chartType: 'extraction_balance',
    actionTipsVi: [
      'Trang bị ít nhất 2 cân điện tử 0.1g, đồng hồ bấm giờ và ca đong chuẩn tại quầy thay vì đong ước lượng bằng mắt.',
      'Kiểm tra lại tốc độ dòng chảy Espresso đầu ca sáng, đầu ca trưa (khi độ ẩm không khí thay đổi) và sau khi thay lô hạt mới.',
      'Vệ sinh tay pha và họng máy bằng bột vệ sinh chuyên dụng cuối mỗi ngày để không ám dầu khét sang sáng hôm sau.',
    ],
    actionTipsEn: [
      'Keep 0.1g digital scales at both Phin and Espresso stations instead of eyeballing doses.',
      'Re-dial grind clicks between humid mornings and dry afternoons or whenever opening a fresh roast lot.',
      'Backflush espresso groupheads nightly to prevent rancid coffee oils from tainting morning shots.',
    ],
    quickLinks: [
      { labelVi: 'Chọn hạt rang cho Quán (B019)', labelEn: 'S18 Bar Selection (B019)', to: '/journal/bi-quyet-chon-hat-rang-s18-cho-quan-espresso', kind: 'journal' },
      { labelVi: 'Đặt sỉ Hạt rang theo kg', labelEn: 'Order Bulk Kg Beans', to: '/coffee/roasted-beans', kind: 'shop' },
    ],
    references: [
      'ROAR HORECA Advisory — Barista Shift Calibration Checklist',
      'Barista Hustle — Commercial Espresso Workflow',
    ],
  },
  {
    code: 'B043',
    pillarId: '10',
    batch: 9,
    titleVi: 'Chuỗi Giá Trị Cà Phê: Từ Người Nông Dân Đến Người Thưởng Thức',
    titleEn: 'The Coffee Value Chain: From Farmer to Consumer',
    slug: 'chuoi-gia-tri-ca-phe-tu-nong-dan-den-nguoi-thuong-thuc',
    canonicalCategory: 'Coffee origins',
    role: 'pillar',
    searchIntentVi: 'Cấu trúc chuỗi cung ứng cà phê từ nông hộ, sơ chế, rang xay đến người uống',
    searchIntentEn: 'Mapping value creation across growers, wet mills, exporters, roasters, and cafes',
    relatedCodes: ['B014', 'B044', 'B048'],
    nextCode: 'B044',
    relatedProductSlugs: ['robusta-house-blend', 'signature-reserve'],
    recommendationReasonVi:
      'Rút ngắn khâu trung gian và đầu tư trực tiếp vào sơ chế tại nguồn giúp cả nông hộ lẫn người uống hưởng lợi giá trị thật.',
    recommendationReasonEn:
      'Shortening opaque middlemen layers and investing in origin wet mills creates lasting value from farm to cup.',
    actionTipsVi: [
      'Hiểu 5 mắt xích chính: Nông hộ trồng trọt → Trạm sơ chế (Wet/Dry Mill) → Xuất khẩu/Thương mại nhân xanh → Nhà rang xay → Quầy Bar / Người tiêu dùng.',
      'Khi giá trị gia tăng được giữ lại ở khâu sơ chế CBU/Honey và rang xay trong nước, ngành cà phê Việt thoát khỏi bẫy bán thô.',
      'Đọc tiếp B044 để biết hồ sơ truy xuất nguồn gốc minh bạch từng mắt xích này ra sao.',
    ],
    actionTipsEn: [
      'Follow the five value nodes: Grower → Wet/Dry Mill → Green Exporter → Roaster → Barista & Drinker.',
      'Adding CBU/Honey processing and precision roasting domestically captures greater value for Vietnamese communities.',
      'Continue to B044 to see how lot traceability documents every handoff.',
    ],
    quickLinks: [
      { labelVi: 'Người trồng cà phê (B014)', labelEn: 'Coffee Farmers (B014)', to: '/journal/nguoi-trong-ca-phe-nen-tang-cua-mot-ly-ca-phe-tot', kind: 'journal' },
      { labelVi: 'Khám phá Vùng trồng ROAR', labelEn: 'ROAR Origin Regions', to: '/origins', kind: 'origin' },
    ],
    references: [
      'World Bank / ICO — Global Coffee Value Chain Economics',
      'FAO — Value Addition in Coffee Producing Countries',
    ],
  },
  {
    code: 'B044',
    pillarId: '10',
    batch: 9,
    titleVi: 'Truy Xuất Nguồn Gốc: Minh Bạch Hóa Hành Trình Của Hạt Cà Phê',
    titleEn: 'Coffee Traceability: Making Every Bean’s Journey Transparent',
    slug: 'truy-xuat-nguon-goc-minh-bach-hanh-trinh-hat-ca-phe',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Tầm quan trọng của dữ liệu vùng trồng, niên vụ, cỡ sàng và hồ sơ kiểm định COA',
    searchIntentEn: 'Lot-level documentation from harvest region and processing protocol to moisture QA',
    relatedCodes: ['B017', 'B043', 'B045'],
    nextCode: 'B045',
    relatedProductSlugs: ['roasted-beans-arabica-s18-cbu', 'roasted-beans-robusta-s18-cbu', 'green-ro-s18-cbu'],
    recommendationReasonVi:
      'Mỗi mã nhân xanh và hạt rang S18 tại ROAR đều gắn với thông số vùng trồng, cỡ sàng, phương pháp sơ chế và kiểm định chất lượng lô hàng (COA).',
    recommendationReasonEn:
      'Every ROAR B2B green lot and S18 roast carries origin region, screen grade, processing protocol, and COA traceability.',
    actionTipsVi: [
      'Khi mua sỉ nhân xanh cho xưởng rang hoặc xuất khẩu, hãy luôn yêu cầu chứng thư COA ghi rõ độ ẩm, tỷ lệ lỗi và niên vụ.',
      'Quét mã QR / kiểm tra mã lô trên bao bì để phân biệt hàng rang mới với hàng tồn kho lâu năm.',
      'Đọc tiếp B045 về tính bền vững sinh thái đi kèm với minh bạch nguồn gốc.',
    ],
    actionTipsEn: [
      'When sourcing wholesale green lots, always verify a Certificate of Analysis (COA) stating moisture, defect count, and crop year.',
      'Track batch codes and roast dates to distinguish current-harvest lots from aged stock.',
      'Read B045 next on water recycling, soil health, and ecological sustainability.',
    ],
    quickLinks: [
      { labelVi: 'Kiểm định Nhân xanh RO-S18-CBU', labelEn: 'RO-S18-CBU Lot Specs', to: '/product/green-ro-s18-cbu', kind: 'product' },
      { labelVi: 'Thị trường cà phê (B048)', labelEn: 'Coffee Markets (B048)', to: '/journal/thi-truong-ca-phe-tu-gia-hang-hoa-den-gia-tri-thuong-hieu', kind: 'journal' },
    ],
    references: [
      'European Union Deforestation Regulation (EUDR) — Coffee Polygon Traceability Framework',
      'ROAR COFFEE® — Lot Documentation & COA Policy',
    ],
  },
  {
    code: 'B045',
    pillarId: '10',
    batch: 9,
    titleVi: 'Cà Phê Bền Vững: Nước, Đất, Khí Hậu Và Sinh Kế',
    titleEn: 'Sustainable Coffee: Water, Soil, Climate & Livelihoods',
    slug: 'ca-phe-ben-vung-nuoc-dat-khi-hau-va-sinh-ke',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Quản trị nguồn nước sơ chế, che bóng đa tầng và bảo vệ độ phì đất',
    searchIntentEn: 'Water recycling in washed processing, agroforestry shade, and soil regeneration',
    relatedCodes: ['B014', 'B043', 'B046'],
    nextCode: 'B046',
    relatedProductSlugs: ['roasted-beans-robusta-s18-cbu', 'arabica-selection'],
    recommendationReasonVi:
      'Chế biến ướt hiện đại tại các trạm đối tác giảm lượng nước tiêu thụ nhờ công nghệ tuần hoàn lọc sinh học và tận dụng vỏ quả ủ phân hữu cơ.',
    recommendationReasonEn:
      'Modern CBU eco-pulpers cut fresh water usage sharply while turning cherry pulp into organic orchard compost.',
    actionTipsVi: [
      'Mô hình vườn xen canh (cà phê + tiêu Tây Nguyên + cây ăn trái/cây che bóng) vừa giữ ẩm đất mùa khô vừa ổn định thu nhập nông hộ.',
      'Vỏ thịt quả cà phê (cascara/pulp) khi được ủ phân vi sinh trả lại dinh dưỡng tự nhiên cho gốc cây.',
      'Khám phá thêm sản phẩm Tiêu Tây Nguyên trong hệ sinh thái vườn rừng cùng ROAR.',
    ],
    actionTipsEn: [
      'Agroforestry intercropping—pairing coffee with black pepper and shade trees—conserves soil moisture and diversifies farmer income.',
      'Composting fresh cherry pulp returns potassium and organic matter straight back to orchard soils.',
      'Explore ROAR’s Central Highlands Pepper line harvested from the same regenerative uplands.',
    ],
    quickLinks: [
      { labelVi: 'Tiêu Tây Nguyên trong Cửa hàng', labelEn: 'Highland Pepper Collection', to: '/coffee/pepper', kind: 'shop' },
      { labelVi: 'Biến đổi khí hậu (B046)', labelEn: 'Climate Change (B046)', to: '/journal/bien-doi-khi-hau-va-tuong-lai-vung-trong-ca-phe', kind: 'journal' },
    ],
    references: [
      'Global Coffee Platform (GCP) — Sustainability Progress Reports',
      'Rainforest Alliance / WASI — Shade & Intercropping Best Practices',
    ],
  },

  // Batch 10 (B046 - B050): Climate, Rising Vietnam Map, Markets, Future & ROAR Manifesto
  {
    code: 'B046',
    pillarId: '10',
    batch: 10,
    titleVi: 'Biến Đổi Khí Hậu Và Tương Lai Vùng Trồng Cà Phê',
    titleEn: 'Climate Change & the Future of Coffee-Growing Regions',
    slug: 'bien-doi-khi-hau-va-tuong-lai-vung-trong-ca-phe',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Thách thức nhiệt độ tăng, dịch chuyển đai cao và nghiên cứu giống thích ứng',
    searchIntentEn: 'Rising upland temperatures, rainfall shifts, and cultivar resilience research',
    relatedCodes: ['B005', 'B015', 'B045'],
    nextCode: 'B047',
    relatedProductSlugs: ['roasted-beans-robusta-s18-cbu', 'roasted-beans-arabica-s18'],
    recommendationReasonVi:
      'Khả năng chống chịu nhiệt tốt hơn của Robusta và công tác chọn tạo giống mới đang đóng vai trò chiến lược bảo đảm nguồn cung cà phê tương lai.',
    recommendationReasonEn:
      'Robusta’s natural heat resilience and modern breeding trials play a pivotal role in climate-ready global coffee supply.',
    actionTipsVi: [
      'Biến đổi khí hậu làm mùa mưa đến thất thường, dễ gây ra hiện tượng ra hoa nhiều đợt trên cùng một cành.',
      'Giải pháp sống còn: giữ tán cây che bóng, tưới tiết kiệm nhỏ giọt và đầu tư vào Fine Robusta cùng các giống Arabica lai chọn lọc.',
      'Đọc tiếp B047 để thấy bức tranh đổi mới tại các vùng trồng mới nổi của Việt Nam.',
    ],
    actionTipsEn: [
      'Erratic seasonal rains trigger asynchronous flowering, making selective ripe harvesting harder.',
      'Key resilience tools include shade canopies, drip irrigation, clonal Fine Robusta, and drought-tolerant cultivars.',
      'Read B047 next to see how Vietnam’s emerging regions are adapting.',
    ],
    quickLinks: [
      { labelVi: 'Đọc Vai trò Fine Robusta (B015)', labelEn: 'Fine Robusta Standards (B015)', to: '/journal/robusta-tr4-tr9-va-arabica-catimor-bourbon-viet-nam', kind: 'journal' },
      { labelVi: 'Bản đồ vùng trồng Việt Nam', labelEn: 'Vietnam Origins Map', to: '/origins', kind: 'origin' },
    ],
    references: [
      'World Coffee Research — Climate Resilience & Breeding Programs',
      'Davis et al. (Kew) — Climate Change Impacts on Genus Coffea',
    ],
  },
  {
    code: 'B047',
    pillarId: '10',
    batch: 10,
    titleVi: 'Robusta Việt Nam & Tiểu Vùng Sơn La, Điện Biên, Măng Đen Trên Bản Đồ Mới',
    titleEn: 'Vietnam’s Rising Coffee Landscape: Fine Robusta & Northern Arabica',
    slug: 'arabica-tay-bac-son-la-dien-bien-va-mang-den',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Sự chuyển dịch sang nâng cao chất lượng và định vị vùng trồng mới tại Việt Nam',
    searchIntentEn: 'How northern Arabica and highland Robusta elevation shape Vietnam’s quality narrative',
    relatedCodes: ['B011', 'B012', 'B015', 'B049'],
    nextCode: 'B048',
    relatedProductSlugs: ['arabica-selection', 'roasted-beans-robusta-s18-cbu'],
    recommendationReasonVi:
      'Cùng với Cầu Đất và Buôn Ma Thuột, các tiểu vùng Sơn La, Điện Biên và Măng Đen đang mở rộng bảng hương cà phê Việt chất lượng cao.',
    recommendationReasonEn:
      'Alongside Cầu Đất and Đắk Lắk, micro-regions like Sơn La, Điện Biên, and Măng Đen expand Vietnam’s quality horizon.',
    actionTipsVi: [
      'Thử chú ý vị ngọt đường mía và mắc-ca đặc trưng của Arabica Sơn La khi so sánh với vị hoa cam của Cầu Đất.',
      'Măng Đen (Kon Tum) với độ cao 1.200m là điểm sáng mới của Bắc Tây Nguyên cho các mẻ rang thử nghiệm.',
      'Đọc tiếp B048 để hiểu tác động kinh tế khi chuyển dịch từ hàng hóa thô sang thương hiệu.',
    ],
    actionTipsEn: [
      'Contrast Sơn La Arabica’s cane-sugar and toasted macadamia profile against Cầu Đất’s bright jasmine acidity.',
      'Watch Măng Đen (1,200m, Kon Tum) as an emerging micro-lot origin in northern Central Highlands.',
      'Continue to B048 to explore the economics of quality vs. commodity trading.',
    ],
    quickLinks: [
      { labelVi: 'Xem tọa độ Sơn La & Măng Đen', labelEn: 'Northern Origins Map', to: '/origins', kind: 'origin' },
      { labelVi: 'Arabica Selection', labelEn: 'Arabica Selection', to: '/product/arabica-selection', kind: 'product' },
    ],
    references: [
      'VICOFA — Northern & Highland Specialty Coffee Initiatives',
      'ROAR Origins Research — Micro-Region Cupping Notes',
    ],
  },
  {
    code: 'B048',
    pillarId: '10',
    batch: 10,
    titleVi: 'Thị Trường Cà Phê: Từ Giá Hàng Hóa Đến Giá Trị Thương Hiệu',
    titleEn: 'Coffee Markets: From Commodity Pricing to Brand Value',
    slug: 'thi-truong-ca-phe-tu-gia-hang-hoa-den-gia-tri-thuong-hieu',
    canonicalCategory: 'Coffee knowledge',
    role: 'supporting',
    searchIntentVi: 'Chênh lệch giữa cà phê hàng hóa (C-price/Robusta futures) và cà phê tạo giá trị gia tăng',
    searchIntentEn: 'Moving beyond commodity price volatility through quality grading and origin identity',
    relatedCodes: ['B043', 'B047', 'B049'],
    nextCode: 'B049',
    relatedProductSlugs: ['signature-reserve', 'roar-espresso-gold', 'green-ro-s18-cbu'],
    recommendationReasonVi:
      'Minh bạch hóa tiêu chuẩn sàng S18, sơ chế CBU/Honey và đầu tư trải nghiệm thương hiệu giúp ROAR thoát khỏi cuộc đua giảm giá thô.',
    recommendationReasonEn:
      'Transparent S18 grading, CBU/Honey craft, and authentic brand identity lift value beyond raw commodity swings.',
    actionTipsVi: [
      'Giá sàn London (Robusta) và New York (Arabica C-price) phản ánh cung-cầu hàng hóa thô, nhưng cà phê chất lượng cao được định giá bằng hợp đồng trực tiếp theo phẩm chất.',
      'Một túi cà phê giá hợp lý nhưng hái chín & rang mộc mới mang lại giá trị sức khỏe và vị giác vượt trội.',
      'Đọc tiếp B049 về tương lai công nghệ và bản sắc của cà phê Việt.',
    ],
    actionTipsEn: [
      'London Robusta and NY C-market futures track commodity contracts, whereas quality-differentiated lots earn direct quality premiums.',
      'True cup value comes from ripe picking, clean milling, and fresh pure roasting rather than artificial price wars.',
      'Continue to B049 to examine Vietnam’s technology and brand trajectory.',
    ],
    quickLinks: [
      { labelVi: 'Cấu trúc giá sỉ 5 nấc ROAR', labelEn: '5-Tier Transparent Pricing', to: '/coffee/roasted-beans', kind: 'shop' },
      { labelVi: 'Signature Reserve', labelEn: 'Signature Reserve', to: '/product/signature-reserve', kind: 'product' },
    ],
    references: [
      'International Coffee Organization (ICO) — Monthly Market Reports',
      'Specialty Coffee Association — Price Crisis & Value Distribution Papers',
    ],
  },
  {
    code: 'B049',
    pillarId: '10',
    batch: 10,
    titleVi: 'Tương Lai Cà Phê Việt Nam: Chất Lượng, Công Nghệ Và Bản Sắc',
    titleEn: 'The Future of Vietnamese Coffee: Quality, Technology & Identity',
    slug: 'tuong-lai-ca-phe-viet-nam-chat-luong-cong-nghe-va-ban-sac',
    canonicalCategory: 'Coffee origins',
    role: 'supporting',
    searchIntentVi: 'Động lực công nghệ rang – sơ chế và bản sắc thương hiệu Việt trên trường quốc tế',
    searchIntentEn: 'Precision processing, data-backed traceability, and distinctive Vietnamese coffee branding',
    relatedCodes: ['B044', 'B047', 'B050'],
    nextCode: 'B050',
    relatedProductSlugs: ['signature-reserve', 'roar-espresso-gold', 'instant-gold-collection'],
    recommendationReasonVi:
      'Thế hệ thương hiệu Việt mới như ROAR COFFEE® kết hợp dữ liệu kiểm soát rang-sơ chế chính xác cùng ngôn ngữ thiết kế mang bản sắc riêng.',
    recommendationReasonEn:
      'Modern Vietnamese roasters like ROAR COFFEE® pair data-driven roast precision with unmistakable visual and cultural character.',
    actionTipsVi: [
      'Ba động lực tương lai: Số hóa dữ liệu đường nhiệt rang (Data Roasting), chuẩn hóa sơ chế CBU/Honey và sáng tạo trải nghiệm hòa tan – quà tặng cao cấp.',
      'Người tiêu dùng Việt chính là lực đẩy quan trọng nhất thúc đẩy các xưởng rang nâng chuẩn sạch và nguyên chất.',
      'Hoàn thành lộ trình với bài tuyên ngôn B050 ngay bên dưới.',
    ],
    actionTipsEn: [
      'Three future engines: telemetry-backed roast profiles, standardized CBU/Honey mills, and elevated instant & gift experiences.',
      'Informed domestic drinkers are the strongest catalyst pushing local roasteries toward purity and transparency.',
      'Finish the 50-article curriculum with the B050 manifesto.',
    ],
    quickLinks: [
      { labelVi: 'Đọc Tuyên ngôn B050', labelEn: 'Read B050 Manifesto', to: '/journal/roar-coffee-khoi-ban-linh-dam-chat-rieng', kind: 'journal' },
      { labelVi: 'Bộ sưu tập Quà tặng & Hòa tan', labelEn: 'Instant & Reserve Gifts', to: '/shop', kind: 'shop' },
    ],
    references: [
      'VICOFA & Ministry of Agriculture — Vietnam Coffee Quality Strategy 2030',
      'ROAR Editorial — Vision & Craftsmanship Notes',
    ],
  },
  {
    code: 'B050',
    pillarId: '10',
    batch: 10,
    titleVi: 'ROAR COFFEE: Khơi Bản Lĩnh, Đậm Chất Riêng',
    titleEn: 'ROAR Coffee: Igniting Courage, Defining Character',
    slug: 'roar-coffee-khoi-ban-linh-dam-chat-rieng',
    canonicalCategory: 'Coffee knowledge',
    role: 'manifesto',
    searchIntentVi: 'Tuyên ngôn kết nối kiến thức B001–B049 với ba trụ cột Roots · Originality · Artistry',
    searchIntentEn: 'Synthesizing B001–B049 through Roots, Originality, and Artistry',
    relatedCodes: ['B001', 'B010', 'B030', 'B049'],
    relatedProductSlugs: ['signature-reserve', 'robusta-house-blend', 'arabica-selection', 'roar-espresso-gold'],
    recommendationReasonVi:
      'Từ cây cà phê Tây Nguyên đến tách cà phê trên tay bạn, mỗi dòng sản phẩm ROAR là kết tinh của Roots (Cội nguồn), Originality (Bản sắc) và Artistry (Nghệ thuật rang-pha).',
    recommendationReasonEn:
      'From highland soil to morning ritual, every ROAR roast unites Roots, Originality, and Artistry.',
    actionTipsVi: [
      'Roots: Bắt đầu mọi lựa chọn bằng việc tôn trọng vùng nguyên liệu Tây Nguyên – Lâm Đồng – Tây Bắc và công sức nông hộ.',
      'Originality: Trân trọng bản sắc riêng của Robusta, Culi và Arabica thay vì sao chép công thức rập khuôn.',
      'Artistry: Biến nghi thức pha chế mỗi sáng thành khoảnh khắc tĩnh tại và khơi dậy bản lĩnh của chính bạn.',
    ],
    actionTipsEn: [
      'Roots: Honor highland basalt soils, mountain terroirs, and smallholder stewardship in every harvest.',
      'Originality: Celebrate the distinct voice of Robusta, Culi, and Arabica rather than chasing generic trends.',
      'Artistry: Elevate your daily Phin, Espresso, or Pour-over ritual into a grounded moment of courage and clarity.',
    ],
    quickLinks: [
      { labelVi: 'Khám phá Cửa hàng ROAR', labelEn: 'Explore ROAR Storefront', to: '/shop', kind: 'shop' },
      { labelVi: '7 Cá tính ROAR COFFEE®', labelEn: '7 ROAR Personalities', to: '/personalities', kind: 'personality' },
      { labelVi: 'Quay lại B001 (Khởi nguồn)', labelEn: 'Restart at B001', to: '/journal/hanh-trinh-ca-phe-tu-ethiopia-den-viet-nam', kind: 'journal' },
    ],
    references: [
      'ROAR COFFEE® Brand Philosophy — Roots · Originality · Artistry (B001–B050)',
    ],
  },
];

export const FIND_YOUR_COFFEE_NEEDS: CoffeeNeedPreset[] = [
  {
    id: 'phin',
    labelVi: 'Pha Phin truyền thống',
    labelEn: 'Vietnamese Phin',
    descVi: 'Đậm sánh, hậu ngọt kéo dài, thơm sâu khi nhỏ giọt chậm.',
    descEn: 'Dense body and sweet finish calibrated for traditional gravity Phin.',
    productSlugs: ['roar-phin-heritage', 'roar-dam-bold', 'robusta-house-blend'],
    articleCodes: ['B023', 'B027'],
    shopCategory: 'roasted',
  },
  {
    id: 'black',
    labelVi: 'Cà phê đen nguyên chất',
    labelEn: 'Pure Black Coffee',
    descVi: 'Rang mộc 100% không tẩm bơ, vị rõ nét, sạch cổ họng.',
    descEn: '100% pure unflavored roast with clean body and crisp aroma.',
    productSlugs: ['robusta-house-blend', 'arabica-selection', 'roasted-beans-robusta-s18'],
    articleCodes: ['B029', 'B010'],
    shopCategory: 'roasted',
  },
  {
    id: 'milk',
    labelVi: 'Cà phê sữa đá',
    labelEn: 'Iced Milk Coffee',
    descVi: 'Cân bằng hoàn hảo giữa cốt cà phê đậm đà và sữa đặc.',
    descEn: 'Rich roasted intensity built to shine through ice and condensed milk.',
    productSlugs: ['roar-phin-heritage', 'roar-dam-bold', 'robusta-house-blend'],
    articleCodes: ['B023', 'B027', 'B041'],
    shopCategory: 'roasted',
  },
  {
    id: 'espresso',
    labelVi: 'Pha máy Espresso',
    labelEn: 'Espresso Machine',
    descVi: 'Chiết xuất áp suất 9 bar ổn định, crema hổ phách dày mịn.',
    descEn: 'Stable 9-bar extraction with dense amber crema and rounded sweetness.',
    productSlugs: ['roar-espresso', 'roar-espresso-gold', 'roasted-beans-robusta-s18-cbu'],
    articleCodes: ['B024', 'B019'],
    shopCategory: 'roasted',
  },
  {
    id: 'daily',
    labelVi: 'Uống hằng ngày',
    labelEn: 'Daily Ritual',
    descVi: 'Nhanh gọn nhưng vẫn giữ đúng gu Việt: phin, máy hoặc hòa tan.',
    descEn: 'Consistent, approachable blends and instant sticks for every morning.',
    productSlugs: ['robusta-house-blend', 'instant-silver-collection', 'instant-gold-collection'],
    articleCodes: ['B001', 'B025'],
    shopCategory: 'roasted',
  },
  {
    id: 'arabica',
    labelVi: 'Khám phá Arabica',
    labelEn: 'Explore Arabica',
    descVi: 'Hương hoa trái thanh tao vùng cao Cầu Đất 1.500m.',
    descEn: 'High-elevation floral clarity and citrus brightness from Cau Dat.',
    productSlugs: ['arabica-selection', 'roasted-beans-arabica-s18', 'roasted-beans-arabica-s18-cbu'],
    articleCodes: ['B003', 'B005', 'B012'],
    shopCategory: 'roasted_beans',
  },
  {
    id: 'robusta',
    labelVi: 'Khám phá Robusta',
    labelEn: 'Explore Robusta',
    descVi: 'Robusta S18 chế biến ướt CBU & Honey nâng tầm sạch vị.',
    descEn: 'Screen 18 Robusta refined through CBU Washed and Honey processing.',
    productSlugs: ['roasted-beans-robusta-s18', 'roasted-beans-robusta-s18-cbu', 'roasted-beans-robusta-s18-honey'],
    articleCodes: ['B003', 'B007', 'B015'],
    shopCategory: 'roasted_beans',
  },
  {
    id: 'culi',
    labelVi: 'Trải nghiệm Culi',
    labelEn: 'Discover Culi (Peaberry)',
    descVi: 'Hạt tròn đơn nhân cô đọng, đậm sâu cho người thích chất mạnh.',
    descEn: 'Dense single-seed peaberry beans with concentrated cocoa aromatics.',
    productSlugs: ['roasted-beans-culi-s18', 'signature-reserve'],
    articleCodes: ['B008', 'B039'],
    shopCategory: 'roasted_beans',
  },
  {
    id: 'blend',
    labelVi: 'Phối trộn Signature',
    labelEn: 'Signature Blend',
    descVi: '60% Robusta · 20% Culi · 20% Arabica CBU chuẩn mực quà tặng.',
    descEn: '60% Robusta · 20% Culi · 20% Washed Arabica crafted for balanced depth.',
    productSlugs: ['signature-reserve', 'roar-espresso-gold'],
    articleCodes: ['B010', 'B022', 'B030'],
    shopCategory: 'roasted',
  },
  {
    id: 'cafe',
    labelVi: 'Mua hạt cho quán',
    labelEn: 'For Cafés & HORECA',
    descVi: 'Hạt rang S18 đồng đều trống rang, giá 5 mức theo sản lượng kg.',
    descEn: 'Uniform Screen 18 roasted beans with transparent 5-tier kg pricing.',
    productSlugs: ['roasted-beans-robusta-s18-cbu', 'roasted-beans-arabica-s18', 'roar-espresso-gold'],
    articleCodes: ['B019', 'B042'],
    shopCategory: 'roasted_beans',
  },
  {
    id: 'bulk',
    labelVi: 'Nguyên liệu & Số lượng lớn',
    labelEn: 'Bulk & Green B2B',
    descVi: '27 cấu hình nhân xanh S14/S16/S18 (NAT/HON/CBU) & hạt rang ≥100kg.',
    descEn: '27-SKU export green coffee matrix and wholesale roasted kg lots.',
    productSlugs: ['roasted-beans-robusta-s18', 'roasted-beans-robusta-s18-cbu', 'green-ro-s18-cbu'],
    articleCodes: ['B008', 'B033', 'B044'],
    shopCategory: 'green_bean',
  },
];

export function getNodeBySlug(slug?: string): JournalNodeMeta | undefined {
  if (!slug) return undefined;
  return JOURNAL_CURRICULUM_B001_B050.find((n) => n.slug === slug);
}

export function getNodeByCode(code?: string): JournalNodeMeta | undefined {
  if (!code) return undefined;
  return JOURNAL_CURRICULUM_B001_B050.find((n) => n.code === code);
}

export function getArticlesForProduct<T extends { slug: string; category: string }>(
  product: Pick<Product, 'slug' | 'sku' | 'category' | 'coffee_type' | 'processing_method' | 'brewing_methods'>,
  allArticles: T[]
): Array<T & { nodeMeta?: JournalNodeMeta }> {
  if (!allArticles.length) return [];

  const matchedNodes: JournalNodeMeta[] = [];
  for (const node of JOURNAL_CURRICULUM_B001_B050) {
    if (!node.slug) continue;
    if (node.relatedProductSlugs.includes(product.slug)) {
      matchedNodes.push(node);
    }
  }

  // Fallback trait matching for products like green_bean / instant / pepper / new ground lines
  if (matchedNodes.length < 2) {
    const slugLower = product.slug.toLowerCase();
    const typeLower = String(product.coffee_type || '').toLowerCase();
    const procLower = String(product.processing_method || '').toLowerCase();
    const brewJoined = (product.brewing_methods || []).join(' ').toLowerCase();

    const addIfSlugPublished = (code: string) => {
      const node = getNodeByCode(code);
      if (node?.slug && !matchedNodes.some((m) => m.code === node.code)) {
        matchedNodes.push(node);
      }
    };

    if (procLower.includes('cbu') || procLower.includes('washed') || procLower.includes('honey') || procLower.includes('nat')) {
      addIfSlugPublished('B007');
      addIfSlugPublished('B031');
    }
    if (typeLower.includes('culi') || slugLower.includes('culi') || slugLower.includes('cu-')) {
      addIfSlugPublished('B039');
      addIfSlugPublished('B008');
    }
    if (typeLower.includes('arabica') || slugLower.includes('arabica') || slugLower.includes('ar-')) {
      addIfSlugPublished('B003');
      addIfSlugPublished('B005');
      addIfSlugPublished('B012');
    }
    if (typeLower.includes('robusta') || slugLower.includes('robusta') || slugLower.includes('ro-')) {
      addIfSlugPublished('B003');
      addIfSlugPublished('B011');
      addIfSlugPublished('B015');
    }
    if (brewJoined.includes('phin')) {
      addIfSlugPublished('B023');
      addIfSlugPublished('B027');
    }
    if (brewJoined.includes('espresso')) {
      addIfSlugPublished('B024');
    }
    if (product.category === 'green_bean') {
      addIfSlugPublished('B016');
      addIfSlugPublished('B017');
      addIfSlugPublished('B033');
      addIfSlugPublished('B044');
    }
    if (product.category === 'pepper') {
      addIfSlugPublished('B045');
      addIfSlugPublished('B011');
    }
    addIfSlugPublished('B010');
    addIfSlugPublished('B029');
  }

  const resolved: Array<T & { nodeMeta?: JournalNodeMeta }> = [];
  for (const node of matchedNodes) {
    const found = allArticles.find((a) => a.slug === node.slug);
    if (found && !resolved.some((r) => r.slug === found.slug)) {
      resolved.push({ ...found, nodeMeta: node });
    }
    if (resolved.length >= 4) break;
  }

  return resolved;
}
