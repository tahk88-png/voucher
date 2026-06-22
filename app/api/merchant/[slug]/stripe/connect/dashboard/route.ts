import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { createDashboardLoginLink } from '@/lib/stripe';
import { logger } from '@/lib/logger';

/**
 * POST /api/merchant/:slug/stripe/connect/dashboard
 *
 * Returns a fresh, single-use Stripe Express dashboard URL where the
 * merchant can view balances / payouts / update banking. Requires
 * `merchant_admin`; we don't cache the URL because Stripe invalidates
 * old links the moment a new one is minted.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: { id: true, stripeAccountId: true, payoutsEnabled: true },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'merchant_not_found' }, { status: 404 });
  }

  try {
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  if (!merchant.stripeAccountId || !merchant.payoutsEnabled) {
    return NextResponse.json(
      { error: 'not_connected', message: 'Complete onboarding before opening the dashboard.' },
      { status: 409 },
    );
  }

  try {
    const link = await createDashboardLoginLink(merchant.stripeAccountId);
    return NextResponse.json({ url: link.url });
  } catch (err) {
    logger.error('Stripe dashboard link failed', {
      merchantId: merchant.id,
      stripeAccountId: merchant.stripeAccountId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'stripe_error', message: 'Failed to open Stripe dashboard' },
      { status: 502 },
    );
  }
}
