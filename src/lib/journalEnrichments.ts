import type { JournalFlowchartSpec } from '../components/JournalFlowchart';
import type { JournalChartType, JournalNodeMeta } from './journalEcosystem';

export interface JournalFigure {
  imageKey: string;
  captionVi: string;
  captionEn: string;
}

export interface JournalEvidenceItem {
  source: string;
  standardOrYear: string;
  findingVi: string;
  findingEn: string;
}

export interface ArticleEnrichment {
  chartType: JournalChartType;
  visualFigures: JournalFigure[];
  flowchart: JournalFlowchartSpec;
  evidenceItems: JournalEvidenceItem[];
}

interface NodeOverride {
  chartType?: JournalChartType;
  visualFigures?: JournalFigure[];
  flowchart?: JournalFlowchartSpec;
  evidenceItems?: JournalEvidenceItem[];
}

const CHART_BY_CODE: Record<string, JournalChartType> = {
  B001: 'coffee_history_timeline',
  B002: 'coffee_botany_anatomy',
  B003: 'species_comparison',
  B004: 'global_coffee_belt',
  B005: 'altitude_variety_matrix',
  B006: 'cherry_development_cycle',
  B007: 'processing_methods_diagram',
  B008: 'screen_size_mm_chart',
  B009: 'roast_thermal_curve',
  B010: 'sensory_cupping_wheel',
  B011: 'vietnam_terroir_elevation',
  B012: 'vietnam_terroir_elevation',
  B013: 'cherry_development_cycle',
  B014: 'vietnam_terroir_elevation',
  B015: 'species_comparison',
  B016: 'screen_size_mm_chart',
  B017: 'moisture_aw_stability',
  B018: 'sensory_cupping_wheel',
  B019: 'roast_thermal_curve',
  B020: 'roast_degree_spectrum',
  B021: 'degassing_co2_curve',
  B022: 'sensory_cupping_wheel',
  B023: 'extraction_balance',
  B024: 'extraction_balance',
  B025: 'extraction_balance',
  B026: 'caffeine_safety_curve',
  B027: 'extraction_balance',
  B028: 'sensory_cupping_wheel',
  B029: 'roast_degree_spectrum',
  B030: 'sensory_cupping_wheel',
  B031: 'processing_methods_diagram',
  B032: 'processing_methods_diagram',
  B033: 'moisture_aw_stability',
  B034: 'moisture_aw_stability',
  B035: 'roast_thermal_curve',
  B036: 'roast_degree_spectrum',
  B037: 'species_comparison',
  B038: 'screen_size_mm_chart',
  B039: 'particle_grind_spectrum',
  B040: 'water_mineral_balance',
  B041: 'caffeine_safety_curve',
  B042: 'extraction_balance',
  B043: 'vietnam_terroir_elevation',
  B044: 'moisture_aw_stability',
  B045: 'altitude_variety_matrix',
  B046: 'global_coffee_belt',
  B047: 'vietnam_terroir_elevation',
  B048: 'global_coffee_belt',
  B049: 'roast_thermal_curve',
  B050: 'coffee_history_timeline',
};

