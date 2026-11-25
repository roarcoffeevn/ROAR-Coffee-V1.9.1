import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Edit3,
  Gamepad2,
  Gift,
  Headphones,
  Newspaper,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import type { Product } from '../../context/StoreContext';
import {
  DEFAULT_CHECKIN_SCHEDULE,
  type CheckinScheduleDay,
  type GameConfigRecord,
  type GameKey,
  type GameRewardClaimRecord,
  type GameRewardRecord,
  type GameRewardType,
} from '../../lib/gamesCatalog';
import { MediaImage } from '../MediaImage';
import { AdminGamesAnalytics } from './AdminGamesAnalytics';

const GAME_LABELS: Record<GameKey, string> = {
  wheel: 'Vòng Quay May Mắn',
  blockblast: 'ROAR Block Blast · Xếp Khối',
  cubeaway: 'ROAR Cube Away 3D · Giải Khối',
  candysaga: 'ROAR Candy Saga · Kẹo Ngọt 8 Hướng',
  shake: 'Lắc Điện Thoại Săn Quà',
  fortune: 'Xin Xăm Cà Phê Đầu Ngày',
  quiz: 'Trắc Nghiệm Gu 7 Cá Tính',
  memory: 'Lật Thẻ Ghép Đôi',
  harvest: 'Hứng Hạt Tây Nguyên',
  mystery: 'Hộp Quà Bí Ẩn',
};

const REWARD_TYPE_LABELS: Record<GameRewardType, string> = {
  points: 'Điểm thưởng ROAR (Tự động cộng)',
  voucher_percent: 'Mã giảm giá theo % (Single-use)',
  voucher_fixed: 'Mã giảm tiền mặt VNĐ (Single-use)',
  free_shipping: 'Mã Freeship (Miễn phí giao hàng)',
  product_gift: 'Quà tặng Sản phẩm ROAR kèm đơn hàng',
};

interface RewardFormState {
  id?: number;
  game_key: GameKey;
  slot_order: number;
  label_vi: string;
  label_en: string;
  description_vi: string;
  description_en: string;
  reward_type: GameRewardType;
  reward_value: number;
  min_order_value: number;
  max_discount: number;
  gift_product_id: number | null;
  gift_product_slug: string;
  gift_product_name_vi: string;
  gift_product_name_en: string;
  gift_product_variant: string;
  gift_image_key: string;
  weight: number;
  stock_total: number;
  stock_remaining: number;
  color_hex: string;
  badge_vi: string;
  badge_en: string;
  active: number;
}

