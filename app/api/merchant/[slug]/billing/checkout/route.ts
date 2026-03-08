import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { getMerchantBillingStatus } from '@/lib/billing';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { getPriceIdForTier, PLAN_TIERS, type PlanTier } from '@/lib/access-control/monetization';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{slug: string}> }
) {
  const { slug } = await params;

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

  // Parse plan tier from request body (default: pro)
  const body = await req.json().catch(() => ({}));
  const planTier: PlanTier = PLAN_TIERS.includes(body.planTier) ? body.planTier : 'pro';

  const priceId = getPriceIdForTier(planTier);
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for ${planTier} plan. Set STRIPE_PRICE_ID_${planTier.toUpperCase()} in env.` },
      { status: 500 }
    );
  }

  const billing = await getMerchantBillingStatus(merchant.id);

  let stripeCustomerId = billing.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      name: merchant.name,
      email: session.user.email || undefined,
      metadata: { merchantId: merchant.id, merchantSlug: merchant.slug },
    });
    stripeCustomerId = customer.id;
    await prisma.merchantSubscription.upsert({
      where: { merchantId: merchant.id },
      update: { stripeCustomerId: customer.id },
      create: { merchantId: merchant.id, stripeCustomerId: customer.id },
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const trialEndUnix =
    billing.inTrial && billing.trialEndsAt
      ? Math.floor(billing.trialEndsAt.getTime() / 1000)
      : undefined;

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      ...(trialEndUnix ? { trial_end: trialEndUnix } : {}),
      metadata: { merchantId: merchant.id },
    },
    metadata: { merchantId: merchant.id, merchantSlug: merchant.slug },
    success_url: `${baseUrl}/merchant/${merchant.slug}/settings?billing=success`,
    cancel_url: `${baseUrl}/merchant/${merchant.slug}/settings?billing=cancel`,
  });

  await prisma.merchantSubscription.upsert({
    where: { merchantId: merchant.id },
    update: { priceId },
    create: { merchantId: merchant.id, priceId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
