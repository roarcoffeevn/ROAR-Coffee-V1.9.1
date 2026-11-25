import React from 'react';
import { Award, Crown, Shield, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  ROAR_MEMBERSHIP_TIERS,
  resolveEffectiveMembershipTier,
  type CanonicalTierName,
} from '../lib/membershipTiers';

export interface LoyaltyTierProgressCardProps {
  accumulatedPoints: number;
  availablePoints?: number;
  lifetimeSpendVnd?: number;
  currentTierName?: string;
  onViewBenefits?: () => void;
}

const TIER_STYLES: Record<
  CanonicalTierName,
  {
    accentText: string;
    badgeBg: string;
    barGradient: string;
    ringColor: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  'ROAR Member': {
    accentText: 'text-[#8D5935] dark:text-[#D89A6A]',
    badgeBg: 'bg-gradient-to-br from-[#A66A3E] to-[#6E4020] text-white',
    barGradient: 'from-[#A66A3E] to-[#D89A6A]',
    ringColor: 'ring-[#A66A3E]/25',
    Icon: Shield,
  },
  'ROAR Silver': {
    accentText: 'text-slate-600 dark:text-slate-300',
    badgeBg: 'bg-gradient-to-br from-slate-400 to-slate-600 text-white',
    barGradient: 'from-slate-400 to-slate-200',
    ringColor: 'ring-slate-400/30',
    Icon: Award,
  },
  'ROAR Gold': {
    accentText: 'text-[#B88933] dark:text-[#E5C27A]',
    badgeBg: 'bg-gradient-to-br from-[#D9B166] to-[#9B6E24] text-[#111111]',
    barGradient: 'from-[#C6A667] via-[#E5C27A] to-[#F3DC9B]',
    ringColor: 'ring-[#C6A667]/40',
    Icon: Crown,
  },
  'ROAR Reserve': {
    accentText: 'text-[#00552B] dark:text-[#6EE7B7]',
    badgeBg: 'bg-gradient-to-br from-[#00552B] via-[#0B7A43] to-[#C6A667] text-white',
    barGradient: 'from-[#00552B] via-[#10B981] to-[#C6A667]',
    ringColor: 'ring-[#00552B]/35 dark:ring-[#C6A667]/40',
    Icon: Sparkles,
  },
};

