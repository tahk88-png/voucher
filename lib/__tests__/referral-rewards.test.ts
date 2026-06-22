import { describe, it, expect } from 'vitest';
import { calculateReferralReward, REFERRAL_REWARD_PERCENT } from '@/lib/referral-rewards';

// Pure unit tests — no DB, runs in the default suite.

describe('calculateReferralReward', () => {
  it('rewards REFERRAL_REWARD_PERCENT of face value for fixed_amount', () => {
    // €50.00 fixed voucher → 10% = €5.00 (was 100% = €50.00 before the fix)
    expect(
      calculateReferralReward({ voucherType: 'fixed_amount', voucherValue: 5000, discountApplied: 5000 }),
    ).toBe(500);
  });

  it('rewards REFERRAL_REWARD_PERCENT of face value for credit_amount', () => {
    expect(
      calculateReferralReward({ voucherType: 'credit_amount', voucherValue: 3000, discountApplied: 0 }),
    ).toBe(300);
  });

  it('rewards REFERRAL_REWARD_PERCENT of the realised discount for percentage', () => {
    // percentage voucher: base is the actual discount applied, not face value
    expect(
      calculateReferralReward({ voucherType: 'percentage', voucherValue: 20, discountApplied: 4000 }),
    ).toBe(400);
  });

  it('is consistent across types for the same realised value', () => {
    const fixed = calculateReferralReward({ voucherType: 'fixed_amount', voucherValue: 10000, discountApplied: 10000 });
    const pct = calculateReferralReward({ voucherType: 'percentage', voucherValue: 50, discountApplied: 10000 });
    expect(fixed).toBe(pct); // same realised base → same reward
  });

  it('floors fractional rewards', () => {
    // 10% of 95 minor units = 9.5 → floor 9
    expect(
      calculateReferralReward({ voucherType: 'fixed_amount', voucherValue: 95, discountApplied: 95 }),
    ).toBe(9);
  });

  it('returns 0 for non-positive base', () => {
    expect(calculateReferralReward({ voucherType: 'fixed_amount', voucherValue: 0, discountApplied: 0 })).toBe(0);
    expect(calculateReferralReward({ voucherType: 'percentage', voucherValue: 20, discountApplied: 0 })).toBe(0);
    expect(calculateReferralReward({ voucherType: 'fixed_amount', voucherValue: -100, discountApplied: 0 })).toBe(0);
  });

  it('never exceeds the realised base (no >100% payout)', () => {
    const base = 7777;
    const reward = calculateReferralReward({ voucherType: 'fixed_amount', voucherValue: base, discountApplied: base });
    expect(reward).toBeLessThanOrEqual(base);
    expect(reward).toBe(Math.floor((base * REFERRAL_REWARD_PERCENT) / 100));
  });
});
