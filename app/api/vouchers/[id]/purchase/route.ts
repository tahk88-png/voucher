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

    // Check rate limit FIRST — before any DB queries
    const rateLimit = await checkPurchaseRateLimit(session.user.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', remaining: rateLimit.remaining },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { referrerId } = purchaseSchema.parse(body);

    // Get voucher along with the merchant's Connect state. We read
    // `stripeAccountId` + `payoutsEnabled` here so the checkout session
    // can route the net-of-fee amount directly to the merchant's
    // connected account when they're onboarded. Un-connected merchants
    // keep the legacy direct-charge flow so nothing regresses.
    const voucher = await prisma.voucher.findUnique({
      where: { id },
      include: {
        merchant: {
          select: {
            id: true,
            slug: true,
            name: true,
            stripeAccountId: true,
            payoutsEnabled: true,
          },
        },
        campaign: true,
      },
    });

    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher not available for purchase' }, { status: 400 });
    }

    // Check if voucher is purchasable (has price in campaign or is free)
    const price = voucher.campaign?.price ?? null;
    if (price === null || price === 0) {
      // Free voucher — grant directly to the user
      const freePurchase = await prisma.voucherPurchase.create({
        data: {
          voucherId: voucher.id,
          campaignId: voucher.campaignId || null,
          merchantId: voucher.merchantId,
          userId: session.user.id,
          amount: 0,
          currency: voucher.currency,
          status: 'paid',
        },
      });
      return NextResponse.json({
        success: true,
        free: true,
        purchaseId: freePurchase.id,
        redirectUrl: `/app/voucher/${voucher.id}`,
      });
    }

    // Atomic: check purchase limit + create purchase in single transaction
    const platformFeeAmount = Math.round((price * PLATFORM_FEE_PERCENT) / 100);
    const purchase = await prisma.$transaction(async (tx) => {
      // Check purchase limits inside transaction
      if (voucher.campaign?.maxPurchases) {
        const purchaseCount = await tx.voucherPurchase.count({
          where: {
            campaignId: voucher.campaignId,
            status: { in: ['paid', 'pending'] },
          },
        });
        if (purchaseCount >= voucher.campaign.maxPurchases) {
          throw new Error('PURCHASE_LIMIT_REACHED');
        }
      }

      // Check stock inside transaction
      if (voucher.stockQuantity !== null && voucher.stockQuantity <= 0) {
        throw new Error('OUT_OF_STOCK');
      }

      return tx.voucherPurchase.create({
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
    }).catch((err) => {
      if (err instanceof Error && err.message === 'PURCHASE_LIMIT_REACHED') {
        return null;
      }
      if (err instanceof Error && err.message === 'OUT_OF_STOCK') {
        return 'OUT_OF_STOCK' as const;
      }
      throw err;
    });

    if (purchase === null) {
      return NextResponse.json({ error: 'Campaign purchase limit reached' }, { status: 400 });
    }
    if (purchase === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: 'Voucher out of stock' }, { status: 400 });
    }

    // Only route via Connect when the merchant has completed onboarding
    // (payoutsEnabled=true). A merchant who has an account but hasn't
    // finished onboarding still falls back to direct charge so that
    // customer-facing purchases never break mid-onboarding.
    const useConnect =
      !!voucher.merchant.stripeAccountId && voucher.merchant.payoutsEnabled;

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
        // Echoed in `payment_intent.succeeded` metadata so the webhook
        // can reconcile direct-charge vs Connect transfers without an
        // extra Stripe API round-trip.
        stripeAccountId: voucher.merchant.stripeAccountId || '',
        platformFeeAmount: String(platformFeeAmount),
      },
      customerEmail: session.user.email || undefined,
      ...(useConnect
        ? {
            connectedAccountId: voucher.merchant.stripeAccountId,
            applicationFeeAmount: platformFeeAmount,
          }
        : {}),
    });

    // Update purchase with Stripe session ID
    await prisma.voucherPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  });
}
