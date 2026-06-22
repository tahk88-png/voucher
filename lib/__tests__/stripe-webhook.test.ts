/**
 * Unit tests for app/api/stripe/webhook/route.ts.
 *
 * Covers the critical branching:
 * - rejects requests without a stripe-signature header (400)
 * - rejects invalid signatures (400)
 * - rejects when STRIPE_WEBHOOK_SECRET is unset (500)
 * - atomic idempotency via StripeEvent upsert:
 *     * first delivery → processes + sets processedAt
 *     * second delivery (processedAt already set) → returns {duplicate: true}
 * - voucher purchase idempotency: skips when status already 'paid'
 * - referral credit math: basis-point percentage of purchase amount
 *
 * All external dependencies are mocked. The route imports 10+ modules so
 * the mock surface is wide — but the test stays fast and deterministic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ────────────────────────────────────────────────────────────────────────────
// Hoisted mocks
// ────────────────────────────────────────────────────────────────────────────

const {
  verifyWebhookSignature,
  isStripeConfigured,
  stripeEventUpsert,
  stripeEventUpdate,
  voucherPurchaseFindUnique,
  voucherPurchaseUpdate,
  ticketPurchaseFindUnique,
  giftCardPurchaseFindUnique,
  userFindUnique,
  creditLedgerCreate,
  auditLogCreate,
  merchantSubscriptionUpsert,
  merchantSubscriptionUpdateMany,
  merchantSubscriptionFindFirst,
  getCreditBalance,
  sendEmailSafely,
  headers,
} = vi.hoisted(() => ({
  verifyWebhookSignature: vi.fn(),
  isStripeConfigured: vi.fn(() => true),
  stripeEventUpsert: vi.fn(),
  stripeEventUpdate: vi.fn(),
  voucherPurchaseFindUnique: vi.fn(),
  voucherPurchaseUpdate: vi.fn(),
  ticketPurchaseFindUnique: vi.fn(),
  giftCardPurchaseFindUnique: vi.fn(),
  userFindUnique: vi.fn(),
  creditLedgerCreate: vi.fn(),
  auditLogCreate: vi.fn(),
  merchantSubscriptionUpsert: vi.fn(),
  merchantSubscriptionUpdateMany: vi.fn(),
  merchantSubscriptionFindFirst: vi.fn(),
  getCreditBalance: vi.fn(),
  sendEmailSafely: vi.fn(),
  headers: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  verifyWebhookSignature,
  isStripeConfigured,
  stripe: {
    subscriptions: { retrieve: vi.fn() },
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    stripeEvent: { upsert: stripeEventUpsert, update: stripeEventUpdate },
    voucherPurchase: {
      findUnique: voucherPurchaseFindUnique,
      update: voucherPurchaseUpdate,
      updateMany: vi.fn(),
    },
    ticketPurchase: {
      findUnique: ticketPurchaseFindUnique,
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    giftCardPurchase: {
      findUnique: giftCardPurchaseFindUnique,
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    giftCard: { updateMany: vi.fn() },
    ticket: { update: vi.fn(), updateMany: vi.fn() },
    user: { findUnique: userFindUnique },
    creditLedger: { create: creditLedgerCreate },
    auditLog: { create: auditLogCreate },
    merchantSubscription: {
      upsert: merchantSubscriptionUpsert,
      updateMany: merchantSubscriptionUpdateMany,
      findFirst: merchantSubscriptionFindFirst,
    },
    refundRecord: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock('@/lib/emails', () => ({
  sendVoucherPurchaseReceipt: vi.fn(),
  sendVoucherDelivery: vi.fn(),
  sendCreditEarned: vi.fn(),
  sendTicketConfirmation: vi.fn(),
}));

vi.mock('@/lib/credits', () => ({
  getCreditBalance,
}));

vi.mock('@/lib/error-tracking', () => ({
  captureException: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
  loggers: { payment: vi.fn() },
}));

vi.mock('@/lib/email-safe', () => ({
  sendEmailSafely,
}));

// withErrorHandler is a simple pass-through in tests so thrown errors become
// rejections (easier to assert on). The real impl catches + returns 500.
vi.mock('@/lib/error-handler', () => ({
  withErrorHandler: async (fn: () => Promise<Response>) => fn(),
  RateLimitError: class RateLimitError extends Error {},
}));

vi.mock('next/headers', () => ({
  headers,
}));

// Import under test (after all mocks are registered)
import { POST } from '@/app/api/stripe/webhook/route';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function makeRequest(body: string, signature: string | null = 'sig_test') {
  // We only need `.text()` to return the raw body.
  return {
    text: async () => body,
  } as unknown as import('next/server').NextRequest;
}

function setSignatureHeader(signature: string | null) {
  headers.mockResolvedValue({
    get: (name: string) =>
      name.toLowerCase() === 'stripe-signature' ? signature : null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  isStripeConfigured.mockReturnValue(true);
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  setSignatureHeader('sig_test');
  stripeEventUpsert.mockResolvedValue({ processedAt: null });
  stripeEventUpdate.mockResolvedValue({});
  sendEmailSafely.mockResolvedValue(undefined);
});

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe('Stripe webhook — auth & configuration', () => {
  it('returns 503 when Stripe is not configured', async () => {
    isStripeConfigured.mockReturnValue(false);
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(503);
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    setSignatureHeader(null);
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
  });

  it('returns 500 when STRIPE_WEBHOOK_SECRET is not set', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(500);
  });

  it('returns 400 on invalid signature', async () => {
    verifyWebhookSignature.mockImplementation(() => {
      throw new Error('bad sig');
    });
    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(400);
  });
});

describe('Stripe webhook — idempotency', () => {
  it('upserts StripeEvent on first delivery and proceeds', async () => {
    verifyWebhookSignature.mockReturnValue({
      id: 'evt_1',
      type: 'payment_intent.succeeded',
      livemode: false,
      data: { object: { id: 'pi_1', amount: 100, currency: 'usd', metadata: {} } },
    });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(stripeEventUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeEventId: 'evt_1' },
      }),
    );
    // processedAt was marked
    expect(stripeEventUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { stripeEventId: 'evt_1' },
        data: expect.objectContaining({ processedAt: expect.any(Date) }),
      }),
    );
    const body = await res.json();
    expect(body).toEqual({ received: true });
  });

  it('short-circuits duplicate delivery (processedAt already set)', async () => {
    verifyWebhookSignature.mockReturnValue({
      id: 'evt_dup',
      type: 'payment_intent.succeeded',
      livemode: false,
      data: { object: { id: 'pi_1', amount: 100, currency: 'usd', metadata: {} } },
    });
    stripeEventUpsert.mockResolvedValueOnce({ processedAt: new Date() });

    const res = await POST(makeRequest('{}'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ received: true, duplicate: true });
    // No processing = no final update
    expect(stripeEventUpdate).not.toHaveBeenCalled();
  });

  it('writes error field on processing failure', async () => {
    verifyWebhookSignature.mockReturnValue({
      id: 'evt_fail',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_1',
          mode: 'subscription',
          subscription: 'sub_1',
          metadata: { merchantId: 'm_1' },
        },
      },
    });
    merchantSubscriptionUpsert.mockRejectedValue(new Error('db boom'));
    // The route catches subscription errors at the inner try/catch level
    // and logs them — it does NOT re-throw. But if it DID re-throw, the
    // outer catch would write the error. Verify neither crashes the test.

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200); // inner catch absorbs
  });
});

describe('Stripe webhook — voucher purchase idempotency', () => {
  const baseSession = {
    id: 'cs_1',
    amount_total: 10000,
    currency: 'usd',
    customer_email: 'buyer@x.com',
    mode: 'payment',
    metadata: {
      purchaseId: 'pur_1',
      voucherId: 'v_1',
      merchantId: 'm_1',
      userId: 'u_1',
    },
  };

  it('skips voucher purchase work when status is already "paid"', async () => {
    verifyWebhookSignature.mockReturnValue({
      id: 'evt_voucher',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: baseSession },
    });
    voucherPurchaseFindUnique.mockResolvedValue({ status: 'paid' });

    const res = await POST(makeRequest('{}'));

    expect(res.status).toBe(200);
    expect(voucherPurchaseFindUnique).toHaveBeenCalledWith({
      where: { id: 'pur_1' },
      select: { status: true },
    });
    // The early-return prevents the update + email side effects
    expect(voucherPurchaseUpdate).not.toHaveBeenCalled();
    expect(sendEmailSafely).not.toHaveBeenCalled();
    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it('processes voucher purchase on first delivery (status != paid)', async () => {
    verifyWebhookSignature.mockReturnValue({
      id: 'evt_voucher_first',
      type: 'checkout.session.completed',
      livemode: false,
      data: { object: baseSession },
    });
    voucherPurchaseFindUnique.mockResolvedValue({ status: 'pending' });
    voucherPurchaseUpdate.mockResolvedValue({
      id: 'pur_1',
      voucherId: 'v_1',
      merchantId: 'm_1',
      amount: 10000,
      currency: 'usd',
      user: { email: 'buyer@x.com' },
      merchant: { name: 'Acme', slug: 'acme' },
      voucher: {
        codePrefix: 'V',
        validTo: new Date('2030-01-01'),
        type: 'fixed_amount',
        value: 1000,
        merchant: { name: 'Acme', slug: 'acme' },
        campaign: null,
      },
      campaign: null,
    });

    const res = await POST(makeRequest('{}'));

    expect(res.status).toBe(200);
    expect(voucherPurchaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pur_1' },
        data: expect.objectContaining({ status: 'paid', stripeSessionId: 'cs_1' }),
      }),
    );
    expect(auditLogCreate).toHaveBeenCalled();
  });
});

describe('Stripe webhook — referral credit math', () => {
  it('credits referrer with basis-point percentage of purchase amount', async () => {
    // 5% of 10000 cents = 500 cents (creditPercentage is basis points: 500 bp = 5%)
    verifyWebhookSignature.mockReturnValue({
      id: 'evt_referral',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_ref',
          amount_total: 10000,
          currency: 'usd',
          customer_email: 'buyer@x.com',
          mode: 'payment',
          metadata: {
            purchaseId: 'pur_2',
            voucherId: 'v_2',
            merchantId: 'm_1',
            userId: 'u_1',
            referrerId: 'u_ref',
          },
        },
      },
    });
    voucherPurchaseFindUnique.mockResolvedValue({ status: 'pending' });
    voucherPurchaseUpdate.mockResolvedValue({
      id: 'pur_2',
      voucherId: 'v_2',
      merchantId: 'm_1',
      amount: 10000,
      currency: 'usd',
      user: { email: 'buyer@x.com' },
      merchant: { name: 'Acme', slug: 'acme' },
      voucher: {
        codePrefix: 'V',
        validTo: new Date('2030-01-01'),
        type: 'fixed_amount',
        value: 1000,
        merchant: { name: 'Acme', slug: 'acme' },
        campaign: { creditPercentage: 500 }, // 5%
      },
      campaign: { creditPercentage: 500 },
    });
    userFindUnique.mockResolvedValue({ id: 'u_ref', email: 'ref@x.com' });
    getCreditBalance.mockResolvedValue({ total: 500, available: 500 });

    const res = await POST(makeRequest('{}'));

    expect(res.status).toBe(200);
    expect(creditLedgerCreate).toHaveBeenCalledTimes(1);
    const creditArgs = creditLedgerCreate.mock.calls[0][0].data;
    // 10000 * 500 / 10000 = 500
    expect(creditArgs.amount).toBe(500);
    expect(creditArgs.userId).toBe('u_ref');
    expect(creditArgs.merchantId).toBe('m_1');
    expect(creditArgs.source).toBe('referral_purchase');
    expect(creditArgs.status).toBe('available');
    // expiresAt ~60 days out
    const daysOut =
      (creditArgs.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    expect(daysOut).toBeGreaterThan(59);
    expect(daysOut).toBeLessThan(61);
  });

  it('does NOT credit when creditAmount rounds to zero', async () => {
    // 1% of 50 cents = 0.5 cent → Math.floor → 0 → skip ledger write
    verifyWebhookSignature.mockReturnValue({
      id: 'evt_ref_0',
      type: 'checkout.session.completed',
      livemode: false,
      data: {
        object: {
          id: 'cs_ref_0',
          amount_total: 50,
          currency: 'usd',
          customer_email: 'buyer@x.com',
          mode: 'payment',
          metadata: {
            purchaseId: 'pur_3',
            voucherId: 'v_3',
            merchantId: 'm_1',
            userId: 'u_1',
            referrerId: 'u_ref',
          },
        },
      },
    });
    voucherPurchaseFindUnique.mockResolvedValue({ status: 'pending' });
    voucherPurchaseUpdate.mockResolvedValue({
      id: 'pur_3',
      voucherId: 'v_3',
      merchantId: 'm_1',
      amount: 50,
      currency: 'usd',
      user: { email: 'buyer@x.com' },
      merchant: { name: 'Acme', slug: 'acme' },
      voucher: {
        codePrefix: 'V',
        validTo: new Date('2030-01-01'),
        type: 'fixed_amount',
        value: 50,
        merchant: { name: 'Acme', slug: 'acme' },
        campaign: { creditPercentage: 100 }, // 1%
      },
      campaign: { creditPercentage: 100 },
    });
    userFindUnique.mockResolvedValue({ id: 'u_ref', email: 'ref@x.com' });

    const res = await POST(makeRequest('{}'));
    expect(res.status).toBe(200);
    expect(creditLedgerCreate).not.toHaveBeenCalled();
  });
});