const FIGURE_POOLS_BY_PILLAR: Record<string, JournalFigure[]> = {
  '01': [
    {
      imageKey: 'journal_coffee_botany',
      captionVi: 'Hoa cà phê trắng muốt và quả chín đỏ trên cành — điểm khởi đầu của chất lượng hạt.',
      captionEn: 'Blossom clusters and ripe red coffee cherries on the branch—where bean density begins.',
    },
    {
      imageKey: 'origin_central_highlands',
      captionVi: 'Đồi cà phê đất đỏ bazan Tây Nguyên đón nắng gió mùa cao nguyên.',
      captionEn: 'Central Highlands red basalt coffee slopes shaped by tropical monsoon cycles.',
    },
    {
      imageKey: 'journal_coffee_processes',
      captionVi: 'Đối chiếu quy trình phơi giàn Natural, Honey và Chế biến ướt CBU.',
      captionEn: 'Post-harvest comparison across Natural, Honey, and CBU Washed drying beds.',
    },
    {
      imageKey: 'journal_defect_sorting',
      captionVi: 'Phân loại cỡ sàng S14–S18 kết hợp sàng lọc nhân xanh sạch lỗi.',
      captionEn: 'Screen S14–S18 grading paired with green bean defect inspection.',
    },
    {
      imageKey: 'product_roasting_drum_clean',
      captionVi: 'Hạt cà phê rang mộc tươi mới đảo nguội trong khay thép không gỉ.',
      captionEn: 'Freshly roasted 100% pure beans cooling in the stainless perforated tray.',
    },
  ],
  '02': [
    {
      imageKey: 'origin_central_highlands',
      captionVi: 'Cao nguyên bazan Đắk Lắk – Đắk Nông: nền tảng cho Robusta đậm hậu ngọt.',
      captionEn: 'Volcanic basalt plateaus of Đắk Lắk and Đắk Nông nourishing dense Robusta.',
    },
    {
      imageKey: 'journal_caudat_arabica',
      captionVi: 'Sườn núi sương mù Cầu Đất (1.500m) nuôi dưỡng hương hoa và chua thanh Arabica.',
      captionEn: 'Cool mountain mist across Cầu Đất (1,500m) shaping crisp floral Arabica.',
    },
    {
      imageKey: 'hero_highland_harvest_banner',
      captionVi: 'Thu hái chọn lọc quả chín đỏ theo nhiều đợt trong mùa khô Tây Nguyên.',
      captionEn: 'Multi-pass selective red-cherry harvesting across the dry highland season.',
    },
    {
      imageKey: 'journal_coffee_botany',
      captionVi: 'Quả cà phê tích lũy đường tự nhiên tối đa khi chuyển đỏ sẫm đồng đều.',
      captionEn: 'Natural cherry sugars peak at full uniform crimson ripeness prior to harvest.',
    },
    {
      imageKey: 'journal_sustainable_farm',
      captionVi: 'Mô hình vườn xen canh cây che bóng giữ ẩm đất và bảo vệ sinh kế nông hộ.',
      captionEn: 'Shade-canopy agroforestry conserving soil moisture and farmer resilience.',
    },
  ],
  '03': [
    {
      imageKey: 'journal_defect_sorting',
      captionVi: 'Kiểm tra cỡ sàng chuẩn ISO 4150 và đo ẩm điện tử mẫu 350g nhân xanh.',
      captionEn: 'ISO 4150 screen analysis and electronic moisture checks on 350g green samples.',
    },
    {
      imageKey: 'product_green_coffee_beans',
      captionVi: 'So sánh trực quan nhân xanh Robusta, Culi và Arabica sau bắn màu sạch lỗi.',
      captionEn: 'Color-sorted green coffee trays spanning Robusta, Culi, and Arabica grades.',
    },
    {
      imageKey: 'journal_cbu_washed',
      captionVi: 'Sơ chế ướt CBU loại bỏ tạp mùi đất, mở khóa tiêu chuẩn Fine Robusta sạch vị.',
      captionEn: 'Clean CBU wet processing eliminates harsh earthiness for Fine Robusta clarity.',
    },
    {
      imageKey: 'journal_cupping_lab',
      captionVi: 'Thử nếm mù (Blind Cupping) tại phòng Lab để đánh giá khách quan từng lô.',
      captionEn: 'Standardized blind cupping flight evaluating cleanliness, sweetness, and balance.',
    },
    {
      imageKey: 'journal_s18_roastery',
      captionVi: 'Hạt rang chuẩn sàng S18 cho độ truyền nhiệt đồng đều trong trống rang.',
      captionEn: 'Screen 18 roasted uniformity promoting even heat transfer inside the drum.',
    },
  ],
  '04': [
    {
      imageKey: 'product_roasting_drum_clean',
      captionVi: 'Kiểm soát phản ứng Maillard và First Crack trong mẻ rang nhỏ chuẩn xác.',
      captionEn: 'Precision small-batch drum roasting balancing Maillard browning and First Crack.',
    },
    {
      imageKey: 'journal_s18_roastery',
      captionVi: 'Đánh giá màu hạt đồng nhất và cấu trúc xốp sau khi ra lò.',
      captionEn: 'Checking roast-color uniformity and porous cell expansion post-drop.',
    },
    {
      imageKey: 'journal_tasting_archetypes',
      captionVi: 'Ba sắc thái rang từ Light đến Medium và Dark phục vụ đa dạng gu pha.',
      captionEn: 'Three roast expressions spanning bright Light, balanced Medium, and bold Dark.',
    },
    {
      imageKey: 'hero_signature_reserve_banner',
      captionVi: 'Nghệ thuật phối trộn đa tầng giữa Robusta, Culi và Arabica CBU.',
      captionEn: 'Multi-layered blend architecture harmonizing Robusta, Culi, and CBU Arabica.',
    },
    {
      imageKey: 'journal_cupping_lab',
      captionVi: 'Thử nếm đối chứng từng mẻ sau degassing để khóa chuẩn hương vị.',
      captionEn: 'Post-degassing reference cupping confirming batch-to-batch repeatability.',
    },
  ],
  '05': [
    {
      imageKey: 'journal_phin_ritual',
      captionVi: 'Nghi thức nhỏ giọt Phin Việt Nam: ủ bloom 30 giây và trích ly cô đọng.',
      captionEn: 'Vietnamese Phin gravity ritual: 30-second bloom into dense syrupy drops.',
    },
    {
      imageKey: 'journal_phin_espresso',
      captionVi: 'Đặt cạnh nhau hai trường phái: Phin truyền thống và Espresso áp suất 9 bar.',
      captionEn: 'Side-by-side extraction craft: slow gravity Phin vs. 9-bar pressurized Espresso.',
    },
    {
      imageKey: 'journal_water_chemistry',
      captionVi: 'Kiểm soát dòng rót và nhiệt độ nước giữ cân bằng chua thanh – ngọt hậu.',
      captionEn: 'Calibrated pour rate and water chemistry preserving clean acidity and sweetness.',
    },
    {
      imageKey: 'product_brewing_ritual',
      captionVi: 'Cân định lượng chính xác bột, nước và thời gian tiếp xúc ở mọi dụng cụ.',
      captionEn: 'Measuring dry dose, water mass, and contact time across daily brewers.',
    },
    {
      imageKey: 'journal_coldbrew_gifting',
      captionVi: 'Chiết xuất lạnh 16 giờ giúp ly cà phê êm dịu, giữ trọn hương thơm hoa trái.',
      captionEn: '16-hour cold extraction yielding low-acidity sweetness and crisp aromatics.',
    },
  ],
  '06': [
    {
      imageKey: 'journal_phin_ritual',
      captionVi: 'Ly Cà phê Sữa Đá: sự hòa quyện kinh điển giữa cốt Phin đậm và sữa đặc.',
      captionEn: 'Iconic Cà Phê Sữa Đá uniting dense Phin roast with sweetened condensed milk.',
    },
    {
      imageKey: 'journal_tasting_archetypes',
      captionVi: 'Thực hành gọi tên 4 tầng cảm quan: Hương, Vị, Thể chất và Hậu vị.',
      captionEn: 'Daily four-step sensory calibration across aroma, taste, body, and finish.',
    },
    {
      imageKey: 'journal_cupping_lab',
      captionVi: 'Kiểm chứng cà phê rang mộc 100% qua độ bloom mịn và màu nâu hổ phách.',
      captionEn: 'Verifying 100% pure unflavored coffee via clean CO2 bloom and chestnut clarity.',
    },
    {
      imageKey: 'hero_signature_reserve_banner',
      captionVi: '7 Cá tính ROAR COFFEE® kết nối biểu tượng linh thú với hồ sơ rang thực tế.',
      captionEn: 'Seven ROAR Wildlife Archetypes mapped to calibrated roast curves.',
    },
    {
      imageKey: 'mascot_panther',
      captionVi: 'Biểu tượng Báo Đen Signature Reserve — Bản lĩnh và chiều sâu đa tầng.',
      captionEn: 'Black Panther crest for Signature Reserve—composure and layered complexity.',
    },
  ],
  '07': [
    {
      imageKey: 'journal_cbu_washed',
      captionVi: 'Bể rửa tuyển nổi và kiểm soát pH trong 24 giờ vàng chế biến ướt CBU.',
      captionEn: 'Floatation sorting and pH-tracked fermentation during the 24-hour CBU window.',
    },
    {
      imageKey: 'journal_coffee_processes',
      captionVi: 'Ba phương pháp sơ chế Natural, Honey và CBU tạo ba bản sắc vị giác riêng.',
      captionEn: 'Natural, Honey, and CBU Washed drying beds shaping distinct flavor curves.',
    },
    {
      imageKey: 'journal_defect_sorting',
      captionVi: 'Theo dõi độ ẩm 10.5–12.0% và hoạt độ nước Aw < 0.60 trước khi nhập kho.',
      captionEn: 'Verifying 10.5–12.0% green moisture and Aw < 0.60 prior to warehouse intake.',
    },
    {
      imageKey: 'product_green_coffee_beans',
      captionVi: 'Ma trận 27 mã nhân xanh B2B phân tách rõ loài, cỡ sàng và quy chuẩn sơ chế.',
      captionEn: '27-SKU green coffee matrix coded transparently by species, screen, and process.',
    },
    {
      imageKey: 'hero_highland_harvest_banner',
      captionVi: 'Phơi chậm trên giàn lưới giúp hạt thóc thoát ẩm đồng đều từ lõi ra vỏ.',
      captionEn: 'Thin-layer raised-bed solar drying stabilizes moisture evenly from bean core outward.',
    },
  ],
  '08': [
    {
      imageKey: 'product_roasting_drum_clean',
      captionVi: 'Ma trận điều chỉnh nhiệt nạp trống và RoR theo mật độ từng giống hạt.',
      captionEn: 'Adjusting charge temperature and Rate of Rise to bean density and sugar load.',
    },
    {
      imageKey: 'journal_s18_roastery',
      captionVi: 'Kiểm định QC sau rang bằng tỷ lệ hao hụt trọng lượng và chỉ số màu Agtron.',
      captionEn: 'Post-roast QC logging weight loss percentage and whole-vs-ground Agtron spread.',
    },
    {
      imageKey: 'hero_signature_reserve_banner',
      captionVi: 'Phối trộn khoa học Robusta S18, Culi và Arabica CBU cho độ crema bền bỉ.',
      captionEn: 'Scientific Robusta-Culi-Arabica blending engineered for syrupy espresso crema.',
    },
    {
      imageKey: 'product_signature_reserve',
      captionVi: 'Cấu trúc danh mục sản phẩm rõ ràng từ hạt rang quán đến hộp quà cao cấp.',
      captionEn: 'Structured catalog architecture spanning café S18 lots to Reserve gifting.',
    },
    {
      imageKey: 'instant_gold_chill',
      captionVi: 'Dòng Hòa tan Gold & 3in1 mở rộng trải nghiệm ROAR tiện lợi trong 15 giây.',
      captionEn: 'Soluble Gold & 3in1 collections delivering fast daily consistency.',
    },
  ],
  '09': [
    {
      imageKey: 'journal_culi_peaberry',
      captionVi: 'Hạt Culi tròn đơn nhân có mật độ nén cao, đòi hỏi đĩa xay sắc chuẩn xác.',
      captionEn: 'Dense spherical Culi peaberries reward precision burr grind calibration.',
    },
    {
      imageKey: 'journal_water_chemistry',
      captionVi: 'Nước pha chiếm 98.5% tách Pour-over — cân bằng Mg²⁺, Ca²⁺ và kiềm đệm.',
      captionEn: 'Water makes up 98.5% of filter coffee—balancing Magnesium, Calcium, and buffer.',
    },
    {
      imageKey: 'journal_phin_espresso',
      captionVi: 'Chuẩn hóa quy trình quầy bar (SOP) cho cả Phin truyền thống và Espresso.',
      captionEn: 'Standardized café bar SOPs uniting gravity Phin and 9-bar Espresso stations.',
    },
    {
      imageKey: 'instant_salted_coffee_chill',
      captionVi: 'Tương tác vị mặn nhẹ, protein sữa và cốt rang đậm trong thức uống pha sữa.',
      captionEn: 'Balancing dairy casein, gentle sea salt, and concentrated roast structure.',
    },
    {
      imageKey: 'product_brewing_ritual',
      captionVi: 'Hiệu chỉnh cỡ xay theo độ ẩm không khí đầu ca sáng và đầu ca trưa.',
      captionEn: 'Dialing burr spacing between humid mornings and dry afternoon café shifts.',
    },
  ],
  '10': [
    {
      imageKey: 'journal_sustainable_farm',
      captionVi: 'Vườn rừng xen canh cà phê – hồ tiêu Tây Nguyên bảo vệ độ ẩm và đất đai.',
      captionEn: 'Coffee-and-pepper agroforestry canopies sheltering red basalt moisture.',
    },
    {
      imageKey: 'origin_central_highlands',
      captionVi: 'Liên kết vùng trồng Tây Nguyên – Cầu Đất – Tây Bắc trong chuỗi giá trị minh bạch.',
      captionEn: 'Connecting Đắk Lắk, Cầu Đất, and northern mountains into a transparent value chain.',
    },
    {
      imageKey: 'journal_caudat_arabica',
      captionVi: 'Các tiểu vùng cao như Cầu Đất, Sơn La, Măng Đen định vị bản đồ chất lượng mới.',
      captionEn: 'Cool highland micro-regions redefining Vietnam’s quality coffee map.',
    },
    {
      imageKey: 'product_green_coffee_beans',
      captionVi: 'Hồ sơ truy xuất nguồn gốc, cỡ sàng và COA minh bạch cho từng lô hàng.',
      captionEn: 'Lot-level traceability and COA documentation guarding origin integrity.',
    },
    {
      imageKey: 'pepper_ground_black_jar',
      captionVi: 'Hồ tiêu Tây Nguyên đồng hành cùng cà phê trong hệ sinh thái nông lâm bền vững.',
      captionEn: 'Central Highlands black pepper harvested from shared regenerative orchards.',
    },
  ],
};

