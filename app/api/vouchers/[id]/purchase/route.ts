import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import { checkPurchaseRateLimit } from '@/lib/fraud';
import { PLATFORM_FEE_PERCENT } from '@/lib/access-control/monetization';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const purchaseSchema = z.object({
  referrerId: z.string().optional(), // Optional referral ID if purchased via referral link
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
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

    const body = await req.json().catch(() => ({}));
    const { referrerId } = purchaseSchema.parse(body);

    // Get voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: { merchant: true, campaign: true },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher not available for purchase' }, { status: 400 });
    }

    // Check rate limit
    const rateLimit = await checkPurchaseRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', remaining: rateLimit.remaining },
        { status: 429 }
      );
    }

    // Check if voucher is purchasable (has price in campaign or is free)
    const price = voucher.campaign?.price ?? null;
    if (price === null) {
      // Free voucher - grant directly
      return NextResponse.json({ error: 'Use /api/vouchers/[id]/grant for free vouchers' }, { status: 400 });
    }

    // Check purchase limits
    if (voucher.campaign?.maxPurchases) {
      const purchaseCount = await prisma.voucherPurchase.count({
        where: {
          campaignId: voucher.campaignId,
          status: 'paid',
        },
      });
      if (purchaseCount >= voucher.campaign.maxPurchases) {
        return NextResponse.json({ error: 'Campaign purchase limit reached' }, { status: 400 });
      }
    }

    // Create purchase record with platform fee
    const platformFeeAmount = Math.round((price * PLATFORM_FEE_PERCENT) / 100);
    const purchase = await prisma.voucherPurchase.create({
      data: {
        voucherId: voucher.id,
        campaignId: voucher.campaignId || null,
        merchantId: voucher.merchantId,
        userId: session.user.id,
        amount: price,
        platformFeeAmount,
        currency: voucher.currency,
        status: 'pending',
      },
    });

    // Create Stripe checkout session
    const checkoutSession = await createCheckoutSession({
      lineItems: [
        {
          price_data: {
            currency: voucher.currency.toLowerCase(),
            product_data: {
              name: `Voucher: ${voucher.campaign?.name || 'Voucher'}`,
              description: voucher.campaign?.description || undefined,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&voucher_id=${voucher.id}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel?voucher_id=${voucher.id}`,
      metadata: {
        purchaseId: purchase.id,
        voucherId: voucher.id,
        campaignId: voucher.campaignId || '',
        merchantId: voucher.merchantId,
        userId: session.user.id,
        referrerId: referrerId || '',
      },
      customerEmail: session.user.email || undefined,
    });

    // Update purchase with Stripe session ID
    await prisma.voucherPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  });
}
