import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Check,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';
import { resolveMediaUrl } from '../../lib/media';

interface InventoryProductRow {
  id: number;
  slug: string;
  sku: string;
  name_vi: string;
  name_en: string;
  category: string;
  price_vnd: number;
  inventory: number;
  low_stock_threshold: number;
  status: string;
  image_key: string;
  sold30d: number;
  daysOfSupply: number | null;
  stockState: 'out' | 'low' | 'healthy';
}

interface InventoryLogRow {
  id: number;
  product_id: number;
  sku: string;
  product_name: string;
  delta: number;
  previous_qty: number;
  new_qty: number;
  reason: string;
  note: string;
  actor_email: string;
  created_at: string;
}

interface AdminInventoryManagerProps {
  onStockChanged?: () => Promise<void> | void;
}

export const AdminInventoryManager: React.FC<AdminInventoryManagerProps> = ({ onStockChanged }) => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    totalSkus: 0,
    totalUnits: 0,
    totalStockValueVnd: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });
  const [items, setItems] = useState<InventoryProductRow[]>([]);
  const [logs, setLogs] = useState<InventoryLogRow[]>([]);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Detailed Adjust Modal
  const [adjustTarget, setAdjustTarget] = useState<InventoryProductRow | null>(null);
  const [exactQty, setExactQty] = useState('');
  const [thresholdDraft, setThresholdDraft] = useState('15');
  const [reasonDraft, setReasonDraft] = useState<'restock' | 'audit_adjust' | 'damaged'>('restock');
  const [noteDraft, setNoteDraft] = useState('');

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/inventory/overview');
      if (res.ok) {
        const d = await res.json();
        if (d.kpis) setKpis(d.kpis);
        setItems(Array.isArray(d.items) ? d.items : []);
        setLogs(Array.isArray(d.logs) ? d.logs : []);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (stateFilter !== 'all' && it.stockState !== stateFilter) return false;
      if (!q) return true;
      return `${it.sku} ${it.name_vi} ${it.name_en} ${it.category}`.toLowerCase().includes(q);
    });
  }, [items, search, stateFilter]);

  const handleQuickDelta = async (item: InventoryProductRow, delta: number) => {
    setBusyId(item.id);
    try {
      const res = await apiFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.id,
          delta,
          reason: delta > 0 ? 'restock' : 'audit_adjust',
          note: delta > 0 ? `Nhập nhanh +${delta} đơn vị` : `Điều chỉnh nhanh ${delta} đơn vị`,
        }),
      });
      if (res.ok) {
        showToast(t(`Đã cập nhật tồn kho ${item.sku}`, `Updated stock for ${item.sku}`));
        await loadOverview();
        await onStockChanged?.();
      }
    } finally {
      setBusyId(null);
    }
  };

  const openAdjustModal = (item: InventoryProductRow) => {
    setAdjustTarget(item);
    setExactQty(String(item.inventory));
    setThresholdDraft(String(item.low_stock_threshold));
    setReasonDraft('restock');
    setNoteDraft('');
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;
    setBusyId(adjustTarget.id);
    try {
      const res = await apiFetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustTarget.id,
          exactQty: Number(exactQty),
          lowStockThreshold: Number(thresholdDraft),
          reason: reasonDraft,
          note: noteDraft.trim() || 'Kiểm kê & cập nhật tồn kho',
        }),
      });
      if (res.ok) {
        showToast(t(`Đã lưu tồn kho & ngưỡng cảnh báo cho ${adjustTarget.sku}`, `Saved inventory settings for ${adjustTarget.sku}`));
        setAdjustTarget(null);
        await loadOverview();
        await onStockChanged?.();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkRestock = async () => {
    setBulkBusy(true);
    try {
      const res = await apiFetch('/api/admin/inventory/bulk-restock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addQty: 50 }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          t(
            `Đã nhập bổ sung +${d.addQty} đơn vị cho ${d.restockedCount} sản phẩm sắp hết hàng!`,
            `Restocked +${d.addQty} units across ${d.restockedCount} low-stock SKUs!`
          )
        );
        await loadOverview();
        await onStockChanged?.();
      }
    } finally {
      setBulkBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">{t('Tổng mã SKU', 'Total SKUs')}</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{kpis.totalSkus}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">{t('Tổng số lượng tồn', 'Total Units in Stock')}</p>
          <p className="text-2xl font-bold font-mono text-[#00552B] mt-1 tabular-nums">
            {kpis.totalUnits.toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">{t('Giá trị tồn kho ước tính', 'Est. Inventory Value')}</p>
          <p className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
            {kpis.totalStockValueVnd.toLocaleString('vi-VN')}₫
          </p>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-4">
          <p className="text-[11px] font-semibold text-amber-700">{t('Sắp hết hàng (Cảnh báo)', 'Low Stock Alerts')}</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">{kpis.lowStockCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4">
          <p className="text-[11px] font-semibold text-red-700">{t('Hết hàng (= 0)', 'Out of Stock')}</p>
          <p className="text-2xl font-bold font-mono text-red-700 mt-1 tabular-nums">{kpis.outOfStockCount}</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Tìm SKU, tên sản phẩm...', 'Search SKU, product...')}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300"
            />
          </div>
          {[
            { id: 'all', vi: 'Tất cả', en: 'All' },
            { id: 'low', vi: `Sắp hết (${kpis.lowStockCount})`, en: `Low (${kpis.lowStockCount})` },
            { id: 'out', vi: `Hết hàng (${kpis.outOfStockCount})`, en: `Out (${kpis.outOfStockCount})` },
            { id: 'healthy', vi: 'Ổn định', en: 'Healthy' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStateFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                stateFilter === tab.id ? 'bg-[#00552B] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {lang === 'en' ? tab.en : tab.vi}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {(kpis.lowStockCount > 0 || kpis.outOfStockCount > 0) && (
            <button
              type="button"
              disabled={bulkBusy}
              onClick={handleBulkRestock}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{bulkBusy ? t('Đang nhập kho...', 'Restocking...') : t('Nhập nhanh +50 cho SKU sắp hết', 'Bulk Restock Low SKUs (+50)')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={loadOverview}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Main Split: Stock Table + Audit Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
          {loading ? (
            <div className="p-10 text-center text-slate-400">{t('Đang tải dữ liệu kho...', 'Loading inventory...')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="p-3 text-left">{t('Sản phẩm & SKU', 'Product & SKU')}</th>
                    <th className="p-3 text-right">{t('Tồn kho', 'Stock')}</th>
                    <th className="p-3 text-right">{t('Ngưỡng báo', 'Alert ≤')}</th>
                    <th className="p-3 text-right">{t('Bán 30 ngày', '30d Sold')}</th>
                    <th className="p-3 text-right">{t('Thao tác kho', 'Quick Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((it) => (
                    <tr key={it.id} className="hover:bg-slate-50/70">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={resolveMediaUrl(it.image_key)}
                            alt={it.name_vi}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 line-clamp-1">{it.name_vi}</p>
                            <p className="text-[11px] font-mono text-slate-500">{it.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            it.stockState === 'out'
                              ? 'text-red-600'
                              : it.stockState === 'low'
                                ? 'text-amber-700'
                                : 'text-[#00552B]'
                          }
                        >
                          {it.inventory}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500 tabular-nums">{it.low_stock_threshold}</td>
                      <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                        <div>{it.sold30d}</div>
                        {it.daysOfSupply !== null && (
                          <div className="text-[10px] text-slate-400">~{it.daysOfSupply}d</div>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            disabled={busyId === it.id}
                            onClick={() => handleQuickDelta(it, 10)}
                            className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-mono font-bold hover:bg-emerald-100 cursor-pointer"
                          >
                            +10
                          </button>
                          <button
                            type="button"
                            disabled={busyId === it.id}
                            onClick={() => handleQuickDelta(it, 50)}
                            className="px-2 py-1 rounded border border-emerald-200 bg-emerald-50 text-emerald-800 font-mono font-bold hover:bg-emerald-100 cursor-pointer"
                          >
                            +50
                          </button>
                          <button
                            type="button"
                            onClick={() => openAdjustModal(it)}
                            className="px-2.5 py-1 rounded border border-slate-200 hover:border-[#00552B] text-slate-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>{t('Kiểm kê', 'Adjust')}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock Movement Log */}
        <div className="xl:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-[#00552B]" />
              {t('Nhật ký Xuất / Nhập Kho', 'Inventory Audit Trail')}
            </h3>
          </div>
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {t('Chưa có biến động xuất/nhập kho nào được ghi nhận.', 'No stock movements logged yet.')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {logs.map((lg) => (
                <div key={lg.id} className="p-3 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-700">{lg.sku}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-bold tabular-nums ${
                        lg.delta >= 0 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {lg.delta >= 0 ? <ArrowUpCircle className="w-3.5 h-3.5" /> : <ArrowDownCircle className="w-3.5 h-3.5" />}
                      {lg.delta > 0 ? `+${lg.delta}` : lg.delta} ({lg.previous_qty} → {lg.new_qty})
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium line-clamp-1">{lg.product_name}</p>
                  <p className="text-[11px] text-slate-500">{lg.note}</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {lg.created_at} · {lg.actor_email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {adjustTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveModal}
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{t('Kiểm kê & Điều chỉnh Tồn kho', 'Adjust Stock & Alert Threshold')}</h3>
                <p className="text-[11px] font-mono text-slate-500">{adjustTarget.sku} · {adjustTarget.name_vi}</p>
              </div>
              <button type="button" onClick={() => setAdjustTarget(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Số lượng tồn mới', 'New Exact Stock')}</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={exactQty}
                  onChange={(e) => setExactQty(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Ngưỡng cảnh báo sắp hết', 'Low-Stock Alert ≤')}</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={thresholdDraft}
                  onChange={(e) => setThresholdDraft(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Lý do điều chỉnh', 'Adjustment Reason')}</label>
              <select
                value={reasonDraft}
                onChange={(e) => setReasonDraft(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="restock">{t('Nhập hàng mới / Mẻ rang mới', 'Restock / Fresh Batch')}</option>
                <option value="audit_adjust">{t('Kiểm kê điều chỉnh tồn thực tế', 'Stock Audit Reconciliation')}</option>
                <option value="damaged">{t('Hao hụt / Hư hỏng / Hàng mẫu', 'Damaged / Sample Deduction')}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Ghi chú phiếu kho', 'Inventory Note')}</label>
              <input
                type="text"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder={t('VD: Nhập lô rang Đắk Lắk ngày 26/11...', 'E.g. Fresh Dak Lak roast batch...')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 font-semibold cursor-pointer"
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={busyId === adjustTarget.id}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white font-semibold cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {t('Lưu phiếu kho', 'Save Stock')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
