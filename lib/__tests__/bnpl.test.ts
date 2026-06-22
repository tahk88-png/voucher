/**
 * Unit tests for lib/bnpl.ts.
 *
 * Focus: buildInstallmentChargeParams — the pure helper the installment cron
 * uses to charge each installment off-session. These assertions pin down the
 * exact fields the original cron got wrong:
 *   - currency must be the plan's real currency (was a `merchant.name ? 'eur'
 *     : 'usd'` ternary that always produced 'eur');
 *   - customer + payment_method must be set and confirm/off_session must be on
 *     (were gated on a never-populated stripeCustomerId, so charges no-op'd).
 * Also covers calculateInstallments rounding/total invariants.
 */

import { describe, it, expect } from 'vitest';
import {
  buildInstallmentChargeParams,
  calculateInstallments,
  type BnplPlanType,
} from '../bnpl';

const baseInput = {
  amountCents: 2500,
  currency: 'usd',
  stripeCustomerId: 'cus_test123',
  stripePaymentMethodId: 'pm_test123',
  planId: 'plan_abc',
  installmentNumber: 2,
  userId: 'user_1',
  merchantId: 'merchant_1',
};

describe('buildInstallmentChargeParams', () => {
  it('charges the saved customer + payment method off-session and confirms', () => {
    const params = buildInstallmentChargeParams(baseInput);

    // Regression #1: customer/payment_method must be explicit, and the charge
    // must actually run (confirm) without the user present (off_session).
    expect(params.customer).toBe('cus_test123');
    expect(params.payment_method).toBe('pm_test123');
    expect(params.confirm).toBe(true);
    expect(params.off_session).toBe(true);
    expect(params.amount).toBe(2500);
    // Redirect-based methods can't be charged off-session.
    expect(params.payment_method_types).toEqual(['card']);
  });

  it('uses the plan currency, not a hardcoded one', () => {
    // Regression #2: the cron hardcoded 'eur'. Prove the currency flows through.
    expect(buildInstallmentChargeParams({ ...baseInput, currency: 'usd' }).currency).toBe('usd');
    expect(buildInstallmentChargeParams({ ...baseInput, currency: 'gbp' }).currency).toBe('gbp');
  });

  it('lowercases the currency (Stripe requires lowercase ISO codes)', () => {
    expect(buildInstallmentChargeParams({ ...baseInput, currency: 'EUR' }).currency).toBe('eur');
  });

  it('tags metadata so the charge is traceable to the plan + installment', () => {
    const params = buildInstallmentChargeParams(baseInput);
    expect(params.metadata).toMatchObject({
      type: 'bnpl_installment',
      planId: 'plan_abc',
      installmentNumber: '2',
      userId: 'user_1',
      merchantId: 'merchant_1',
    });
  });
});

describe('calculateInstallments', () => {
  it.each(['3x', '6x', '12x'] as BnplPlanType[])(
    '%s installments sum to the total-with-interest and have the right count',
    (plan) => {
      const total = 12000;
      const calc = calculateInstallments(total, plan);
      const months = Number(plan.replace('x', ''));

      expect(calc.installments).toHaveLength(months);
      const sum = calc.installments.reduce((s, i) => s + i.amountCents, 0);
      // No rounding leakage: the parts must add up to the financed total.
      expect(sum).toBe(calc.totalWithInterestCents);
      expect(calc.totalWithInterestCents).toBeGreaterThanOrEqual(total);
    }
  );

  it('0% plan (3x) does not add interest', () => {
    const calc = calculateInstallments(9000, '3x');
    expect(calc.totalWithInterestCents).toBe(9000);
    expect(calc.interestRate).toBe(0);
  });

  it('all installments start pending', () => {
    const calc = calculateInstallments(10000, '6x');
    expect(calc.installments.every((i) => i.status === 'pending')).toBe(true);
  });
});
