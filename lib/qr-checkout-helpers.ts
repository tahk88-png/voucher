import type Stripe from 'stripe';

/**
 * Pure helpers for QR-checkout fulfilment (no Prisma / network), so they can
 * be unit-tested in the default suite. The Prisma-backed fulfilment lives in
 * lib/qr-checkout-fulfillment.ts, which re-exports these for convenience.
 */

/**
 * True for a Stripe Checkout session that originated from the anonymous
 * QR-checkout flow (app/api/qr-checkout/route.ts). Those sessions carry
 * `source: 'qr-checkout'` + a `voucherId` but NO `purchaseId` (the buyer is
 * anonymous and no purchase row exists yet). The presence of a `purchaseId`
 * means it's a normal, already-owned purchase — not ours to fulfil here.
 */
export function isQrCheckoutSession(
  metadata: Stripe.Metadata | null | undefined,
): boolean {
  if (!metadata) return false;
  return (
    metadata.source === 'qr-checkout' &&
    !!metadata.voucherId &&
    !metadata.purchaseId
  );
}

/**
 * Resolve the buyer's email from a completed Checkout session. Stripe always
 * collects an email for card payments; it lands on `customer_details.email`.
 * We fall back to `customer_email` (set only if the session pre-filled it) and
 * normalise (trim + lowercase) so the downstream user upsert is stable.
 * Returns null when no usable email is present.
 */
export function extractBuyerEmail(
  session: Pick<Stripe.Checkout.Session, 'customer_details' | 'customer_email'>,
): string | null {
  const raw = session.customer_details?.email ?? session.customer_email ?? null;
  if (!raw) return null;
  const normalized = raw.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}
