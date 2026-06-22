import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import {
  createExpressAccount,
  createAccountOnboardingLink,
  retrieveAccount,
  deriveAccountStatus,
} from '@/lib/stripe';
import { logger } from '@/lib/logger';

/**
 * POST /api/merchant/:slug/stripe/connect
 *
 * Creates (or reuses) a Stripe Express account for this merchant and
 * returns a single-use onboarding URL. Merchants in the middle of
 * onboarding hit the same endpoint to get a fresh refresh link.
 *
 * Guarded by `merchant_admin` role. We never expose the account id to
 * the client — only the Stripe-hosted URL.
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
    select: {
      id: true,
      country: true,
      name: true,
      stripeAccountId: true,
    },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'merchant_not_found' }, { status: 404 });
  }

  try {
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const refreshUrl = `${baseUrl}/api/merchant/${slug}/stripe/connect`;
  const returnUrl = `${baseUrl}/api/merchant/${slug}/stripe/connect/return`;

  try {
    let accountId = merchant.stripeAccountId;

    if (!accountId) {
      const account = await createExpressAccount({
        email: session.user.email ?? null,
        country: merchant.country,
        businessName: merchant.name,
      });
      accountId = account.id;

      // Persist immediately so a mid-flow crash doesn't orphan the account.
      // We also seed the cached status from the freshly-created account.
      const derived = deriveAccountStatus(account);
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          stripeAccountId: accountId,
          stripeAccountStatus: derived.status,
          payoutsEnabled: derived.payoutsEnabled,
        },
      });
      logger.info('Created Stripe Connect account', {
        merchantId: merchant.id,
        stripeAccountId: accountId,
      });
    }

    const link = await createAccountOnboardingLink({
      accountId,
      refreshUrl,
      returnUrl,
    });

    return NextResponse.json({ url: link.url });
  } catch (err) {
    logger.error('Stripe Connect onboarding failed', {
      merchantId: merchant.id,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: 'stripe_error', message: 'Failed to start Stripe onboarding' },
      { status: 502 },
    );
  }
}

/**
 * DELETE /api/merchant/:slug/stripe/connect
 *
 * Disconnects the merchant from Stripe Connect. We keep the Stripe
 * account (in case they want to reconnect) but clear the reference and
 * flip `payoutsEnabled` off so the checkout path falls back to direct
 * charge. Intentionally soft-delete on our side — Stripe account
 * deletion is out of scope here because it blocks pending payouts.
 */
export async function DELETE(
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
    select: { id: true, stripeAccountId: true },
  });
  if (!merchant) {
    return NextResponse.json({ error: 'merchant_not_found' }, { status: 404 });
  }

  try {
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  // Refresh before clearing so the admin audit log reflects the final
  // Stripe-side state rather than a stale cache.
  if (merchant.stripeAccountId) {
    try {
      const account = await retrieveAccount(merchant.stripeAccountId);
      const derived = deriveAccountStatus(account);
      logger.info('Disconnecting Stripe Connect account', {
        merchantId: merchant.id,
        stripeAccountId: merchant.stripeAccountId,
        lastStatus: derived.status,
      });
    } catch {
      // Non-fatal — the account may have been deleted Stripe-side.
    }
  }

  await prisma.merchant.update({
    where: { id: merchant.id },
    data: {
      stripeAccountId: null,
      stripeAccountStatus: 'pending',
      payoutsEnabled: false,
    },
  });

  return NextResponse.json({ ok: true });
}
