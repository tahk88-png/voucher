import type Stripe from 'stripe';

export type BnplPlanType = '3x' | '6x' | '12x';

export interface InstallmentDetail {
  number: number;
  amountCents: number;
  dueDate: string; // ISO date string
  status: 'pending' | 'paid' | 'failed' | 'overdue';
  stripePaymentIntentId?: string;
}

export interface BnplCalculation {
  installments: InstallmentDetail[];
  totalWithInterestCents: number;
  interestRate: number;
  monthlyAmountCents: number;
  totalInterestCents: number;
}

const PLAN_CONFIG: Record<BnplPlanType, { months: number; interestRate: number }> = {
  '3x': { months: 3, interestRate: 0 },
  '6x': { months: 6, interestRate: 2.5 },
  '12x': { months: 12, interestRate: 5 },
};

/**
 * Calculate installment plan details for a given total and plan type
 */
export function calculateInstallments(
  totalCents: number,
  plan: BnplPlanType
): BnplCalculation {
  const config = PLAN_CONFIG[plan];
  if (!config) {
    throw new Error(`Invalid BNPL plan type: ${plan}`);
  }

  const { months, interestRate } = config;
  const totalWithInterestCents = Math.round(totalCents * (1 + interestRate / 100));
  const totalInterestCents = totalWithInterestCents - totalCents;
  const baseInstallmentCents = Math.floor(totalWithInterestCents / months);
  const remainder = totalWithInterestCents - baseInstallmentCents * months;

  const now = new Date();
  const installments: InstallmentDetail[] = [];

  for (let i = 0; i < months; i++) {
    const dueDate = new Date(now);
    dueDate.setMonth(dueDate.getMonth() + i);
    // First installment gets any remainder from rounding
    const amountCents = i === 0 ? baseInstallmentCents + remainder : baseInstallmentCents;

    installments.push({
      number: i + 1,
      amountCents,
      dueDate: dueDate.toISOString(),
      status: 'pending',
    });
  }

  return {
    installments,
    totalWithInterestCents,
    interestRate,
    monthlyAmountCents: baseInstallmentCents,
    totalInterestCents,
  };
}

export interface InstallmentChargeInput {
  amountCents: number;
  currency: string;
  stripeCustomerId: string;
  stripePaymentMethodId: string;
  planId: string;
  installmentNumber: number;
  userId: string;
  merchantId: string;
}

/**
 * Build the Stripe PaymentIntent params to charge a single BNPL installment
 * off-session (the cron path, run while the user is away).
 *
 * Extracted as a pure function so the four fields the original cron got wrong
 * are unit-testable without hitting Stripe:
 *   - currency came from a `merchant.name ? 'eur' : 'usd'` ternary (always eur);
 *   - `customer` / `payment_method` were never persisted, so `confirm` was
 *     gated off and every installment PaymentIntent was created unconfirmed
 *     and never charged.
 * Here currency is the plan's real currency and confirm+off_session are always
 * on against an explicit saved customer + payment method.
 */
export function buildInstallmentChargeParams(
  input: InstallmentChargeInput
): Stripe.PaymentIntentCreateParams {
  return {
    amount: input.amountCents,
    currency: input.currency.toLowerCase(),
    customer: input.stripeCustomerId,
    payment_method: input.stripePaymentMethodId,
    // Restrict to card: redirect-based methods can't be charged off-session.
    payment_method_types: ['card'],
    // confirm:true charges the saved card now; off_session:true tells Stripe
    // the customer isn't present to complete any step-up (SCA) challenge.
    confirm: true,
    off_session: true,
    metadata: {
      type: 'bnpl_installment',
      planId: input.planId,
      installmentNumber: String(input.installmentNumber),
      userId: input.userId,
      merchantId: input.merchantId,
    },
  };
}

/**
 * Get plan configuration for display
 */
export function getPlanOptions(totalCents: number) {
  return (['3x', '6x', '12x'] as BnplPlanType[]).map((plan) => {
    const calc = calculateInstallments(totalCents, plan);
    return {
      plan,
      months: PLAN_CONFIG[plan].months,
      interestRate: calc.interestRate,
      monthlyAmountCents: calc.monthlyAmountCents,
      totalWithInterestCents: calc.totalWithInterestCents,
      totalInterestCents: calc.totalInterestCents,
      label: calc.interestRate === 0 ? `${PLAN_CONFIG[plan].months}x (0% interest)` : `${PLAN_CONFIG[plan].months}x (${calc.interestRate}% fee)`,
    };
  });
}
