import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { queueWebhook } from '@/lib/webhooks';
import { pushNotifyUser } from '@/lib/push-notify';
import { rateLimit } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

export async function POST(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params;
  // Rate limit: 60 redemptions per minute per merchant slug
  const rl = rateLimit(`redeem:${slug}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return withErrorHandler(async () => {
    const { profile, merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');
    const redeemSchema = z.object({
      type: z.enum(['ticket', 'gift_card', 'voucher']),
      id: z.string().min(1),
      amountBeforeDiscount: z.number().positive().optional(),
    });
    const parsed = redeemSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { type, id, amountBeforeDiscount } = parsed.data;

    if (type === 'ticket') {
      const ticket = await prisma.ticket.findFirst({
        where: { id, merchantId: merchant.id, status: 'sold' },
      });
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket not found or already used' }, { status: 404 });
      }
      await prisma.ticket.update({
        where: { id },
        data: { status: 'used', usedAt: new Date() },
      });

      // Dispatch webhook (fire-and-forget; queueWebhook handles retry/log)
      queueWebhook(merchant.id, 'ticket.redeemed', {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        merchantId: merchant.id,
        redeemedByStaffUserId: profile.userId,
      });

      return NextResponse.json({ success: true, message: 'Ticket redeemed' });
    }

    if (type === 'gift_card') {
      const giftCard = await prisma.giftCard.findFirst({
        where: { id, merchantId: merchant.id, status: 'active' },
      });
      if (!giftCard) {
        return NextResponse.json({ error: 'Gift card not found or already redeemed' }, { status: 404 });
      }
      await prisma.giftCard.update({
        where: { id },
        data: {
          status: 'redeemed',
          redeemedAt: new Date(),
          redeemedByStaffUserId: profile.userId,
        },
      });

      // Dispatch webhook (fire-and-forget; queueWebhook handles retry/log)
      queueWebhook(merchant.id, 'gift_card.redeemed', {
        giftCardId: giftCard.id,
        amount: giftCard.amount,
        currency: giftCard.currency,
        merchantId: merchant.id,
        redeemedByStaffUserId: profile.userId,
      });

      return NextResponse.json({ success: true, message: 'Gift card redeemed' });
    }

    if (type === 'voucher') {
      const voucher = await prisma.voucher.findFirst({
        where: { id, merchantId: merchant.id, status: 'published' },
        include: {
          campaign: { select: { name: true } },
        },
      });
      if (!voucher) {
        return NextResponse.json({ error: 'Voucher not found or not active' }, { status: 404 });
      }

      // Validity window — status can lag validTo until the hourly auto-expire
      // cron runs, so gate on the timestamps directly here too.
      const now = new Date();
      if (now < voucher.validFrom || now > voucher.validTo) {
        return NextResponse.json({ error: 'Voucher expired or not yet valid' }, { status: 400 });
      }

      // Look up the last paid purchase to get actual transaction amount
      const lastPurchase = await prisma.voucherPurchase.findFirst({
        where: { voucherId: voucher.id, status: 'paid' },
        orderBy: { createdAt: 'desc' },
        select: { amount: true, userId: true },
      });

      const actualAmount = typeof amountBeforeDiscount === 'number'
        ? amountBeforeDiscount
        : (lastPurchase?.amount ?? 0);

      // Enforce usage limits inside a transaction so concurrent scans
      // can't both pass the count check and over-redeem (TOCTOU).
      try {
        await prisma.$transaction(async (tx) => {
          if (voucher.usageLimitTotal !== null) {
            const totalConfirmed = await tx.redemption.count({
              where: { voucherId: voucher.id, confirmedAt: { not: null } },
            });
            if (totalConfirmed >= voucher.usageLimitTotal) {
              throw new Error('USAGE_LIMIT_TOTAL');
            }
          }

          if (voucher.usageLimitPerUser !== null && lastPurchase?.userId) {
            const perUser = await tx.redemption.count({
              where: {
                voucherId: voucher.id,
                redeemedByUserId: lastPurchase.userId,
                confirmedAt: { not: null },
              },
            });
            if (perUser >= voucher.usageLimitPerUser) {
              throw new Error('USAGE_LIMIT_PER_USER');
            }
          }

          await tx.redemption.create({
            data: {
              voucherId: voucher.id,
              merchantId: merchant.id,
              redeemedByUserId: lastPurchase?.userId ?? null,
              redeemedByStaffUserId: profile.userId,
              method: 'in_store',
              amountBeforeDiscount: actualAmount,
              discountApplied: voucher.value,
              currency: voucher.currency,
              confirmedAt: new Date(),
            },
          });
        });
      } catch (err) {
        if (err instanceof Error && err.message === 'USAGE_LIMIT_TOTAL') {
          return NextResponse.json({ error: 'Voucher usage limit reached' }, { status: 400 });
        }
        if (err instanceof Error && err.message === 'USAGE_LIMIT_PER_USER') {
          return NextResponse.json({ error: 'Per-user usage limit reached' }, { status: 400 });
        }
        throw err;
      }

      // Dispatch webhook (fire-and-forget; queueWebhook handles retry/log)
      queueWebhook(merchant.id, 'voucher.redeemed', {
        voucherId: voucher.id,
        campaignName: voucher.campaign?.name,
        discountApplied: voucher.value,
        currency: voucher.currency,
        merchantId: merchant.id,
        redeemedByStaffUserId: profile.userId,
      });

      // Push notification to voucher buyer (fire-and-forget)
      if (lastPurchase?.userId) {
        pushNotifyUser(lastPurchase.userId, {
          title: 'Voucher redeemed',
          body: `Your ${voucher.campaign?.name ?? 'voucher'} was used at ${merchant.name}.`,
          url: '/app/vouchers',
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, message: 'Voucher redeemed' });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  });
}
