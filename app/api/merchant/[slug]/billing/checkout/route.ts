import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { getMerchantBillingStatus } from '@/lib/billing';
import { stripe, isStripeConfigured } from '@/lib/stripe';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const priceId = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Missing STRIPE_SUBSCRIPTION_PRICE_ID' }, { status: 500 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

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
