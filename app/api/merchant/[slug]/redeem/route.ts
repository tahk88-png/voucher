import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { dispatchWebhook } from '@/lib/webhooks';
import { pushNotifyUser } from '@/lib/push-notify';
import { rateLimit } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  // Rate limit: 60 redemptions per minute per merchant slug
  const rl = rateLimit(`redeem:${slug}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return withErrorHandler(async () => {
  const { slug } = await params
    const { profile, merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');
    const { type, id, amountBeforeDiscount } = await req.json();

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

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

      // Dispatch webhook
      dispatchWebhook(merchant.id, 'ticket.redeemed', {
        ticketId: ticket.id,
        eventId: ticket.eventId,
        merchantId: merchant.id,
        redeemedByStaffUserId: profile.userId,
      }).catch(() => {});

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

      // Dispatch webhook
      dispatchWebhook(merchant.id, 'gift_card.redeemed', {
        giftCardId: giftCard.id,
        amount: giftCard.amount,
        currency: giftCard.currency,
        merchantId: merchant.id,
        redeemedByStaffUserId: profile.userId,
      }).catch(() => {});

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

      // Look up the last paid purchase to get actual transaction amount
      const lastPurchase = await prisma.voucherPurchase.findFirst({
        where: { voucherId: voucher.id, status: 'paid' },
        orderBy: { createdAt: 'desc' },
        select: { amount: true, userId: true },
      });

      const actualAmount = typeof amountBeforeDiscount === 'number'
        ? amountBeforeDiscount
        : (lastPurchase?.amount ?? 0);

      await prisma.redemption.create({
        data: {
          voucherId: voucher.id,
          merchantId: merchant.id,
          redeemedByStaffUserId: profile.userId,
          method: 'in_store',
          amountBeforeDiscount: actualAmount,
          discountApplied: voucher.value,
          currency: voucher.currency,
          confirmedAt: new Date(),
        },
      });

      // Dispatch webhook (fire-and-forget)
      dispatchWebhook(merchant.id, 'voucher.redeemed', {
        voucherId: voucher.id,
        campaignName: voucher.campaign?.name,
        discountApplied: voucher.value,
        currency: voucher.currency,
        merchantId: merchant.id,
        redeemedByStaffUserId: profile.userId,
      }).catch(() => {});

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