export const LoyaltyTierProgressCard: React.FC<LoyaltyTierProgressCardProps> = ({
  accumulatedPoints,
  availablePoints,
  lifetimeSpendVnd = 0,
  currentTierName,
  onViewBenefits,
}) => {
  const { lang, t } = useI18n();
  const safePoints = Math.max(0, Math.floor(accumulatedPoints || 0));
  const safeSpend = Math.max(0, Math.floor(lifetimeSpendVnd || 0));

  const { tier: currentTier, activeIdx, nextTier } = resolveEffectiveMembershipTier({
    currentTierName,
    lifetimeSpendVnd: safeSpend,
    lifetimePoints: safePoints,
  });

  const style = TIER_STYLES[currentTier.name];
  const CurrentIcon = style.Icon;

  let progressPct = 100;
  let pointsRemaining = 0;
  if (nextTier) {
    const ptsProgress =
      safePoints >= currentTier.minPoints
        ? ((safePoints - currentTier.minPoints) / Math.max(1, nextTier.minPoints - currentTier.minPoints)) * 100
        : (safePoints / Math.max(1, nextTier.minPoints)) * 100;
    const spendProgress =
      safeSpend >= currentTier.minSpendVnd
        ? ((safeSpend - currentTier.minSpendVnd) / Math.max(1, nextTier.minSpendVnd - currentTier.minSpendVnd)) * 100
        : (safeSpend / Math.max(1, nextTier.minSpendVnd)) * 100;
    progressPct = Math.min(100, Math.max(0, Math.round(Math.max(ptsProgress, spendProgress))));
    pointsRemaining = Math.max(0, nextTier.minPoints - safePoints);
  }

  return (
    <section
      aria-label={t('Tiến độ hạng thành viên', 'Loyalty tier progress')}
      className="relative overflow-hidden rounded-2xl border border-[#202020]/10 dark:border-white/10 bg-white dark:bg-[#16221C] p-6 shadow-sm"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#C6A667]/10 blur-2xl"
      />

      {/* Top row: Current Tier Identity + Accumulated Points */}
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`flex h-13 w-13 shrink-0 items-center justify-center rounded-xl shadow-md ring-4 ${style.badgeBg} ${style.ringColor}`}
          >
            <CurrentIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#202020]/55 dark:text-[#F1EFEA]/55">
                {t('Hạng thành viên hiện tại', 'Current Loyalty Tier')}
              </span>
              <span className="rounded-md bg-[#00552B]/10 dark:bg-[#C6A667]/15 px-2 py-0.5 text-[11px] font-semibold text-[#00552B] dark:text-[#C6A667]">
                {currentTier.name} · {currentTier.multiplierLabel}
              </span>
            </div>
            <h2 className={`mt-0.5 text-xl font-bold tracking-tight ${style.accentText}`}>
              {lang === 'en' ? currentTier.labelEn : currentTier.labelVi}
            </h2>
            <p className="mt-0.5 text-xs text-[#202020]/65 dark:text-[#F1EFEA]/65">
              {(lang === 'en' ? currentTier.benefitsEn : currentTier.benefitsVi)[0]}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-[11px] font-medium text-[#202020]/55 dark:text-[#F1EFEA]/55">
            {t('Điểm tích lũy', 'Accumulated Points')}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tabular-nums text-[#00552B] dark:text-[#C6A667]">
              {safePoints.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs font-medium text-[#202020]/60 dark:text-[#F1EFEA]/60">
              {t('điểm', 'pts')}
            </span>
          </div>
          {typeof availablePoints === 'number' && availablePoints !== safePoints && (
            <span className="text-[11px] text-[#202020]/50 dark:text-[#F1EFEA]/50">
              {t(
                `Khả dụng: ${availablePoints.toLocaleString('vi-VN')} điểm`,
                `Available: ${availablePoints.toLocaleString('vi-VN')} pts`
              )}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar toward next tier */}
      <div className="relative mt-6 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          {nextTier ? (
            <p className="font-medium text-[#202020]/80 dark:text-[#F1EFEA]/85">
              {t(
                `Cần thêm ${pointsRemaining.toLocaleString('vi-VN')} điểm để lên ${nextTier.labelVi}`,
                `${pointsRemaining.toLocaleString('vi-VN')} more pts to unlock ${nextTier.labelEn}`
              )}
            </p>
          ) : (
            <p className="font-semibold text-[#00552B] dark:text-[#C6A667]">
              {t(
                'Bạn đã đạt hạng cao nhất tại ROAR COFFEE!',
                'You have reached the highest tier at ROAR COFFEE!'
              )}
            </p>
          )}
          <span className="font-mono font-bold tabular-nums text-[#00552B] dark:text-[#C6A667]">
            {progressPct}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-3 w-full overflow-hidden rounded-full bg-[#202020]/10 dark:bg-white/10"
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ease-out ${style.barGradient}`}
            style={{ width: `${Math.max(progressPct, safePoints > 0 ? 4 : 0)}%` }}
          />
        </div>

        {/* Tier milestones strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {ROAR_MEMBERSHIP_TIERS.map((tr, idx) => {
            const reached = idx <= activeIdx;
            const isCurrent = idx === activeIdx;
            return (
              <div
                key={tr.key}
                className={`rounded-xl border px-3 py-2 transition-colors ${
                  isCurrent
                    ? 'border-[#00552B] dark:border-[#C6A667] bg-[#00552B]/5 dark:bg-[#C6A667]/10'
                    : reached
                      ? 'border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/80 dark:bg-[#0E1512]/80'
                      : 'border-dashed border-[#202020]/15 dark:border-white/10 opacity-65'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-bold truncate ${
                      isCurrent ? 'text-[#00552B] dark:text-[#C6A667]' : 'text-[#202020] dark:text-[#F1EFEA]'
                    }`}
                  >
                    {tr.name}
                  </span>
                  {reached && (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#00552B] dark:bg-[#C6A667] text-white dark:text-[#111111]">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                <p className="mt-0.5 font-mono text-[10px] tabular-nums text-[#202020]/60 dark:text-[#F1EFEA]/60">
                  {tr.minPoints.toLocaleString('vi-VN')}+ {t('điểm', 'pts')} · {tr.multiplierLabel}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer action */}
      {onViewBenefits && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#202020]/10 dark:border-white/10 pt-4 text-xs">
          <span className="text-[#202020]/60 dark:text-[#F1EFEA]/60">
            {nextTier
              ? t(
                  `Đặc quyền hạng tiếp theo (${nextTier.name}): ${(nextTier.benefitsVi)[0]}`,
                  `Next tier perk (${nextTier.name}): ${(nextTier.benefitsEn)[0]}`
                )
              : t('Tất cả đặc quyền VIP đã được mở khóa.', 'All VIP benefits unlocked.')}
          </span>
          <button
            type="button"
            onClick={onViewBenefits}
            className="inline-flex items-center gap-1 font-semibold text-[#00552B] dark:text-[#C6A667] hover:underline cursor-pointer shrink-0"
          >
            <span>{t('Xem chi tiết hạng', 'View tier details')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </section>
  );
};
