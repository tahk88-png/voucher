export type LoyaltyTierName = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LoyaltyTier {
  name: LoyaltyTierName;
  label: string;
  minPoints: number;
  discountPercent: number;
  earlyAccess: boolean;
  freeShipping: boolean;
  exclusiveVouchers: boolean;
  bonusPointsMultiplier: number;
  color: string;
  icon: string;
}

export const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'bronze',
    label: 'Bronze',
    minPoints: 0,
    discountPercent: 0,
    earlyAccess: false,
    freeShipping: false,
    exclusiveVouchers: false,
    bonusPointsMultiplier: 1.0,
    color: '#CD7F32',
    icon: 'Shield',
  },
  {
    name: 'silver',
    label: 'Silver',
    minPoints: 500,
    discountPercent: 3,
    earlyAccess: false,
    freeShipping: false,
    exclusiveVouchers: false,
    bonusPointsMultiplier: 1.25,
    color: '#C0C0C0',
    icon: 'ShieldCheck',
  },
  {
    name: 'gold',
    label: 'Gold',
    minPoints: 2000,
    discountPercent: 5,
    earlyAccess: true,
    freeShipping: false,
    exclusiveVouchers: true,
    bonusPointsMultiplier: 1.5,
    color: '#FFD700',
    icon: 'ShieldPlus',
  },
  {
    name: 'platinum',
    label: 'Platinum',
    minPoints: 5000,
    discountPercent: 8,
    earlyAccess: true,
    freeShipping: true,
    exclusiveVouchers: true,
    bonusPointsMultiplier: 2.0,
    color: '#E5E4E2',
    icon: 'Crown',
  },
  {
    name: 'diamond',
    label: 'Diamond',
    minPoints: 10000,
    discountPercent: 12,
    earlyAccess: true,
    freeShipping: true,
    exclusiveVouchers: true,
    bonusPointsMultiplier: 3.0,
    color: '#B9F2FF',
    icon: 'Gem',
  },
];

/**
 * Calculate which tier a user belongs to based on lifetime points
 */
export function calculateTier(lifetimePoints: number): LoyaltyTier {
  let tier = LOYALTY_TIERS[0];
  for (const t of LOYALTY_TIERS) {
    if (lifetimePoints >= t.minPoints) {
      tier = t;
    }
  }
  return tier;
}

/**
 * Get the next tier above the current one, or null if at max
 */
export function getNextTier(currentTierName: LoyaltyTierName): LoyaltyTier | null {
  const idx = LOYALTY_TIERS.findIndex((t) => t.name === currentTierName);
  return LOYALTY_TIERS[idx + 1] || null;
}

/**
 * Get benefits list for a tier
 */
export function getTierBenefits(tierName: LoyaltyTierName): string[] {
  const tier = LOYALTY_TIERS.find((t) => t.name === tierName);
  if (!tier) return [];

  const benefits: string[] = [];
  if (tier.discountPercent > 0) {
    benefits.push(`${tier.discountPercent}% discount on purchases`);
  }
  if (tier.bonusPointsMultiplier > 1) {
    benefits.push(`${tier.bonusPointsMultiplier}x bonus points on purchases`);
  }
  if (tier.earlyAccess) {
    benefits.push('Early access to new vouchers');
  }
  if (tier.freeShipping) {
    benefits.push('Free shipping on all orders');
  }
  if (tier.exclusiveVouchers) {
    benefits.push('Access to exclusive vouchers');
  }
  if (benefits.length === 0) {
    benefits.push('Welcome tier — earn points to unlock perks!');
  }
  return benefits;
}

/**
 * Calculate progress to next tier
 */
export function getTierProgress(lifetimePoints: number): {
  currentTier: LoyaltyTier;
  nextTier: LoyaltyTier | null;
  pointsToNextTier: number;
  progressPercent: number;
} {
  const currentTier = calculateTier(lifetimePoints);
  const nextTier = getNextTier(currentTier.name);

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      pointsToNextTier: 0,
      progressPercent: 100,
    };
  }

  const pointsInCurrentRange = lifetimePoints - currentTier.minPoints;
  const rangeSize = nextTier.minPoints - currentTier.minPoints;
  const progressPercent = Math.min(100, Math.round((pointsInCurrentRange / rangeSize) * 100));

  return {
    currentTier,
    nextTier,
    pointsToNextTier: nextTier.minPoints - lifetimePoints,
    progressPercent,
  };
}
