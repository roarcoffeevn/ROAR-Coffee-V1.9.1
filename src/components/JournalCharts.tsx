import React from 'react';
import type { JournalChartType } from '../lib/journalEcosystem';

interface JournalChartsProps {
  chartType: JournalChartType;
  lang: 'vi' | 'en';
}

export const JournalCharts: React.FC<JournalChartsProps> = ({ chartType, lang }) => {
  const isVi = lang === 'vi';

  if (chartType === 'coffee_history_timeline') {
    const steps = [
      {
        era: 'IX–XV',
        titleVi: 'Cao nguyên Ethiopia & Yemen',
        titleEn: 'Ethiopia & Yemen Highlands',
        noteVi: 'Cây Coffea arabica mọc tự nhiên tại Kaffa; rang pha đầu tiên phổ biến tại cảng Mocha (Yemen).',
        noteEn: 'Wild Coffea arabica in Kaffa; early roasting and trade spread through the port of Mocha.',
      },
      {
        era: '1600–1700',
        titleVi: 'Lan tỏa Á – Âu & Thuộc địa nhiệt đới',
        titleEn: 'Global Expansion & Tropical Belt',
        noteVi: 'Cây giống theo tuyến hàng hải sang Java (Indonesia), Ấn Độ, Caribê và Mỹ Latinh.',
        noteEn: 'Maritime trade routes established coffee cultivation in Java, India, and the Americas.',
      },
      {
        era: '1857',
        titleVi: 'Cà phê du nhập Việt Nam',
        titleEn: 'Arrival in Vietnam',
        noteVi: 'Những cây Arabica đầu tiên được trồng thử nghiệm tại các tỉnh phía Bắc rồi mở rộng xuống Tây Nguyên.',
        noteEn: 'Initial Arabica plantings began in northern provinces before expanding south to the highlands.',
      },
      {
        era: '1975–2026',
        titleVi: 'Tây Nguyên & Kỷ nguyên Chất lượng',
        titleEn: 'Central Highlands & Quality Shift',
        noteVi: 'Việt Nam vươn lên top 2 xuất khẩu cà phê toàn cầu (ICO), chuyển dịch sang sơ chế CBU/Honey và Fine Robusta.',
        noteEn: 'Vietnam rose to #2 global coffee exporter (ICO), increasingly investing in CBU, Honey, and specialty lots.',
      },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Sơ đồ lịch sử · B001' : 'Historical Timeline · B001'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Dòng thời gian lan tỏa của cây cà phê đến Việt Nam' : 'Historical Diffusion of Coffee Cultivation to Vietnam'}
          </h4>
        </figcaption>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s) => (
            <div key={s.era} className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/8 dark:border-white/10 p-3.5 space-y-1.5">
              <span className="text-xs font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{s.era}</span>
              <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA]">{isVi ? s.titleVi : s.titleEn}</p>
              <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">{isVi ? s.noteVi : s.noteEn}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Nguồn khái niệm: Tài liệu lưu trữ lịch sử thương mại cà phê ICO & FAO.'
            : 'Conceptual timeline synthesized from ICO & FAO coffee trade archives.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'species_comparison') {
    const metrics = [
      {
        labelVi: 'Hàm lượng đường tự nhiên (khoảng tham chiếu)',
        labelEn: 'Natural Sugar Precursors (reference band)',
        arabica: 80,
        robusta: 45,
        liberica: 55,
      },
      {
        labelVi: 'Hàm lượng Caffeine (% khối lượng khô: Arabica ~1.2–1.5% · Robusta ~2.0–2.7%)',
        labelEn: 'Caffeine Concentration (dry weight: Arabica ~1.2–1.5% · Robusta ~2.0–2.7%)',
        arabica: 48,
        robusta: 88,
        liberica: 52,
      },
      {
        labelVi: 'Sức chống chịu sâu bệnh & nhiệt độ ấm',
        labelEn: 'Heat & Leaf-Rust Agronomic Resilience',
        arabica: 42,
        robusta: 86,
        liberica: 90,
      },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              {isVi ? 'Biểu đồ đối chiếu loài · B003' : 'Species Comparison · B003'}
            </p>
            <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
              {isVi ? 'So sánh đặc tính tương đối: Arabica · Robusta · Liberica' : 'Relative Agronomic & Chemical Profile: Arabica · Robusta · Liberica'}
            </h4>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#00552B]" /> Arabica</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#C6A667]" /> Robusta</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#6B7280]" /> Liberica</span>
          </div>
        </figcaption>
        <div className="space-y-3.5">
          {metrics.map((m) => (
            <div key={m.labelEn} className="space-y-1.5">
              <p className="text-xs font-medium text-[#202020]/85 dark:text-[#F1EFEA]/85">{isVi ? m.labelVi : m.labelEn}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-14 opacity-70">Arabica</span>
                  <div className="flex-1 h-2 rounded-full bg-[#202020]/8 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#00552B]" style={{ width: `${m.arabica}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-14 opacity-70">Robusta</span>
                  <div className="flex-1 h-2 rounded-full bg-[#202020]/8 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#C6A667]" style={{ width: `${m.robusta}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-14 opacity-70">Liberica</span>
                  <div className="flex-1 h-2 rounded-full bg-[#202020]/8 dark:bg-white/10 overflow-hidden">
                    <div className="h-full bg-[#6B7280]" style={{ width: `${m.liberica}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Lưu ý: Độ dài thanh mang tính minh họa xu hướng tương đối theo tài liệu World Coffee Research (WCR) & Illy/Viani (2005); tỷ lệ thực tế thay đổi theo giống và thổ nhưỡng.'
            : 'Note: Bars illustrate directional species tendencies per World Coffee Research (WCR) & Illy/Viani; exact concentrations vary by cultivar and terroir.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'screen_size_mm_chart') {
    const screens = [
      { code: 'S14', inch: '14/64"', mm: 5.5, px: 38, noteVi: 'Hạt gọn, dẫn nhiệt nhanh — hợp phối trộn thương mại', noteEn: 'Compact bean, rapid heat conduction — suited for commercial blends' },
      { code: 'S16', inch: '16/64"', mm: 6.3, px: 46, noteVi: 'Tiêu chuẩn phổ biến toàn cầu — cân bằng hiệu suất rang', noteEn: 'Global commercial standard — balanced roast throughput' },
      { code: 'S18', inch: '18/64"', mm: 7.1, px: 56, noteVi: 'Hạt lớn đồng đều — tối ưu chín tâm khi rang mẻ quán/specialty', noteEn: 'Large uniform bean — even core heat transfer for espresso & Phin' },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Thang đo chuẩn ISO 4150 / TCVN · B008' : 'ISO 4150 Screen Grading Scale · B008'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Đường kính lỗ sàng tròn S14 · S16 · S18 (tính theo mm)' : 'Round-Hole Sieve Aperture Comparison: S14 · S16 · S18 (mm)'}
          </h4>
        </figcaption>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {screens.map((s) => (
            <div key={s.code} className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-4 flex flex-col items-center text-center space-y-2">
              <div className="h-16 flex items-center justify-center">
                <div
                  className="rounded-full border-2 border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/10 dark:bg-[#C6A667]/15 flex items-center justify-center font-mono text-xs font-bold text-[#00552B] dark:text-[#C6A667]"
                  style={{ width: s.px, height: s.px }}
                >
                  {s.code}
                </div>
              </div>
              <p className="text-sm font-bold font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums">
                {s.mm.toFixed(1)} mm <span className="text-xs font-normal opacity-65">({s.inch})</span>
              </p>
              <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">{isVi ? s.noteVi : s.noteEn}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Lưu ý khoa học: Cỡ sàng đo kích thước vật lý theo ISO 4150 / TCVN 4193, không đồng nghĩa trực tiếp với điểm thử nếm cảm quan.'
            : 'Scientific note: Screen size measures physical sieve retention per ISO 4150; larger screens aid roast uniformity rather than directly guaranteeing cup score.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'processing_methods_diagram') {
    const flows = [
      {
        name: 'Natural (Dry)',
        stepsVi: ['Thu hái chín đỏ', 'Phơi nguyên quả 18–25 ngày', 'Xát khô tách vỏ', 'Body dày · Trái cây chín'],
        stepsEn: ['Ripe cherry harvest', 'Whole-cherry drying 18–25d', 'Dry hulling', 'Heavy body · Ripe fruit notes'],
      },
      {
        name: 'Honey Process',
        stepsVi: ['Xát bỏ vỏ ngoài', 'Giữ lớp nhầy đường (Mucilage)', 'Phơi giàn 14–20 ngày', 'Ngọt caramel · Cân bằng'],
        stepsEn: ['Skin pulped off', 'Natural mucilage retained', 'Raised-bed drying 14–20d', 'Caramel sweetness · Rounded'],
      },
      {
        name: 'CBU (Full Washed)',
        stepsVi: ['Rửa nổi & Xát vỏ tươi', 'Lên men tách nhớt 16–24h', 'Rửa nước sạch & Phơi', 'Vị trong trẻo · Sạch hậu'],
        stepsEn: ['Density sort & fresh pulping', 'Controlled tank fermentation 16–24h', 'Clean-water wash & dry', 'Crisp clarity · Clean finish'],
      },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Sơ đồ quy trình sơ chế · B007' : 'Processing Flow Architecture · B007'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Khác biệt lớp đường lên men giữa Natural, Honey và CBU (Washed)' : 'Mucilage Retention & Fermentation Pathways Across Natural, Honey, and CBU'}
          </h4>
        </figcaption>
        <div className="space-y-2.5">
          {flows.map((f) => (
            <div key={f.name} className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-3.5 space-y-2">
              <p className="text-xs font-bold font-mono text-[#00552B] dark:text-[#C6A667]">{f.name}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {(isVi ? f.stepsVi : f.stepsEn).map((step, i) => (
                  <div key={step} className="px-2.5 py-1.5 rounded bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/85 dark:text-[#F1EFEA]/85 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold text-[#00552B] dark:text-[#C6A667]">{i + 1}.</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Nguồn: Quy chuẩn sơ chế hậu thu hoạch SCA & quy trình định danh CBU tại ROAR COFFEE.'
            : 'Source: SCA Post-Harvest Processing principles & ROAR COFFEE CBU commercial standard.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'roast_thermal_curve') {
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Biểu đồ khái niệm nhiệt rang · B009' : 'Conceptual Roast Curve · B009'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? '3 pha biến đổi nhiệt bên trong trống rang (Drying → Maillard → Development)' : 'Three Thermal Phases Inside the Roasting Drum (Drying → Maillard → Development)'}
          </h4>
        </figcaption>
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 640 210" className="w-full min-w-[460px] h-auto" role="img" aria-label="Coffee roast thermal curve">
            <rect x="0" y="0" width="640" height="210" rx="10" className="fill-white dark:fill-[#16221C]" />
            <line x1="56" y1="172" x2="610" y2="172" stroke="currentColor" strokeOpacity="0.2" />
            <line x1="56" y1="24" x2="56" y2="172" stroke="currentColor" strokeOpacity="0.2" />
            {/* Phase backgrounds */}
            <rect x="56" y="24" width="175" height="148" fill="#C6A667" fillOpacity="0.08" />
            <rect x="231" y="24" width="195" height="148" fill="#00552B" fillOpacity="0.08" />
            <rect x="426" y="24" width="184" height="148" fill="#7C2D12" fillOpacity="0.08" />
            {/* Labels */}
            <text x="143" y="42" textAnchor="middle" className="fill-current text-[11px] font-semibold">
              {isVi ? '1. Làm khô (~150°C)' : '1. Drying (~150°C)'}
            </text>
            <text x="328" y="42" textAnchor="middle" className="fill-current text-[11px] font-semibold">
              {isVi ? '2. Maillard (150–195°C)' : '2. Maillard (150–195°C)'}
            </text>
            <text x="518" y="42" textAnchor="middle" className="fill-current text-[11px] font-semibold">
              {isVi ? '3. Phát triển (≥196°C)' : '3. Development (≥196°C)'}
            </text>
            {/* Bean temp curve */}
            <path
              d="M 56 75 Q 92 152, 130 132 T 231 96 T 426 58 T 595 36"
              fill="none"
              stroke="#00552B"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* First crack marker */}
            <circle cx="426" cy="58" r="5" fill="#C6A667" />
            <text x="426" y="76" textAnchor="middle" className="fill-[#00552B] dark:fill-[#C6A667] text-[10px] font-bold">
              First Crack (~196°C)
            </text>
            <text x="56" y="190" className="fill-current opacity-60 text-[10px]">0:00 (Charge)</text>
            <text x="231" y="190" textAnchor="middle" className="fill-current opacity-60 text-[10px]">~4:30 Yellowing</text>
            <text x="426" y="190" textAnchor="middle" className="fill-current opacity-60 text-[10px]">~8:30–9:30</text>
            <text x="595" y="190" textAnchor="end" className="fill-current opacity-60 text-[10px]">Drop (10–12m)</text>
          </svg>
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Sơ đồ khái niệm đường nhiệt hạt (Bean Temperature) theo giáo trình SCA Roasting Foundations; thời gian và nhiệt độ thực tế phụ thuộc loại trống rang và độ ẩm nhân xanh.'
            : 'Conceptual Bean Temperature trajectory adapted from SCA Roasting Foundations; exact times vary by roaster thermodynamics and green bean density.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'vietnam_terroir_elevation') {
    const regions = [
      { nameVi: 'Đắk Lắk – Đắk Nông', nameEn: 'Đắk Lắk & Đắk Nông', band: '500–850m', temp: '22–25°C', soilVi: 'Đất đỏ Bazan', soilEn: 'Volcanic Basalt', pct: 48, species: 'Robusta · Culi' },
      { nameVi: 'Măng Đen (Kon Tum)', nameEn: 'Măng Đen (Kon Tum)', band: '1.100–1.250m', temp: '18–22°C', soilVi: 'Đất Bazan rừng thông', soilEn: 'Pine Forest Basalt', pct: 72, species: 'Arabica Catimor' },
      { nameVi: 'Sơn La – Điện Biên', nameEn: 'Sơn La & Điện Biên', band: '900–1.300m', temp: '16–22°C', soilVi: 'Đất núi đá vôi', soilEn: 'Limestone Upland', pct: 75, species: 'Arabica Catimor' },
      { nameVi: 'Cầu Đất (Đà Lạt)', nameEn: 'Cầu Đất (Đà Lạt)', band: '1.450–1.650m', temp: '14–20°C', soilVi: 'Đất đồi núi cao', soilEn: 'Highland Loam', pct: 95, species: 'Arabica Bourbon / Catimor' },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Biểu đồ phân tầng cao độ Việt Nam · Terroir' : 'Vietnam Highland Elevation Profile · Terroir'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Độ cao, biên độ nhiệt và giống chủ lực tại 4 vùng nguyên liệu Việt Nam' : 'Elevation Bands, Microclimate & Signature Species Across Vietnam Origins'}
          </h4>
        </figcaption>
        <div className="space-y-3">
          {regions.map((r) => (
            <div key={r.band} className="space-y-1">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#202020] dark:text-[#F1EFEA]">{isVi ? r.nameVi : r.nameEn}</span>
                <span className="font-mono text-[11px] text-[#00552B] dark:text-[#C6A667] tabular-nums">
                  {r.band} · {r.temp} · {isVi ? r.soilVi : r.soilEn}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#202020]/8 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00552B] to-[#C6A667]" style={{ width: `${r.pct}%` }} />
              </div>
              <p className="text-[10px] text-[#202020]/60 dark:text-[#F1EFEA]/60">{r.species}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Nguồn: Dữ liệu khí tượng nông nghiệp vùng trồng Việt Nam & bản đồ vùng nguyên liệu ROAR COFFEE®.'
            : 'Source: Vietnam agricultural elevation records & ROAR COFFEE® highland sourcing benchmarks.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'moisture_aw_stability') {
    const zones = [
      { band: '< 9.5%', aw: '< 0.48', labelVi: 'Quá khô (Dễ giòn gãy)', labelEn: 'Over-Dried (Brittle)', riskVi: 'Hao hương nhanh khi rang', riskEn: 'Faded aromatics & uneven scorch', tone: 'text-[#B45309] dark:text-[#FBBF24]' },
      { band: '10.5% – 12.0%', aw: '0.50 – 0.58', labelVi: 'Vùng Chuẩn Vàng (Ổn định)', labelEn: 'Target Safe Zone', riskVi: 'Bảo toàn đường & lipid 12+ tháng', riskEn: 'Preserves sucrose & lipids 12+ mo', tone: 'text-[#00552B] dark:text-[#6EE7B7]' },
      { band: '12.5% – 13.5%', aw: '0.62 – 0.68', labelVi: 'Cảnh báo ẩm cao', labelEn: 'Elevated Moisture Risk', riskVi: 'Lão hóa nhanh, giảm vị ngọt', riskEn: 'Rapid staling & baggy woody notes', tone: 'text-[#B45309] dark:text-[#FBBF24]' },
      { band: '> 14.0%', aw: '> 0.70', labelVi: 'Nguy cơ nấm mốc / OTA', labelEn: 'Mold & OTA Hazard', riskVi: 'Không đạt chuẩn xuất khẩu / rang', riskEn: 'Fails CQI & food safety limits', tone: 'text-[#B91C1C] dark:text-[#FCA5A5]' },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Ngưỡng an toàn nhân xanh · Moisture & Water Activity (Aw)' : 'Green Coffee Stability Thresholds · Moisture & Aw'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Kiểm soát Độ ẩm (10.5–12.0%) và Hoạt độ nước Aw (< 0.60) khi phơi & lưu kho' : 'Controlling Moisture (10.5–12.0%) & Water Activity (Aw < 0.60)'}
          </h4>
        </figcaption>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {zones.map((z) => (
            <div key={z.band} className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-3.5 space-y-1.5">
              <div className={`text-xs font-mono font-bold tabular-nums ${z.tone}`}>{z.band}</div>
              <div className="text-[11px] font-mono text-[#202020]/60 dark:text-[#F1EFEA]/60 tabular-nums">Aw: {z.aw}</div>
              <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA]">{isVi ? z.labelVi : z.labelEn}</p>
              <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">{isVi ? z.riskVi : z.riskEn}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Nguồn: Quy chuẩn CQI Green Coffee & tiêu chuẩn độ ẩm TCVN 4193 / ISO 6673.'
            : 'Source: CQI Green Coffee Quality Standards & ISO 6673 / TCVN 4193 moisture guidelines.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'roast_degree_spectrum') {
    const levels = [
      { name: 'Light', agtron: '65–75', acid: 88, sweet: 68, bitter: 22, color: '#D97706', useVi: 'Pour Over · Arabica hương hoa', useEn: 'Pour Over · Floral Arabica' },
      { name: 'Medium', agtron: '55–64', acid: 62, sweet: 86, bitter: 44, color: '#92400E', useVi: 'Espresso cân bằng · Cold Brew', useEn: 'Balanced Espresso · Cold Brew' },
      { name: 'Medium-Dark', agtron: '45–54', acid: 34, sweet: 78, bitter: 68, color: '#572814', useVi: 'Phin hiện đại · Cà phê sữa', useEn: 'Modern Phin · Milk Espresso' },
      { name: 'Dark', agtron: '35–44', acid: 14, sweet: 46, bitter: 90, color: '#291711', useVi: 'Gu đậm truyền thống mạnh mẽ', useEn: 'Traditional Bold Dark Roast' },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
              {isVi ? 'Phổ mức độ rang Agtron · B020' : 'Agtron Roast Spectrum · B020'}
            </p>
            <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
              {isVi ? 'Biến thiên Độ chua – Vị ngọt – Vị đắng theo 4 mức rang' : 'Acidity, Sweetness & Bitterness Shift Across Roast Levels'}
            </h4>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#C6A667]" /> {isVi ? 'Chua thanh' : 'Acidity'}</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#00552B]" /> {isVi ? 'Ngọt caramel' : 'Sweetness'}</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#451A03]" /> {isVi ? 'Đắng cacao' : 'Roast Bitterness'}</span>
          </div>
        </figcaption>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {levels.map((lv) => (
            <div key={lv.name} className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lv.color }} />
                  {lv.name}
                </span>
                <span className="text-[10px] font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums">Agtron {lv.agtron}</span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="h-1.5 rounded-full bg-[#202020]/10 dark:bg-white/10 overflow-hidden"><div className="h-full bg-[#C6A667]" style={{ width: `${lv.acid}%` }} /></div>
                <div className="h-1.5 rounded-full bg-[#202020]/10 dark:bg-white/10 overflow-hidden"><div className="h-full bg-[#00552B]" style={{ width: `${lv.sweet}%` }} /></div>
                <div className="h-1.5 rounded-full bg-[#202020]/10 dark:bg-white/10 overflow-hidden"><div className="h-full bg-[#451A03]" style={{ width: `${lv.bitter}%` }} /></div>
              </div>
              <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70">{isVi ? lv.useVi : lv.useEn}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Nguồn: Thang đo màu Agtron Gourmet (Ground) tham chiếu theo SCA Roasting Standards.'
            : 'Source: Agtron Gourmet Ground Scale conceptual trends per SCA Roasting Standards.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'degassing_co2_curve') {
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Động học thoát khí CO2 sau rang · B021' : 'Post-Roast CO2 Degassing Window · B021'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Cửa sổ nghỉ (Resting Window) giúp hạt đạt độ ổn định hương vị tối ưu' : 'Why Resting 4–14 Days Stabilizes Extraction & Crema'}
          </h4>
        </figcaption>
        <div className="w-full overflow-x-auto">
          <svg viewBox="0 0 640 190" className="w-full min-w-[460px] h-auto" role="img" aria-label="CO2 degassing and flavor stability curve">
            <rect x="0" y="0" width="640" height="190" rx="10" className="fill-white dark:fill-[#16221C]" />
            <rect x="130" y="20" width="230" height="130" fill="#00552B" fillOpacity="0.09" />
            <line x1="50" y1="150" x2="605" y2="150" stroke="currentColor" strokeOpacity="0.2" />
            <line x1="50" y1="20" x2="50" y2="150" stroke="currentColor" strokeOpacity="0.2" />
            {/* CO2 release declining curve */}
            <path d="M 50 32 Q 110 95, 220 124 T 590 144" fill="none" stroke="#C6A667" strokeWidth="3" strokeDasharray="5 4" />
            {/* Cup stability / sweetness curve */}
            <path d="M 50 120 Q 130 45, 240 42 T 420 68 T 590 112" fill="none" stroke="#00552B" strokeWidth="3.5" />
            <text x="245" y="34" textAnchor="middle" className="fill-[#00552B] dark:fill-[#C6A667] text-[11px] font-bold">
              {isVi ? 'Vùng Đỉnh Hương Vị (Ngày 5–21)' : 'Peak Extraction Window (Days 5–21)'}
            </text>
            <text x="50" y="170" className="fill-current opacity-65 text-[10px]">{isVi ? 'Ngày 0 (Mới rang)' : 'Day 0'}</text>
            <text x="155" y="170" textAnchor="middle" className="fill-current opacity-65 text-[10px]">{isVi ? 'Ngày 4–7 (Phin/Filter)' : 'Days 4–7 (Filter)'}</text>
            <text x="315" y="170" textAnchor="middle" className="fill-current opacity-65 text-[10px]">{isVi ? 'Ngày 7–14 (Espresso)' : 'Days 7–14 (Espresso)'}</text>
            <text x="590" y="170" textAnchor="end" className="fill-current opacity-65 text-[10px]">{isVi ? 'Ngày 45–60+' : 'Days 45–60+'}</text>
          </svg>
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Đường nét đứt: tốc độ thoát CO2; Đường liền: độ cân bằng & ổn định chiết xuất (túi van 1 chiều bảo toàn hương đến 6–12 tháng).'
            : 'Dashed curve: CO2 pressure release; Solid curve: cup equilibrium inside one-way valve packaging.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'particle_grind_spectrum') {
    const grinds = [
      { method: 'Espresso (9 bar)', microns: '250–380 μm', pct: 26, noteVi: 'Mịn, tạo lực cản áp suất 26–30 giây', noteEn: 'Fine resistance for 26–30s shots' },
      { method: 'Pour Over (V60/Kalita)', microns: '550–750 μm', pct: 52, noteVi: 'Trung bình, giữ dòng chảy 2:30–3:00', noteEn: 'Medium clarity for 2:30–3:00 drawdown' },
      { method: 'Phin Việt Nam', microns: '650–850 μm', pct: 64, noteVi: 'Vừa-thô, nhỏ giọt 1 giọt/giây không nghẹt', noteEn: 'Medium-coarse for steady 4–5m drip' },
      { method: 'French Press / Cold Brew', microns: '950–1.200 μm', pct: 88, noteVi: 'Thô đều, giảm cặn mịn & vị chát ngâm lâu', noteEn: 'Coarse chunks prevent over-steep bitterness' },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Phân bố cỡ hạt xay theo dụng cụ · B039' : 'Target Grind Particle Spectrum · B039'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Thang kích thước bột xay (Micron μm) cho từng phương pháp chiết xuất' : 'Reference Grind Particle Size (μm) Across Brewing Methods'}
          </h4>
        </figcaption>
        <div className="space-y-3">
          {grinds.map((g) => (
            <div key={g.method} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#202020] dark:text-[#F1EFEA]">{g.method}</span>
                <span className="font-mono text-[11px] font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">{g.microns}</span>
              </div>
              <div className="h-2 rounded-full bg-[#202020]/8 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-[#00552B] dark:bg-[#C6A667]" style={{ width: `${g.pct}%` }} />
              </div>
              <p className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65">{isVi ? g.noteVi : g.noteEn}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Lưu ý: Cỡ micron tham chiếu cho máy xay đĩa phẳng/nón chuẩn; luôn tinh chỉnh 1–2 nấc theo độ mới của hạt.'
            : 'Reference laser-diffraction bands; fine-tune 1–2 clicks for roast age and ambient humidity.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'water_mineral_balance') {
    const params = [
      { code: 'TDS', target: '75 – 150 ppm', descVi: 'Tổng chất rắn hòa tan lý tưởng giúp nước "nhẹ" nhưng đủ lực trích ly', descEn: 'Total dissolved solids window for clean sweetness without chalkiness' },
      { code: 'GH (Mg²⁺ / Ca²⁺)', target: '50 – 85 ppm', descVi: 'Magie (Mg²⁺) kéo hương hoa trái; Canxi (Ca²⁺) làm dày độ béo mượt', descEn: 'Magnesium lifts bright aromatics; calcium rounds creamy mouthfeel' },
      { code: 'KH (Bicarbonate)', target: '40 – 75 ppm', descVi: 'Đệm kiềm giữ độ chua dịu êm; vượt >100 ppm làm cà phê bị bẹt vị', descEn: 'Alkalinity buffer; excess >100 ppm flattens lively fruit acidity' },
      { code: 'pH', target: '6.5 – 7.5', descVi: 'Trung tính sạch, không clo tự do (Free Chlorine = 0 mg/L)', descEn: 'Clean neutral pH with zero free chlorine taint' },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Thông số hóa học nước pha · SCA Water Standard' : 'SCA Water Chemistry Benchmarks · B040'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? '4 chỉ số nước chuẩn giúp mở khóa 98% thể tích tách cà phê' : 'Four Water Mineral Targets Shaping 98% of Your Brewed Cup'}
          </h4>
        </figcaption>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {params.map((p) => (
            <div key={p.code} className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-3.5 space-y-1.5">
              <span className="text-xs font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{p.code}</span>
              <p className="text-sm font-bold font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums">{p.target}</p>
              <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">{isVi ? p.descVi : p.descEn}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Nguồn: Specialty Coffee Association (SCA) Water Quality Handbook & Water for Coffee (Colonna-Dashwood & Hendon).'
            : 'Source: Specialty Coffee Association (SCA) Water Standards & Colonna-Dashwood / Hendon research.'}
        </p>
      </figure>
    );
  }

  if (chartType === 'caffeine_safety_curve') {
    const drinks = [
      { labelVi: '1 Shot Espresso Arabica/Blend (36ml)', labelEn: '1 Single Espresso Shot (36ml)', mg: '~65–85 mg', pct: 20 },
      { labelVi: '1 Ly Pour Over Arabica 240ml', labelEn: '1 Pour-Over Arabica Cup (240ml)', mg: '~95–130 mg', pct: 30 },
      { labelVi: '1 Ly Phin Robusta đậm chuẩn (80–100ml cốt)', labelEn: '1 Traditional Robusta Phin (80–100ml)', mg: '~140–210 mg', pct: 48 },
      { labelVi: 'Ngưỡng khuyến nghị người trưởng thành khỏe mạnh (EFSA/FDA)', labelEn: 'Daily Reference Ceiling for Healthy Adults (EFSA/FDA)', mg: '≤ 400 mg/ngày', pct: 100 },
    ];
    return (
      <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
        <figcaption className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
            {isVi ? 'Tham chiếu hàm lượng Caffeine · EFSA / FDA' : 'Caffeine Dosage Reference · EFSA / FDA'}
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? 'Ước lượng Caffeine theo phương pháp pha so với ngưỡng an toàn 400 mg/ngày' : 'Estimated Caffeine per Serve vs. 400 mg/Day Healthy Adult Reference'}
          </h4>
        </figcaption>
        <div className="space-y-3">
          {drinks.map((d) => (
            <div key={d.labelEn} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#202020] dark:text-[#F1EFEA]">{isVi ? d.labelVi : d.labelEn}</span>
                <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">{d.mg}</span>
              </div>
              <div className="h-2 rounded-full bg-[#202020]/8 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full ${d.pct === 100 ? 'bg-[#C6A667]' : 'bg-[#00552B]'}`}
                  style={{ width: `${d.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
          {isVi
            ? 'Nguồn: Cơ quan An toàn Thực phẩm Châu Âu (EFSA 2015) & FDA (phụ nữ mang thai nên giới hạn ≤200 mg/ngày theo khuyến cáo y tế).'
            : 'Source: European Food Safety Authority (EFSA 2015) & US FDA guidance (≤200 mg/day during pregnancy).'}
        </p>
      </figure>
    );
  }

  // Generic crisp conceptual card diagram for timeline/anatomy/map/altitude/sensory/extraction
  const cardsByType: Record<
    Exclude<
      JournalChartType,
      | 'coffee_history_timeline'
      | 'species_comparison'
      | 'screen_size_mm_chart'
      | 'processing_methods_diagram'
      | 'roast_thermal_curve'
      | 'vietnam_terroir_elevation'
      | 'moisture_aw_stability'
      | 'roast_degree_spectrum'
      | 'degassing_co2_curve'
      | 'particle_grind_spectrum'
      | 'water_mineral_balance'
      | 'caffeine_safety_curve'
    >,
    {
      tagVi: string;
      tagEn: string;
      titleVi: string;
      titleEn: string;
      nodes: Array<{ k: string; titleVi: string; titleEn: string; descVi: string; descEn: string }>;
      sourceVi: string;
      sourceEn: string;
    }
  > = {
    coffee_botany_anatomy: {
      tagVi: 'Sơ đồ sinh học · B002',
      tagEn: 'Botanical Lifecycle · B002',
      titleVi: 'Cấu trúc cây cà phê & Chu kỳ 4 pha sinh trưởng',
      titleEn: 'Coffee Plant Anatomy & Four-Stage Reproductive Cycle',
      nodes: [
        { k: '01', titleVi: 'Hệ rễ & Đất bazan', titleEn: 'Root System', descVi: 'Rễ cọc neo sâu + tầng rễ tơ 0–30cm hút nước và khoáng chất.', descEn: 'Deep taproot + shallow feeder mat absorbing water and minerals.' },
        { k: '02', titleVi: 'Cành sơ cấp & Tán lá', titleEn: 'Canopy & Leaves', descVi: 'Lá xanh đậm quang hợp tổng hợp đường nuôi nụ hoa trên cành ngang.', descEn: 'Glossy evergreen leaves photosynthesize sugars along lateral branches.' },
        { k: '03', titleVi: 'Hoa trắng & Thụ phấn', titleEn: 'Blossom Flush', descVi: 'Nở rộ sau cơn mưa chuyển mùa, hương hoa nhài dịu trong 2–4 ngày.', descEn: 'Fragrant white blossoms open synchronously after seasonal rains.' },
        { k: '04', titleVi: 'Quả chín 7–11 tháng', titleEn: 'Cherry Maturation', descVi: 'Arabica chín sau 7–9 tháng; Robusta cần 9–11 tháng để tích lũy đường.', descEn: 'Cherries ripen in 7–9 months (Arabica) or 9–11 months (Robusta).' },
      ],
      sourceVi: 'Nguồn tham khảo khái niệm: World Coffee Research (WCR) Botany Guide.',
      sourceEn: 'Conceptual reference: World Coffee Research (WCR) Coffee Botany Guide.',
    },
    global_coffee_belt: {
      tagVi: 'Bản đồ vùng trồng · B004',
      tagEn: 'Global Coffee Belt · B004',
      titleVi: '3 Trục khu vực sản xuất lớn trong Vành đai Cà phê (25°B – 25°N)',
      titleEn: 'Three Major Producing Axes Across the Bean Belt (25°N – 25°S)',
      nodes: [
        { k: 'LATAM', titleVi: 'Mỹ Latinh', titleEn: 'Latin America', descVi: 'Brazil, Colombia, Honduras — nổi bật sản lượng Arabica sạch vị, sô-cô-la & hạt rang.', descEn: 'Brazil, Colombia, Honduras — leading global Arabica volumes with nutty-cocoa balance.' },
        { k: 'AFRICA', titleVi: 'Đông Phi & Tây Phi', titleEn: 'Africa', descVi: 'Ethiopia, Kenya, Uganda — cái nôi đa dạng di truyền với hương hoa và quả mọng sáng.', descEn: 'Ethiopia, Kenya, Uganda — genetic cradle renowned for floral and bright berry aromatics.' },
        { k: 'ASIA', titleVi: 'Châu Á – Thái Bình Dương', titleEn: 'Asia-Pacific', descVi: 'Việt Nam, Indonesia, Ấn Độ — trung tâm Robusta toàn cầu và Arabica vùng cao.', descEn: 'Vietnam, Indonesia, India — global center for Robusta body alongside highland Arabica.' },
      ],
      sourceVi: 'Nguồn: Báo cáo thị trường xuất khẩu ICO (International Coffee Organization).',
      sourceEn: 'Source: International Coffee Organization (ICO) Exporting Country Statistics.',
    },
    altitude_variety_matrix: {
      tagVi: 'Ma trận sinh thái · B005',
      tagEn: 'Altitude & Climate Matrix · B005',
      titleVi: 'Độ cao tương tác cùng nhiệt độ, giống cây và ánh sáng',
      titleEn: 'How Elevation Interacts With Temperature, Cultivar & Shade',
      nodes: [
        { k: '400–850m', titleVi: 'Đai cao nguyên Tây Nguyên', titleEn: 'Central Highlands Belt', descVi: 'Phù hợp Coffea canephora (Robusta TR4/TR9); đất đỏ bazan giúp thân vị dày sánh.', descEn: 'Ideal for Coffea canephora (Robusta) on volcanic basalt; develops syrupy body.' },
        { k: '900–1.300m', titleVi: 'Sơn La · Điện Biên · Măng Đen', titleEn: 'Northern & North-Highland Belt', descVi: 'Khí hậu mát mùa đông giúp Arabica Catimor phát triển vị ngọt đường mía.', descEn: 'Cool winter microclimates help Catimor Arabica retain cane-sugar sweetness.' },
        { k: '1.450–1.600m+', titleVi: 'Cầu Đất – Lạc Dương (Lâm Đồng)', titleEn: 'Cau Dat High Elevation', descVi: 'Biên độ nhiệt ngày-đêm rộng làm quả chín chậm, giữ axit hữu cơ và hương hoa.', descEn: 'Wide day-night swings slow cherry maturation, preserving bright acidity and florals.' },
      ],
      sourceVi: 'Lưu ý khoa học: Chất lượng là kết quả tổng hợp của giống + thổ nhưỡng + thu hái + sơ chế, không chỉ do độ cao.',
      sourceEn: 'Scientific note: Cup quality reflects genetics, soil, selective picking, and processing—never altitude alone.',
    },
    cherry_development_cycle: {
      tagVi: 'Giải phẫu quả chín · B006',
      tagEn: 'Cherry Cross-Section · B006',
      titleVi: '5 lớp cấu trúc từ ngoài vào nhân trong một quả cà phê chín',
      titleEn: 'Five Anatomical Layers Inside a Ripe Coffee Cherry',
      nodes: [
        { k: '1·2', titleVi: 'Vỏ quả & Thịt quả (Exocarp/Pulp)', titleEn: 'Skin & Fruit Pulp', descVi: 'Chứa sắc tố đỏ chín và thành phần xơ; được tách bỏ trong chế biến ướt CBU.', descEn: 'Red outer skin and fleshy pulp; removed during wet-mill pulping.' },
        { k: '3', titleVi: 'Lớp nhầy đường (Mucilage)', titleEn: 'Pectin Mucilage', descVi: 'Giàu pectin và đường đơn; là chất nền quyết định trong lên men Honey & Washed.', descEn: 'Sugar- and pectin-rich layer central to Honey and Washed fermentation.' },
        { k: '4', titleVi: 'Vỏ thóc & Vỏ lụa (Parchment/Silverskin)', titleEn: 'Parchment & Chaff', descVi: 'Lớp áo bảo vệ nhân hạt trong suốt giai đoạn phơi và bảo quản kho.', descEn: 'Protective endocarp and delicate silverskin guarding green beans in storage.' },
        { k: '5', titleVi: 'Nhân hạt (Endosperm / Green Bean)', titleEn: 'Two Seeds (or 1 Culi)', descVi: 'Chứa lipid, axit chlorogenic, sucrose và caffeine — biến đổi thành hương vị khi rang.', descEn: 'Dense seed storing lipids, chlorogenic acids, sucrose, and caffeine.' },
      ],
      sourceVi: 'Nguồn: Tài liệu giải phẫu hạt cà phê World Coffee Research (WCR).',
      sourceEn: 'Source: World Coffee Research (WCR) Coffee Seed Anatomy.',
    },
    sensory_cupping_wheel: {
      tagVi: 'Ngôn ngữ cảm quan · B010',
      tagEn: 'Sensory Framework · B010',
      titleVi: '6 Trụ cột đọc vị tách cà phê theo chuẩn cảm quan quốc tế',
      titleEn: 'Six Core Pillars of Objective Coffee Sensory Evaluation',
      nodes: [
        { k: 'Aroma', titleVi: 'Hương khô & Hương nước', titleEn: 'Fragrance & Aroma', descVi: 'Cảm nhận trực tiếp qua mũi khi ngửi bột khô và khi phá lớp váng cà phê.', descEn: 'Orthonasal impression of dry grounds and freshly steeped crust.' },
        { k: 'Taste', titleVi: 'Ngọt · Chua · Đắng hài hòa', titleEn: 'Acidity & Sweetness', descVi: 'Độ chua thanh tự nhiên nâng hương vị và vị ngọt đường caramel dễ chịu.', descEn: 'Lively organic acidity balanced by natural caramel-like sweetness.' },
        { k: 'Body', titleVi: 'Thể chất vòm miệng', titleEn: 'Mouthfeel & Viscosity', descVi: 'Độ sánh mượt từ nhẹ như trà đến dày mịn như kem tùy giống và cách pha.', descEn: 'Tactile weight ranging from tea-like delicacy to syrupy richness.' },
        { k: 'Finish', titleVi: 'Cân bằng & Hậu vị', titleEn: 'Balance & Aftertaste', descVi: 'Sự hòa quyện không gắt và dư hương ngọt dịu lưu lại sau khi uống.', descEn: 'Harmonious integration leaving a clean, pleasant lingering finish.' },
      ],
      sourceVi: 'Nguồn: Hệ thống thuộc tính cảm quan SCA & World Coffee Research Sensory Lexicon.',
      sourceEn: 'Source: SCA Cupping Form Attributes & WCR Sensory Lexicon.',
    },
    extraction_balance: {
      tagVi: 'Biểu đồ cân bằng chiết xuất · Pha chế',
      tagEn: 'Brewing Extraction Balance',
      titleVi: 'Tác động của thời gian, cỡ xay & nhiệt độ lên vùng cân bằng (Sweet Spot)',
      titleEn: 'How Time, Grind Size & Temperature Steer Extraction Balance',
      nodes: [
        { k: 'Under', titleVi: 'Chiết xuất thiếu (Under-extracted)', titleEn: 'Under-Extracted', descVi: 'Bột quá thô hoặc nước nguội/nhanh: tách vị chua gắt, mặn, thân mỏng, hậu ngắn.', descEn: 'Too coarse or fast/cool: sharp sourness, thin body, fleeting finish.' },
        { k: 'Sweet', titleVi: 'Vùng cân bằng (Balanced)', titleEn: 'Balanced Extraction', descVi: 'Cân đối cỡ xay + 90–94°C + thời gian chuẩn (Phin 4–5p / Espresso 26–30s).', descEn: 'Calibrated grind + 90–94°C + target time (Phin 4–5m / Espresso 26–30s).' },
        { k: 'Over', titleVi: 'Chiết xuất quá (Over-extracted)', titleEn: 'Over-Extracted', descVi: 'Bột quá mịn hoặc ngâm quá lâu: tách bị đắng gắt, chát khô ở cuống lưỡi.', descEn: 'Too fine or prolonged contact: harsh astringency and dry bitterness.' },
      ],
      sourceVi: 'Nguồn: Nguyên lý hòa tan SCA Brewing Control Chart (thông số tham chiếu thực hành).',
      sourceEn: 'Source: SCA Brewing Control Principles (practical reference bands).',
    },
  };

  const cfg = cardsByType[chartType as keyof typeof cardsByType];
  if (!cfg) return null;

  return (
    <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/70 dark:bg-[#0E1512] p-5 space-y-4">
      <figcaption className="space-y-0.5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667]">
          {isVi ? cfg.tagVi : cfg.tagEn}
        </p>
        <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">{isVi ? cfg.titleVi : cfg.titleEn}</h4>
      </figcaption>
      <div className={`grid grid-cols-1 ${cfg.nodes.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-4'} gap-3`}>
        {cfg.nodes.map((node) => (
          <div key={node.k} className="rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/8 dark:border-white/10 p-3.5 space-y-1.5">
            <span className="text-xs font-mono font-bold text-[#00552B] dark:text-[#C6A667]">{node.k}</span>
            <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA]">{isVi ? node.titleVi : node.titleEn}</p>
            <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">{isVi ? node.descVi : node.descEn}</p>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">{isVi ? cfg.sourceVi : cfg.sourceEn}</p>
    </figure>
  );
};
