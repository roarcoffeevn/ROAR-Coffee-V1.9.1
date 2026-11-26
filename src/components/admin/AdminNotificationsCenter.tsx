import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  Check,
  CheckSquare,
  Copy,
  Gift,
  Package,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Users,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';

interface CustomerItem {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  tier: string;
  orderCount?: number;
  b2b_verified?: number;
}

interface CampaignRecord {
  id: number;
  title_vi: string;
  title_en: string;
  message_vi: string;
  message_en: string;
  category: 'promo' | 'system' | 'order' | 'event' | 'loyalty';
  target_mode: string;
  targetMeta?: Record<string, any>;
  link_url: string;
  push_enabled: number;
  recipient_count: number;
  created_by_email: string;
  created_at: string;
}

interface AdminNotificationsCenterProps {
  customers: CustomerItem[];
}

const TEMPLATES = [
  {
    id: 'promo_season',
    labelVi: 'Khuyến mãi Combo Mùa',
    labelEn: 'Seasonal Promo',
    category: 'promo' as const,
    linkUrl: '/promotions',
    titleVi: 'Ưu Đãi Mùa Thu Hoạch: Giảm ngay 15% mọi Combo Cà Phê!',
    titleEn: 'Harvest Season Offer: 15% OFF All ROAR Combos!',
    messageVi: 'Nhập mã ROARSEASON15 tại giỏ hàng để giảm 15% kèm quà tặng Phin nhôm & miễn phí giao hàng. Số lượng có hạn!',
    messageEn: 'Apply code ROARSEASON15 at checkout for 15% OFF plus complimentary harvest perks.',
  },
  {
    id: 'system_update',
    labelVi: 'Cập nhật Hệ thống',
    labelEn: 'System Update',
    category: 'system' as const,
    linkUrl: '/account?tab=profile',
    titleVi: 'Nâng cấp mới: Đăng nhập 1 chạm bằng Vân tay / Face ID & Gợi ý Gu Cá Nhân',
    titleEn: 'System Upgrade: Fingerprint / Face ID Sign-In & Personal Taste Picks',
    messageVi: 'ROAR COFFEE vừa nâng cấp đăng nhập sinh trắc học chuẩn FIDO2 và tính năng cá nhân hóa gợi ý cà phê. Vào Hồ sơ & Bảo mật để kích hoạt ngay!',
    messageEn: 'ROAR COFFEE now supports FIDO2 Fingerprint / Face ID sign-in and personalized recommendations. Enable it in Profile & Security!',
  },
  {
    id: 'order_roast',
    labelVi: 'Thông báo Mua hàng / Mẻ rang',
    labelEn: 'Fresh Roast Order Alert',
    category: 'order' as const,
    linkUrl: '/shop',
    titleVi: 'Mẻ rang tươi đầu tuần vừa ra lò — Đặt ngay giao nóng trong ngày!',
    titleEn: 'Fresh Weekly Roast Just Dropped — Order Today!',
    messageVi: 'Robusta S18, Arabica Cầu Đất và Espresso Gold vừa hoàn tất rang mộc sáng nay. Đặt sớm để nhận hạt rang mới nhất và tích điểm thưởng x1.5.',
    messageEn: 'Fresh batches of Robusta S18, Cau Dat Arabica, and Espresso Gold just came off the roaster. Order now for peak aroma!',
  },
  {
    id: 'event_cupping',
    labelVi: 'Sự kiện & Workshop',
    labelEn: 'Event & Workshop',
    category: 'event' as const,
    linkUrl: '/brewing-handbook',
    titleVi: 'Thư Mời Sự Kiện: Workshop Thử Nếm & Pha Phin Chuẩn Quán Cuối Tuần',
    titleEn: 'Event Invite: Weekend Specialty Cupping & Phin Brewing Workshop',
    messageVi: 'Thân mời thành viên ROAR CLUB tham gia buổi thử nếm hạt vụ mùa mới & nhận quà tặng trực tiếp cùng đội ngũ Barista ROAR vào Thứ 7 tuần này.',
    messageEn: 'Join ROAR Baristas this Saturday for a live harvest cupping session, Phin masterclass, and member gift bags.',
  },
];