const NODE_OVERRIDES: Record<string, NodeOverride> = {
  B003: {
    visualFigures: [
      {
        imageKey: 'journal_coffee_botany',
        captionVi: 'Sự khác biệt sinh học giữa quả cà phê Arabica vùng cao và Robusta chịu nhiệt.',
        captionEn: 'Botanical contrast between highland Coffea arabica and heat-tolerant Robusta.',
      },
      {
        imageKey: 'product_arabica_selection',
        captionVi: 'Arabica Selection: hương hoa thanh thoát và độ chua trái cây sáng.',
        captionEn: 'Arabica Selection expressing floral aromatics and bright citrus acidity.',
      },
      {
        imageKey: 'product_robusta_house',
        captionVi: 'Robusta House Blend: thể chất dày sánh, sô-cô-la đen và hậu ngọt.',
        captionEn: 'Robusta House Blend delivering viscous dark-chocolate depth.',
      },
      {
        imageKey: 'journal_culi_peaberry',
        captionVi: 'Hạt Culi (Peaberry) — đột biến hình thái hạt đơn tròn xuất hiện ở cả hai loài.',
        captionEn: 'Culi (Peaberry)—a natural single-seed shape occurring in both species.',
      },
      {
        imageKey: 'hero_signature_reserve_banner',
        captionVi: 'Khi Robusta, Culi và Arabica CBU hội tụ trong công thức Signature Reserve.',
        captionEn: 'Robusta, Culi, and Washed Arabica harmonized inside Signature Reserve.',
      },
    ],
    evidenceItems: [
      {
        source: 'Royal Botanic Gardens, Kew (Davis et al.)',
        standardOrYear: 'Taxonomy Classification',
        findingVi: 'Xác nhận chi Coffea có hơn 120 loài, trong đó thương mại toàn cầu tập trung vào C. arabica (tứ bội 2n=44), C. canephora (lưỡng bội 2n=22) và C. liberica (bao gồm thứ var. dewevrei / Excelsa).',
        findingEn: 'Documents over 120 Coffea species globally, with commercial trade centered on allotetraploid C. arabica (2n=44), diploid C. canephora (2n=22), and C. liberica (including Excelsa).',
      },
      {
        source: 'World Coffee Research (WCR)',
        standardOrYear: 'Genetic & Chemistry Catalog',
        findingVi: 'Arabica thường chứa hàm lượng sucrose và axit hữu cơ cao hơn, trong khi Robusta sở hữu hàm lượng caffeine (~2.0–2.7%) và axit chlorogenic cao hơn gấp ~1.7–2 lần.',
        findingEn: 'Notes higher sucrose reserves in Arabica alongside roughly 1.7–2x higher caffeine (~2.0–2.7%) and chlorogenic acid density in Robusta.',
      },
    ],
  },
  B007: {
    visualFigures: [
      {
        imageKey: 'journal_cbu_washed',
        captionVi: 'Chế biến ướt CBU: tách vỏ thịt ngay trong ngày và lên men sạch lớp nhớt.',
        captionEn: 'CBU Washed process: same-day pulping and clean pH-controlled fermentation.',
      },
      {
        imageKey: 'hero_highland_harvest_banner',
        captionVi: 'Quả cà phê chín đỏ chuẩn bị bước vào tuyển nổi và phân loại sơ chế.',
        captionEn: 'Ripe crimson cherries entering density floatation before processing.',
      },
      {
        imageKey: 'product_green_coffee_beans',
        captionVi: 'Nhân xanh sau sơ chế Natural, Honey và CBU cho màu sắc và độ sạch khác nhau.',
        captionEn: 'Green coffee appearance differences across Natural, Honey, and CBU Washed.',
      },
      {
        imageKey: 'journal_s18_roastery',
        captionVi: 'Hạt CBU và Honey sạch vỏ phản ứng nhiệt đồng đều hơn khi rang.',
        captionEn: 'Clean CBU and Honey lots conduct heat more predictably inside the roaster.',
      },
      {
        imageKey: 'journal_cupping_lab',
        captionVi: 'Đánh giá độ sạch vị (Clean Cup) giữa ba phương pháp trên bàn cupping.',
        captionEn: 'Benchmarking Clean Cup clarity across Natural, Honey, and CBU lots.',
      },
    ],
  },
  B008: {
    evidenceItems: [
      {
        source: 'ISO 4150 / TCVN 4193',
        standardOrYear: 'Green Coffee Size Standard',
        findingVi: 'Quy chuẩn lỗ sàng tròn tính theo bội số 1/64 inch: Sàng 18 tương đương đường kính ~7.14mm, Sàng 16 là ~6.35mm và Sàng 14 là ~5.56mm.',
        findingEn: 'Defines round-hole aperture grading in 1/64-inch increments: Screen 18 (~7.14mm), Screen 16 (~6.35mm), and Screen 14 (~5.56mm).',
      },
      {
        source: 'International Trade Centre (ITC)',
        standardOrYear: 'Coffee Exporter’s Guide',
        findingVi: 'Cỡ sàng đồng đều giúp hạn chế hiện tượng hạt nhỏ cháy xém trước khi hạt lớn chín tâm trong cùng một mẻ rang.',
        findingEn: 'Uniform bean sizing prevents small seeds from scorching before larger seeds reach target core development.',
      },
    ],
  },
  B017: {
    evidenceItems: [
      {
        source: 'ISO 6673 & WCR Drying Guidelines',
        standardOrYear: 'Moisture & Water Activity',
        findingVi: 'Độ ẩm nhân xanh thương mại an toàn nằm trong khung 10.5% – 12.0% kèm hoạt độ nước Aw < 0.60 nhằm ngăn nấm mốc và bảo toàn hương thơm suốt 12 tháng.',
        findingEn: 'Establishes 10.5–12.0% moisture paired with water activity Aw < 0.60 as the stability threshold against mold growth and lipid oxidation.',
      },
      {
        source: 'USDA & Food Safety Standards',
        standardOrYear: 'Ochratoxin A Prevention',
        findingVi: 'Giữ Aw dưới 0.65 trong suốt quá trình phơi giàn và lưu kho là rào cản sinh học quan trọng nhất ngăn nấm mốc sinh độc tố.',
        findingEn: 'Maintaining water activity below 0.65 across drying beds and warehousing blocks mycotoxin-producing fungal growth.',
      },
    ],
  },
  B021: {
    evidenceItems: [
      {
        source: 'Smrke et al. — ZHAW Coffee Excellence Center',
        standardOrYear: 'Degassing Kinetics Research',
        findingVi: 'Hạt rang mới sinh ra áp suất khí CO2 đáng kể; khoảng 40–60% lượng khí tự do thoát ra trong 3–7 ngày đầu và giảm tiệm cận ổn định sau 10–14 ngày.',
        findingEn: 'Demonstrates that rapid early CO2 release stabilizes over days 7–14, preventing channeling during pressurized espresso extraction.',
      },
      {
        source: 'Specialty Coffee Association (SCA)',
        standardOrYear: 'Packaging Permeability Handbook',
        findingVi: 'Túi ghép nhôm/cản khí gắn van 1 chiều đẩy khí CO2 dư ra ngoài trong khi ngăn oxy xâm nhập gây ôi hóa dầu cà phê.',
        findingEn: 'One-way valve high-barrier pouches vent residual CO2 pressure while blocking oxygen ingress that triggers lipid staling.',
      },
    ],
  },
  B026: {
    evidenceItems: [
      {
        source: 'Fuller & Rao (Scientific Reports)',
        standardOrYear: 'Cold vs. Hot Extraction Chemistry',
        findingVi: 'Chiết xuất lạnh 4–8°C hòa tan ít axit hữu cơ có pKa thấp và các phân tử vị đắng nặng hơn so với pha nóng >90°C, tạo cảm giác dịu dạ dày hơn.',
        findingEn: 'Shows cold steeping extracts fewer titratable sour acids than hot brewing while preserving smooth soluble sweetness.',
      },
      {
        source: 'European Food Safety Authority (EFSA)',
        standardOrYear: 'Caffeine Safety Opinion',
        findingVi: 'Khuyến nghị ngưỡng an toàn chung cho người trưởng thành khỏe mạnh không vượt quá 400mg caffeine/ngày (khoảng 200mg/ngày đối với phụ nữ mang thai).',
        findingEn: 'Sets 400mg/day total caffeine as a safe daily upper guideline for healthy adults (200mg/day during pregnancy).',
      },
    ],
  },
  B040: {
    evidenceItems: [
      {
        source: 'Hendon & Colonna-Dashwood',
        standardOrYear: 'Water for Coffee (RSC Chemistry)',
        findingVi: 'Ion Magie (Mg²⁺) ái lực mạnh với các hợp chất hương trái cây – hoa giàu oxy, còn ion Canxi (Ca²⁺) nhấn mạnh độ sánh béo; kiềm đệm Bicarbonate quyết định độ sắc của vị chua.',
        findingEn: 'Documents how Mg²⁺ binds fruity oxygen-rich volatiles while Ca²⁺ enhances creamy mouthfeel and Bicarbonate buffers organic acidity.',
      },
      {
        source: 'Specialty Coffee Association (SCA)',
        standardOrYear: 'Water Quality Standard',
        findingVi: 'Khuyến nghị nước pha cà phê sạch mùi Clo, pH trung tính 6.5–7.5, TDS lý tưởng 75–150 ppm và độ kiềm tổng quanh ~40 ppm CaCO3.',
        findingEn: 'Recommends zero chlorine odor, neutral pH 6.5–7.5, target TDS around 75–150 ppm, and ~40 ppm alkalinity for balanced extraction.',
      },
    ],
  },
  B044: {
    evidenceItems: [
      {
        source: 'European Union (EUDR)',
        standardOrYear: 'Regulation (EU) 2023/1115',
        findingVi: 'Yêu cầu cà phê nhập khẩu vào thị trường châu Âu phải minh bạch tọa độ vùng trồng (geolocation polygons) và chứng minh không liên quan phá rừng sau mốc 31/12/2020.',
        findingEn: 'Mandates plot-level geolocation polygons and deforestation-free supply chain documentation for coffee entering EU markets.',
      },
      {
        source: 'ISO 10470 / TCVN 4193',
        standardOrYear: 'Lot Certificate of Analysis (COA)',
        findingVi: 'Hồ sơ COA lô nhân xanh chuẩn hóa thông số độ ẩm, tỷ trọng g/L, tỷ lệ sót sàng và phân loại lỗi trên mẫu đại diện 350g.',
        findingEn: 'Standardized COA records moisture %, bulk density (g/L), sieve retention, and primary/secondary defect counts per 350g sample.',
      },
    ],
  },
};

