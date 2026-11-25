import React, { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { GameAnalyticsResponse, GameKey } from '../../lib/gamesCatalog';

const SHORT_GAME_LABELS: Record<GameKey, string> = {
  wheel: 'Vòng Quay',
  blockblast: 'Block Blast',
  cubeaway: 'Cube Away 3D',
  candysaga: 'Candy Saga',
  shake: 'Lắc Máy',
  fortune: 'Xin Xăm',
  quiz: 'Gu 7 Cá Tính',
  memory: 'Lật Thẻ',
  harvest: 'Hứng Hạt',
  mystery: 'Hộp Bí Ẩn',
};

const REWARD_BAR_COLORS = ['#00552B', '#C6A667', '#16A34A', '#0284C7', '#9333EA'];

export const AdminGamesAnalytics: React.FC = () => {
  const { apiFetch } = useStore();
  const [days, setDays] = useState<'7' | '14' | '30' | 'all'>('14');
  const [data, setData] = useState<GameAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/games/analytics?days=${days}`);
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || 'Không thể tải dữ liệu phân tích.');
        return;
      }
      const d = (await res.json()) as GameAnalyticsResponse;
      setData(d);
    } catch {
      setError('Lỗi kết nối máy chủ phân tích.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch, days]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const formatVnd = (n: number) => `${Math.round(Number(n || 0)).toLocaleString('vi-VN')}₫`;

  const chartByGameData = (data?.byGame || []).map((g) => ({
    name: SHORT_GAME_LABELS[g.game_key] || g.title_vi,
    plays: g.plays,
    wins: g.wins,
    redeemedOrders: g.redeemedOrders,
    conversionRatePct: g.conversionRatePct,
  }));

  return (
    <div className="space-y-6">
      {/* Toolbar: Date Range Filter & Refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#111111] dark:text-[#F8F5EF] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />
            <span>Hiệu Quả Tương Tác & Tỷ Lệ Chuyển Đổi Đơn Hàng</span>
          </h3>
          <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-0.5">
            Theo dõi số lượt chơi, tỷ lệ trúng thưởng, quy đổi mã/quà tặng thành đơn hàng thật và doanh thu tạo ra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10">
            {(
              [
                { id: '7', label: '7 ngày' },
                { id: '14', label: '14 ngày' },
                { id: '30', label: '30 ngày' },
                { id: 'all', label: 'Tất cả' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDays(opt.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  days === opt.id
                    ? 'bg-[#00552B] text-white'
                    : 'text-[#202020]/70 dark:text-[#F1EFEA]/70 hover:text-[#111111] dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-300 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-700/40 text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 animate-pulse"
            />
          ))}
        </div>
      ) : data ? (
        <>
          {/* 4-Column KPI Strip */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-1">
              <div className="text-xs font-medium text-[#202020]/65 dark:text-[#F1EFEA]/65">Tổng lượt chơi</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#111111] dark:text-[#F8F5EF]">
                {data.summary.totalPlays.toLocaleString('vi-VN')}
              </div>
              <div className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
                {data.summary.uniquePlayers.toLocaleString('vi-VN')} người chơi ·{' '}
                {data.summary.totalCheckins.toLocaleString('vi-VN')} lượt điểm danh
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-1">
              <div className="text-xs font-medium text-[#202020]/65 dark:text-[#F1EFEA]/65">Tỷ lệ trúng quà</div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#00552B] dark:text-[#C6A667]">
                {data.summary.winRatePct}%
              </div>
              <div className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
                {data.summary.totalWins.toLocaleString('vi-VN')} lượt phát thưởng thành công
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-1">
              <div className="text-xs font-medium text-[#202020]/65 dark:text-[#F1EFEA]/65">
                Tỷ lệ chuyển đổi mua hàng
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#16A34A] dark:text-emerald-400">
                {data.summary.conversionRatePct}%
              </div>
              <div className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
                {data.summary.totalRedeemedOrders}/{data.summary.totalRedeemableClaims} mã/quà đã gắn đơn hàng
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-1">
              <div className="text-xs font-medium text-[#202020]/65 dark:text-[#F1EFEA]/65">
                Doanh thu đơn gắn mã Game
              </div>
              <div className="font-mono text-2xl font-bold tabular-nums text-[#111111] dark:text-[#F8F5EF]">
                {formatVnd(data.summary.attributedRevenueVnd)}
              </div>
              <div className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
                {data.summary.totalPointsSpent.toLocaleString('vi-VN')} điểm đã tiêu để chơi thêm
              </div>
            </div>
          </div>

          {data.summary.totalPlays === 0 && (
            <div className="p-5 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 flex flex-wrap items-center justify-between gap-3">
              <span>
                Chưa có lượt chơi nào được ghi nhận trong khoảng thời gian đã chọn. Khi thành viên tham gia trên trang{' '}
                <strong>/play</strong> và áp dụng mã khi thanh toán, biểu đồ và tỷ lệ chuyển đổi sẽ cập nhật theo thời gian thực.
              </span>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Chart 1: Daily Plays & Conversions Trend */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-[#F8F5EF]">
                  Xu Hướng Lượt Chơi & Quy Đổi Theo Ngày
                </h4>
                <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                  So sánh tổng lượt chơi, lượt trúng quà và đơn hàng áp dụng mã thưởng theo ngày
                </p>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.dailySeries} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="roarPlaysFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00552B" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#00552B" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="roarConvFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C6A667" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#C6A667" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111814',
                        borderColor: '#C6A667',
                        borderRadius: '10px',
                        color: '#F8F5EF',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area
                      type="monotone"
                      dataKey="plays"
                      name="Lượt chơi"
                      stroke="#00552B"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#roarPlaysFill)"
                    />
                    <Area
                      type="monotone"
                      dataKey="wins"
                      name="Trúng thưởng"
                      stroke="#16A34A"
                      strokeWidth={1.8}
                      fillOpacity={0.12}
                      fill="#16A34A"
                    />
                    <Area
                      type="monotone"
                      dataKey="conversions"
                      name="Đơn quy đổi"
                      stroke="#C6A667"
                      strokeWidth={2.2}
                      fillOpacity={1}
                      fill="url(#roarConvFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Plays vs Conversions by Game */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-[#F8F5EF]">
                  So Sánh Lượt Chơi & Chuyển Đổi Theo Từng Mini-Game
                </h4>
                <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                  Mức độ thu hút người chơi và số đơn quy đổi thành công của 7 trò chơi
                </p>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartByGameData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111814',
                        borderColor: '#C6A667',
                        borderRadius: '10px',
                        color: '#F8F5EF',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="plays" name="Lượt chơi" fill="#00552B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="wins" name="Lượt trúng" fill="#16A34A" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="redeemedOrders" name="Đơn mua hàng" fill="#C6A667" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Chart 3 + Performance Matrix */}
          <div className="grid lg:grid-cols-[0.9fr_1.3fr] gap-6">
            <div className="p-5 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-[#F8F5EF]">
                  Hiệu Quả Theo Loại Phần Thưởng
                </h4>
                <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                  Số phần thưởng đã phát vs. đã sử dụng khi đặt hàng
                </p>
              </div>
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byRewardType} layout="vertical" margin={{ top: 6, right: 18, left: 12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis dataKey="label" type="category" width={92} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111814',
                        borderColor: '#C6A667',
                        borderRadius: '10px',
                        color: '#F8F5EF',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="issued" name="Đã phát" radius={[0, 4, 4, 0]}>
                      {data.byRewardType.map((entry, idx) => (
                        <Cell key={entry.reward_type} fill={REWARD_BAR_COLORS[idx % REWARD_BAR_COLORS.length]} />
                      ))}
                    </Bar>
                    <Bar dataKey="redeemed" name="Đã dùng" fill="#C6A667" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Table Per Game */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-[#111111] dark:text-[#F8F5EF]">
                  Bảng Chỉ Số Chi Tiết Theo Từng Trò Chơi
                </h4>
                <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                  Tỷ lệ chuyển đổi = Số đơn áp dụng mã/quà chia cho tổng mã/quà có thể quy đổi của game đó
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-[#202020]/10 dark:border-white/10 text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65">
                    <tr>
                      <th className="py-2 pr-3 font-semibold">Mini-game</th>
                      <th className="py-2 px-2 text-right font-semibold">Lượt chơi</th>
                      <th className="py-2 px-2 text-right font-semibold">Người chơi</th>
                      <th className="py-2 px-2 text-right font-semibold">Trúng quà</th>
                      <th className="py-2 px-2 text-right font-semibold">Đơn đổi mã</th>
                      <th className="py-2 px-2 text-right font-semibold">Chuyển đổi</th>
                      <th className="py-2 pl-2 text-right font-semibold">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202020]/8 dark:divide-white/8 tabular-nums">
                    {data.byGame.map((row) => (
                      <tr key={row.game_key} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 pr-3 font-semibold text-[#111111] dark:text-[#F8F5EF] truncate max-w-[160px]">
                          {SHORT_GAME_LABELS[row.game_key] || row.title_vi}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{row.plays.toLocaleString('vi-VN')}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{row.uniquePlayers.toLocaleString('vi-VN')}</td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          {row.wins} ({row.winRatePct}%)
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">
                          {row.redeemedOrders}/{row.redeemableClaims}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-[#00552B] dark:text-[#C6A667]">
                          {row.conversionRatePct}%
                        </td>
                        <td className="py-2.5 pl-2 text-right font-mono">{formatVnd(row.attributedRevenueVnd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