export const AdminGamesManager: React.FC = () => {
  const { apiFetch, showToast } = useStore();

  const [subTab, setSubTab] = useState<'rewards' | 'analytics' | 'checkin' | 'claims' | 'support_news'>('rewards');
  const [selectedGame, setSelectedGame] = useState<GameKey>('wheel');
  const [configs, setConfigs] = useState<GameConfigRecord[]>([]);
  const [rewards, setRewards] = useState<GameRewardRecord[]>([]);
  const [claims, setClaims] = useState<GameRewardClaimRecord[]>([]);
  const [checkinSchedule, setCheckinSchedule] = useState<CheckinScheduleDay[]>(DEFAULT_CHECKIN_SCHEDULE);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingCheckin, setSavingCheckin] = useState(false);
  const [claimFilter, setClaimFilter] = useState<'all' | 'active' | 'redeemed' | 'fulfilled'>('all');

  const [adminTickets, setAdminTickets] = useState<any[]>([]);
  const [ticketReplyText, setTicketReplyText] = useState<Record<number, string>>({});
  const [newsForm, setNewsForm] = useState({ titleVi: '', titleEn: '', summaryVi: '', summaryEn: '', tag: 'event', pinned: true });
  const [newsItems, setNewsItems] = useState<any[]>([]);

  const [editingCfg, setEditingCfg] = useState<GameConfigRecord | null>(null);
  const [modalReward, setModalReward] = useState<RewardFormState | null>(null);
  const [savingReward, setSavingReward] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gamesRes, prodsRes, ticketsRes, newsRes] = await Promise.all([
        apiFetch('/api/admin/games'),
        apiFetch('/api/admin/products'),
        apiFetch('/api/support/tickets?scope=all'),
        apiFetch('/api/game-news'),
      ]);
      if (gamesRes.ok) {
        const d = await gamesRes.json();
        setConfigs(d.configs || []);
        setRewards(d.rewards || []);
        setClaims(d.claims || []);
        if (Array.isArray(d.checkinSchedule) && d.checkinSchedule.length === 7) {
          setCheckinSchedule(d.checkinSchedule);
        }
      }
      if (prodsRes.ok) {
        const pd = await prodsRes.json();
        setCatalogProducts(pd.products || []);
      }
      if (ticketsRes.ok) {
        const td = await ticketsRes.json();
        setAdminTickets(td.tickets || []);
      }
      if (newsRes.ok) {
        const nd = await newsRes.json();
        setNewsItems(nd.posts || []);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const match = configs.find((c) => c.game_key === selectedGame);
    if (match) setEditingCfg({ ...match });
  }, [configs, selectedGame]);

  const currentRewards = useMemo(
    () =>
      rewards
        .filter((r) => r.game_key === selectedGame)
        .sort((a, b) => a.slot_order - b.slot_order || a.id - b.id),
    [rewards, selectedGame]
  );

  const totalActiveWeight = useMemo(
    () =>
      currentRewards
        .filter((r) => r.active && (r.stock_total < 0 || r.stock_remaining > 0))
        .reduce((acc, r) => acc + Math.max(1, Number(r.weight || 1)), 0),
    [currentRewards]
  );

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCfg) return;
    setSavingConfig(true);
    try {
      const res = await apiFetch(`/api/admin/games/configs/${editingCfg.game_key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCfg),
      });
      if (res.ok) {
        showToast('Đã lưu cấu hình trò chơi thành công');
        await loadAll();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Lỗi lưu cấu hình');
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const openCreateRewardModal = () => {
    const maxSlot = currentRewards.reduce((m, r) => Math.max(m, r.slot_order || 0), 0);
    setModalReward({
      game_key: selectedGame,
      slot_order: maxSlot + 1,
      label_vi: 'Tặng Sản Phẩm ROAR',
      label_en: 'Free ROAR Coffee Gift',
      description_vi: 'Quà tặng kèm miễn phí khi đặt đơn hàng ROAR COFFEE.',
      description_en: 'Complimentary coffee gift attached to your next ROAR order.',
      reward_type: 'product_gift',
      reward_value: 185000,
      min_order_value: 0,
      max_discount: 0,
      gift_product_id: catalogProducts[0]?.id ?? null,
      gift_product_slug: catalogProducts[0]?.slug || '',
      gift_product_name_vi: catalogProducts[0]?.name_vi || '',
      gift_product_name_en: catalogProducts[0]?.name_en || '',
      gift_product_variant: catalogProducts[0]?.variants?.[0]?.label || 'Quà tặng Game',
      gift_image_key: catalogProducts[0]?.image_key || 'product_robusta_house',
      weight: 10,
      stock_total: 30,
      stock_remaining: 30,
      color_hex: '#00552B',
      badge_vi: 'QUÀ TẶNG',
      badge_en: 'GIFT',
      active: 1,
    });
  };

  const openEditOrReplaceModal = (rw: GameRewardRecord) => {
    setModalReward({
      id: rw.id,
      game_key: rw.game_key,
      slot_order: rw.slot_order,
      label_vi: rw.label_vi,
      label_en: rw.label_en,
      description_vi: rw.description_vi,
      description_en: rw.description_en,
      reward_type: rw.reward_type,
      reward_value: rw.reward_value,
      min_order_value: rw.min_order_value,
      max_discount: rw.max_discount,
      gift_product_id: rw.gift_product_id,
      gift_product_slug: rw.gift_product_slug,
      gift_product_name_vi: rw.gift_product_name_vi,
      gift_product_name_en: rw.gift_product_name_en,
      gift_product_variant: rw.gift_product_variant,
      gift_image_key: rw.gift_image_key || 'product_robusta_house',
      weight: rw.weight,
      stock_total: rw.stock_total,
      stock_remaining: rw.stock_remaining,
      color_hex: rw.color_hex || '#00552B',
      badge_vi: rw.badge_vi,
      badge_en: rw.badge_en,
      active: rw.active,
    });
  };

  const handleAttachProductToReward = (productIdStr: string) => {
    if (!modalReward) return;
    const prod = catalogProducts.find((p) => String(p.id) === productIdStr);
    if (!prod) return;
    const defaultVariant = prod.variants?.[0]?.label || prod.moq || 'Standard';
    setModalReward({
      ...modalReward,
      reward_type: 'product_gift',
      gift_product_id: prod.id,
      gift_product_slug: prod.slug,
      gift_product_name_vi: prod.name_vi,
      gift_product_name_en: prod.name_en,
      gift_product_variant: `${defaultVariant} (Quà tặng)`,
      gift_image_key: prod.image_key,
      reward_value: prod.price_vnd || modalReward.reward_value,
      label_vi: `Tặng ${prod.name_vi.replace(/^ROAR COFFEE\s*/i, '').slice(0, 26)}`,
      label_en: `Free ${prod.name_en.replace(/^ROAR COFFEE\s*/i, '').slice(0, 26)}`,
      description_vi: `Tặng kèm miễn phí 1 sản phẩm ${prod.name_vi} khi đặt đơn hàng.`,
      description_en: `Complimentary ${prod.name_en} attached to your order.`,
      badge_vi: 'QUÀ TẶNG',
      badge_en: 'GIFT',
    });
  };

  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalReward) return;
    setSavingReward(true);
    try {
      const isEdit = Boolean(modalReward.id);
      const url = isEdit ? `/api/admin/games/rewards/${modalReward.id}` : '/api/admin/games/rewards';
      const res = await apiFetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modalReward),
      });
      if (res.ok) {
        showToast(isEdit ? 'Đã cập nhật / thay thế phần thưởng thành công' : 'Đã thêm phần thưởng mới');
        setModalReward(null);
        await loadAll();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(d.error || 'Lỗi lưu phần thưởng');
      }
    } finally {
      setSavingReward(false);
    }
  };

  const handleToggleRewardActive = async (rw: GameRewardRecord) => {
    const res = await apiFetch(`/api/admin/games/rewards/${rw.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: rw.active ? 0 : 1 }),
    });
    if (res.ok) {
      showToast(rw.active ? 'Đã ẩn phần thưởng' : 'Đã bật lại phần thưởng');
      await loadAll();
    }
  };

  const handleQuickRestock = async (rw: GameRewardRecord) => {
    const nextTotal = rw.stock_total < 0 ? 30 : rw.stock_total + 20;
    const nextRem = rw.stock_remaining < 0 ? 30 : rw.stock_remaining + 20;
    const res = await apiFetch(`/api/admin/games/rewards/${rw.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_total: nextTotal, stock_remaining: nextRem }),
    });
    if (res.ok) {
      showToast(`Đã bổ sung +20 suất cho "${rw.label_vi}"`);
      await loadAll();
    }
  };

  const handleDeleteReward = async (rw: GameRewardRecord) => {
    if (!window.confirm(`Xóa phần thưởng "${rw.label_vi}" khỏi ${GAME_LABELS[rw.game_key]}?`)) return;
    const res = await apiFetch(`/api/admin/games/rewards/${rw.id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Đã xóa phần thưởng');
      await loadAll();
    }
  };

  const handleSaveCheckinSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCheckin(true);
    try {
      const res = await apiFetch('/api/admin/games/checkin-schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule: checkinSchedule }),
      });
      if (res.ok) {
        showToast('Đã cập nhật lịch thưởng Điểm Danh 7 Ngày');
        await loadAll();
      } else {
        showToast('Lỗi lưu lịch điểm danh');
      }
    } finally {
      setSavingCheckin(false);
    }
  };

  const handleUpdateClaimStatus = async (claimId: number, status: string, note?: string) => {
    const res = await apiFetch(`/api/admin/games/claims/${claimId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(note !== undefined ? { admin_note: note } : {}) }),
    });
    if (res.ok) {
      showToast('Đã cập nhật trạng thái trao thưởng');
      await loadAll();
    }
  };

  const filteredClaims = useMemo(() => {
    if (claimFilter === 'all') return claims;
    return claims.filter((c) => c.status === claimFilter);
  }, [claims, claimFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#202020]/10 dark:border-white/10">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#111111] dark:text-[#F8F5EF] flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-[#00552B] dark:text-[#C6A667]" />
            <span>Quản lý Mini-Game & Thay Thế Quà Tặng Kèm</span>
          </h2>
          <p className="text-xs text-[#202020]/70 dark:text-[#F1EFEA]/70 mt-1">
            Chỉnh sửa, thêm/xóa hoặc thay thế trực tiếp quà tặng sản phẩm, voucher giảm giá, điểm thưởng cho 7 mini-game, lịch điểm danh 7 ngày & theo dõi hiệu quả chuyển đổi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('rewards')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'rewards'
                ? 'bg-[#00552B] text-white'
                : 'bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Kho Quà 7 Mini-Game</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'analytics'
                ? 'bg-[#00552B] text-white'
                : 'bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Thống Kê & Chuyển Đổi</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('checkin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'checkin'
                ? 'bg-[#00552B] text-white'
                : 'bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10'
            }`}
          >
            <CalendarCheck2 className="w-3.5 h-3.5" />
            <span>Điểm Danh 7 Ngày</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('claims')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'claims'
                ? 'bg-[#00552B] text-white'
                : 'bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trúng Thưởng & Giao Quà ({claims.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('support_news')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              subTab === 'support_news'
                ? 'bg-[#00552B] text-white'
                : 'bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>CSKH Trực Tiếp & Tin Game ({adminTickets.length})</span>
          </button>
        </div>
      </div>

      {subTab === 'analytics' ? (
        <AdminGamesAnalytics />
      ) : loading ? (
        <div className="py-10 text-center text-sm text-[#202020]/60 dark:text-[#F1EFEA]/60">Đang tải dữ liệu trò chơi...</div>
      ) : subTab === 'rewards' ? (
        <div className="space-y-6">
          {/* 7 Game Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(GAME_LABELS) as GameKey[]).map((gk) => {
              const cnt = rewards.filter((r) => r.game_key === gk).length;
              const active = selectedGame === gk;
              return (
                <button
                  key={gk}
                  type="button"
                  onClick={() => setSelectedGame(gk)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border whitespace-nowrap ${
                    active
                      ? 'bg-[#C6A667] text-[#111111] border-[#C6A667]'
                      : 'bg-white dark:bg-[#16221C] border-[#202020]/10 dark:border-white/10 hover:border-[#C6A667]'
                  }`}
                >
                  {GAME_LABELS[gk]} ({cnt})
                </button>
              );
            })}
          </div>

          {/* Game Config Card */}
          {editingCfg && (
            <form
              onSubmit={handleSaveConfig}
              className="p-5 rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-bold text-sm text-[#111111] dark:text-[#F8F5EF]">
                  Cấu hình luật chơi: {GAME_LABELS[editingCfg.game_key]}
                </div>
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingCfg.active)}
                    onChange={(e) => setEditingCfg({ ...editingCfg, active: e.target.checked ? 1 : 0 })}
                    className="w-4 h-4 accent-[#00552B]"
                  />
                  <span>Đang mở trên website (/play)</span>
                </label>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Tên game (VI)
                  </label>
                  <input
                    type="text"
                    value={editingCfg.title_vi}
                    onChange={(e) => setEditingCfg({ ...editingCfg, title_vi: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Tên game (EN)
                  </label>
                  <input
                    type="text"
                    value={editingCfg.title_en}
                    onChange={(e) => setEditingCfg({ ...editingCfg, title_en: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Lượt Free / Ngày
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingCfg.daily_free_plays}
                    onChange={(e) => setEditingCfg({ ...editingCfg, daily_free_plays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Điểm đổi lượt thêm
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={editingCfg.extra_play_cost_points}
                    onChange={(e) => setEditingCfg({ ...editingCfg, extra_play_cost_points: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent text-xs tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Điểm tối thiểu thắng
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingCfg.min_score_to_win}
                    onChange={(e) => setEditingCfg({ ...editingCfg, min_score_to_win: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="px-4 py-2 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingConfig ? 'Đang lưu...' : 'Lưu cấu hình Game'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Rewards Pool & Gift Replacement Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-base text-[#111111] dark:text-[#F8F5EF]">
                  Danh sách Phần thưởng & Quà tặng kèm — {GAME_LABELS[selectedGame]}
                </h3>
                <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
                  Bấm <strong>Sửa / Thay Quà</strong> ở bất kỳ dòng nào để đổi sang sản phẩm ROAR khác, đổi voucher hoặc chỉnh tỷ lệ trúng.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateRewardModal}
                className="px-4 py-2 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Quà / Ô Thưởng</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#202020]/10 dark:border-white/10 text-[11px] uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60">
                    <th className="py-2.5 pr-3">Ô / Nhãn</th>
                    <th className="py-2.5 px-3">Loại & Quà đính kèm</th>
                    <th className="py-2.5 px-3 text-right">Giá trị / ĐH tối thiểu</th>
                    <th className="py-2.5 px-3 text-right">Trọng số (Tỷ lệ %)</th>
                    <th className="py-2.5 px-3 text-right">Tồn kho quà</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 pl-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202020]/10 dark:divide-white/10">
                  {currentRewards.map((rw) => {
                    const isEligible = rw.active && (rw.stock_total < 0 || rw.stock_remaining > 0);
                    const pct =
                      isEligible && totalActiveWeight > 0
                        ? ((Math.max(1, rw.weight) / totalActiveWeight) * 100).toFixed(1)
                        : '0.0';
                    return (
                      <tr key={rw.id} className={!rw.active ? 'opacity-55' : ''}>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-5 h-5 rounded-md border border-black/15 shrink-0"
                              style={{ backgroundColor: rw.color_hex || '#00552B' }}
                            />
                            <div>
                              <div className="font-bold text-[#111111] dark:text-[#F8F5EF]">
                                #{rw.slot_order} · {rw.label_vi}
                              </div>
                              <div className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">{rw.label_en}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {rw.reward_type === 'product_gift' && rw.gift_image_key && (
                              <div className="w-9 h-9 rounded-lg overflow-hidden border border-black/10 shrink-0 bg-white">
                                <MediaImage imageKey={rw.gift_image_key} alt={rw.label_vi} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <span className="font-semibold text-[#00552B] dark:text-[#C6A667]">
                                {REWARD_TYPE_LABELS[rw.reward_type]}
                              </span>
                              {rw.reward_type === 'product_gift' && (
                                <div className="text-[11px] font-bold text-[#111111] dark:text-[#F8F5EF]">
                                  🎁 {rw.gift_product_name_vi || 'Quà tùy chỉnh'}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          <div className="font-bold">
                            {rw.reward_type === 'points'
                              ? `+${rw.reward_value} điểm`
                              : rw.reward_type === 'voucher_percent'
                                ? `-${rw.reward_value}%`
                                : `${Number(rw.reward_value || 0).toLocaleString('vi-VN')}₫`}
                          </div>
                          {rw.min_order_value > 0 && (
                            <div className="text-[10px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                              Đơn từ {Number(rw.min_order_value).toLocaleString('vi-VN')}₫
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          <span className="font-bold">{rw.weight}</span>{' '}
                          <span className="text-[#00552B] dark:text-[#C6A667] font-bold">({pct}%)</span>
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          {rw.stock_total < 0 ? (
                            <span className="text-[#202020]/65 dark:text-[#F1EFEA]/65">Vô hạn</span>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-bold">
                                {rw.stock_remaining}/{rw.stock_total}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuickRestock(rw)}
                                title="Cộng thêm +20 suất"
                                className="px-1.5 py-0.5 rounded bg-[#00552B]/10 text-[#00552B] dark:text-[#C6A667] text-[10px] font-bold cursor-pointer hover:bg-[#00552B]/20"
                              >
                                +20
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRewardActive(rw)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              rw.active
                                ? 'bg-[#00552B]/15 text-[#00552B] dark:text-[#C6A667]'
                                : 'bg-black/10 dark:bg-white/10 text-[#202020]/60 dark:text-white/60'
                            }`}
                          >
                            {rw.active ? 'Đang bật' : 'Đang ẩn'}
                          </button>
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditOrReplaceModal(rw)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#C6A667]/20 hover:bg-[#C6A667]/35 text-[#8C6D32] dark:text-[#C6A667] font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Sửa / Thay Quà</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteReward(rw)}
                              className="p-1.5 rounded-lg text-red-600 hover:bg-red-500/10 cursor-pointer"
                              aria-label="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : subTab === 'checkin' ? (
        <form
          onSubmit={handleSaveCheckinSchedule}
          className="p-5 rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-[#111111] dark:text-[#F8F5EF]">
                Cấu hình Thưởng Điểm Danh Hàng Ngày (Chu kỳ 7 Ngày)
              </h3>
              <p className="text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
                Thay đổi số điểm thưởng & nhãn quà VIP cho từng ngày trong chuỗi điểm danh liên tục.
              </p>
            </div>
            <button
              type="submit"
              disabled={savingCheckin}
              className="px-4 py-2 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingCheckin ? 'Đang lưu...' : 'Lưu Lịch Điểm Danh'}</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {checkinSchedule.map((dayItem, idx) => (
              <div
                key={dayItem.day}
                className="p-3.5 rounded-xl bg-[#F8F5EF]/75 dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2.5"
              >
                <div className="font-bold text-xs text-[#00552B] dark:text-[#C6A667]">Ngày {dayItem.day}</div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Điểm thưởng
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={dayItem.points}
                    onChange={(e) => {
                      const next = [...checkinSchedule];
                      next[idx] = { ...next[idx], points: Number(e.target.value) };
                      setCheckinSchedule(next);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#16221C] text-xs font-bold tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Nhãn Bonus (VI)
                  </label>
                  <input
                    type="text"
                    value={dayItem.bonusVi}
                    placeholder="VD: Bonus 3 ngày!"
                    onChange={(e) => {
                      const next = [...checkinSchedule];
                      next[idx] = { ...next[idx], bonusVi: e.target.value };
                      setCheckinSchedule(next);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#16221C] text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60 mb-1">
                    Nhãn Bonus (EN)
                  </label>
                  <input
                    type="text"
                    value={dayItem.bonusEn}
                    placeholder="e.g. 7-Day VIP Gift!"
                    onChange={(e) => {
                      const next = [...checkinSchedule];
                      next[idx] = { ...next[idx], bonusEn: e.target.value };
                      setCheckinSchedule(next);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#16221C] text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </form>
      ) : (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'active', 'redeemed', 'fulfilled'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setClaimFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    claimFilter === st
                      ? 'bg-[#00552B] text-white'
                      : 'bg-[#F8F5EF] dark:bg-[#0E1512] text-[#202020]/75 dark:text-[#F1EFEA]/75'
                  }`}
                >
                  {st === 'all'
                    ? 'Tất cả'
                    : st === 'active'
                      ? 'Chờ dùng / Đổi mã'
                      : st === 'redeemed'
                        ? 'Đã gắn đơn hàng'
                        : 'Đã hoàn tất / Đã giao'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={loadAll}
              className="px-3 py-1.5 rounded-lg border border-[#202020]/15 dark:border-white/15 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#202020]/10 dark:border-white/10 text-[11px] uppercase text-[#202020]/60 dark:text-[#F1EFEA]/60">
                  <th className="py-2.5 pr-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Trò chơi & Quà trúng</th>
                  <th className="py-2.5 px-3">Mã Claim / Voucher</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 pl-3 text-right">Cập nhật giao quà</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#202020]/10 dark:divide-white/10">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#202020]/60 dark:text-[#F1EFEA]/60">
                      Chưa có lượt trúng thưởng nào trong bộ lọc này.
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((cl) => (
                    <tr key={cl.id}>
                      <td className="py-3 pr-3">
                        <div className="font-bold text-[#111111] dark:text-[#F8F5EF]">{cl.user_name || `User #${cl.user_id}`}</div>
                        <div className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60">
                          {cl.user_email} {cl.member_code ? `· ${cl.member_code}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold">{cl.reward_label_vi}</div>
                        <div className="text-[11px] text-[#202020]/65 dark:text-[#F1EFEA]/65">
                          {GAME_LABELS[cl.game_key]}
                          {cl.gift_product_name_vi ? ` · 🎁 ${cl.gift_product_name_vi}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <code className="px-2 py-0.5 rounded bg-[#F8F5EF] dark:bg-[#0E1512] font-mono font-bold text-[#00552B] dark:text-[#C6A667]">
                          {cl.promo_code || cl.claim_code}
                        </code>
                        {cl.redeemed_order_id && (
                          <div className="text-[10px] text-[#202020]/65 dark:text-[#F1EFEA]/65 mt-0.5">
                            Đơn ID: #{cl.redeemed_order_id}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-bold uppercase text-[11px]">{cl.status}</td>
                      <td className="py-3 pl-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {cl.status !== 'fulfilled' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateClaimStatus(cl.id, 'fulfilled', 'Admin đã giao / xác nhận')}
                              className="px-2.5 py-1 rounded-lg bg-[#00552B] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đã giao quà</span>
                            </button>
                          )}
                          {cl.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateClaimStatus(cl.id, 'cancelled')}
                              className="px-2 py-1 rounded-lg border border-red-500/30 text-red-600 text-[11px] font-bold cursor-pointer"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'support_news' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Live Support Tickets */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Headphones className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />
                <span>Phiếu Hỗ Trợ Đa Kênh ({adminTickets.length})</span>
              </h3>
              <button type="button" onClick={loadAll} className="px-3 py-1 rounded border text-xs font-bold cursor-pointer">
                Làm mới
              </button>
            </div>
            <div className="space-y-3 max-h-[460px] overflow-y-auto text-xs">
              {adminTickets.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-[#F8F5EF] dark:bg-[#0E1512] border border-[#202020]/10 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold">
                      [{String(t.channel).toUpperCase()}] #{t.id} · {t.subject}
                    </div>
                    <select
                      value={t.status}
                      onChange={async (e) => {
                        const res = await apiFetch(`/api/support/tickets/${t.id}/status`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: e.target.value }),
                        });
                        if (res.ok) {
                          showToast('Đã cập nhật trạng thái phiếu');
                          loadAll();
                        }
                      }}
                      className="px-2 py-1 rounded bg-white dark:bg-[#16221C] border text-[11px] font-bold"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="text-[11px] opacity-70">
                    {t.customer_name} ({t.customer_email})
                  </div>
                  <div className="space-y-1 pl-2 border-l-2 border-[#00552B]/40">
                    {(t.messages || []).map((m: any) => (
                      <div key={m.id}>
                        <strong>{m.sender_name}:</strong> {m.message}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ticketReplyText[t.id] || ''}
                      onChange={(e) => setTicketReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                      placeholder="Nhập phản hồi gửi thẳng khách hàng (Live Push)..."
                      className="flex-1 px-2.5 py-1.5 rounded bg-white dark:bg-[#16221C] border text-xs"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const msg = (ticketReplyText[t.id] || '').trim();
                        if (!msg) return;
                        const res = await apiFetch(`/api/support/tickets/${t.id}/reply`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ message: msg }),
                        });
                        if (res.ok) {
                          setTicketReplyText((prev) => ({ ...prev, [t.id]: '' }));
                          showToast('Đã gửi phản hồi trực tiếp!');
                          loadAll();
                        }
                      }}
                      className="px-3 py-1.5 rounded bg-[#00552B] text-white font-bold cursor-pointer"
                    >
                      Trả lời
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game News Publisher */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 space-y-4">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Newspaper className="w-4 h-4 text-[#00552B] dark:text-[#C6A667]" />
              <span>Đăng Bảng Tin Sự Kiện Game</span>
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await apiFetch('/api/game-news', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newsForm),
                });
                if (res.ok) {
                  setNewsForm({ titleVi: '', titleEn: '', summaryVi: '', summaryEn: '', tag: 'event', pinned: true });
                  showToast('Đã phát hành bản tin sự kiện!');
                  loadAll();
                }
              }}
              className="space-y-2.5 text-xs"
            >
              <input
                type="text"
                required
                value={newsForm.titleVi}
                onChange={(e) => setNewsForm({ ...newsForm, titleVi: e.target.value })}
                placeholder="Tiêu đề bản tin (VI)"
                className="w-full px-3 py-2 rounded-lg border bg-transparent"
              />
              <input
                type="text"
                value={newsForm.titleEn}
                onChange={(e) => setNewsForm({ ...newsForm, titleEn: e.target.value })}
                placeholder="Headline (EN)"
                className="w-full px-3 py-2 rounded-lg border bg-transparent"
              />
              <textarea
                required
                rows={2}
                value={newsForm.summaryVi}
                onChange={(e) => setNewsForm({ ...newsForm, summaryVi: e.target.value })}
                placeholder="Nội dung tóm tắt sự kiện (VI)..."
                className="w-full px-3 py-2 rounded-lg border bg-transparent"
              />
              <button type="submit" className="px-4 py-2 rounded-lg bg-[#00552B] text-white font-bold cursor-pointer">
                Đăng Tin Tức Game Ngay
              </button>
            </form>
            <div className="space-y-2 max-h-52 overflow-y-auto text-xs pt-2 border-t border-[#202020]/10 dark:border-white/10">
              {newsItems.map((n) => (
                <div key={n.id} className="p-2.5 rounded-lg bg-[#F8F5EF] dark:bg-[#0E1512]">
                  <div className="font-bold">{n.pinned ? '📌 ' : ''}{n.title_vi}</div>
                  <div className="opacity-75">{n.summary_vi}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit / Replace Reward & Gift Modal */}
      {modalReward && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveReward}
            className="bg-white dark:bg-[#16221C] border border-[#C6A667]/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#202020]/10 dark:border-white/10">
              <h3 className="font-serif text-xl font-bold text-[#111111] dark:text-[#F8F5EF]">
                {modalReward.id ? 'Chỉnh sửa / Thay thế Quà tặng & Phần thưởng' : 'Thêm Ô Phần thưởng Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setModalReward(null)}
                className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Product Gift Selector (Replace Gift Directly from Catalog) */}
            <div className="p-3.5 rounded-xl bg-[#00552B]/10 dark:bg-[#00552B]/25 border border-[#00552B]/25 space-y-2">
              <label className="block text-xs font-bold text-[#00552B] dark:text-[#C6A667]">
                Thay thế nhanh bằng Sản phẩm Cà phê ROAR (Tự động gắn làm Quà tặng kèm đơn)
              </label>
              <select
                value={modalReward.gift_product_id ? String(modalReward.gift_product_id) : ''}
                onChange={(e) => handleAttachProductToReward(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#00552B]/30 bg-white dark:bg-[#0E1512] text-xs font-semibold"
              >
                <option value="">-- Chọn sản phẩm trong kho ROAR để gắn/thay thế quà tặng --</option>
                {catalogProducts.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name_vi} ({p.sku} · {Number(p.price_vnd || 0).toLocaleString('vi-VN')}₫)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Loại phần thưởng</label>
                <select
                  value={modalReward.reward_type}
                  onChange={(e) => setModalReward({ ...modalReward, reward_type: e.target.value as GameRewardType })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-white dark:bg-[#0E1512]"
                >
                  {(Object.keys(REWARD_TYPE_LABELS) as GameRewardType[]).map((rt) => (
                    <option key={rt} value={rt}>
                      {REWARD_TYPE_LABELS[rt]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Thứ tự ô hiển thị</label>
                <input
                  type="number"
                  min={1}
                  value={modalReward.slot_order}
                  onChange={(e) => setModalReward({ ...modalReward, slot_order: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent tabular-nums"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Tên hiển thị (Tiếng Việt) *</label>
                <input
                  type="text"
                  required
                  value={modalReward.label_vi}
                  onChange={(e) => setModalReward({ ...modalReward, label_vi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Tên hiển thị (English) *</label>
                <input
                  type="text"
                  required
                  value={modalReward.label_en}
                  onChange={(e) => setModalReward({ ...modalReward, label_en: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent"
                />
              </div>

              <div>
                <label className="block font-bold mb-1">
                  {modalReward.reward_type === 'points'
                    ? 'Số điểm thưởng'
                    : modalReward.reward_type === 'voucher_percent'
                      ? 'Phần trăm giảm (%)'
                      : 'Giá trị (VNĐ)'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={modalReward.reward_value}
                  onChange={(e) => setModalReward({ ...modalReward, reward_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent tabular-nums"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Đơn hàng tối thiểu (VNĐ)</label>
                <input
                  type="number"
                  min={0}
                  value={modalReward.min_order_value}
                  onChange={(e) => setModalReward({ ...modalReward, min_order_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent tabular-nums"
                />
              </div>

              {modalReward.reward_type === 'voucher_percent' && (
                <div>
                  <label className="block font-bold mb-1">Giảm tối đa (VNĐ)</label>
                  <input
                    type="number"
                    min={0}
                    value={modalReward.max_discount}
                    onChange={(e) => setModalReward({ ...modalReward, max_discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent tabular-nums"
                  />
                </div>
              )}

              {modalReward.reward_type === 'product_gift' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Tên quà sản phẩm (VI)</label>
                    <input
                      type="text"
                      value={modalReward.gift_product_name_vi}
                      onChange={(e) => setModalReward({ ...modalReward, gift_product_name_vi: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Quy cách quà tặng kèm</label>
                    <input
                      type="text"
                      value={modalReward.gift_product_variant}
                      onChange={(e) => setModalReward({ ...modalReward, gift_product_variant: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold mb-1">Trọng số tỷ lệ trúng (Weight ≥ 1)</label>
                <input
                  type="number"
                  min={1}
                  value={modalReward.weight}
                  onChange={(e) => setModalReward({ ...modalReward, weight: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent tabular-nums"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Tổng kho (-1 = vô hạn)</label>
                  <input
                    type="number"
                    min={-1}
                    value={modalReward.stock_total}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setModalReward({
                        ...modalReward,
                        stock_total: val,
                        stock_remaining: val < 0 ? -1 : modalReward.stock_remaining < 0 ? val : modalReward.stock_remaining,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent tabular-nums"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Còn lại</label>
                  <input
                    type="number"
                    min={-1}
                    value={modalReward.stock_remaining}
                    onChange={(e) => setModalReward({ ...modalReward, stock_remaining: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Màu ô Vòng Quay (Hex)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={modalReward.color_hex || '#00552B'}
                    onChange={(e) => setModalReward({ ...modalReward, color_hex: e.target.value })}
                    className="w-10 h-9 rounded border border-black/15 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={modalReward.color_hex}
                    onChange={(e) => setModalReward({ ...modalReward, color_hex: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Nhãn Badge ngắn (VI / EN)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={modalReward.badge_vi}
                    onChange={(e) => setModalReward({ ...modalReward, badge_vi: e.target.value })}
                    placeholder="QUÀ TẶNG"
                    className="w-full px-2.5 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent"
                  />
                  <input
                    type="text"
                    value={modalReward.badge_en}
                    onChange={(e) => setModalReward({ ...modalReward, badge_en: e.target.value })}
                    placeholder="GIFT"
                    className="w-full px-2.5 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold mb-1">Mô tả chi tiết (VI)</label>
                <input
                  type="text"
                  value={modalReward.description_vi}
                  onChange={(e) => setModalReward({ ...modalReward, description_vi: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#202020]/15 dark:border-white/15 bg-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#202020]/10 dark:border-white/10">
              <button
                type="button"
                onClick={() => setModalReward(null)}
                className="px-4 py-2 rounded-xl border border-[#202020]/15 dark:border-white/15 text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={savingReward}
                className="px-5 py-2 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{savingReward ? 'Đang lưu...' : 'Lưu & Áp Dụng Ngay'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
