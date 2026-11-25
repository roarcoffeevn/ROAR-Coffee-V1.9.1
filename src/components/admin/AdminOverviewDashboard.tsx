import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowUpRight,
  Briefcase,
  FileEdit,
  FileText,
  Gamepad2,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { localizeOrderStatus } from '../../lib/i18nHelpers';
import { hasAdminPermission, type AdminPermission } from '../../lib/rbac';

type CmsSection = AdminPermission | 'menus' | 'hero' | 'games';

interface DailyPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
  gamePlays: number;
  newMembers: number;
}

export interface AdminOverviewPayload {
  metrics: {
    revenue: number;
    totalOrders: number;
    avgOrderValue: number;
    completedOrders?: number;
    pendingOrders?: number;
    members: number;
    b2bInquiries: number;
    newsletterCount?: number;
    products: number;
    activeProducts?: number;
    articles: number;
    mediaAssets?: number;
    pointsIssued: number;
    pointsRedeemed?: number;
    totalGamePlays?: number;
    gamePlayers?: number;
    gameClaims?: number;
  };
  dailyTrend?: DailyPoint[];
  orderStatusBreakdown?: Array<{ status: string; count: number; revenue: number }>;
  categoryMix?: Array<{ category: string; productCount: number; unitsSold: number; revenue: number }>;
  paymentBreakdown?: Array<{ method: string; count: number; revenue: number }>;
  memberTiers?: Array<{ tier: string; count: number }>;
  b2bStatusBreakdown?: Array<{ status: string; count: number }>;
  topGames?: Array<{ game_key: string; plays: number; wins: number }>;
  productPerformance?: Array<{
    sku: string;
    product_name_vi: string;
    product_name_en: string;
    units_sold: number;
    revenue: number;
  }>;
  recentOrders?: Array<{
    id: number;
    order_number: string;
    customer_name: string;
    total: number;
    order_status: string;
    payment_status: string;
    created_at: string;
  }>;
  lowStockProducts?: Array<{
    id: number;
    sku: string;
    name_vi: string;
    name_en: string;
    inventory: number;
    category: string;
  }>;
  auditLogs?: any[];
}

interface AdminOverviewDashboardProps {
  overview: AdminOverviewPayload | null;
  user: any;
  onRefresh: () => Promise<void> | void;
  onSelectSection: (section: CmsSection) => void;
  onCreateNewProduct: () => void;
}

const CHART_PALETTE = ['#00552B', '#C6A667', '#2E7D5B', '#7C5A3C', '#0284C7', '#64748B', '#D97706'];

const CATEGORY_NAMES: Record<string, { vi: string; en: string }> = {
  roasted: { vi: 'Rang xay', en: 'Roasted Ground' },
  roasted_beans: { vi: 'Hạt rang', en: 'Roasted Beans' },
  instant: { vi: 'Hòa tan', en: 'Instant' },
  pepper: { vi: 'Tiêu Tây Nguyên', en: 'Highland Pepper' },
  green_bean: { vi: 'Nhân xanh B2B', en: 'Green Coffee' },
};

const PAYMENT_NAMES: Record<string, { vi: string; en: string }> = {
  bank_transfer: { vi: 'Chuyển khoản / QR', en: 'Bank Transfer / QR' },
  cod: { vi: 'Thanh toán COD', en: 'Cash on Delivery' },
  wallet: { vi: 'Ví ROAR Pay', en: 'ROAR Wallet' },
  vnpay: { vi: 'VNPay / Thẻ', en: 'VNPay / Card' },
};

const GAME_SHORT_NAMES: Record<string, { vi: string; en: string }> = {
  wheel: { vi: 'Vòng Quay', en: 'Lucky Wheel' },
  blockblast: { vi: 'Block Blast', en: 'Block Blast' },
  cubeaway: { vi: 'Cube Away 3D', en: 'Cube Away 3D' },
  candysaga: { vi: 'Candy Saga', en: 'Candy Saga' },
  shake: { vi: 'Lắc Máy', en: 'Shake & Win' },
  fortune: { vi: 'Xin Xăm', en: 'Fortune Stick' },
  quiz: { vi: 'Gu 7 Vị', en: 'Taste Quiz' },
  memory: { vi: 'Lật Thẻ', en: 'Memory Match' },
  harvest: { vi: 'Hứng Hạt', en: 'Harvest' },
  mystery: { vi: 'Hộp Bí Ẩn', en: 'Mystery Box' },
};

