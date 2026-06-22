import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { retrieveAccount, deriveAccountStatus } from '@/lib/stripe';
import { logger } from '@/lib/logger';

/**
 * GET /api/merchant/:slug/stripe/connect/return
 *
 * Stripe redirects the merchant here after they finish (or abandon)
 * the hosted onboarding flow. We re-fetch the account to sync our
 * cached capabilities and then redirect back to the merchant payouts
 * settings page.
 *
 * The `account.updated` webhook is the authoritative source of truth
 * for later changes — this handler only exists so the UI reflects
 * fresh state immediately when the user lands back on our site
 * (webhooks can be delayed by seconds, and the UI shouldn't show a
 * stale "pending" badge if the account already flipped to enabled).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(
      new URL('/login', _req.url),
    );
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug },
    select: { id: true, stripeAccountId: true },
  });
  if (!merchant) {
    return NextResponse.redirect(new URL('/', _req.url));
  }

  try {
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');
  } catch {
    return NextResponse.redirect(
      new URL(`/merchant/${slug}/dashboard`, _req.url),
    );
  }

  if (merchant.stripeAccountId) {
    try {
      const account = await retrieveAccount(merchant.stripeAccountId);
      const derived = deriveAccountStatus(account);
      await prisma.merchant.update({
        where: { id: merchant.id },
        data: {
          stripeAccountStatus: derived.status,
          payoutsEnabled: derived.payoutsEnabled,
        },
      });
    } catch (err) {
      logger.warn('Failed to refresh Stripe account on return', {
        merchantId: merchant.id,
        stripeAccountId: merchant.stripeAccountId,
        error: err instanceof Error ? err.message : String(err),
      });
      // Fall through — still redirect to payouts page, webhook will catch up.
    }
  }

  return NextResponse.redirect(
    new URL(`/merchant/${slug}/settings/payouts`, _req.url),
  );
}
