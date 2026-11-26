import React, { useMemo, useState } from 'react';
import { Calculator, Coffee, ShoppingBag, TrendingUp } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { type Product, useStore } from '../context/StoreContext';
import { resolveVolumeTier } from '../lib/pricing';

interface CafeMarginCalculatorProps {
  product?: Product;
  products?: Product[];
}

export const CafeMarginCalculator: React.FC<CafeMarginCalculatorProps> = ({ product, products = [] }) => {
  const { lang, t } = useI18n();
  const { addToCart, formatPrice, showToast } = useStore();

  const roastedBeanCatalog = useMemo(() => {
    if (product) return [product];
    return products.filter(
      (p) => (p.category === 'roasted_beans' || (p.pricing_tiers && p.pricing_tiers.length > 0)) && p.status === 'active'
    );
  }, [product, products]);

  const [selectedSlug, setSelectedSlug] = useState<string>(
    product?.slug || roastedBeanCatalog[0]?.slug || ''
  );

  const activeProduct = useMemo(() => {
    if (product) return product;
    return roastedBeanCatalog.find((p) => p.slug === selectedSlug) || roastedBeanCatalog[0] || null;
  }, [product, roastedBeanCatalog, selectedSlug]);

  const [cupsPerDay, setCupsPerDay] = useState(80);
  const [doseG, setDoseG] = useState(20);
  const [menuPriceVnd, setMenuPriceVnd] = useState(32000);

  if (!activeProduct) return null;

  const monthlyKg = Math.max(1, Math.ceil((cupsPerDay * doseG * 30) / 1000));
  const tiers = activeProduct.pricing_tiers || [];
  const resolvedTier = tiers.length > 0 ? resolveVolumeTier(tiers, monthlyKg) : null;
  const pricePerKgVnd = resolvedTier ? resolvedTier.priceVnd : activeProduct.price_vnd;
  const pricePerKgUsd = resolvedTier ? resolvedTier.priceUsd : activeProduct.price_usd;

  const beanCostPerCupVnd = Math.round((pricePerKgVnd / 1000) * doseG);
  const monthlyCups = cupsPerDay * 30;
  const monthlyBeanSpendVnd = monthlyKg * pricePerKgVnd;
  const monthlyGrossMarginVnd = Math.max(0, monthlyCups * menuPriceVnd - monthlyBeanSpendVnd);
  const beanCostPct = menuPriceVnd > 0 ? ((beanCostPerCupVnd / menuPriceVnd) * 100).toFixed(1) : '0';

  const handleAddMonthlyKg = () => {
    addToCart({
      productId: activeProduct.id,
      slug: activeProduct.slug,
      sku: activeProduct.sku,
      nameVi: activeProduct.name_vi,
      nameEn: activeProduct.name_en,
      variantLabel: resolvedTier ? `${monthlyKg} kg · ${resolvedTier.labelVi}` : `${monthlyKg} kg`,
      unitPriceVnd: pricePerKgVnd,
      unitPriceUsd: pricePerKgUsd,
      quantity: monthlyKg,
      imageKey: activeProduct.image_key,
      unit: tiers.length > 0 ? 'kg' : 'unit',
      pricingTiers: tiers.length > 0 ? tiers : undefined,
    });
    showToast(
      t(
        `Đã thêm ${monthlyKg} kg (${formatPrice(monthlyBeanSpendVnd)}) theo giá sỉ vào giỏ`,
        `Added ${monthlyKg} kg wholesale batch to cart`
      )
    );
  };

  return (
    <section className="bg-white dark:bg-[#16221C] rounded-2xl border border-[#202020]/10 dark:border-[#C6A667]/25 p-5 sm:p-7 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#202020]/10 dark:border-white/10 pb-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5" />
            <span>{t('Dành cho Chủ Quán & HORECA', 'Café Owner & HORECA Margin Simulator')}</span>
          </p>
          <h3 className="text-lg sm:text-xl font-bold text-[#202020] dark:text-[#F1EFEA]">
            {t('Ước Tính Cost Hạt / Ly & Lợi Nhuận Tháng', 'Monthly Bean COGS & Gross Margin Calculator')}
          </h3>
        </div>
        {resolvedTier && (
          <span className="px-2.5 py-1 rounded bg-[#00552B]/10 dark:bg-[#C6A667]/15 text-[#00552B] dark:text-[#C6A667] font-mono text-xs font-bold">
            {t('Mức sỉ:', 'Active Tier:')} {lang === 'vi' ? resolvedTier.labelVi : resolvedTier.labelEn}
          </span>
        )}
      </div>

      {!product && roastedBeanCatalog.length > 1 && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#202020]/70 dark:text-[#F1EFEA]/70 block">
            {t('Chọn dòng hạt rang cho quán:', 'Select Wholesale Roast SKU:')}
          </label>
          <select
            value={activeProduct.slug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full sm:max-w-md bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/15 dark:border-white/15 rounded-lg px-3 py-2 text-xs font-semibold text-[#202020] dark:text-[#F1EFEA]"
          >
            {roastedBeanCatalog.map((p) => (
              <option key={p.slug} value={p.slug}>
                {lang === 'vi' ? p.name_vi : p.name_en} ({p.sku})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Controls */}
        <div className="lg:col-span-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs font-semibold">
              <span>{t('Sản lượng bán / ngày', 'Daily Cups Served')}</span>
              <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                {cupsPerDay} {t('ly/ngày', 'cups/day')}
              </span>
            </span>
            <input
              type="range"
              min={20}
              max={500}
              step={10}
              value={cupsPerDay}
              onChange={(e) => setCupsPerDay(Number(e.target.value))}
              className="w-full accent-[#00552B] dark:accent-[#C6A667] cursor-pointer"
            />
          </label>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold block">{t('Định lượng cà phê / ly (gram)', 'Coffee Dose per Cup')}</span>
            <div className="flex flex-wrap gap-1.5">
              {[16, 18, 20, 22, 25].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDoseG(g)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold border cursor-pointer transition-colors ${
                    doseG === g
                      ? 'bg-[#00552B] text-white border-[#00552B]'
                      : 'bg-[#F8F5EF] dark:bg-[#0E1512] border-[#202020]/12 dark:border-white/15'
                  }`}
                >
                  {g}g
                </button>
              ))}
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs font-semibold">
              <span>{t('Giá bán menu trung bình / ly', 'Avg. Menu Price / Cup')}</span>
              <span className="font-mono font-bold text-[#00552B] dark:text-[#C6A667] tabular-nums">
                {formatPrice(menuPriceVnd)}
              </span>
            </span>
            <input
              type="range"
              min={18000}
              max={75000}
              step={1000}
              value={menuPriceVnd}
              onChange={(e) => setMenuPriceVnd(Number(e.target.value))}
              className="w-full accent-[#00552B] dark:accent-[#C6A667] cursor-pointer"
            />
          </label>
        </div>

        {/* Live Output Cards */}
        <div className="lg:col-span-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10 p-3.5">
              <span className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 block">
                {t('Nhu cầu hạt / tháng', 'Monthly Bean Volume')}
              </span>
              <span className="text-xl font-bold font-mono text-[#00552B] dark:text-[#C6A667] tabular-nums mt-0.5 block">
                {monthlyKg} kg
              </span>
              <span className="text-[10px] font-mono text-[#202020]/60 dark:text-[#F1EFEA]/60 tabular-nums">
                {formatPrice(pricePerKgVnd, pricePerKgUsd)}/kg
              </span>
            </div>

            <div className="rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/8 dark:border-white/10 p-3.5">
              <span className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 flex items-center gap-1">
                <Coffee className="w-3 h-3 text-[#00552B] dark:text-[#C6A667]" />
                {t('Cost hạt / 1 ly', 'Bean COGS / Cup')}
              </span>
              <span className="text-xl font-bold font-mono text-[#202020] dark:text-[#F1EFEA] tabular-nums mt-0.5 block">
                {formatPrice(beanCostPerCupVnd)}
              </span>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-[#C6A667] tabular-nums">
                ≈ {beanCostPct}% {t('giá bán menu', 'of menu price')}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-[#003D25] text-white p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#C6A667] font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                {t('Biên lợi nhuận gộp (sau trừ tiền hạt)', 'Est. Monthly Gross Margin (Net of Beans)')}
              </span>
              <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums block mt-0.5">
                {formatPrice(monthlyGrossMarginVnd)}
              </span>
              <span className="text-[11px] text-white/75 font-mono tabular-nums">
                {monthlyCups.toLocaleString('vi-VN')} {t('ly/tháng', 'cups/mo')} · {t('Tiền hạt:', 'Bean cost:')} {formatPrice(monthlyBeanSpendVnd)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddMonthlyKg}
              className="px-4 py-2.5 rounded-lg bg-[#C6A667] hover:bg-[#d7b97b] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t(`Đặt ${monthlyKg} kg ngay`, `Order ${monthlyKg} kg`)}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