const formatCompactVnd = (value: number): string => {
  const v = Number(value || 0);
  if (v >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return `${v}`;
};

export const AdminOverviewDashboard: React.FC<AdminOverviewDashboardProps> = ({
  overview,
  user,
  onRefresh,
  onSelectSection,
  onCreateNewProduct,
}) => {
  const { lang, t } = useI18n();
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(14);
  const [trendMode, setTrendMode] = useState<'commerce' | 'community'>('commerce');
  const [donutMode, setDonutMode] = useState<'orders' | 'categories' | 'payments'>('orders');
  const [refreshing, setRefreshing] = useState(false);

  const greetingText = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return t('Chào buổi sáng', 'Good morning');
    if (hr < 18) return t('Chào buổi chiều', 'Good afternoon');
    return t('Chào buổi tối', 'Good evening');
  }, [t]);

  const trendSlice = useMemo(() => {
    const raw = overview?.dailyTrend || [];
    if (raw.length === 0) return [];
    return raw.slice(-rangeDays);
  }, [overview?.dailyTrend, rangeDays]);

  const sparklineData = useMemo(() => {
    const raw = overview?.dailyTrend || [];
    return raw.slice(-14);
  }, [overview?.dailyTrend]);

  const donutData = useMemo(() => {
    if (!overview) return [];
    if (donutMode === 'orders') {
      return (overview.orderStatusBreakdown || []).map((row, idx) => ({
        name: localizeOrderStatus(row.status, lang),
        value: Number(row.count || 0),
        extra: `${Number(row.revenue || 0).toLocaleString()} ₫`,
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
      }));
    }
    if (donutMode === 'categories') {
      return (overview.categoryMix || []).map((row, idx) => {
        const lbl = CATEGORY_NAMES[row.category];
        const hasSales = Number(row.revenue || 0) > 0;
        return {
          name: lbl ? (lang === 'en' ? lbl.en : lbl.vi) : row.category,
          value: hasSales ? Number(row.revenue) : Number(row.productCount || 0),
          extra: hasSales
            ? `${row.unitsSold} ${t('SP đã bán', 'sold')}`
            : `${row.productCount} ${t('SP danh mục', 'SKUs')}`,
          color: CHART_PALETTE[idx % CHART_PALETTE.length],
        };
      });
    }
    return (overview.paymentBreakdown || []).map((row, idx) => {
      const lbl = PAYMENT_NAMES[row.method];
      return {
        name: lbl ? (lang === 'en' ? lbl.en : lbl.vi) : row.method,
        value: Number(row.count || 0),
        extra: `${Number(row.revenue || 0).toLocaleString()} ₫`,
        color: CHART_PALETTE[idx % CHART_PALETTE.length],
      };
    });
  }, [overview, donutMode, lang, t]);

  const donutTotal = useMemo(
    () => donutData.reduce((acc, item) => acc + Number(item.value || 0), 0),
    [donutData]
  );

  const skuBarData = useMemo(() => {
    return (overview?.productPerformance || []).slice(0, 6).map((item) => {
      const rawName = lang === 'en' ? item.product_name_en : item.product_name_vi || item.product_name_en;
      return {
        sku: item.sku,
        shortName: rawName.length > 22 ? `${rawName.slice(0, 21)}…` : rawName,
        fullName: rawName,
        revenue: Number(item.revenue || 0),
        units: Number(item.units_sold || 0),
      };
    });
  }, [overview?.productPerformance, lang]);

  const tierChartData = useMemo(() => {
    return (overview?.memberTiers || []).map((row, idx) => ({
      tier: row.tier.replace('ROAR ', ''),
      fullTier: row.tier,
      count: Number(row.count || 0),
      fill: CHART_PALETTE[idx % CHART_PALETTE.length],
    }));
  }, [overview?.memberTiers]);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      window.setTimeout(() => setRefreshing(false), 300);
    }
  };

  const tooltipStyle: React.CSSProperties = {
    backgroundColor: '#131D18',
    border: '1px solid rgba(198, 166, 103, 0.45)',
    borderRadius: '10px',
    color: '#F8F5EF',
    fontSize: '12px',
    boxShadow: '0 10px 24px -8px rgba(0,0,0,0.35)',
  };

  if (!overview) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 h-80 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          <div className="lg:col-span-4 h-80 rounded-2xl bg-white border border-slate-200 animate-pulse" />
        </div>
      </div>
    );
  }

  const m = overview.metrics;
  const completionRate =
    m.totalOrders > 0 ? Math.round(((m.completedOrders || 0) / m.totalOrders) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* 1. CALM EXECUTIVE HEADER + QUICK ACTIONS */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0F271C] via-[#133223] to-[#1A241E] text-[#F8F5EF] p-4 sm:p-6 border border-[#C6A667]/25">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium tracking-wider uppercase text-[#C6A667]">
              ROAR COFFEE · {t('Bảng điều hành tổng quan', 'Executive Workspace')}
            </p>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              {greetingText}, {user?.fullName || t('Quản trị viên', 'Admin')}
            </h2>
            <p className="text-xs text-[#F8F5EF]/70">
              {t(
                `${m.pendingOrders || 0} đơn đang xử lý · ${m.activeProducts || m.products} sản phẩm đang bán · ${m.totalGamePlays || 0} lượt chơi Play & Win`,
                `${m.pendingOrders || 0} active orders · ${m.activeProducts || m.products} live products · ${m.totalGamePlays || 0} game plays`
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Range Segmented Filter */}
            <div className="flex items-center p-1 rounded-xl bg-black/25 border border-white/10 text-xs">
              {([7, 14, 30] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setRangeDays(d)}
                  className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    rangeDays === d
                      ? 'bg-[#C6A667] text-[#111111]'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {d} {t('ngày', 'd')}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleRefreshClick}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/18 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t('Làm mới', 'Refresh')}</span>
            </button>

            {hasAdminPermission(user, 'products') && (
              <button
                type="button"
                onClick={onCreateNewProduct}
                className="px-3.5 py-2 rounded-xl bg-[#C6A667] hover:bg-[#b89757] text-[#111111] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('Thêm Sản phẩm', 'New Product')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Workspace Shortcuts */}
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
          {hasAdminPermission(user, 'orders') && (
            <button
              type="button"
              onClick={() => onSelectSection('orders')}
              className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-[#F8F5EF] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C6A667]" />
              <span>{t('Đơn hàng', 'Orders')}</span>
            </button>
          )}
          {hasAdminPermission(user, 'pages') && (
            <button
              type="button"
              onClick={() => onSelectSection('pages')}
              className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-[#F8F5EF] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <FileEdit className="w-3.5 h-3.5 text-[#C6A667]" />
              <span>{t('Trang con', 'Pages')}</span>
            </button>
          )}
          {hasAdminPermission(user, 'posts') && (
            <button
              type="button"
              onClick={() => onSelectSection('posts')}
              className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-[#F8F5EF] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-[#C6A667]" />
              <span>{t('Bài viết', 'Posts')}</span>
            </button>
          )}
          {hasAdminPermission(user, 'media') && (
            <button
              type="button"
              onClick={() => onSelectSection('media')}
              className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-[#F8F5EF] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#C6A667]" />
              <span>{t('Thư viện ảnh', 'Media')}</span>
            </button>
          )}
          {hasAdminPermission(user, 'promotions') && (
            <button
              type="button"
              onClick={() => onSelectSection('games')}
              className="px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 text-[#F8F5EF] inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-[#C6A667]" />
              <span>{t('Game & Quà', 'Games')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. 4-COLUMN KPI CARDS WITH SILKY SPARKLINES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
        {/* KPI 1: Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-500">{t('Tổng doanh thu', 'Gross Revenue')}</span>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 truncate">
                {Number(m.revenue || 0).toLocaleString()} ₫
              </p>
            </div>
            <span className="w-8 h-8 rounded-xl bg-[#00552B]/8 text-[#00552B] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="h-11 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpiRevSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00552B" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#00552B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#00552B"
                  strokeWidth={2}
                  fill="url(#kpiRevSpark)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
            {t('TB đơn:', 'Avg order:')} {Number(m.avgOrderValue || 0).toLocaleString()} ₫
          </p>
        </div>

        {/* KPI 2: Orders & Fulfillment */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-500">{t('Đơn hàng & Vận hành', 'Orders & Fulfillment')}</span>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {m.totalOrders} <span className="text-sm font-semibold text-slate-500">{t('đơn', 'orders')}</span>
              </p>
            </div>
            <span className="w-8 h-8 rounded-xl bg-amber-500/12 text-amber-700 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="h-11 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpiOrdSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C6A667" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#C6A667" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#C6A667"
                  strokeWidth={2}
                  fill="url(#kpiOrdSpark)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
            {completionRate}% {t('hoàn tất', 'done')} · {m.pendingOrders || 0} {t('đang xử lý', 'active')}
          </p>
        </div>

        {/* KPI 3: Members & Loyalty */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-500">{t('Thành viên & Điểm', 'Members & Loyalty')}</span>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {m.members} <span className="text-sm font-semibold text-slate-500">{t('khách', 'members')}</span>
              </p>
            </div>
            <span className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="h-11 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpiMemSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284C7" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0284C7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="newMembers"
                  stroke="#0284C7"
                  strokeWidth={2}
                  fill="url(#kpiMemSpark)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
            +{Number(m.pointsIssued || 0).toLocaleString()} {t('điểm cấp', 'pts issued')} · {m.newsletterCount || 0} {t('đăng ký tin', 'subs')}
          </p>
        </div>

        {/* KPI 4: Games & B2B */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 flex flex-col justify-between gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-500">{t('Game & Đối tác B2B', 'Play & Win · B2B')}</span>
              <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
                {Number(m.totalGamePlays || 0).toLocaleString()}{' '}
                <span className="text-sm font-semibold text-slate-500">{t('lượt', 'plays')}</span>
              </p>
            </div>
            <span className="w-8 h-8 rounded-xl bg-emerald-500/12 text-[#00552B] flex items-center justify-center shrink-0">
              <Gamepad2 className="w-4 h-4" />
            </span>
          </div>
          <div className="h-11 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="kpiGameSpark" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2E7D5B" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2E7D5B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="gamePlays"
                  stroke="#2E7D5B"
                  strokeWidth={2}
                  fill="url(#kpiGameSpark)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
            {m.b2bInquiries} {t('hồ sơ B2B', 'B2B leads')} · {m.gameClaims || 0} {t('quà game', 'claims')}
          </p>
        </div>
      </div>

      {/* 3. PRIMARY CHARTS: TREND CURVE (8 COLS) + DONUT BREAKDOWN (4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Daily Revenue / Orders / Engagement Curve */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t(`Nhịp Tăng Trưởng ${rangeDays} Ngày Gần Nhất`, `${rangeDays}-Day Performance Rhythm`)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {trendMode === 'commerce'
                  ? t('Biểu đồ doanh thu hàng ngày và số lượng đơn phát sinh', 'Daily net order revenue & order volume')
                  : t('Biểu đồ lượt tham gia Play & Win và thành viên mới đăng ký', 'Daily Play & Win engagement & member signups')}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setTrendMode('commerce')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  trendMode === 'commerce' ? 'bg-white text-[#00552B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('Doanh thu & Đơn', 'Revenue & Orders')}
              </button>
              <button
                type="button"
                onClick={() => setTrendMode('community')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  trendMode === 'community' ? 'bg-white text-[#00552B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('Game & Thành viên', 'Games & Members')}
              </button>
            </div>
          </div>

          <div className="h-[260px] sm:h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {trendMode === 'commerce' ? (
                <AreaChart data={trendSlice} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roarOverviewRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00552B" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#00552B" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => formatCompactVnd(Number(v))}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any, name: any) => [
                      name === 'revenue'
                        ? `${Number(val || 0).toLocaleString()} ₫`
                        : `${Number(val || 0)} ${t('đơn', 'orders')}`,
                      name === 'revenue' ? t('Doanh thu', 'Revenue') : t('Số đơn', 'Orders'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="#00552B"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#roarOverviewRev)"
                  />
                </AreaChart>
              ) : (
                <AreaChart data={trendSlice} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="roarOverviewPlays" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D5B" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#2E7D5B" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="roarOverviewMembers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C6A667" stopOpacity={0.36} />
                      <stop offset="95%" stopColor="#C6A667" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={34} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(val: any, name: any) => [
                      Number(val || 0).toLocaleString(),
                      name === 'gamePlays' ? t('Lượt chơi game', 'Game plays') : t('Thành viên mới', 'New members'),
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="gamePlays"
                    name="gamePlays"
                    stroke="#2E7D5B"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#roarOverviewPlays)"
                  />
                  <Area
                    type="monotone"
                    dataKey="newMembers"
                    name="newMembers"
                    stroke="#C6A667"
                    strokeWidth={2.2}
                    fillOpacity={1}
                    fill="url(#roarOverviewMembers)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Donut Chart: Orders / Categories / Payment */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col justify-between gap-3">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t('Phân Bổ Cơ Cấu', 'Portfolio Mix')}
              </h3>
              <Layers className="w-4 h-4 text-[#00552B]" />
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-[11px]">
              {(
                [
                  { id: 'orders', label: t('Trạng thái đơn', 'Orders') },
                  { id: 'categories', label: t('Danh mục', 'Catalog') },
                  { id: 'payments', label: t('Thanh toán', 'Payments') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDonutMode(tab.id)}
                  className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap truncate ${
                    donutMode === tab.id ? 'bg-white text-[#00552B] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {donutData.length > 0 && donutTotal > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 items-center">
              <div className="h-[175px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={74}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {donutData.map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any) => [
                        donutMode === 'categories' && Number(val) >= 1000
                          ? `${Number(val).toLocaleString()} ₫`
                          : Number(val).toLocaleString(),
                        '',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-medium text-slate-400">
                    {donutMode === 'categories' ? t('Tổng giá trị', 'Total') : t('Tổng số', 'Count')}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    {donutTotal >= 1_000_000 ? `${formatCompactVnd(donutTotal)}₫` : donutTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {donutData.map((item) => {
                  const pct = donutTotal > 0 ? Math.round((item.value / donutTotal) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-700 truncate">{item.name}</span>
                      </span>
                      <span className="font-mono tabular-nums text-slate-500 shrink-0">
                        {pct}% · {item.extra}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              {t('Chưa có dữ liệu phân bổ ở mục này.', 'No breakdown data recorded yet.')}
            </div>
          )}
        </div>
      </div>

      {/* 4. SECONDARY ANALYTICS: TOP SKU BAR CHART + LOYALTY & MINI-GAMES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Top SKUs Horizontal Bar Chart + Crisp Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t('Sản Phẩm Dẫn Đầu Doanh Số', 'Top Performing SKUs')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('So sánh doanh thu và sản lượng bán ra theo từng mã hàng', 'Revenue and unit volume across leading SKUs')}
              </p>
            </div>
            {hasAdminPermission(user, 'products') && (
              <button
                type="button"
                onClick={() => onSelectSection('products')}
                className="text-xs font-semibold text-[#00552B] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{t('Kho sản phẩm', 'Catalog')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {skuBarData.length > 0 ? (
            <>
              <div className="h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={skuBarData} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" horizontal={false} />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatCompactVnd(Number(v))}
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      width={132}
                      tick={{ fontSize: 11, fill: '#334155' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any, _name: any, props: any) => [
                        `${Number(val || 0).toLocaleString()} ₫ (${props?.payload?.units || 0} ${t('SP', 'units')})`,
                        props?.payload?.sku || 'SKU',
                      ]}
                    />
                    <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={18}>
                      {skuBarData.map((_, idx) => (
                        <Cell key={idx} fill={idx === 0 ? '#00552B' : idx === 1 ? '#C6A667' : '#2E7D5B'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="overflow-x-auto border-t border-slate-100 pt-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="py-1.5 pr-2 font-medium">SKU</th>
                      <th className="py-1.5 pr-2 font-medium">{t('Sản phẩm', 'Product')}</th>
                      <th className="py-1.5 text-right font-medium">{t('SL', 'Qty')}</th>
                      <th className="py-1.5 text-right font-medium">{t('Doanh thu', 'Revenue')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(overview.productPerformance || []).slice(0, 5).map((row) => (
                      <tr key={row.sku} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 pr-2 font-mono text-[#00552B] font-semibold whitespace-nowrap">{row.sku}</td>
                        <td className="py-2 pr-2 truncate max-w-[160px] sm:max-w-none text-slate-700">
                          {lang === 'en' ? row.product_name_en : row.product_name_vi || row.product_name_en}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-slate-700">{row.units_sold}</td>
                        <td className="py-2 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                          {Number(row.revenue || 0).toLocaleString()} ₫
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-14 text-center space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">
                {t('Chưa có dữ liệu đơn hàng để xếp hạng SKU bán chạy.', 'No order items yet to rank top SKUs.')}
              </p>
            </div>
          )}
        </div>

        {/* Member Tiers + Play & Win Top Games + Catalog/CMS Snapshot */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {t('Phân Tầng Thành Viên & Mini-Game', 'Loyalty Tiers & Game Pulse')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('Cơ cấu hạng thẻ ROAR và mức độ tham gia trò chơi', 'Membership distribution & interactive game activity')}
                </p>
              </div>
              {hasAdminPermission(user, 'customers') && (
                <button
                  type="button"
                  onClick={() => onSelectSection('customers')}
                  className="text-xs font-semibold text-[#00552B] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <span>{t('Khách hàng', 'Customers')}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {tierChartData.length > 0 ? (
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tierChartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                    <XAxis dataKey="tier" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val: any, _n: any, props: any) => [
                        `${Number(val || 0)} ${t('thành viên', 'members')}`,
                        props?.payload?.fullTier || '',
                      ]}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
                      {tierChartData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                {t('Chưa có dữ liệu thành viên.', 'No member data yet.')}
              </div>
            )}
          </div>

          {/* Top Mini-Games Mini Progress Bars */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">
                {t('Top trò chơi được yêu thích', 'Most Played Mini-Games')}
              </span>
              {hasAdminPermission(user, 'promotions') && (
                <button
                  type="button"
                  onClick={() => onSelectSection('games')}
                  className="text-[#00552B] font-semibold hover:underline cursor-pointer"
                >
                  {t('Phân tích Game', 'Game Analytics')}
                </button>
              )}
            </div>

            {(overview.topGames || []).length > 0 ? (
              <div className="space-y-2">
                {(overview.topGames || []).slice(0, 4).map((g, idx) => {
                  const maxPlays = Math.max(1, ...(overview.topGames || []).map((x) => Number(x.plays || 0)));
                  const widthPct = Math.max(8, Math.round((Number(g.plays || 0) / maxPlays) * 100));
                  const labelObj = GAME_SHORT_NAMES[g.game_key];
                  const label = labelObj ? (lang === 'en' ? labelObj.en : labelObj.vi) : g.game_key;
                  return (
                    <div key={g.game_key} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="font-mono tabular-nums text-slate-500">
                          {g.plays} {t('lượt', 'plays')} · {g.wins} {t('thưởng', 'wins')}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: idx === 0 ? '#00552B' : idx === 1 ? '#C6A667' : '#3D8B68',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                {t('Chưa có lượt chơi mới. Lượt chơi trên /play sẽ hiển thị tại đây.', 'Play activity from /play will appear here.')}
              </p>
            )}
          </div>

          {/* Quiet CMS & B2B Summary Row */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50">
              <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">{m.products}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{t('Sản phẩm', 'Products')}</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">{m.articles}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{t('Bài viết', 'Articles')}</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">{m.mediaAssets || 0}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{t('Media', 'Media')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. OPERATIONAL PULSE: RECENT ORDERS + LOW STOCK / B2B + AUDIT LOG */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Orders & Inventory Watch */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t('Đơn Hàng Gần Nhất', 'Recent Orders')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('Theo dõi nhanh các đơn vừa phát sinh trên cửa hàng', 'Latest storefront checkouts and statuses')}
              </p>
            </div>
            {hasAdminPermission(user, 'orders') && (
              <button
                type="button"
                onClick={() => onSelectSection('orders')}
                className="text-xs font-semibold text-[#00552B] hover:underline inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{t('Quản lý đơn hàng', 'All Orders')}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {(overview.recentOrders || []).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-2 pr-2 font-medium">{t('Mã đơn', 'Order')}</th>
                    <th className="py-2 pr-2 font-medium">{t('Khách hàng', 'Customer')}</th>
                    <th className="py-2 pr-2 font-medium">{t('Trạng thái', 'Status')}</th>
                    <th className="py-2 text-right font-medium">{t('Giá trị', 'Total')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(overview.recentOrders || []).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 pr-2 font-mono font-semibold text-[#00552B] whitespace-nowrap">
                        {ord.order_number}
                      </td>
                      <td className="py-2.5 pr-2 truncate max-w-[130px] sm:max-w-none text-slate-700">
                        {ord.customer_name}
                      </td>
                      <td className="py-2.5 pr-2 whitespace-nowrap text-slate-600">
                        {localizeOrderStatus(ord.order_status, lang)}
                      </td>
                      <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                        {Number(ord.total || 0).toLocaleString()} ₫
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">
              {t('Chưa có đơn hàng nào.', 'No orders placed yet.')}
            </p>
          )}

          {/* Low Stock / B2B Summary Footer */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#00552B]" />
              <span>
                {t('B2B & Xuất khẩu:', 'B2B Pipeline:')}{' '}
                <strong className="font-mono text-slate-800">{m.b2bInquiries}</strong> {t('yêu cầu', 'leads')}
              </span>
            </span>
            {(overview.lowStockProducts || []).length > 0 ? (
              <span className="text-amber-700 font-medium">
                {t(
                  `${overview.lowStockProducts!.length} SP tồn kho ≤ 15`,
                  `${overview.lowStockProducts!.length} low-stock SKUs (≤15)`
                )}
              </span>
            ) : (
              <span className="text-emerald-700 font-medium">
                {t('Tồn kho đang bán ổn định', 'Catalog inventory healthy')}
              </span>
            )}
          </div>
        </div>

        {/* System Activity Log */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {t('Nhật Ký Hoạt Động', 'Activity Stream')}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('Các thao tác cập nhật mới nhất trong hệ thống', 'Latest administrative actions')}
              </p>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs pr-1">
            {(overview.auditLogs || []).length > 0 ? (
              (overview.auditLogs || []).slice(0, 14).map((log: any) => (
                <div key={log.id} className="py-2.5 flex justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-slate-800 truncate">
                      <span className="font-mono font-semibold text-[#00552B]">{log.action}</span>
                      <span className="text-slate-400"> · </span>
                      <span>
                        {log.entity_type} #{log.entity_id}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{log.actor_email}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[10px] sm:text-[11px] shrink-0 tabular-nums">
                    {String(log.created_at || '').slice(5, 16)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-8 text-center">
                {t('Chưa có nhật ký thao tác nào.', 'No activity recorded yet.')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
