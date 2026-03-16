import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { calculateTier, getTierBenefits, LOYALTY_TIERS } from '@/lib/loyalty-tiers';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await prisma.loyaltyAccount.findUnique({
      where: { userId: session.user.id },
    });

    const lifetimePoints = account?.lifetimePoints ?? 0;
    const currentTier = calculateTier(lifetimePoints);
    const benefits = getTierBenefits(currentTier.name);

    return NextResponse.json({
      tier: {
        name: currentTier.name,
        label: currentTier.label,
        color: currentTier.color,
      },
      benefits,
      discountPercent: currentTier.discountPercent,
      earlyAccess: currentTier.earlyAccess,
      freeShipping: currentTier.freeShipping,
      exclusiveVouchers: currentTier.exclusiveVouchers,
      bonusPointsMultiplier: currentTier.bonusPointsMultiplier,
      // Show what they could unlock at the next tier
      allTierBenefits: LOYALTY_TIERS.map((t) => ({
        tier: t.label,
        minPoints: t.minPoints,
        benefits: getTierBenefits(t.name),
        unlocked: lifetimePoints >= t.minPoints,
      })),
    });
  });
}