const LINK_PRESETS = [
  { value: '/promotions', labelVi: 'Trang Ưu đãi & Khuyến mãi (/promotions)', labelEn: 'Promotions (/promotions)' },
  { value: '/shop', labelVi: 'Cửa hàng sản phẩm (/shop)', labelEn: 'Shop Catalog (/shop)' },
  { value: '/account?tab=vouchers', labelVi: 'Kho Voucher Thành viên (/account?tab=vouchers)', labelEn: 'Member Vouchers' },
  { value: '/account?tab=orders', labelVi: 'Quản lý Đơn hàng (/account?tab=orders)', labelEn: 'Member Orders' },
  { value: '/account?tab=profile', labelVi: 'Hồ sơ & Bảo mật Vân tay (/account?tab=profile)', labelEn: 'Profile & Biometrics' },
  { value: '/brewing-handbook', labelVi: 'Cẩm nang Pha chế (/brewing-handbook)', labelEn: 'Brewing Handbook' },
  { value: '/play', labelVi: 'Khu vực 16 Mini-Game (/play)', labelEn: '16 Mini-Games (/play)' },
];

export const AdminNotificationsCenter: React.FC<AdminNotificationsCenterProps> = ({ customers }) => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [stats, setStats] = useState({ totalMembers: 0, pushOptInCount: 0, totalUnread: 0, totalSentAllTime: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Composer state
  const [category, setCategory] = useState<'promo' | 'system' | 'order' | 'event' | 'loyalty'>('promo');
  const [targetMode, setTargetMode] = useState<'all' | 'selected' | 'tier' | 'b2b' | 'inactive'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('ROAR Member');
  const [inactiveDays, setInactiveDays] = useState(30);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [titleVi, setTitleVi] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [messageVi, setMessageVi] = useState('');
  const [messageEn, setMessageEn] = useState('');
  const [linkUrl, setLinkUrl] = useState('/promotions');

  const nonAdminMembers = useMemo(
    () => customers.filter((c) => c.role !== 'admin'),
    [customers]
  );

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return nonAdminMembers;
    return nonAdminMembers.filter((m) =>
      `${m.full_name} ${m.email} ${m.phone || ''} ${m.tier}`.toLowerCase().includes(q)
    );
  }, [nonAdminMembers, memberSearch]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/notifications/campaigns');
      if (res.ok) {
        const d = await res.json();
        setCampaigns(Array.isArray(d.campaigns) ? d.campaigns : []);
        if (d.stats) setStats(d.stats);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const applyTemplate = (tpl: (typeof TEMPLATES)[number]) => {
    setCategory(tpl.category);
    setLinkUrl(tpl.linkUrl);
    setTitleVi(tpl.titleVi);
    setTitleEn(tpl.titleEn);
    setMessageVi(tpl.messageVi);
    setMessageEn(tpl.messageEn);
  };

  const toggleUserSelection = (id: number) => {
    setSelectedUserIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleVi.trim() || !messageVi.trim()) {
      showToast(t('Vui lòng nhập tiêu đề và nội dung thông báo.', 'Please enter title and message.'));
      return;
    }
    if (targetMode === 'selected' && selectedUserIds.length === 0) {
      showToast(t('Vui lòng chọn ít nhất 1 thành viên.', 'Please select at least 1 member.'));
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch('/api/admin/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleVi: titleVi.trim(),
          titleEn: titleEn.trim() || titleVi.trim(),
          messageVi: messageVi.trim(),
          messageEn: messageEn.trim() || messageVi.trim(),
          category,
          targetMode,
          userIds: targetMode === 'selected' ? selectedUserIds : undefined,
          tier: targetMode === 'tier' ? tierFilter : undefined,
          inactiveDays: targetMode === 'inactive' ? inactiveDays : undefined,
          linkUrl,
          pushEnabled,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          t(
            `Đã phát thông báo thành công tới ${d.sentCount || 0} thành viên!`,
            `Broadcast sent to ${d.sentCount || 0} members!`
          )
        );
        setTitleVi('');
        setTitleEn('');
        setMessageVi('');
        setMessageEn('');
        await loadData();
      } else {
        showToast(d.error || t('Không thể gửi thông báo.', 'Failed to send broadcast.'));
      }
    } finally {
      setSending(false);
    }
  };

  const categoryBadge = (cat: string) => {
    const map: Record<string, { labelVi: string; labelEn: string; cls: string }> = {
      promo: { labelVi: 'Khuyến mãi', labelEn: 'Promo', cls: 'bg-amber-100 text-amber-800' },
      system: { labelVi: 'Hệ thống', labelEn: 'System', cls: 'bg-slate-100 text-slate-700' },
      order: { labelVi: 'Mua hàng', labelEn: 'Order', cls: 'bg-sky-100 text-sky-800' },
      event: { labelVi: 'Sự kiện', labelEn: 'Event', cls: 'bg-emerald-100 text-emerald-800' },
      loyalty: { labelVi: 'Thành viên', labelEn: 'Loyalty', cls: 'bg-purple-100 text-purple-800' },
    };
    const info = map[cat] || map.promo;
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${info.cls}`}>
        {lang === 'en' ? info.labelEn : info.labelVi}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">{t('Tổng thành viên nhận tin', 'Total Members')}</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.totalMembers}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">{t('Đã bật Thông báo đẩy (Push)', 'Browser Push Opt-In')}</p>
          <p className="text-2xl font-bold font-mono text-[#00552B] mt-1 tabular-nums">{stats.pushOptInCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">{t('Tổng lượt phát thông báo', 'Total Notifications Sent')}</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">{stats.totalSentAllTime}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold text-slate-500">{t('Đang chờ khách đọc', 'Unread Across Members')}</p>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1 tabular-nums">{stats.totalUnread}</p>
        </div>
      </div>

      {/* Main Grid: Composer + History */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <form
          onSubmit={handleBroadcast}
          className="xl:col-span-7 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#00552B]" />
                {t('Soạn & Phát Thông Báo Thành Viên (Toàn hệ thống / Chọn lọc)', 'Compose Member Broadcast & Push Alert')}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t(
                  'Gửi ngay vào Hộp thư thành viên + kích hoạt Thông báo đẩy (Push Notification) trên trình duyệt & điện thoại.',
                  'Delivers to member inbox and triggers live Browser Push Alerts.'
                )}
              </p>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-600">{t('Mẫu thông báo nhanh (1 chạm điền sẵn):', 'Quick Templates:')}</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#00552B] hover:bg-[#00552B]/5 text-slate-700 font-semibold cursor-pointer transition-colors"
                >
                  {lang === 'en' ? tpl.labelEn : tpl.labelVi}
                </button>
              ))}
            </div>
          </div>

          {/* Category + Target Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Phân loại thông báo', 'Notification Category')}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="promo">{t('Khuyến mãi & Ưu đãi', 'Promotions & Offers')}</option>
                <option value="system">{t('Cập nhật Hệ thống', 'System Updates')}</option>
                <option value="order">{t('Thông báo Mua hàng / Mẻ rang', 'Order & Roast Alerts')}</option>
                <option value="event">{t('Thông báo Sự kiện / Workshop', 'Events & Workshops')}</option>
                <option value="loyalty">{t('Điểm thưởng & Hạng thành viên', 'Loyalty & Tier Perks')}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Đối tượng nhận tin', 'Target Audience')}</label>
              <select
                value={targetMode}
                onChange={(e) => setTargetMode(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="all">{t(`Toàn bộ thành viên (${nonAdminMembers.length})`, `All Members (${nonAdminMembers.length})`)}</option>
                <option value="selected">{t(`Chọn lọc từng thành viên (${selectedUserIds.length} đã chọn)`, `Selected Members (${selectedUserIds.length})`)}</option>
                <option value="tier">{t('Theo Hạng thành viên (Member / Silver / Gold / Reserve)', 'By Membership Tier')}</option>
                <option value="b2b">{t('Chỉ Đối tác B2B / HORECA', 'B2B Partners Only')}</option>
                <option value="inactive">{t('Thành viên lâu chưa đặt hàng', 'Inactive Members')}</option>
              </select>
            </div>
          </div>

          {/* Conditional Target Pickers */}
          {targetMode === 'tier' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <label className="block font-semibold text-slate-700 mb-1">{t('Chọn Hạng thành viên', 'Select Membership Tier')}</label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                className="w-full sm:w-72 border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="ROAR Member">ROAR Member</option>
                <option value="ROAR Silver">ROAR Silver</option>
                <option value="ROAR Gold">ROAR Gold</option>
                <option value="ROAR Reserve">ROAR Reserve</option>
              </select>
            </div>
          )}

          {targetMode === 'inactive' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
              <label className="font-semibold text-slate-700">{t('Chưa phát sinh đơn hàng trong:', 'No orders within last:')}</label>
              <input
                type="number"
                min={7}
                max={365}
                value={inactiveDays}
                onChange={(e) => setInactiveDays(Number(e.target.value))}
                className="w-20 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono bg-white"
              />
              <span className="text-slate-600">{t('ngày gần nhất', 'days')}</span>
            </div>
          )}

          {targetMode === 'selected' && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder={t('Tìm tên, email, SĐT thành viên...', 'Search member name, email...')}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds(filteredMembers.map((m) => m.id))}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold cursor-pointer"
                  >
                    {t('Chọn hết', 'Select All')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUserIds([])}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-600 cursor-pointer"
                  >
                    {t('Bỏ chọn', 'Clear')}
                  </button>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/70 bg-white rounded-lg border border-slate-200">
                {filteredMembers.map((m) => {
                  const checked = selectedUserIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleUserSelection(m.id)}
                      className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-slate-50 cursor-pointer ${
                        checked ? 'bg-emerald-50/60' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-[#00552B] shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{m.full_name}</p>
                          <p className="text-[11px] text-slate-500 truncate">{m.email}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-semibold text-slate-600 shrink-0">{m.tier}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bilingual Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề thông báo (VI) *', 'Title (VI) *')}</label>
              <input
                type="text"
                required
                value={titleVi}
                onChange={(e) => setTitleVi(e.target.value)}
                placeholder={t('VD: Siêu ưu đãi Combo Lễ Hội -20%', 'E.g. Festive Combo -20%')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề (EN - tùy chọn)', 'Title (EN - optional)')}</label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="English title..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Nội dung chi tiết (VI) *', 'Message (VI) *')}</label>
              <textarea
                rows={4}
                required
                value={messageVi}
                onChange={(e) => setMessageVi(e.target.value)}
                placeholder={t('Nhập nội dung khuyến mãi, thông tin sự kiện hoặc cập nhật hệ thống...', 'Enter notification message...')}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Nội dung (EN - tùy chọn)', 'Message (EN - optional)')}</label>
              <textarea
                rows={4}
                value={messageEn}
                onChange={(e) => setMessageEn(e.target.value)}
                placeholder="English message..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Liên kết điều hướng khi bấm vào', 'Click Destination Link')}</label>
              <select
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white"
              >
                {LINK_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {lang === 'en' ? p.labelEn : p.labelVi}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="accent-[#00552B] w-4 h-4"
              />
              <div>
                <span className="font-semibold text-slate-800 block">{t('Gửi kèm Thông báo đẩy (Push Alert)', 'Enable Live Push Alert')}</span>
                <span className="text-[10px] text-slate-500">{t('Hiện thông báo nổi & đẩy trình duyệt ngay lập tức', 'Triggers live toast & OS push alert')}</span>
              </div>
            </label>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white font-bold cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? t('Đang phát thông báo...', 'Sending...') : t('Phát Thông Báo Ngay', 'Send Broadcast Now')}</span>
            </button>
          </div>
        </form>

        {/* Broadcast Campaign History */}
        <div className="xl:col-span-5 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">{t('Lịch sử chiến dịch đã phát', 'Broadcast History')}</h3>
            <button
              type="button"
              onClick={loadData}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
              title={t('Làm mới', 'Refresh')}
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">{t('Đang tải...', 'Loading...')}</div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center text-slate-500 space-y-1">
              <Bell className="w-7 h-7 mx-auto text-slate-300" />
              <p>{t('Chưa có chiến dịch phát thông báo nào.', 'No broadcast campaigns sent yet.')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
              {campaigns.map((c) => (
                <div key={c.id} className="p-3.5 space-y-1.5 hover:bg-slate-50/70">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {categoryBadge(c.category)}
                      <span className="font-mono text-[11px] font-semibold text-[#00552B] tabular-nums">
                        <Users className="w-3 h-3 inline mr-0.5" />
                        {c.recipient_count}
                      </span>
                      {c.push_enabled === 1 && (
                        <span className="text-[10px] font-mono text-emerald-700">· Push</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCategory(c.category);
                        setTitleVi(c.title_vi);
                        setTitleEn(c.title_en);
                        setMessageVi(c.message_vi);
                        setMessageEn(c.message_en);
                        setLinkUrl(c.link_url || '/promotions');
                        showToast(t('Đã nạp nội dung chiến dịch vào khung soạn', 'Loaded campaign into composer'));
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-[#00552B] font-semibold hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      {t('Dùng lại', 'Reuse')}
                    </button>
                  </div>
                  <p className="font-bold text-slate-900 line-clamp-1">{c.title_vi}</p>
                  <p className="text-slate-600 line-clamp-2">{c.message_vi}</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {c.created_at} · {c.target_mode} · {c.created_by_email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
