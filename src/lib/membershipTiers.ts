export type CanonicalTierName = 'ROAR Member' | 'ROAR Silver' | 'ROAR Gold' | 'ROAR Reserve';

export interface RoarMembershipTier {
  key: 'member' | 'silver' | 'gold' | 'reserve';
  name: CanonicalTierName;
  shortVi: string;
  shortEn: string;
  labelVi: string;
  labelEn: string;
  minSpendVnd: number;
  minPoints: number;
  multiplier: number;
  multiplierLabel: string;
  benefitsVi: string[];
  benefitsEn: string[];
}

export const ROAR_MEMBERSHIP_TIERS: RoarMembershipTier[] = [
  {
    key: 'member',
    name: 'ROAR Member',
    shortVi: 'Member',
    shortEn: 'Member',
    labelVi: 'Thành viên ROAR (Member)',
    labelEn: 'ROAR Member',
    minSpendVnd: 0,
    minPoints: 0,
    multiplier: 1.0,
    multiplierLabel: '1.0x',
    benefitsVi: [
      'Tích 1.0x điểm cho mọi đơn hàng hợp lệ (1 điểm / 10.000₫)',
      'Nạp Ví ROAR tặng thưởng +10% đến +30%',
      'Nhận mã ưu đãi chào mừng & bản tin mùa vụ',
    ],
    benefitsEn: [
      'Earn 1.0x points on every eligible order (1 pt / 10,000 VND)',
      'ROAR Wallet top-up bonuses from +10% to +30%',
      'Welcome voucher & seasonal harvest dispatches',
    ],
  },
  {
    key: 'silver',
    name: 'ROAR Silver',
    shortVi: 'Silver',
    shortEn: 'Silver',
    labelVi: 'ROAR Bạc (Silver)',
    labelEn: 'ROAR Silver',
    minSpendVnd: 3000000,
    minPoints: 300,
    multiplier: 1.25,
    multiplierLabel: '1.25x',
    benefitsVi: [
      'Nhân 1.25x tốc độ tích điểm thưởng mọi đơn hàng',
      'Ưu đãi sinh nhật giảm 15% toàn giỏ hàng',
      'Freeship cho đơn hàng từ 400.000₫',
    ],
    benefitsEn: [
      '1.25x accelerated reward points multiplier',
      '15% birthday month discount storewide',
      'Complimentary shipping on orders from 400,000 VND',
    ],
  },
  {
    key: 'gold',
    name: 'ROAR Gold',
    shortVi: 'Gold',
    shortEn: 'Gold',
    labelVi: 'ROAR Vàng (Gold)',
    labelEn: 'ROAR Gold',
    minSpendVnd: 10000000,
    minPoints: 1000,
    multiplier: 1.5,
    multiplierLabel: '1.5x',
    benefitsVi: [
      'Nhân 1.5x điểm thưởng mọi giao dịch',
      'Freeship mọi đơn hàng toàn quốc không giới hạn',
      'Quyền mua sớm các mẻ rang giới hạn Cầu Đất',
    ],
    benefitsEn: [
      '1.5x reward points on all purchases',
      'Unlimited complimentary nationwide shipping',
      'Early access to limited Cầu Đất micro-lots',
    ],
  },
  {
    key: 'reserve',
    name: 'ROAR Reserve',
    shortVi: 'Reserve',
    shortEn: 'Reserve',
    labelVi: 'ROAR Thượng Hạng (Reserve)',
    labelEn: 'ROAR Reserve (VIP)',
    minSpendVnd: 25000000,
    minPoints: 2500,
    multiplier: 2.0,
    multiplierLabel: '2.0x',
    benefitsVi: [
      'Nhân 2.0x điểm thưởng cao nhất hệ thống',
      'Đặc quyền Signature Reserve & quà tặng VIP cuối năm',
      'Chuyên viên Barista & Quà tặng doanh nghiệp riêng',
    ],
    benefitsEn: [
      'Maximum 2.0x reward points multiplier',
      'Signature Reserve privileges & annual VIP gift box',
      'Dedicated Barista & executive gifting concierge',
    ],
  },
];

export function normalizeMembershipTierName(raw?: string | null): CanonicalTierName {
  const clean = String(raw || '').trim().toLowerCase();
  if (!clean) return 'ROAR Member';
  if (
    clean.includes('reserve') ||
    clean.includes('thượng hạng') ||
    clean.includes('thuong hang') ||
    clean.includes('platinum') ||
    clean.includes('bạch kim')
  ) {
    return 'ROAR Reserve';
  }
  if (clean.includes('gold') || clean.includes('vàng') || clean.includes('vang')) {
    return 'ROAR Gold';
  }
  if (clean.includes('silver') || clean.includes('bạc') || clean.includes('bac')) {
    return 'ROAR Silver';
  }
  return 'ROAR Member';
}

export function getTierIndexByName(raw?: string | null): number {
  const canonical = normalizeMembershipTierName(raw);
  const idx = ROAR_MEMBERSHIP_TIERS.findIndex((t) => t.name === canonical);
  return idx >= 0 ? idx : 0;
}

export function resolveEarnedTierIndex(params: {
  lifetimeSpendVnd?: number;
  lifetimePoints?: number;
}): number {
  const spend = Math.max(0, Number(params.lifetimeSpendVnd || 0));
  const points = Math.max(0, Number(params.lifetimePoints || 0));
  let idx = 0;
  for (let i = ROAR_MEMBERSHIP_TIERS.length - 1; i >= 0; i--) {
    if (spend >= ROAR_MEMBERSHIP_TIERS[i].minSpendVnd || points >= ROAR_MEMBERSHIP_TIERS[i].minPoints) {
      idx = i;
      break;
    }
  }
  return idx;
}

export function resolveEffectiveMembershipTier(params: {
  currentTierName?: string | null;
  lifetimeSpendVnd?: number;
  lifetimePoints?: number;
}) {
  const explicitIdx = getTierIndexByName(params.currentTierName);
  const earnedIdx = resolveEarnedTierIndex(params);
  const activeIdx = Math.max(explicitIdx, earnedIdx);
  const tier = ROAR_MEMBERSHIP_TIERS[activeIdx] || ROAR_MEMBERSHIP_TIERS[0];
  const nextTier = activeIdx < ROAR_MEMBERSHIP_TIERS.length - 1 ? ROAR_MEMBERSHIP_TIERS[activeIdx + 1] : null;
  return {
    tier,
    activeIdx,
    explicitIdx,
    earnedIdx,
    nextTier,
    isManuallyElevated: explicitIdx > earnedIdx,
  };
}

export function getTierDisplayName(raw?: string | null, lang: 'vi' | 'en' = 'vi'): string {
  const canonical = normalizeMembershipTierName(raw);
  const found = ROAR_MEMBERSHIP_TIERS.find((t) => t.name === canonical) || ROAR_MEMBERSHIP_TIERS[0];
  return lang === 'en' ? found.labelEn : found.labelVi;
}
