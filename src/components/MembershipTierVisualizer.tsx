import React from 'react';
import { Award, CheckCircle2, Crown, Lock, Shield, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { useStore } from '../context/StoreContext';
import {
  ROAR_MEMBERSHIP_TIERS,
  resolveEffectiveMembershipTier,
  type CanonicalTierName,
} from '../lib/membershipTiers';

const VISUALIZER_STYLES: Record<
  CanonicalTierName,
  { accentBg: string; accentText: string; accentBorder: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  'ROAR Member': {
    accentBg: 'bg-amber-900/10 dark:bg-amber-700/20',
    accentText: 'text-amber-800 dark:text-amber-300',
    accentBorder: 'border-amber-700/30',
    Icon: Shield,
  },
  'ROAR Silver': {
    accentBg: 'bg-slate-200/70 dark:bg-slate-700/35',
    accentText: 'text-slate-700 dark:text-slate-200',
    accentBorder: 'border-slate-400/40',
    Icon: Award,
  },
  'ROAR Gold': {
    accentBg: 'bg-[#C6A667]/20 dark:bg-[#C6A667]/20',
    accentText: 'text-[#8C6D2E] dark:text-[#C6A667]',
    accentBorder: 'border-[#C6A667]/60',
    Icon: Crown,
  },
  'ROAR Reserve': {
    accentBg: 'bg-[#111111] dark:bg-black',
    accentText: 'text-[#C6A667]',
    accentBorder: 'border-[#C6A667]',
    Icon: Sparkles,
  },
};

interface MembershipTierVisualizerProps {
  currentTierName?: string;
  lifetimeSpendVnd: number;
  lifetimePoints: number;
}

export const MembershipTierVisualizer: React.FC<MembershipTierVisualizerProps> = ({
  currentTierName,
  lifetimeSpendVnd,
  lifetimePoints,
}) => {
  const { lang, t } = useI18n();
  const { formatPrice } = useStore();

  const safeSpend = Math.max(0, Number(lifetimeSpendVnd || 0));
  const safePoints = Math.max(0, Number(lifetimePoints || 0));

  const { tier: currentTier, activeIdx, nextTier } = resolveEffectiveMembershipTier({
    currentTierName,
    lifetimeSpendVnd: safeSpend,
    lifetimePoints: safePoints,
  });

  let progressPct = 100;
  let remainingSpendVnd = 0;
  let remainingPoints = 0;
  if (nextTier) {
    const spendProg =
      safeSpend >= currentTier.minSpendVnd
        ? ((safeSpend - currentTier.minSpendVnd) / Math.max(1, nextTier.minSpendVnd - currentTier.minSpendVnd)) * 100
        : (safeSpend / Math.max(1, nextTier.minSpendVnd)) * 100;
    const ptsProg =
      safePoints >= currentTier.minPoints
        ? ((safePoints - currentTier.minPoints) / Math.max(1, nextTier.minPoints - currentTier.minPoints)) * 100
        : (safePoints / Math.max(1, nextTier.minPoints)) * 100;
    progressPct = Math.min(100, Math.max(0, Math.round(Math.max(spendProg, ptsProg))));
    remainingSpendVnd = Math.max(0, nextTier.minSpendVnd - safeSpend);
    remainingPoints = Math.max(0, nextTier.minPoints - safePoints);
  }

  return (
    <div className="space-y-5">
      {/* Current Tier Progress Hero */}
      <div className="rounded-2xl bg-gradient-to-br from-[#003D25] via-[#00552B] to-[#0E1512] text-white p-5 sm:p-6 border border-[#C6A667]/35 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#C6A667] font-semibold inline-flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>{t('HÀNH TRÌNH THĂNG HẠNG THÀNH VIÊN', 'MEMBERSHIP TIER JOURNEY')}</span>
            </p>
            <h3 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2.5">
              <span>{lang === 'en' ? currentTier.labelEn : currentTier.labelVi}</span>
              <span className="px-2 py-0.5 rounded bg-[#C6A667] text-[#111111] font-mono text-xs font-extrabold">
                {currentTier.multiplierLabel} {t('Điểm', 'Pts')}
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-5 text-xs">
            <div>
              <p className="text-[#F8F5EF]/65">{t('Tổng chi tiêu tích lũy', 'Lifetime Spend')}</p>
              <p className="text-base font-mono font-bold text-white tabular-nums">{formatPrice(safeSpend)}</p>
            </div>
            <div className="h-8 w-px bg-white/15" />
            <div>
              <p className="text-[#F8F5EF]/65">{t('Điểm tích lũy', 'Lifetime Points')}</p>
              <p className="text-base font-mono font-bold text-[#C6A667] tabular-nums">
                {safePoints.toLocaleString('vi-VN')} {t('điểm', 'pts')}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar toward Next Tier */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F8F5EF]/90">
              {nextTier
                ? t(`Tiến độ lên hạng ${nextTier.labelVi}`, `Progress to ${nextTier.labelEn}`)
                : t('Bạn đã đạt hạng thành viên cao nhất tại ROAR COFFEE®!', 'You have reached the highest ROAR COFFEE® VIP tier!')}
            </span>
            <span className="font-mono font-bold text-[#C6A667] tabular-nums">{progressPct}%</span>
          </div>

          <div className="w-full h-3 rounded-full bg-black/35 border border-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#C6A667] via-[#e5ca8e] to-[#C6A667] transition-all duration-700"
              style={{ width: `${Math.max(4, progressPct)}%` }}
            />
          </div>

          {nextTier && (
            <p className="text-[11px] text-[#F8F5EF]/75">
              {t(
                `Cần thêm ${formatPrice(remainingSpendVnd)} chi tiêu hoặc ${remainingPoints.toLocaleString('vi-VN')} điểm để mở khóa hạng ${nextTier.labelVi} (${nextTier.multiplierLabel} điểm).`,
                `Spend ${formatPrice(remainingSpendVnd)} more or earn ${remainingPoints.toLocaleString('vi-VN')} more points to unlock ${nextTier.labelEn} (${nextTier.multiplierLabel} pts).`
              )}
            </p>
          )}
        </div>

        {/* 4-Stage Milestone Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/15">
          {ROAR_MEMBERSHIP_TIERS.map((tr, idx) => {
            const unlocked = idx <= activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={tr.key}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isCurrent
                    ? 'bg-[#C6A667]/20 border-[#C6A667] text-white'
                    : unlocked
                      ? 'bg-white/8 border-white/20 text-[#F8F5EF]/90'
                      : 'bg-black/20 border-white/10 text-[#F8F5EF]/45'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
                  {unlocked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#C6A667] shrink-0" />
                  ) : (
                    <Lock className="w-3 h-3 opacity-60 shrink-0" />
                  )}
                  <span className="truncate">{lang === 'en' ? tr.shortEn : tr.shortVi}</span>
                </div>
                <p className="text-[10px] font-mono mt-0.5 tabular-nums opacity-80">
                  {tr.minSpendVnd === 0 ? t('Khởi đầu', 'Start') : `${formatPrice(tr.minSpendVnd)} · ${tr.minPoints}pt`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Exclusive Tier Benefits Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {ROAR_MEMBERSHIP_TIERS.map((tr, idx) => {
          const isCurrent = idx === activeIdx;
          const unlocked = idx <= activeIdx;
          const st = VISUALIZER_STYLES[tr.name];
          const Icon = st.Icon;
          return (
            <div
              key={tr.key}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 transition-all ${
                isCurrent
                  ? 'border-[#00552B] dark:border-[#C6A667] ring-1 ring-[#00552B] dark:ring-[#C6A667] bg-white dark:bg-[#16221C] shadow-md'
                  : 'border-[#202020]/10 dark:border-white/10 bg-white/80 dark:bg-[#16221C]/70'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${st.accentBg} ${st.accentText} ${st.accentBorder}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tr.multiplierLabel}</span>
                  </span>
                  {isCurrent ? (
                    <span className="px-2 py-0.5 rounded-full bg-[#00552B] text-white text-[10px] font-bold">
                      {t('Hạng hiện tại', 'Current')}
                    </span>
                  ) : unlocked ? (
                    <span className="text-[10px] font-semibold text-[#00552B] dark:text-[#C6A667]">
                      {t('Đã mở khóa', 'Unlocked')}
                    </span>
                  ) : (
                    <span className="text-[10px] text-[#202020]/45 dark:text-[#F1EFEA]/45 font-mono">
                      {formatPrice(tr.minSpendVnd)}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
                    {lang === 'en' ? tr.labelEn : tr.labelVi}
                  </h4>
                  <p className="text-[11px] text-[#202020]/60 dark:text-[#F1EFEA]/60 font-mono mt-0.5">
                    {tr.minSpendVnd === 0
                      ? t('Miễn phí đăng ký', 'Free to join')
                      : t(
                          `Từ ${formatPrice(tr.minSpendVnd)} hoặc ${tr.minPoints.toLocaleString('vi-VN')} điểm`,
                          `From ${formatPrice(tr.minSpendVnd)} or ${tr.minPoints.toLocaleString('vi-VN')} pts`
                        )}
                  </p>
                </div>

                <ul className="space-y-1.5 pt-1 border-t border-[#202020]/10 dark:border-white/10 text-xs text-[#202020]/80 dark:text-[#F1EFEA]/80">
                  {(lang === 'en' ? tr.benefitsEn : tr.benefitsVi).map((b, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-1.5 leading-snug">
                      <Sparkles className="w-3 h-3 text-[#C6A667] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
