import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Coins, PlusCircle, RefreshCw, Wallet, XCircle } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import { getTierDisplayName } from '../lib/membershipTiers';

export const AdminWalletPointsPanel: React.FC<{ onGoProducts?: () => void }> = ({ onGoProducts }) => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast, refreshUser } = useStore();
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [topupRequests, setTopupRequests] = useState<any[]>([]);
  const [approvalMode, setApprovalMode] = useState<'manual' | 'auto'>('manual');
  const [processingReqId, setProcessingReqId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<number>(0);
  const [amountVnd, setAmountVnd] = useState<string>('500000');
  const [pointsDelta, setPointsDelta] = useState<string>('0');
  const [applyBonus, setApplyBonus] = useState<boolean>(true);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const [res, reqRes] = await Promise.all([
        apiFetch('/api/admin/wallets'),
        apiFetch('/api/admin/wallet/requests'),
      ]);
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d.members) ? d.members : Array.isArray(d.users) ? d.users : [];
        setMembers(list);
        setTransactions(Array.isArray(d.transactions) ? d.transactions : []);
        if (!selectedUserId && list.length > 0) {
          setSelectedUserId(list[0].id);
        }
      }
      if (reqRes.ok) {
        const rd = await reqRes.json();
        setApprovalMode(rd.approvalMode === 'auto' ? 'auto' : 'manual');
        setTopupRequests(Array.isArray(rd.requests) ? rd.requests : []);
      } else {
        const err = await reqRes.json().catch(() => ({}));
        if (err.error) showToast(err.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeApprovalMode = async (mode: 'manual' | 'auto') => {
    const res = await apiFetch('/api/admin/wallet/approval-mode', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    });
    if (res.ok) {
      setApprovalMode(mode);
      showToast(
        mode === 'manual'
          ? t('Đã chuyển sang chế độ Duyệt thủ công khi công ty nhận chuyển khoản', 'Switched to Manual bank verification mode')
          : t('Đã chuyển sang chế độ Tự động duyệt nạp ví', 'Switched to Auto-approve mode')
      );
    } else {
      const d = await res.json().catch(() => ({}));
      showToast(d.error || t('Không thể đổi chế độ duyệt', 'Failed to change approval mode'));
    }
  };

  const handleReviewRequest = async (id: number, action: 'approve' | 'reject') => {
    setProcessingReqId(id);
    try {
      const res = await apiFetch(`/api/admin/wallet/requests/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          action === 'approve'
            ? t('Đã xác nhận nhận tiền, cộng Ví ROAR & gửi thông báo thành công cho thành viên!', 'Approved top-up, credited wallet & notified member!')
            : t('Đã từ chối yêu cầu nạp tiền & thông báo cho thành viên.', 'Rejected top-up request & notified member.')
        );
        await Promise.all([loadWallets(), refreshUser()]);
      } else {
        showToast(d.error || t('Không thể xử lý yêu cầu', 'Unable to process request'));
      }
    } finally {
      setProcessingReqId(null);
    }
  };

  useEffect(() => {
    loadWallets();
    const onRefresh = () => {
      loadWallets();
    };
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'roar_static_runtime_v1') loadWallets();
    };
    window.addEventListener('roar:runtime-updated', onRefresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('roar:runtime-updated', onRefresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || submitting) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/admin/wallets/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          amountVnd: Number(amountVnd || 0),
          pointsDelta: Number(pointsDelta || 0),
          applyBonus,
          note,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(t('Đã cập nhật Ví & Điểm thành viên thành công!', 'Updated member wallet & points!'));
        setNote('');
        setPointsDelta('0');
        await Promise.all([loadWallets(), refreshUser()]);
      } else {
        showToast(d.error || t('Không thể cập nhật Ví', 'Failed to update wallet'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 space-y-5 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#00552B]" />
            <span>{t('Quản lý Ví Thành Viên, Nạp Tiền (+10%–30%) & Điểm Thưởng', 'Member Wallet, Top-up (+10%–30%) & Points Manager')}</span>
          </h3>
          <p className="text-slate-500 mt-0.5">
            {t(
              'Nạp tiền vào Ví ROAR cho khách hàng, cộng/trừ điểm thưởng quy đổi mua hàng và theo dõi toàn bộ giao dịch Ví.',
              'Top up ROAR member wallets, adjust redeemable reward points, and audit all wallet transactions.'
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onGoProducts && (
            <button
              type="button"
              onClick={onGoProducts}
              className="px-3 py-1.5 rounded-lg bg-[#C6A667]/20 text-[#00552B] font-semibold hover:bg-[#C6A667]/30 cursor-pointer"
            >
              {t('Sửa 4 sản phẩm Gift Voucher (50k–1tr)', 'Edit Gift Voucher Products')}
            </button>
          )}
          <button
            type="button"
            onClick={loadWallets}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('Làm mới', 'Refresh')}</span>
          </button>
        </div>
      </div>

      {/* Approval Mode Switcher (Manual vs Auto) */}
      <div className="p-3.5 rounded-xl bg-[#F8F5EF] border border-[#C6A667]/35 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-slate-900">
            {t('Chế độ duyệt yêu cầu nạp tiền Ví ROAR', 'ROAR Wallet Top-Up Approval Mode')}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5">
            {approvalMode === 'manual'
              ? t(
                  'Đang áp dụng Duyệt thủ công: Thành viên chuyển khoản → Báo về Admin → Kế toán kiểm tra tài khoản công ty đã nhận tiền rồi bấm Duyệt cộng ví & báo thành viên.',
                  'Manual mode active: Member transfers → Admin verifies company bank receipt → Approves to credit wallet & notify member.'
                )
              : t(
                  'Đang áp dụng Tự động duyệt: Hệ thống tự cộng tiền vào Ví ROAR ngay khi thành viên bấm xác nhận nạp.',
                  'Auto mode active: Wallet is credited immediately upon member top-up submission.'
                )}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 gap-1">
          <button
            type="button"
            onClick={() => handleChangeApprovalMode('manual')}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs cursor-pointer transition-colors ${
              approvalMode === 'manual' ? 'bg-[#00552B] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('Duyệt thủ công', 'Manual Approval')}
          </button>
          <button
            type="button"
            onClick={() => handleChangeApprovalMode('auto')}
            className={`px-3 py-1.5 rounded-md font-semibold text-xs cursor-pointer transition-colors ${
              approvalMode === 'auto' ? 'bg-[#00552B] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t('Tự động duyệt', 'Auto Approval')}
          </button>
        </div>
      </div>

      {/* Pending & Recent Top-Up Requests */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>{t('Yêu cầu nạp tiền từ Thành viên', 'Member Top-Up Requests')}</span>
            {topupRequests.filter((r) => r.status === 'pending').length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                {topupRequests.filter((r) => r.status === 'pending').length} {t('chờ duyệt', 'pending')}
              </span>
            )}
          </h4>
        </div>
        {topupRequests.length === 0 ? (
          <p className="p-4 text-slate-500 text-xs">
            {t('Chưa có yêu cầu nạp tiền nào từ thành viên.', 'No member top-up requests yet.')}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {topupRequests.map((req) => (
              <div key={req.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{req.full_name || req.email}</span>
                    {req.member_code && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {req.member_code}
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-[#00552B] font-semibold">{req.reference_code}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {req.status === 'pending'
                        ? t('Chờ xác nhận tiền về', 'Pending')
                        : req.status === 'approved'
                        ? t('Đã duyệt & cộng ví', 'Approved')
                        : t('Đã từ chối', 'Rejected')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    {t('Chuyển khoản:', 'Transfer:')}{' '}
                    <strong className="font-mono text-slate-900">{Number(req.amount_vnd || 0).toLocaleString('vi-VN')}₫</strong>
                    {' · '}
                    {t('Cộng ví:', 'Credit:')}{' '}
                    <strong className="font-mono text-[#00552B]">
                      +{Number(req.total_credit_vnd || 0).toLocaleString('vi-VN')}₫ (+{req.bonus_pct}%)
                    </strong>
                    {' · '}
                    +{req.points_delta || 0} {t('điểm', 'pts')}
                  </p>
                </div>

                {req.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processingReqId === req.id}
                      onClick={() => handleReviewRequest(req.id, 'approve')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#00552B] text-white font-semibold hover:bg-[#004422] disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t('Đã nhận tiền — Duyệt', 'Approve')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={processingReqId === req.id}
                      onClick={() => handleReviewRequest(req.id, 'reject')}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{t('Từ chối', 'Reject')}</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Admin Top-up / Points Adjust Form */}
      <form onSubmit={handleAdjust} className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div className="lg:col-span-2">
          <label className="block font-semibold text-slate-700 mb-1">{t('Chọn thành viên', 'Select Member')}</label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(Number(e.target.value))}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.email}) — Ví: {Number(m.wallet_balance_vnd || 0).toLocaleString('vi-VN')}₫ · {m.points?.available || 0} điểm
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">{t('Nạp / Trừ Ví (VNĐ)', 'Wallet Amount (VND)')}</label>
          <input
            type="number"
            step={50000}
            value={amountVnd}
            onChange={(e) => setAmountVnd(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold text-slate-700 mb-1">{t('Cộng / Trừ Điểm', 'Points Delta')}</label>
          <input
            type="number"
            value={pointsDelta}
            onChange={(e) => setPointsDelta(e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-2 bg-white font-mono"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={submitting || !selectedUserId}
            className="w-full py-2 px-3 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{submitting ? t('Đang lưu...', 'Saving...') : t('Nạp Ví / Cộng Điểm', 'Apply Adjustment')}</span>
          </button>
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('Ghi chú giao dịch (vd: Nạp gói Gold +20% tại quầy / Chuyển khoản)', 'Transaction note (e.g. Gold pack top-up)')}
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
          />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-slate-700 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={applyBonus}
            onChange={(e) => setApplyBonus(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span>{t('Tự động cộng thưởng +10% đến +30% & tích điểm theo gói nạp', 'Auto-apply +10% to +30% bonus & points')}</span>
        </label>
      </form>

      {/* Members Balance Table + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#00552B]" />
            <span>{t(`Số dư Ví & Điểm (${members.length} thành viên)`, `Member Balances (${members.length})`)}</span>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {members.map((m) => (
              <div key={m.id} className="px-3.5 py-2 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{m.full_name} <span className="font-mono text-[10px] text-slate-400">({m.member_code})</span></p>
                  <p className="text-[11px] text-slate-500 truncate">{m.email} · {getTierDisplayName(m.tier, lang)}</p>
                </div>
                <div className="text-right font-mono shrink-0">
                  <p className="font-bold text-[#00552B]">{Number(m.wallet_balance_vnd || 0).toLocaleString('vi-VN')}₫</p>
                  <p className="text-[10px] text-amber-600 font-semibold">{(m.points?.available || 0).toLocaleString('vi-VN')} {t('điểm', 'pts')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
            {t(`Lịch sử Nạp tiền & Giao dịch Ví (${transactions.length})`, `Wallet Transaction Log (${transactions.length})`)}
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <p className="p-4 text-slate-400 text-center">{t('Chưa có giao dịch Ví nào.', 'No wallet transactions yet.')}</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="px-3.5 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{tx.full_name} — {tx.note}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{tx.reference_code} · {tx.created_at}</p>
                  </div>
                  <div className="text-right font-mono shrink-0">
                    <p className={`font-bold ${tx.tx_type === 'spend' ? 'text-rose-600' : 'text-[#00552B]'}`}>
                      {tx.tx_type === 'spend'
                        ? `-${Math.abs(Number(tx.amount_vnd || 0)).toLocaleString('vi-VN')}₫`
                        : `+${(Number(tx.amount_vnd || 0) + Number(tx.bonus_vnd || 0)).toLocaleString('vi-VN')}₫`}
                    </p>
                    {tx.points_delta > 0 && <p className="text-[10px] text-amber-600">+{tx.points_delta} {t('điểm', 'pts')}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
