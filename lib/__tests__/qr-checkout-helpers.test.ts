import { describe, it, expect } from 'vitest';
import type Stripe from 'stripe';
import { isQrCheckoutSession, extractBuyerEmail } from '@/lib/qr-checkout-helpers';

// Pure tests for the QR-checkout fulfilment gate + email resolution. No
// Prisma / network, so they run in the default suite (the Prisma-backed
// fulfilment lives in lib/qr-checkout-fulfillment.ts).

describe('isQrCheckoutSession', () => {
  it('is true for a qr-checkout session with a voucherId and no purchaseId', () => {
    expect(
      isQrCheckoutSession({ source: 'qr-checkout', voucherId: 'v_1', merchantId: 'm_1' }),
    ).toBe(true);
  });

  it('is false when source is not qr-checkout', () => {
    expect(isQrCheckoutSession({ source: 'web', voucherId: 'v_1' })).toBe(false);
    expect(isQrCheckoutSession({ voucherId: 'v_1' })).toBe(false);
  });

  it('is false when voucherId is missing (e.g. a non-voucher QR session)', () => {
    expect(isQrCheckoutSession({ source: 'qr-checkout', merchantId: 'm_1' })).toBe(false);
    expect(isQrCheckoutSession({ source: 'qr-checkout', voucherId: '' })).toBe(false);
  });

  it('is false when a purchaseId is present (already an owned purchase)', () => {
    expect(
      isQrCheckoutSession({ source: 'qr-checkout', voucherId: 'v_1', purchaseId: 'p_1' }),
    ).toBe(false);
  });

  it('is false for null / undefined metadata', () => {
    expect(isQrCheckoutSession(null)).toBe(false);
    expect(isQrCheckoutSession(undefined)).toBe(false);
  });
});

describe('extractBuyerEmail', () => {
  const make = (
    customerDetailsEmail: string | null,
    customerEmail: string | null = null,
  ) =>
    ({
      customer_details: customerDetailsEmail
        ? ({ email: customerDetailsEmail } as Stripe.Checkout.Session.CustomerDetails)
        : null,
      customer_email: customerEmail,
    }) as Pick<Stripe.Checkout.Session, 'customer_details' | 'customer_email'>;

  it('prefers customer_details.email', () => {
    expect(extractBuyerEmail(make('Buyer@Example.com', 'other@example.com'))).toBe(
      'buyer@example.com',
    );
  });

  it('falls back to customer_email when customer_details is absent', () => {
    expect(extractBuyerEmail(make(null, 'Fallback@Example.com'))).toBe(
      'fallback@example.com',
    );
  });

  it('trims and lowercases', () => {
    expect(extractBuyerEmail(make('  Mixed.Case@Example.COM  '))).toBe(
      'mixed.case@example.com',
    );
  });

  it('returns null when no email is present', () => {
    expect(extractBuyerEmail(make(null, null))).toBeNull();
  });

  it('returns null for an empty / whitespace-only email', () => {
    expect(extractBuyerEmail(make('   '))).toBeNull();
  });
});