function buildDefaultFlowchart(node: JournalNodeMeta): JournalFlowchartSpec {
  const { code, pillarId } = node;

  if (pillarId === '01') {
    if (code === 'B007') {
      return {
        titleVi: 'Chuỗi quyết định sơ chế Natural · Honey · CBU Washed',
        titleEn: 'Post-Harvest Processing Decision Flow (Natural · Honey · CBU)',
        captionVi: 'Chất lượng tách cà phê sạch vị bắt đầu từ tốc độ xử lý quả chín ngay trong ngày thu hoạch.',
        captionEn: 'Clean-cup integrity depends on same-day sorting and moisture discipline.',
        steps: [
          {
            stepCode: '01',
            titleVi: 'Tuyển nổi tách quả lép',
            titleEn: 'Density Floatation',
            detailVi: 'Loại bỏ quả khô, lép, sâu bệnh; giữ 100% quả chín đỏ chìm đáy.',
            detailEn: 'Skim floaters and green twigs; retain dense ripe cherries.',
            targetMetric: '≥95% chín',
          },
          {
            stepCode: '02',
            titleVi: 'Chọn phương thức xử lý',
            titleEn: 'Select Process Path',
            detailVi: 'Phơi nguyên quả (Natural), giữ nhớt (Honey) hoặc xát sạch lên men (CBU).',
            detailEn: 'Dry whole cherry (Natural), keep mucilage (Honey), or depulp + wash (CBU).',
            targetMetric: 'pH 4.0–4.2',
          },
          {
            stepCode: '03',
            titleVi: 'Phơi giàn & Đảo đều',
            titleEn: 'Raised-Bed Drying',
            detailVi: 'Trải lớp mỏng 3–5cm trên giàn lưới thoáng khí, đảo mỗi 2–3 giờ.',
            detailEn: 'Spread 3–5cm thin layers on raised mesh, raking every 2–3 hours.',
            targetMetric: '10–21 ngày',
          },
          {
            stepCode: '04',
            titleVi: 'Khóa ẩm & Nghỉ thóc',
            titleEn: 'Stabilize & Rest',
            detailVi: 'Đưa ẩm về 10.5–12.0% và nghỉ thóc ổn định trước khi xát trắng.',
            detailEn: 'Lock moisture at 10.5–12.0% and rest parchment before hulling.',
            targetMetric: 'Aw < 0.60',
          },
        ],
      };
    }

    if (code === 'B008') {
      return {
        titleVi: 'Quy trình phân cấp Cỡ sàng & Sàng lọc nhân xanh',
        titleEn: 'Green Bean Screen Grading & Optical Sorting Flow',
        captionVi: 'Kích thước sàng (S14–S18) hỗ trợ truyền nhiệt đều nhưng luôn đi kèm bước bắn màu tách lỗi.',
        captionEn: 'Screen grading supports even roasting while color sorting eliminates cup defects.',
        steps: [
          {
            stepCode: '01',
            titleVi: 'Xát vỏ thóc & Đánh bóng',
            titleEn: 'Hulling & Cleaning',
            detailVi: 'Tách vỏ trấu khô, loại đá sạn, vỏ vỡ và bụi cám bằng quạt gió.',
            detailEn: 'Remove dry parchment and separate stones or chaff by air density.',
            targetMetric: '0 tạp chất',
          },
          {
            stepCode: '02',
            titleVi: 'Phân tầng trọng lực',
            titleEn: 'Gravity Table Split',
            detailVi: 'Tách riêng hạt tròn đơn nhân (Culi / Peaberry) và hạt lép nhẹ.',
            detailEn: 'Isolate dense spherical peaberries (Culi) and skim lightweight defects.',
            targetMetric: '5–10% Culi',
          },
          {
            stepCode: '03',
            titleVi: 'Chạy sàng tròn ISO 4150',
            titleEn: 'Round Sieve Grading',
            detailVi: 'Phân tách chuẩn S18 (~7.1mm), S16 (~6.3mm) và S14 (~5.5mm).',
            detailEn: 'Grade cleanly into S18 (~7.1mm), S16 (~6.3mm), and S14 (~5.5mm).',
            targetMetric: '±0.2mm',
          },
          {
            stepCode: '04',
            titleVi: 'Bắn màu quang học & Đóng bao',
            titleEn: 'Optical Color Sort',
            detailVi: 'Loại hạt đen, hạt mốc, sâu đục rồi niêm phong bao lót kín khí.',
            detailEn: 'Reject black, sour, or insect-damaged seeds before hermetic bagging.',
            targetMetric: '350g QC',
          },
        ],
      };
    }

    if (code === 'B009') {
      return {
        titleVi: '4 chặng biến đổi nhiệt trong trống rang cà phê',
        titleEn: 'Four Thermal Phases Inside the Roasting Drum',
        captionVi: 'Kiểm soát mượt Rate of Rise (RoR) giúp lõi và vỏ hạt chín đồng bộ không cháy cạnh.',
        captionEn: 'Smooth declining Rate of Rise (RoR) ensures even core development without scorching.',
        steps: [
          {
            stepCode: '01',
            titleVi: 'Sấy khô (Drying)',
            titleEn: 'Endothermic Drying',
            detailVi: 'Bay hơi ẩm 11% trong hạt nhân xanh từ nhiệt độ phòng lên ~150°C.',
            detailEn: 'Evaporate internal moisture cleanly while beans turn from green to straw.',
            targetMetric: '20°C → 150°C',
          },
          {
            stepCode: '02',
            titleVi: 'Phản ứng Maillard',
            titleEn: 'Maillard Browning',
            detailVi: 'Axit amin kết hợp đường tạo hương bánh mì nướng, hạt dẻ và cacao.',
            detailEn: 'Amino acids and sugars build nutty, caramel, and cacao precursors.',
            targetMetric: '150°C → 195°C',
          },
          {
            stepCode: '03',
            titleVi: 'First Crack (Nổ lần 1)',
            titleEn: 'First Crack Expansion',
            detailVi: 'Áp suất hơi nước bẻ gãy thành tế bào làm hạt nở gấp đôi thể tích.',
            detailEn: 'Steam pressure fractures cell walls, doubling roasted bean volume.',
            targetMetric: '~196°C',
          },
          {
            stepCode: '04',
            titleVi: 'Phát triển & Làm nguội',
            titleEn: 'Development & Cooling',
            detailVi: 'Giữ DTR 14–22% tùy gu rồi xả nhanh ra mâm hút gió < 4 phút.',
            detailEn: 'Hold 14–22% DTR for balance, then rapidly air-cool under 4 minutes.',
            targetMetric: 'DTR 14–22%',
          },
        ],
      };
    }

    return {
      titleVi: `Lộ trình tiếp cận hệ thống · ${node.code}`,
      titleEn: `Systemic Coffee Knowledge Flow · ${node.code}`,
      captionVi: 'Mỗi tách cà phê cân bằng là tổng hòa của thực vật học, thổ nhưỡng, sơ chế và kỹ thuật pha.',
      captionEn: 'Every balanced cup unites botany, origin terroir, clean processing, and calibration.',
      steps: [
        {
          stepCode: '01',
          titleVi: 'Di truyền & Sinh học',
          titleEn: 'Genetics & Botany',
          detailVi: 'Xác định loài Arabica, Robusta hay biến thể hình thái Culi tự nhiên.',
          detailEn: 'Identify species traits across Arabica, Robusta, and Peaberry genetics.',
          targetMetric: '2n vs 4n',
        },
        {
          stepCode: '02',
          titleVi: 'Thổ nhưỡng & Thu hái',
          titleEn: 'Terroir & Harvest',
          detailVi: 'Độ cao, đất bazan và thu hái chọn lọc quả chín đỏ tích lũy đường.',
          detailEn: 'Elevation, volcanic soil, and red-ripe picking lock natural sugars.',
          targetMetric: '≥95% chín',
        },
        {
          stepCode: '03',
          titleVi: 'Sơ chế & Rang nhiệt',
          titleEn: 'Processing & Roast',
          detailVi: 'Cân bằng CBU/Honey/Natural và đường nhiệt rang mộc 100%.',
          detailEn: 'Clean Natural/Honey/CBU prep paired with 100% pure roast curves.',
          targetMetric: '100% Mộc',
        },
        {
          stepCode: '04',
          titleVi: 'Chiết xuất & Cảm quan',
          titleEn: 'Brew & Sensory',
          detailVi: 'Đọc vị qua hương thơm, vị ngọt, độ sánh Body và hậu vị sạch.',
          detailEn: 'Verify aroma, sweetness, mouthfeel weight, and lingering aftertaste.',
          targetMetric: '6 Trụ cột',
        },
      ],
    };
  }

  if (pillarId === '02') {
    return {
      titleVi: 'Chu trình Mùa vụ & Bản sắc Vùng nguyên liệu Việt Nam',
      titleEn: 'Vietnamese Highland Harvest & Terroir Stewardship Flow',
      captionVi: 'Từ vườn đất đỏ Tây Nguyên đến triền núi sương mù Cầu Đất, mùa nắng khô là chìa khóa cho hạt sạch.',
      captionEn: 'From Đắk Lắk red basalt to misty Cầu Đất peaks, dry-season timing safeguards clean lots.',
      steps: [
        {
          stepCode: '01',
          titleVi: 'Nuôi dưỡng Đất & Tán che',
          titleEn: 'Soil & Shade Care',
          detailVi: 'Bồi bổ hữu cơ cho đất đỏ bazan hoặc đất dốc núi cao sau thu hoạch.',
          detailEn: 'Replenish organic matter across basalt plateaus and mountain slopes.',
          targetMetric: '500–1.500m',
        },
        {
          stepCode: '02',
          titleVi: 'Nở hoa & Nuôi trái',
          titleEn: 'Blossom & Maturation',
          detailVi: 'Tưới đồng bộ đầu mùa khô giúp hoa nở rộ và quả chín cùng đợt.',
          detailEn: 'Synchronized flowering produces even cherry ripening 8–10 months later.',
          targetMetric: '8–10 tháng',
        },
        {
          stepCode: '03',
          titleVi: 'Hái chín nhiều lượt',
          titleEn: 'Multi-Pass Picking',
          detailVi: 'Thu hái chọn lọc quả đỏ sẫm giàu đường tự nhiên vào tháng 11–1.',
          detailEn: 'Selective hand-picking of crimson fruit from November through January.',
          targetMetric: 'Tháng 11–1',
        },
        {
          stepCode: '04',
          titleVi: 'Sơ chế ngay tại nguồn',
          titleEn: 'Origin Milling',
          detailVi: 'Đưa vào trạm CBU, Honey hoặc giàn phơi sạch trong vòng 6 giờ.',
          detailEn: 'Enter local CBU, Honey, or clean solar drying within 6 hours of harvest.',
          targetMetric: '< 6 giờ',
        },
      ],
    };
  }

  if (pillarId === '03') {
    return {
      titleVi: 'Quy trình Kiểm định Chất lượng Nhân xanh & Fine Robusta Lab',
      titleEn: 'Green Coffee QA & Sensory Verification Workflow',
      captionVi: 'Chất lượng bền vững được kiểm soát đồng thời bằng đo đạc vật lý (ẩm, Aw, lỗi) và thử nếm mù.',
      captionEn: 'Consistent quality combines physical lab metrics (moisture, Aw, defects) with blind cupping.',
      steps: [
        {
          stepCode: '01',
          titleVi: 'Lấy mẫu đại diện 350g',
          titleEn: '350g Sample Pull',
          detailVi: 'Xiên bao ngẫu nhiên nhiều vị trí theo quy chuẩn ISO để đại diện cả lô.',
          detailEn: 'Probe random bags across pallets to pull a true 350g lot sample.',
          targetMetric: '350g ISO',
        },
        {
          stepCode: '02',
          titleVi: 'Đo Độ ẩm & Hoạt độ Aw',
          titleEn: 'Moisture & Aw Check',
          detailVi: 'Kiểm tra độ ẩm 10.5–12.0% và Aw < 0.60 loại trừ rủi ro nấm mốc.',
          detailEn: 'Verify 10.5–12.0% moisture and Aw < 0.60 against storage spoilage.',
          targetMetric: 'Aw < 0.60',
        },
        {
          stepCode: '03',
          titleVi: 'Đếm lỗi sơ/thứ cấp & Sàng',
          titleEn: 'Defect & Sieve Audit',
          detailVi: 'Phân loại hạt đen, sâu, vỡ và kiểm tra độ lọt sàng S14–S18.',
          detailEn: 'Count primary/secondary defects and confirm S14–S18 screen uniformity.',
          targetMetric: 'S14 / S16 / S18',
        },
        {
          stepCode: '04',
          titleVi: 'Rang mẫu & Blind Cupping',
          titleEn: 'Sample Roast & Cup',
          detailVi: 'Rang thử nghiệm và thử nếm mù 3–5 chén xác nhận vị sạch trước nhập kho.',
          detailEn: 'Sample-roast and cup 3–5 bowls blind to sign off clean sweetness.',
          targetMetric: '93°C · 1:18',
        },
      ],
    };
  }

  if (pillarId === '04' || pillarId === '08') {
    return {
      titleVi: 'Chu trình Thiết kế Đường nhiệt, Degassing & QC Sau Rang',
      titleEn: 'Thermal Profiling, Degassing & Post-Roast QC Workflow',
      captionVi: 'Từ thông số nhân xanh đến tách cà phê ổn định trong túi van 1 chiều.',
      captionEn: 'From green bean density telemetry to batch-verified one-way valve pouches.',
      steps: [
        {
          stepCode: '01',
          titleVi: 'Đọc mật độ & Sơ chế lô',
          titleEn: 'Profile Green Inputs',
          detailVi: 'Điều chỉnh nhiệt nạp trống thấp hơn cho Honey nhiều đường, cao hơn cho Arabica cứng.',
          detailEn: 'Set gentler charge heat for sugary Honey; firmer energy for dense Arabica.',
          targetMetric: '10.5–12% ẩm',
        },
        {
          stepCode: '02',
          titleVi: 'Điều tiết RoR & DTR',
          titleEn: 'Steer RoR & DTR',
          detailVi: 'Giữ đường RoR giảm mượt đều, không khựng (baked) hay vọt (flick).',
          detailEn: 'Maintain smoothly declining Rate of Rise to protect natural sweetness.',
          targetMetric: '14–22% DTR',
        },
        {
          stepCode: '03',
          titleVi: 'Đo Weight Loss & Agtron',
          titleEn: 'Weight Loss & Agtron',
          detailVi: 'Kiểm tra hao hụt 12–18% và chênh lệch màu vỏ – lõi ≤ 12–15 điểm.',
          detailEn: 'Verify 12–18% roast loss and whole-to-ground Agtron spread ≤ 12–15.',
          targetMetric: 'Δ ≤ 15 Agtron',
        },
        {
          stepCode: '04',
          titleVi: 'Nghỉ khí CO2 & Đóng van',
          titleEn: 'Degassing & Sealing',
          detailVi: 'Đóng túi van 1 chiều, khuyến nghị nghỉ 5–14 ngày trước khi pha đạt đỉnh.',
          detailEn: 'Seal with one-way valves; brew at peak flavor window days 5–21.',
          targetMetric: '7–21 ngày',
        },
      ],
    };
  }

  if (pillarId === '05' || pillarId === '09') {
    return {
      titleVi: 'Quy trình Chuẩn hóa Chiết xuất & Sửa lỗi Ly Cà Phê',
      titleEn: 'Dial-In Extraction Calibration & Troubleshooting Flow',
      captionVi: 'Chỉ điều chỉnh MỘT biến số mỗi lần thử (Cỡ xay → Nhiệt độ → Tỷ lệ) để kiểm soát vị.',
      captionEn: 'Adjust ONE variable per calibration cycle (Grind → Temperature → Ratio) to lock balance.',
      steps: [
        {
          stepCode: '01',
          titleVi: 'Kiểm tra Nước & Cân bột',
          titleEn: 'Water & Precision Dose',
          detailVi: 'Dùng nước sạch không mùi Clo (TDS 75–150 ppm) và cân bột sai số 0.1g.',
          detailEn: 'Use chlorine-free 75–150 ppm water and weigh dry coffee to 0.1g.',
          targetMetric: '75–150 ppm',
        },
        {
          stepCode: '02',
          titleVi: 'Chỉnh Cỡ xay Đĩa (Burr)',
          titleEn: 'Calibrate Burr Grind',
          detailVi: 'Quá chua → xay mịn hơn; quá đắng chát → nới thô hơn 0.5–1 nấc.',
          detailEn: 'Too sour → grind finer; bitter/astringent → grind slightly coarser.',
          targetMetric: '±0.5 nấc',
        },
        {
          stepCode: '03',
          titleVi: 'Ủ Bloom & Căn Thời gian',
          titleEn: 'Bloom & Contact Time',
          detailVi: 'Ủ nước nóng 30 giây thoát CO2 rồi kiểm soát tổng thời gian trích ly.',
          detailEn: '30-second hot bloom vents CO2 before tracking total brew drawdown.',
          targetMetric: '30s bloom',
        },
        {
          stepCode: '04',
          titleVi: 'Cân bằng Phục vụ / Sữa',
          titleEn: 'Taste & Dairy Pairing',
          detailVi: 'Thử đen trước; nếu pha sữa giữ nhiệt đánh sữa 55–62°C bảo toàn ngọt.',
          detailEn: 'Taste black first; steam dairy to 55–62°C to protect lactose sweetness.',
          targetMetric: '55–62°C sữa',
        },
      ],
    };
  }

  if (pillarId === '06') {
    return {
      titleVi: 'Hành trình Đọc nhãn, Kiểm chứng Rang mộc & Chọn đúng Gu',
      titleEn: 'Label Verification, Pure-Roast Check & Personal Pairing Flow',
      captionVi: 'Người thưởng thức am hiểu kiểm chứng chất lượng qua thông số minh bạch và phản ứng pha thực tế.',
      captionEn: 'Informed drinkers verify purity via bag transparency and physical brewing cues.',
      steps: [
        {
          stepCode: '01',
          titleVi: 'Đọc 4 thông số nhãn túi',
          titleEn: 'Read 4 Bag Specs',
          detailVi: 'Kiểm tra giống hạt, vùng trồng/sơ chế, mức rang và ngày đóng gói van 1 chiều.',
          detailEn: 'Confirm species, origin/process, roast level, and fresh valve date.',
          targetMetric: '4 thông số',
        },
        {
          stepCode: '02',
          titleVi: 'Kiểm tra độ tơi & Bloom',
          titleEn: 'Verify Loft & Bloom',
          detailVi: 'Bột tơi khô không bết dính, nở bọt mịn tự nhiên khi rót nước 92–94°C.',
          detailEn: 'Confirm dry fluffy grounds and clean CO2 bloom at 92–94°C.',
          targetMetric: '100% Mộc',
        },
        {
          stepCode: '03',
          titleVi: 'Đọc 4 bước Cảm quan',
          titleEn: '4-Step Palate Check',
          detailVi: 'Đối chiếu Hương – Chua/Ngọt – Thể chất Body – Hậu vị sạch khi ấm dần.',
          detailEn: 'Check Aroma, Acidity/Sweetness, Body, and Finish as cup cools.',
          targetMetric: '65°C → 35°C',
        },
        {
          stepCode: '04',
          titleVi: 'Khớp đúng Cá tính ROAR',
          titleEn: 'Match ROAR Archetype',
          detailVi: 'Chọn Phin (Hổ/Sư Tử), Espresso (Cáo/Đại Bàng) hay Signature (Báo Đen).',
          detailEn: 'Pair Phin (Tiger/Lion), Espresso (Fox/Eagle), or Signature (Panther).',
          targetMetric: '7 Cá tính',
        },
      ],
    };
  }

  if (pillarId === '07') {
    return {
      titleVi: 'Chuỗi Kiểm soát Sơ chế Sạch, Độ ẩm & Lưu kho Dài hạn',
      titleEn: 'Fermentation, Drying & Hermetic Green Warehousing Flow',
      captionVi: 'Từ 24 giờ vàng bể lên men tới bao lót kín khí trong kho 18–22°C giữ tươi suốt niên vụ.',
      captionEn: 'Linking clean tank fermentation to 18–22°C hermetic storage across the full crop year.',
      steps: [
        {
          stepCode: '01',
          titleVi: 'Xát vỏ & Theo dõi pH',
          titleEn: 'Depulp & Log pH',
          detailVi: 'Rửa tuyển nổi trong 6 giờ, tách vỏ cùng ngày và theo dõi pH hạ về 4.0–4.2.',
          detailEn: 'Floatation sort within 6h, same-day pulping, track pH down to 4.0–4.2.',
          targetMetric: 'pH 4.0–4.2',
        },
        {
          stepCode: '02',
          titleVi: 'Rửa sạch / Kín oxy',
          titleEn: 'Rinse / Sealed Valve',
          detailVi: 'Rửa sạch hoàn toàn nhớt (CBU) hoặc xả van 1 chiều (Anaerobic) đúng điểm dừng.',
          detailEn: 'Rinse squeaky clean (CBU) or vent CO2 lock (Anaerobic) on schedule.',
          targetMetric: '16–72 giờ',
        },
        {
          stepCode: '03',
          titleVi: 'Phơi giàn ổn định Aw',
          titleEn: 'Raised-Bed Drying',
          detailVi: 'Phơi chậm lớp mỏng không sốc nhiệt >45°C để khóa ẩm 10.5–12.0%.',
          detailEn: 'Slow drying below 45°C locks green moisture evenly at 10.5–12.0%.',
          targetMetric: 'Aw < 0.60',
        },
        {
          stepCode: '04',
          titleVi: 'Lưu kho Hermetic chuẩn',
          titleEn: 'Hermetic Warehouse',
          detailVi: 'Đóng bao lót đa lớp kê Pallet cách sàn 15cm ở 18–22°C, 55–65% RH.',
          detailEn: 'Seal inside multi-layer liners on pallets at 18–22°C and 55–65% RH.',
          targetMetric: '55–65% RH',
        },
      ],
    };
  }

  // Pillar 10: Value chain, Traceability, Sustainability & Future (B043–B050)
  return {
    titleVi: 'Chuỗi Giá trị Minh bạch & Bền vững Từ Nông hộ Đến Ly Cà phê',
    titleEn: 'Traceable Coffee Value Chain & Regenerative Sustainability Flow',
    captionVi: 'Nâng chuẩn chế biến tại nguồn và truy xuất COA giúp giữ giá trị kinh tế lâu bền tại vùng trồng Việt Nam.',
    captionEn: 'Origin processing discipline and verifiable COA logs sustain value inside farming regions.',
    steps: [
      {
        stepCode: '01',
        titleVi: 'Vườn xen canh & Hái chín',
        titleEn: 'Agroforestry & Ripeness',
        detailVi: 'Trồng xen cây che bóng/hồ tiêu, giữ ẩm đất và hái chín chọn lọc nhiều đợt.',
        detailEn: 'Shade intercropping with pepper/fruit canopies and multi-pass picking.',
        targetMetric: 'Vườn rừng',
      },
      {
        stepCode: '02',
        titleVi: 'Sơ chế tuần hoàn nước',
        titleEn: 'Eco-Milling & Compost',
        detailVi: 'Giảm 70% nước rửa CBU, ủ vỏ thịt quả làm phân bón hữu cơ quay lại vườn.',
        detailEn: 'Water-saving eco-pulpers plus composted cherry pulp soil return.',
        targetMetric: '-70% nước',
      },
      {
        stepCode: '03',
        titleVi: 'Hồ sơ Truy xuất & COA',
        titleEn: 'Geolocation & COA Log',
        detailVi: 'Ghi nhận tọa độ vùng, cỡ sàng S14–S18, sơ chế và kiểm định ẩm 350g.',
        detailEn: 'Document region polygons, screen grade, process, and 350g lab QA.',
        targetMetric: 'Minh bạch lô',
      },
      {
        stepCode: '04',
        titleVi: 'Rang mộc & Giá trị Thương hiệu',
        titleEn: 'Pure Roast & Brand Value',
        detailVi: 'Chuyển dịch từ bán nguyên liệu thô sang bản sắc chất lượng Việt Nam.',
        detailEn: 'Shift from volatile raw commodity trading toward crafted origin brands.',
        targetMetric: 'Roots · Artistry',
      },
    ],
  };
}

