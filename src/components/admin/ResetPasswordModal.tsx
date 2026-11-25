import React, { useEffect, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw, ShieldAlert, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { useStore } from '../../context/StoreContext';

export interface ResetPasswordTarget {
  id: number;
  email: string;
  fullName: string;
  role?: string;
  adminRole?: string;
  memberCode?: string;
}

interface ResetPasswordModalProps {
  target: ResetPasswordTarget | null;
  onClose: () => void;
  onSuccess?: () => void | Promise<void>;
}

function generateStrongPassword(length = 12): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '@#$!*';
  const all = upper + lower + digits + symbols;
  const picks = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];
  while (picks.length < length) {
    picks.push(all[Math.floor(Math.random() * all.length)]);
  }
  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }
  return picks.join('');
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  target,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  const { apiFetch, showToast } = useStore();
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(true);
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (target) {
      setNewPassword('');
      setShowPass(true);
      setCopied(false);
      setErrorMsg('');
    }
  }, [target?.id]);

  if (!target) return null;

  const isTargetAdmin = target.role === 'admin';
  const isTargetSuperAdmin = isTargetAdmin && target.adminRole === 'super_admin';

  const handleCopy = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (newPassword.length < 8) {
      setErrorMsg(t('Mật khẩu mới phải có ít nhất 8 ký tự.', 'New password must be at least 8 characters.'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/admin/users/${target.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast(
          t(
            `Đã đặt lại mật khẩu mới cho ${target.email}.`,
            `Password updated for ${target.email}.`
          )
        );
        if (onSuccess) await onSuccess();
        onClose();
      } else {
        setErrorMsg(d.error || t('Không thể đặt lại mật khẩu.', 'Unable to reset password.'));
      }
    } catch {
      setErrorMsg(t('Lỗi kết nối máy chủ.', 'Network error.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-[1px] flex items-center justify-center p-4 text-xs">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#00552B]">
              {t('Bảo mật Tài khoản CMS', 'Account Security Override')}
            </p>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-[#00552B]" />
              {t('Đặt lại mật khẩu thủ công', 'Manual Password Reset')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-900 text-sm">{target.fullName}</span>
            <span className="font-mono text-[11px] text-slate-600">
              {isTargetSuperAdmin
                ? 'Super Admin'
                : isTargetAdmin
                  ? t('Quản trị viên', 'Admin Staff')
                  : target.role === 'b2b_partner'
                    ? 'B2B Partner'
                    : t('Thành viên / Khách hàng', 'Member / Customer')}
            </span>
          </div>
          <p className="font-mono text-[11px] text-slate-600 break-all">
            {target.email}
            {target.memberCode ? ` · ${target.memberCode}` : ''}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                {t('Mật khẩu mới (≥ 8 ký tự) *', 'New Password (≥ 8 chars) *')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewPassword(generateStrongPassword());
                  setShowPass(true);
                  setErrorMsg('');
                }}
                className="text-[11px] font-semibold text-[#00552B] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                {t('Tạo ngẫu nhiên', 'Generate Strong')}
              </button>
            </div>

            <div className="relative flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('Nhập tối thiểu 8 ký tự...', 'Minimum 8 characters...')}
                  className="w-full border border-slate-300 focus:border-[#00552B] focus:outline-none rounded-lg pl-3 pr-9 py-2.5 font-mono text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPass ? t('Ẩn mật khẩu', 'Hide password') : t('Hiện mật khẩu', 'Show password')}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                disabled={!newPassword}
                onClick={handleCopy}
                className="px-2.5 py-2.5 rounded-lg border border-slate-200 hover:border-[#00552B] text-slate-700 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer shrink-0"
                title={t('Sao chép mật khẩu', 'Copy password')}
              >
                {copied ? <Check className="w-4 h-4 text-[#00552B]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">
              {t(
                'Sau khi lưu, mật khẩu cũ hết hiệu lực ngay lập tức và người dùng có thể đăng nhập bằng mật khẩu mới này.',
                'Once saved, the previous password is invalidated immediately and the user can sign in with this new password.'
              )}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold cursor-pointer"
            >
              {t('Hủy', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#00552B] hover:bg-[#003D25] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {submitting ? t('Đang lưu...', 'Updating...') : t('Xác nhận Đặt lại Mật khẩu', 'Confirm Password Reset')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
