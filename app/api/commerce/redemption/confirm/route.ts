import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { verifySignature } from '@/lib/commerce-webhook';
import { unlockCreditForRedemption } from '@/lib/credits';
import { checkIPRateLimit } from '@/lib/fraud';
import { getClientIp } from '@/lib/request';

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
  }

  const redemption = await prisma.redemption.create({
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

  let creditUnlocked = false;
  if (referral) {
    let creditAmount = 0;
    if (voucher.type === 'credit_amount') {
      creditAmount = voucher.value;
    } else if (voucher.type === 'fixed_amount') {
      creditAmount = voucher.value;
    } else {
      creditAmount = Math.floor(data.discountApplied * 0.1);
    }

    if (creditAmount > 0) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 60);

      await prisma.creditLedger.create({
        data: {
          merchantId: voucher.merchantId,
          userId: referral.referrerUserId,
          amount: creditAmount,
          currency: voucher.currency,
          status: 'locked',
          source: 'referral_redemption',
          sourceId: redemption.id,
          expiresAt,
        },
      });

      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: 'redeemed' },
      });

      await unlockCreditForRedemption(redemption.id, voucher.merchantId);
      creditUnlocked = true;
    }
  }

  return NextResponse.json({
    ok: true,
    creditUnlocked,
    redemptionId: redemption.id,
  });
}
