import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import { PLATFORM_FEE_PERCENT } from '@/lib/access-control/monetization';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { z } from 'zod';

const purchaseSchema = z.object({
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().max(100).optional(),
  senderName: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Payment processing unavailable.' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { recipientEmail, recipientName, senderName, message } = purchaseSchema.parse(body);

    // Rate limit: 20 purchases per hour per user
    const { allowed } = await rateLimitDistributed(`gift-card-purchase:${session.user.id}`, 20, 60_000 * 60);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const giftCard = await prisma.giftCard.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 });
    }

    if (giftCard.status !== 'active') {
      return NextResponse.json({ error: 'Gift card not available for purchase' }, { status: 400 });
    }

    if (!giftCard.purchasable) {
      return NextResponse.json({ error: 'This gift card is not available for purchase' }, { status: 400 });
    }

    // Check expiry
    if (giftCard.validTo && new Date(giftCard.validTo) < new Date()) {
      return NextResponse.json({ error: 'Gift card has expired' }, { status: 400 });
    }

    const price = giftCard.price ?? giftCard.amount;
    const platformFeeAmount = Math.round((price * PLATFORM_FEE_PERCENT) / 100);

    const purchase = await prisma.giftCardPurchase.create({
      data: {
        giftCardId: giftCard.id,
        merchantId: giftCard.merchantId,
        userId: session.user.id,
        amount: price,
        platformFeeAmount,
        currency: giftCard.currency,
        status: 'pending',
        recipientEmail,
        recipientName,
        senderName,
      },
    });

    // Override gift card message if buyer provided one
    if (message && message !== giftCard.message) {
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: { message },
      });
    }

    const connectedAccountId =
      giftCard.merchant.payoutsEnabled && giftCard.merchant.stripeAccountId
        ? giftCard.merchant.stripeAccountId
        : null;

    const checkoutSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: giftCard.currency.toLowerCase(),
            product_data: {
              name: `Gift Card: ${giftCard.merchant.name}`,
              description: `${(giftCard.amount / 100).toFixed(2)} ${giftCard.currency} gift card`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&gift_card_id=${giftCard.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel?gift_card_id=${giftCard.id}`,
      metadata: {
        purchaseId: purchase.id,
        giftCardId: giftCard.id,
        merchantId: giftCard.merchantId,
        userId: session.user.id,
        type: 'gift_card',
        recipientEmail: recipientEmail || '',
        platformFeeAmount: String(platformFeeAmount),
      },
      customerEmail: session.user.email || undefined,
      connectedAccountId,
      applicationFeeAmount: connectedAccountId ? platformFeeAmount : undefined,
    });

    await prisma.giftCardPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  });
}
