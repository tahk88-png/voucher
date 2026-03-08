export type ReferralTier = {
  name: string;
  minReferrals: number;
  bonusPercent: number; // extra % on top of base credit
  badge: string;
};

export const REFERRAL_TIERS: ReferralTier[] = [
  { name: 'Starter', minReferrals: 0, bonusPercent: 0, badge: '🌱' },
  { name: 'Advocate', minReferrals: 5, bonusPercent: 10, badge: '⭐' },
  { name: 'Champion', minReferrals: 20, bonusPercent: 25, badge: '🏆' },
  { name: 'Legend', minReferrals: 50, bonusPercent: 50, badge: '💎' },
];

export function getUserReferralTier(redeemedReferralCount: number): ReferralTier {
  let tier = REFERRAL_TIERS[0];
  for (const t of REFERRAL_TIERS) {
    if (redeemedReferralCount >= t.minReferrals) tier = t;
  }
  return tier;
}

export function getNextReferralTier(currentTier: ReferralTier): ReferralTier | null {
  const idx = REFERRAL_TIERS.findIndex(t => t.name === currentTier.name);
  return REFERRAL_TIERS[idx + 1] || null;
}

/** Apply tier bonus to a credit amount (in minor units) */
export function applyTierBonus(baseAmount: number, tier: ReferralTier): number {
  if (tier.bonusPercent === 0) return baseAmount;
  return Math.round(baseAmount * (1 + tier.bonusPercent / 100));
}
