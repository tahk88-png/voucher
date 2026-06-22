import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { verifySignature } from '@/lib/commerce-webhook';
import { unlockCreditForRedemption } from '@/lib/credits';
import { logger } from '@/lib/logger';
import { calculateReferralReward } from '@/lib/referral-rewards';
import { checkIPRateLimit } from '@/lib/fraud';
import { getClientIp } from '@/lib/request';
import { queueWebhook } from '@/lib/webhooks';
import { withErrorHandler } from '@/lib/error-handler';

const confirmSchema = z.object({
  voucherId: z.string(),
  referralId: z.string().optional(),
  orderReference: z.string(),
  amountBeforeDiscount: z.number().int().positive(),
  discountApplied: z.number().int().nonnegative(),
  currency: z.string().min(3),
  customerEmail: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const ip = getClientIp(req);
    const rateLimit = await checkIPRateLimit(ip, 60, 120);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const rawBody = await req.text();
    const secret = process.env.COMMERCE_WEBHOOK_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'COMMERCE_WEBHOOK_SECRET not configured' }, { status: 503 });
    }
    if (secret) {
      const signature = req.headers.get('x-vouchr-signature');
      if (!signature || !verifySignature(rawBody, signature, secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    let data: z.infer<typeof confirmSchema>;
    try {
      data = confirmSchema.parse(JSON.parse(rawBody));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id: data.voucherId },
      include: { merchant: true },
    });
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    try {
      await requireActiveMerchant(voucher.merchantId);
    } catch {
      return NextResponse.json({ error: 'Merchant is inactive' }, { status: 403 });
    }

    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher not available' }, { status: 400 });
    }

    const now = new Date();
    if (now < voucher.validFrom || now > voucher.validTo) {
      return NextResponse.json({ error: 'Voucher expired or not yet valid' }, { status: 400 });
    }

    if (voucher.usageLimitTotal) {
      const totalRedemptions = await prisma.redemption.count({
        where: {
          voucherId: voucher.id,
          confirmedAt: { not: null },
        },
      });
      if (totalRedemptions >= voucher.usageLimitTotal) {
        return NextResponse.json({ error: 'Voucher usage limit reached' }, { status: 400 });
      }
    }

    const existing = await prisma.redemption.findFirst({
      where: {
        merchantId: voucher.merchantId,
        orderReference: data.orderReference,
      },
    });
    if (existing) {
      return NextResponse.json({
        ok: true,
        creditUnlocked: existing.confirmedAt !== null,
        redemptionId: existing.id,
      });
    }

    let referral = null;
    if (data.referralId) {
      referral = await prisma.referral.findUnique({
        where: { id: data.referralId },
        include: { referrer: true },
      });
      if (!referral || referral.voucherId !== voucher.id) {
        return NextResponse.json({ error: 'Invalid referral' }, { status: 400 });
      }

      // customerEmail is the ONLY buyer identity we have on this anonymous
      // webhook path, and it's what the self-referral check below relies on.
      // Require it whenever a referral is claimed — otherwise omitting it
      // would silently skip the self-referral guard and let a merchant mint
      // referral credit to themselves.
      if (!data.customerEmail) {
        return NextResponse.json(
          { error: 'customerEmail is required when redeeming with a referral' },
          { status: 400 },
        );
      }

      // Block self-referral: reject when the buyer email matches the
      // referrer's (case-insensitive).
      const referrerEmail = referral.referrer?.email?.toLowerCase();
      const buyerEmail = data.customerEmail.toLowerCase();
      if (referrerEmail && buyerEmail && referrerEmail === buyerEmail) {
        return NextResponse.json(
          { error: 'Cannot redeem your own referral' },
          { status: 400 },
        );
      }
    }

    // Resolve the referral reward up-front (pure calc) so the redemption,
    // locked credit, and referral flip can all be written in one transaction.
    let creditAmount = 0;
    if (referral) {
      // Consistent referral reward across voucher types (see lib/referral-rewards).
      creditAmount = calculateReferralReward({
        voucherType: voucher.type,
        voucherValue: voucher.value,
        discountApplied: data.discountApplied,
      });
    }
    const creditExpiresAt = new Date();
    creditExpiresAt.setDate(creditExpiresAt.getDate() + 60);

    let redemption;
    try {
      // One transaction so a partial failure can't leave a confirmed
      // redemption with no locked credit (referrer underpaid) or a credit
      // row with the referral never flipped to 'redeemed'.
      redemption = await prisma.$transaction(async (tx) => {
        const created = await tx.redemption.create({
          data: {
            voucherId: voucher.id,
            merchantId: voucher.merchantId,
            referralId: referral?.id ?? null,
            redeemedByUserId: null,
            method: 'online',
            orderReference: data.orderReference,
            amountBeforeDiscount: data.amountBeforeDiscount,
            discountApplied: data.discountApplied,
            currency: data.currency,
            confirmedAt: new Date(),
          },
        });

        if (referral) {
          if (creditAmount > 0) {
            await tx.creditLedger.create({
              data: {
                merchantId: voucher.merchantId,
                userId: referral.referrerUserId,
                amount: creditAmount,
                currency: voucher.currency,
                status: 'locked',
                source: 'referral_redemption',
                sourceId: created.id,
                expiresAt: creditExpiresAt,
              },
            });
          }
          // Always close the referral so it can't be replayed on a future
          // redemption — even when the reward amount is zero (e.g. a
          // percentage voucher with discountApplied=0).
          await tx.referral.update({
            where: { id: referral.id },
            data: { status: 'redeemed' },
          });
        }

        return created;
      });
    } catch (err) {
      // Unique (merchantId, orderReference) violation = a concurrent
      // delivery already created this redemption. Return idempotently
      // rather than double-creating / double-unlocking credit.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const existingRow = await prisma.redemption.findFirst({
          where: { merchantId: voucher.merchantId, orderReference: data.orderReference },
        });
        return NextResponse.json({
          ok: true,
          creditUnlocked: existingRow?.confirmedAt != null,
          redemptionId: existingRow?.id ?? null,
        });
      }
      throw err;
    }

    let creditUnlocked = false;
    if (referral && creditAmount > 0) {
      // Flip the just-locked credit to 'available' (CAS) and notify the
      // referrer. Runs AFTER the transaction commits — the helper uses the
      // global prisma client (must see committed rows) and sends email
      // (no I/O inside a DB transaction). It's idempotent on retry.
      // We catch and log rather than re-throwing: the redemption is already
      // confirmed and the referral is already closed. A transient failure
      // here leaves the credit 'locked'; the auto-expire cron will eventually
      // reverse it, but ops should investigate the logged error.
      try {
        await unlockCreditForRedemption(redemption.id, voucher.merchantId);
        creditUnlocked = true;
      } catch (unlockErr) {
        logger.error('[redemption/confirm] unlockCreditForRedemption failed — credit stuck in locked state', {
          redemptionId: redemption.id,
          merchantId: voucher.merchantId,
          error: unlockErr instanceof Error ? unlockErr.message : String(unlockErr),
        });
      }
    }

    // Commerce webhook creates a redemption that's already confirmed
    // (the external system is the source of truth for the order). Emit
    // both lifecycle events so merchants wired to either side see it.
    const commercePayload = {
      redemptionId: redemption.id,
      merchantId: voucher.merchantId,
      voucherId: voucher.id,
      campaignId: voucher.campaignId,
      referralId: referral?.id ?? null,
      userId: null,
      method: 'online' as const,
      orderReference: data.orderReference,
      amountBeforeDiscount: data.amountBeforeDiscount,
      discountApplied: data.discountApplied,
      currency: data.currency,
    };
    queueWebhook(voucher.merchantId, 'redemption.created', {
      ...commercePayload,
      confirmed: true,
      createdAt: redemption.createdAt.toISOString(),
    });
    queueWebhook(voucher.merchantId, 'redemption.confirmed', {
      ...commercePayload,
      staffUserId: null,
      confirmedAt: (redemption.confirmedAt ?? redemption.createdAt).toISOString(),
    });

    return NextResponse.json({
      ok: true,
      creditUnlocked,
      redemptionId: redemption.id,
    });
  });
}