function buildDefaultEvidence(node: JournalNodeMeta): JournalEvidenceItem[] {
  const refs = node.references || [];
  const items: JournalEvidenceItem[] = [];

  for (const r of refs.slice(0, 3)) {
    const parts = r.split('—').map((s) => s.trim());
    const source = parts[0] || r;
    const topic = parts[1] || (node.titleEn || 'Coffee Quality Standard');
    items.push({
      source,
      standardOrYear: node.code,
      findingVi: `Tài liệu đối chiếu chuyên môn về "${topic}" làm cơ sở xác thực cho các thông số kỹ thuật, phân loại và khuyến nghị thực hành trong bài ${node.code}.`,
      findingEn: `Peer technical reference covering "${topic}" underpinning the analytical metrics and practical calibration recommendations in ${node.code}.`,
    });
  }

  if (items.length < 2) {
    items.push({
      source: 'Specialty Coffee Association (SCA) & Coffee Quality Institute (CQI)',
      standardOrYear: 'Global Sensory & Grading Protocols',
      findingVi: 'Khung đánh giá chất lượng nhân xanh, độ ẩm/hoạt độ nước và thử nếm cảm quan mù được áp dụng làm chuẩn mực đối chiếu xuyên suốt hệ thống kiến thức ROAR.',
      findingEn: 'Provides standardized green-defect classification, moisture stability thresholds, and blind sensory evaluation frameworks cited across ROAR guides.',
    });
  }

  return items;
}

