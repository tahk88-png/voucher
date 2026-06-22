/**
 * Referral reward calculation (pure — no DB/server deps).
 *
 * The referrer earns REFERRAL_REWARD_PERCENT of the value the referred
 * friend realised on redemption. Centralised here so the two redemption
 * paths — app/api/redemptions and app/api/commerce/redemption/confirm —
 * stay in lockstep.
 *
 * History: fixed_amount / credit_amount vouchers previously granted the
 * FULL voucher value (100%) as referral credit, while percentage vouchers
 * granted only 10% of the realised discount. That was both inconsistent and
 * an unsustainable payout (referring a €50 fixed voucher minted €50 of
 * referrer credit). All voucher types now use REFERRAL_REWARD_PERCENT of the
 * realised value. Tune the percentage here in one place.
 */

export const REFERRAL_REWARD_PERCENT = 10;

export function calculateReferralReward(params: {
  voucherType: string;
  voucherValue: number;
  discountApplied: number;
}): number {
  const { voucherType, voucherValue, discountApplied } = params;
  // Realised value: the discount actually applied for percentage vouchers,
  // the face value for fixed_amount / credit_amount vouchers.
  const base = voucherType === 'percentage' ? discountApplied : voucherValue;
  if (base <= 0) return 0;
  return Math.floor((base * REFERRAL_REWARD_PERCENT) / 100);
}
