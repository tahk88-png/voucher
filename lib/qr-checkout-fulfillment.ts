import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { logger } from '@/lib/logger';
import { queueWebhook } from '@/lib/webhooks';
import { sendEmailSafely } from '@/lib/email-safe';
import { sendVoucherPurchaseReceipt, sendVoucherDelivery } from '@/lib/emails';
import { isQrCheckoutSession, extractBuyerEmail } from '@/lib/qr-checkout-helpers';

export { isQrCheckoutSession, extractBuyerEmail };

/**
 * Fulfil a paid QR-checkout voucher purchase.
 *
 * QR-checkout sessions are created anonymously (no logged-in user, no
 * pre-existing purchase row), so the standard `checkout.session.completed`
 * voucher branch — which requires `purchaseId && userId` — never fires for
 * them. This handler closes that gap:
 *   1. resolve the buyer from the email Stripe collected,
 *   2. find-or-create their account (matches the platform's auto-account
 *      creation on first sign-in),
 *   3. create the paid VoucherPurchase + deliver the voucher by email,
 *   4. stamp the new purchaseId onto the PaymentIntent so charge.refunded /
 *      charge.dispute.created (which key off charge.metadata.purchaseId) can
 *      reverse it.
 *
 * Idempotent: keyed off the Stripe session id, so a webhook retry can't
 * double-fulfil. Expected gaps (no email, missing voucher) are logged and
 * skipped rather than thrown, so Stripe doesn't retry them forever.
 */
export async function fulfilQrCheckoutVoucher(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const voucherId = session.metadata?.voucherId;
  const merchantId = session.metadata?.merchantId;
  if (!voucherId || !merchantId) {
    logger.warn('QR-checkout fulfilment skipped: missing voucherId/merchantId', {
      sessionId: session.id,
    });
    return;
  }

  // Idempotency: no purchase exists up front, so key off the session id.
  const existing = await prisma.voucherPurchase.findFirst({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (existing) {
    logger.info('QR-checkout already fulfilled, skipping', {
      sessionId: session.id,
      purchaseId: existing.id,
    });
    return;
  }

  const email = extractBuyerEmail(session);
  if (!email) {
    logger.error('QR-checkout fulfilment failed: no buyer email on session', {
      sessionId: session.id,
    });
    return;
  }

  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    include: { merchant: true, campaign: true },
  });
  if (!voucher) {
    logger.error('QR-checkout fulfilment failed: voucher not found', {
      sessionId: session.id,
      voucherId,
    });
    return;
  }

  // Find-or-create the buyer (mirrors lib/auth.ts ensureDbUser).
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: email.split('@')[0] },
  });

  const amount = session.amount_total ?? voucher.campaign?.price ?? voucher.value;
  const currency = (session.currency ?? voucher.currency).toLowerCase();

  const purchase = await prisma.voucherPurchase.create({
    data: {
      voucherId: voucher.id,
      campaignId: voucher.campaignId ?? null,
      merchantId,
      userId: user.id,
      amount,
      currency,
      status: 'paid',
      stripeSessionId: session.id,
    },
  });

  // Stamp the new purchaseId onto the PaymentIntent so the refund / dispute
  // handlers (which key off charge.metadata.purchaseId) can reverse this sale.
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  if (paymentIntentId) {
    await stripe.paymentIntents
      .update(paymentIntentId, {
        metadata: {
          purchaseId: purchase.id,
          voucherId: voucher.id,
          merchantId,
          userId: user.id,
          type: 'voucher',
          source: 'qr-checkout',
        },
      })
      .catch((e) => {
        logger.warn('QR-checkout: failed to stamp purchaseId on PaymentIntent', {
          sessionId: session.id,
          paymentIntentId,
          error: e instanceof Error ? e.message : String(e),
        });
      });
  }

  // Deliver by email (receipt + voucher), reusing the shared senders.
  const voucherCode = `${voucher.codePrefix || 'V'}-${voucher.id.slice(0, 8).toUpperCase()}`;
  const voucherUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/v/${voucher.id}`;
  const validUntil = voucher.validTo.toISOString().split('T')[0];
  const value =
    voucher.type === 'percentage'
      ? `${voucher.value / 100}%`
      : `${currency.toUpperCase()} ${(voucher.value / 100).toFixed(2)}`;

  await sendEmailSafely(
    'voucher_purchase_receipt',
    () =>
      sendVoucherPurchaseReceipt({
        to: email,
        merchantName: voucher.merchant.name,
        voucherCode,
        amount,
        currency: currency.toUpperCase(),
        voucherUrl,
      }),
    { recipient: email, voucherId: voucher.id },
  );
  await sendEmailSafely(
    'voucher_delivery',
    () =>
      sendVoucherDelivery({
        to: email,
        merchantName: voucher.merchant.name,
        voucherCode,
        value,
        validUntil,
        voucherUrl,
      }),
    { recipient: email, voucherId: voucher.id },
  );

  await prisma.auditLog.create({
    data: {
      merchantId,
      actorUserId: user.id,
      action: 'voucher_purchased',
      payloadJson: {
        purchaseId: purchase.id,
        voucherId: voucher.id,
        amount,
        currency,
        source: 'qr-checkout',
      },
    },
  });

  // Notify merchant webhooks (fire-and-forget; retry/log inside queueWebhook).
  queueWebhook(merchantId, 'voucher.purchased', {
    purchaseId: purchase.id,
    voucherId: voucher.id,
    campaignId: voucher.campaignId,
    merchantId,
    userId: user.id,
    amount,
    currency,
    voucherCode,
    referrerId: null,
    purchasedAt: purchase.createdAt.toISOString(),
  });

  logger.info('QR-checkout voucher fulfilled', {
    sessionId: session.id,
    purchaseId: purchase.id,
    voucherId: voucher.id,
    userId: user.id,
  });
}
