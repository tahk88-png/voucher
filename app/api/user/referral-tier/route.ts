import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getUserReferralTier, getNextReferralTier, REFERRAL_TIERS } from '@/lib/referral-tiers';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const redeemedCount = await prisma.referral.count({
      where: {
        referrerUserId: session.user.id,
        status: 'redeemed',
      },
    });

    const tier = getUserReferralTier(redeemedCount);
    const nextTier = getNextReferralTier(tier);

    return NextResponse.json({
      redeemedReferrals: redeemedCount,
      tier,
      nextTier,
      allTiers: REFERRAL_TIERS,
    });
  });
}
