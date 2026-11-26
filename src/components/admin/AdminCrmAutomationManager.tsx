import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Edit3,
  Gift,
  HeartHandshake,
  Play,
  RefreshCw,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';

interface CrmRuleRecord {
  id: number;
  rule_key: string;
  name_vi: string;
  name_en: string;
  trigger_type: string;
  days_threshold: number;
  voucher_code: string;
  bonus_points: number;
  title_vi: string;
  title_en: string;
  message_vi: string;
  message_en: string;
  link_url: string;
  active: number;
  last_run_at: string | null;
  total_sent: number;
  eligibleCount: number;
}

interface CrmRunRecord {
  id: number;
  rule_key: string;
  rule_name: string;
  matched_count: number;
  sent_count: number;
  actor_email: string;
  summary_text: string;
  created_at: string;
}

export const AdminCrmAutomationManager: React.FC = () => {
  const { lang, t } = useI18n();
  const { apiFetch, showToast } = useStore();

  const [rules, setRules] = useState<CrmRuleRecord[]>([]);
  const [runs, setRuns] = useState<CrmRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<number | 'all' | null>(null);
  const [editingRule, setEditingRule] = useState<CrmRuleRecord | null>(null);
  const [savingRule, setSavingRule] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/admin/crm/rules');
      if (res.ok) {
        const d = await res.json();
        setRules(Array.isArray(d.rules) ? d.rules : []);
        setRuns(Array.isArray(d.runs) ? d.runs : []);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleActive = async (rule: CrmRuleRecord) => {
    const res = await apiFetch(`/api/admin/crm/rules/${rule.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !rule.active }),
    });
    if (res.ok) {
      showToast(rule.active ? t('Đã tạm dừng kịch bản CSKH', 'Paused CRM rule') : t('Đã bật kịch bản CSKH', 'Activated CRM rule'));
      await loadData();
    }
  };

  const handleRunRule = async (rule: CrmRuleRecord) => {
    setRunningId(rule.id);
    try {
      const res = await apiFetch(`/api/admin/crm/rules/${rule.id}/run`, { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(d.summaryText || t(`Đã gửi chăm sóc cho ${d.sentCount} khách hàng`, `Sent care alerts to ${d.sentCount} members`));
        await loadData();
      }
    } finally {
      setRunningId(null);
    }
  };

  const handleRunAll = async () => {
    setRunningId('all');
    try {
      const res = await apiFetch('/api/admin/crm/run-all', { method: 'POST' });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          t(
            `Đã chạy ${d.rulesRun} kịch bản CSKH đang bật · Gửi thành công tới ${d.totalSent} lượt thành viên!`,
            `Executed ${d.rulesRun} active CRM workflows · Sent ${d.totalSent} care notifications!`
          )
        );
        await loadData();
      }
    } finally {
      setRunningId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setSavingRule(true);
    try {
      const res = await apiFetch(`/api/admin/crm/rules/${editingRule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_vi: editingRule.name_vi,
          name_en: editingRule.name_en,
          days_threshold: editingRule.days_threshold,
          voucher_code: editingRule.voucher_code,
          bonus_points: editingRule.bonus_points,
          title_vi: editingRule.title_vi,
          title_en: editingRule.title_en,
          message_vi: editingRule.message_vi,
          message_en: editingRule.message_en,
          link_url: editingRule.link_url,
          active: Boolean(editingRule.active),
        }),
      });
      if (res.ok) {
        showToast(t('Đã lưu cấu hình kịch bản CSKH tự động', 'Saved CRM automation rule'));
        setEditingRule(null);
        await loadData();
      }
    } finally {
      setSavingRule(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-[#00552B]" />
            {t('Chăm Sóc Khách Hàng Tự Động (CRM Automation)', 'Automated Customer Care Workflows (CRM)')}
          </h2>
          <p className="text-xs text-slate-500">
            {t(
              'Tự động lọc nhóm khách hàng theo chu kỳ mua hàng 21–30 ngày, hạng thành viên VIP và thành viên mới — tự gửi thông báo đẩy, mã giảm giá & cộng điểm tri ân (tự chống gửi trùng trong 7 ngày).',
              'Automatically target new members, 21-day repurchase cycles, 30-day win-backs, and VIP tiers with push alerts, vouchers & loyalty points (7-day anti-spam deduplication).'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={runningId !== null}
            onClick={handleRunAll}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#00552B] hover:bg-[#003D25] text-white text-xs font-bold cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            <Zap className="w-4 h-4 text-[#C6A667]" />
            <span>
              {runningId === 'all'
                ? t('Đang chạy toàn bộ...', 'Running All...')
                : t('Chạy tất cả kịch bản đang bật', 'Run All Active Workflows')}
            </span>
          </button>
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Rules Grid + Run Log */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-8 space-y-3">
          {loading ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center text-xs text-slate-400">
              {t('Đang tải kịch bản CSKH...', 'Loading CRM workflows...')}
            </div>
          ) : (
            rules.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          r.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {r.active ? t('Đang bật', 'Active') : t('Tạm dừng', 'Paused')}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-[#00552B] tabular-nums">
                        <Users className="w-3 h-3 inline mr-1" />
                        {r.eligibleCount} {t('khách phù hợp hiện tại', 'eligible now')}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                        {t('Đã gửi:', 'Total sent:')} {r.total_sent}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {lang === 'en' ? r.name_en : r.name_vi}
                    </h3>
                    <p className="text-slate-600">{lang === 'en' ? r.message_en : r.message_vi}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(r)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 cursor-pointer"
                    >
                      {r.active ? t('Tắt', 'Pause') : t('Bật', 'Enable')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingRule({ ...r })}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-[#00552B] text-slate-700 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{t('Sửa', 'Edit')}</span>
                    </button>
                    <button
                      type="button"
                      disabled={runningId !== null}
                      onClick={() => handleRunRule(r)}
                      className="px-3 py-1.5 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{runningId === r.id ? t('Đang chạy...', 'Running...') : t('Chạy ngay', 'Run Now')}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-mono">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {t(`Chu kỳ: ${r.days_threshold} ngày`, `Cycle: ${r.days_threshold}d`)}
                  </span>
                  {r.voucher_code && (
                    <span className="inline-flex items-center gap-1 text-amber-800 font-bold">
                      <Gift className="w-3 h-3" />
                      Voucher: {r.voucher_code}
                    </span>
                  )}
                  {r.bonus_points > 0 && (
                    <span className="inline-flex items-center gap-1 text-[#00552B] font-bold">
                      <Sparkles className="w-3 h-3" />
                      +{r.bonus_points} {t('điểm thưởng', 'pts')}
                    </span>
                  )}
                  {r.last_run_at && (
                    <span className="ml-auto text-slate-400">
                      {t('Chạy lần cuối:', 'Last run:')} {r.last_run_at}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Execution Runs Log */}
        <div className="xl:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">{t('Lịch sử thực thi CSKH Tự động', 'Automation Run History')}</h3>
          </div>
          {runs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              {t('Chưa có lượt chạy nào. Bấm "Chạy ngay" trên bất kỳ kịch bản nào để chăm sóc khách hàng.', 'No automation runs yet.')}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {runs.map((run) => (
                <div key={run.id} className="p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-900 line-clamp-1">{run.rule_name}</p>
                    <span className="font-mono font-bold text-[#00552B] shrink-0 tabular-nums">
                      {run.sent_count}/{run.matched_count}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{run.summary_text}</p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {run.created_at} · {run.actor_email}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-5 space-y-4 text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{t('Tùy chỉnh kịch bản CSKH Tự động', 'Edit CRM Automation Rule')}</h3>
              <button type="button" onClick={() => setEditingRule(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Ngưỡng ngày', 'Days Threshold')}</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={editingRule.days_threshold}
                  onChange={(e) => setEditingRule({ ...editingRule, days_threshold: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Mã Voucher đính kèm', 'Attached Voucher')}</label>
                <input
                  type="text"
                  value={editingRule.voucher_code}
                  onChange={(e) => setEditingRule({ ...editingRule, voucher_code: e.target.value.toUpperCase() })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">{t('Cộng điểm thưởng', 'Bonus Points')}</label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={editingRule.bonus_points}
                  onChange={(e) => setEditingRule({ ...editingRule, bonus_points: Number(e.target.value) })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề thông báo gửi khách (VI)', 'Customer Alert Title (VI)')}</label>
              <input
                type="text"
                required
                value={editingRule.title_vi}
                onChange={(e) => setEditingRule({ ...editingRule, title_vi: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Nội dung chăm sóc (VI)', 'Care Message (VI)')}</label>
              <textarea
                rows={3}
                required
                value={editingRule.message_vi}
                onChange={(e) => setEditingRule({ ...editingRule, message_vi: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Tiêu đề (EN)', 'Customer Alert Title (EN)')}</label>
              <input
                type="text"
                value={editingRule.title_en}
                onChange={(e) => setEditingRule({ ...editingRule, title_en: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">{t('Nội dung (EN)', 'Care Message (EN)')}</label>
              <textarea
                rows={2}
                value={editingRule.message_en}
                onChange={(e) => setEditingRule({ ...editingRule, message_en: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 font-semibold cursor-pointer"
              >
                {t('Hủy', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={savingRule}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00552B] text-white font-semibold cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                {savingRule ? t('Đang lưu...', 'Saving...') : t('Lưu thay đổi', 'Save Changes')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
