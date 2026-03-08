import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { stripe, isStripeConfigured } from '@/lib/stripe';

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
    include: { subscription: true },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

  const stripeCustomerId = merchant.subscription?.stripeCustomerId;
  if (!stripeCustomerId) {
    return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/merchant/${merchant.slug}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
