import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { verifySignature } from '@/lib/commerce-webhook';
import { checkIPRateLimit } from '@/lib/fraud';
import { getClientIp } from '@/lib/request';
import { withErrorHandler } from '@/lib/error-handler';

const validateSchema = z.object({
  code: z.string().min(3),
  orderTotal: z.number().int().positive(),
  currency: z.string().min(3),
  customerEmail: z.string().email().optional(),
  referralId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

function parseVoucherCode(code: string): { prefix: string; shortId: string } | null {
  const cleaned = code.trim().toUpperCase();
  const parts = cleaned.split('-');
  if (parts.length < 2) return null;
  const prefix = parts[0];
  const shortId = parts.slice(1).join('').toLowerCase();
  if (!prefix || shortId.length < 6) return null;
  return { prefix, shortId };
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const ip = getClientIp(req);
    const rateLimit = await checkIPRateLimit(ip, 60, 200);
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

    let data: z.infer<typeof validateSchema>;
    try {
      data = validateSchema.parse(JSON.parse(rawBody));
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json({ error: error.errors }, { status: 400 });
      }
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const parsed = parseVoucherCode(data.code);
    if (!parsed) {
      return NextResponse.json({ valid: false, reason: 'invalid_code_format' });
    }

    const voucher = await prisma.voucher.findFirst({
      where: {
        id: { startsWith: parsed.shortId },
        codePrefix: parsed.prefix,
      },
      include: { merchant: true },
    });

    if (!voucher) {
      return NextResponse.json({ valid: false, reason: 'voucher_not_found' });
    }

    try {
      await requireActiveMerchant(voucher.merchantId);
    } catch {
      return NextResponse.json({ valid: false, reason: 'merchant_inactive' });
    }

    if (voucher.status !== 'published') {
      return NextResponse.json({ valid: false, reason: 'voucher_not_available' });
    }

    const now = new Date();
    if (now < voucher.validFrom || now > voucher.validTo) {
      return NextResponse.json({ valid: false, reason: 'voucher_expired' });
    }

    if (voucher.usageLimitTotal) {
      const totalRedemptions = await prisma.redemption.count({
        where: {
          voucherId: voucher.id,
          confirmedAt: { not: null },
        },
      });
      if (totalRedemptions >= voucher.usageLimitTotal) {
        return NextResponse.json({ valid: false, reason: 'usage_limit_reached' });
      }
    }

    if (data.referralId) {
      const referral = await prisma.referral.findUnique({ where: { id: data.referralId } });
      if (!referral || referral.voucherId !== voucher.id) {
        return NextResponse.json({ valid: false, reason: 'invalid_referral' });
      }
      if (['redeemed', 'expired', 'blocked'].includes(referral.status)) {
        return NextResponse.json({ valid: false, reason: 'referral_unavailable' });
      }
    }

    let discountAmount = 0;
    if (voucher.type === 'percentage') {
      discountAmount = Math.floor((data.orderTotal * voucher.value) / 10000);
    } else if (voucher.type === 'fixed_amount') {
      discountAmount = Math.min(voucher.value, data.orderTotal);
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      voucherId: voucher.id,
      referralId: data.referralId,
    });
  });
}