export function getArticleEnrichment(node: JournalNodeMeta, heroImageKey?: string): ArticleEnrichment {
  const override = NODE_OVERRIDES[node.code] || {};
  const chartType = override.chartType || node.chartType || CHART_BY_CODE[node.code] || 'sensory_cupping_wheel';

  const basePool = override.visualFigures || FIGURE_POOLS_BY_PILLAR[node.pillarId] || FIGURE_POOLS_BY_PILLAR['01'];

  // Supplement pool with safe cross-pillar figures so even after filtering out heroImageKey, we always have 4-5 distinct visuals (+1 hero = 5-6 total!)
  const supplementPool: JournalFigure[] = [
    {
      imageKey: 'journal_cupping_lab',
      captionVi: 'Kiểm định chất lượng tách bằng phương pháp thử nếm mù chuẩn Lab.',
      captionEn: 'Laboratory blind cupping verification ensuring batch cleanliness.',
    },
    {
      imageKey: 'journal_water_chemistry',
      captionVi: 'Kiểm soát dòng nước và tỷ lệ tiếp xúc chiết xuất hương thơm cân bằng.',
      captionEn: 'Controlling pour kinetics and brew water balance for clean aromatics.',
    },
    {
      imageKey: 'journal_defect_sorting',
      captionVi: 'Đo ẩm hạt nhân xanh và phân cấp cỡ sàng S14–S18 đồng đều.',
      captionEn: 'Electronic moisture testing and ISO 4150 screen-size grading.',
    },
    {
      imageKey: 'journal_coffee_botany',
      captionVi: 'Cành cà phê hoa trắng và quả chín đỏ tích lũy đường tự nhiên.',
      captionEn: 'Coffee blossoms and ripe red fruit building natural sugar density.',
    },
    {
      imageKey: 'journal_sustainable_farm',
      captionVi: 'Canh tác xen canh dưới tán che bền vững bảo vệ đất bazan.',
      captionEn: 'Shade-canopy intercropping protecting long-term highland soil fertility.',
    },
    {
      imageKey: 'product_roasting_drum_clean',
      captionVi: 'Hạt rang mộc tươi mới thoát nhiệt nhanh trên mâm làm nguội.',
      captionEn: 'Freshly roasted 100% pure whole beans rapidly cooled post-drop.',
    },
  ];

  const seenKeys = new Set<string>();
  if (heroImageKey) seenKeys.add(heroImageKey);

  const uniqueFigures: JournalFigure[] = [];
  for (const fig of [...basePool, ...supplementPool]) {
    if (!fig.imageKey || seenKeys.has(fig.imageKey)) continue;
    seenKeys.add(fig.imageKey);
    uniqueFigures.push(fig);
    if (uniqueFigures.length >= 5) break;
  }

  return {
    chartType,
    visualFigures: uniqueFigures,
    flowchart: override.flowchart || buildDefaultFlowchart(node),
    evidenceItems: override.evidenceItems || buildDefaultEvidence(node),
  };
}
