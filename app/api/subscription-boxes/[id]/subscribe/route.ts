import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { stripe } from '@/lib/stripe';
import { getOrCreateStripeCustomerForUser } from '@/lib/stripe-customers';
import { queueWebhook } from '@/lib/webhooks';
import { withErrorHandler } from '@/lib/error-handler';

type Params = Promise<{ id: string }>;

export async function POST(req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const box = await prisma.subscriptionBox.findFirst({
      where: { id, isActive: true },
      include: { merchant: { select: { name: true, slug: true } } },
    });
    if (!box) return NextResponse.json({ error: 'Subscription box not found' }, { status: 404 });

    // Check for existing active subscription
    const existing = await prisma.boxSubscription.findUnique({
      where: { boxId_userId: { boxId: id, userId: session.user.id } },
    });
    if (existing && existing.status === 'active') {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

    // Create or reactivate subscription
    if (box.stripePriceId) {
      // Reuse the user's existing Stripe Customer (or create+persist one) so
      // repeated subscribe attempts don't mint duplicate Customer objects.
      const stripeCustomerId = await getOrCreateStripeCustomerForUser(session.user.id, {
        metadata: { boxId: id },
      });

      const stripeSub = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: box.stripePriceId }],
        metadata: { boxId: id, userId: session.user.id },
      });

      const subscription = await prisma.boxSubscription.upsert({
        where: { boxId_userId: { boxId: id, userId: session.user.id } },
        update: {
          status: 'active',
          stripeSubId: stripeSub.id,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          cancelledAt: null,
        },
        create: {
          boxId: id,
          userId: session.user.id,
          status: 'active',
          stripeSubId: stripeSub.id,
          currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        },
      });

      queueWebhook(box.merchantId, 'subscription.created', {
        subscriptionId: subscription.id,
        boxId: id,
        merchantId: box.merchantId,
        userId: session.user.id,
        stripeSubId: stripeSub.id,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
        reactivated: Boolean(existing),
        createdAt: subscription.createdAt.toISOString(),
      });

      return NextResponse.json(subscription, { status: 201 });
    }

    // No Stripe price — record intent directly
    const subscription = await prisma.boxSubscription.upsert({
      where: { boxId_userId: { boxId: id, userId: session.user.id } },
      update: { status: 'active', cancelledAt: null },
      create: { boxId: id, userId: session.user.id, status: 'active' },
    });

    queueWebhook(box.merchantId, 'subscription.created', {
      subscriptionId: subscription.id,
      boxId: id,
      merchantId: box.merchantId,
      userId: session.user.id,
      stripeSubId: null,
      currentPeriodEnd: null,
      reactivated: Boolean(existing),
      createdAt: subscription.createdAt.toISOString(),
    });

    return NextResponse.json(subscription, { status: 201 });
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Params }) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const subscription = await prisma.boxSubscription.findUnique({
      where: { boxId_userId: { boxId: id, userId: session.user.id } },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Not subscribed' }, { status: 404 });
    }

    // Cancel Stripe subscription if present
    if (subscription.stripeSubId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubId);
      } catch {
        // Stripe sub may already be cancelled
      }
    }

    await prisma.boxSubscription.update({
      where: { boxId_userId: { boxId: id, userId: session.user.id } },
      data: { status: 'cancelled', cancelledAt: new Date() },
    });

    return NextResponse.json({ success: true });
  });
}
