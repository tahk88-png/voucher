import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkRedemptionRateLimit, isSelfReferral, checkIPRateLimit } from '@/lib/fraud';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { calculateReferralReward } from '@/lib/referral-rewards';
import { queueWebhook } from '@/lib/webhooks';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const createRedemptionSchema = z.object({
  voucherId: z.string(),
  referralId: z.string().optional(),
  method: z.enum(['online', 'in_store']),
  orderReference: z.string().optional(),
  amountBeforeDiscount: z.number().int().positive(),
  discountApplied: z.number().int().nonnegative(),
  currency: z.string(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    // IP-based rate limiting for public redemptions
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               'unknown';
    const ipRateLimit = await checkIPRateLimit(ip, 60, 50); // 50 per hour per IP
    if (!ipRateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', remaining: ipRateLimit.remaining },
        { status: 429 }
      );
    }

    const session = await auth();
    const body = await req.json();
    const data = createRedemptionSchema.parse(body);

    // Get voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id: data.voucherId },
      include: { merchant: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    // Check merchant is active (kill switch)
    try {
      await requireActiveMerchant(voucher.merchantId);
    } catch (error) {
      if (error instanceof Error && error.message?.includes('inactive')) {
        return NextResponse.json({ error: 'Merchant is inactive' }, { status: 403 });
      }
      throw error;
    }

    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher not available' }, { status: 400 });
    }

    // Check validity dates
    const now = new Date();
    if (now < voucher.validFrom || now > voucher.validTo) {
      return NextResponse.json({ error: 'Voucher expired or not yet valid' }, { status: 400 });
    }

    // Check usage limits
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

    // Per-user usage limit (only enforceable when we know the user)
    if (voucher.usageLimitPerUser && session?.user?.id) {
      const userRedemptions = await prisma.redemption.count({
        where: {
          voucherId: voucher.id,
          redeemedByUserId: session.user.id,
          confirmedAt: { not: null },
        },
      });
      if (userRedemptions >= voucher.usageLimitPerUser) {
        return NextResponse.json({ error: 'Per-user usage limit reached' }, { status: 400 });
      }
    }

    // If referral exists, check self-referral and rate limits
    if (data.referralId && session?.user?.id) {
      const isSelf = await isSelfReferral(data.referralId, session.user.id);
      if (isSelf) {
        return NextResponse.json({ error: 'Cannot redeem your own referral' }, { status: 400 });
      }

      const referral = await prisma.referral.findUnique({
        where: { id: data.referralId },
      });

      if (referral) {
        const rateLimit = await checkRedemptionRateLimit(referral.friendHash);
        if (!rateLimit.allowed) {
          return NextResponse.json(
            { error: 'Rate limit exceeded', remaining: rateLimit.remaining },
            { status: 429 }
          );
        }
      }
    }

    // Resolve referral credit up-front (read), so the writes below all run in
    // one transaction.
    let referrerUserId: string | null = null;
    let creditAmount = 0;
    if (data.referralId) {
      const referral = await prisma.referral.findUnique({
        where: { id: data.referralId },
        include: { referrer: true },
      });
      if (referral) {
        // Consistent referral reward across voucher types (see lib/referral-rewards).
        creditAmount = calculateReferralReward({
          voucherType: voucher.type,
          voucherValue: voucher.value,
          discountApplied: data.discountApplied,
        });
        if (creditAmount > 0) referrerUserId = referral.referrerUserId;
      }
    }

    const creditExpiresAt = new Date();
    creditExpiresAt.setDate(creditExpiresAt.getDate() + 60); // Default 60 days

    // Create the redemption and atomically lock the referral credit + mark the
    // referral redeemed. Without one transaction a partial failure could leave
    // a redemption with no locked credit (referrer underpaid) or a referral
    // flipped to 'redeemed' with no credit row.
    const redemption = await prisma.$transaction(async (tx) => {
      const created = await tx.redemption.create({
        data: {
          voucherId: voucher.id,
          merchantId: voucher.merchantId,
          referralId: data.referralId,
          redeemedByUserId: session?.user?.id || null,
          method: data.method,
          orderReference: data.orderReference,
          amountBeforeDiscount: data.amountBeforeDiscount,
          discountApplied: data.discountApplied,
          currency: data.currency,
          confirmedAt: null,
        },
      });

      if (data.referralId && referrerUserId && creditAmount > 0) {
        await tx.creditLedger.create({
          data: {
            merchantId: voucher.merchantId,
            userId: referrerUserId,
            amount: creditAmount,
            currency: voucher.currency,
            status: 'locked',
            source: 'referral_redemption',
            sourceId: created.id,
            expiresAt: creditExpiresAt,
          },
        });
        await tx.referral.update({
          where: { id: data.referralId },
          data: { status: 'redeemed' },
        });
      }

      return created;
    });

    // Fire redemption.created webhook. Redemption starts in the
    // unconfirmed state (confirmedAt=null); the in-store flow will
    // emit redemption.confirmed separately once staff scan the QR.
    queueWebhook(voucher.merchantId, 'redemption.created', {
      redemptionId: redemption.id,
      merchantId: voucher.merchantId,
      voucherId: voucher.id,
      campaignId: voucher.campaignId,
      referralId: data.referralId || null,
      userId: session?.user?.id || null,
      method: data.method,
      orderReference: data.orderReference || null,
      amountBeforeDiscount: data.amountBeforeDiscount,
      discountApplied: data.discountApplied,
      currency: data.currency,
      confirmed: false,
      createdAt: redemption.createdAt.toISOString(),
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const qrUrl = data.method === 'in_store' ? `${baseUrl}/redeem/${redemption.id}` : null;

    return NextResponse.json({
      redemptionId: redemption.id,
      requiresConfirmation: data.method === 'in_store',
      qrUrl,
    });
  });
}
