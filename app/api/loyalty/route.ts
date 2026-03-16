import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { calculateTier, getTierProgress, getTierBenefits, LOYALTY_TIERS } from '@/lib/loyalty-tiers';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create loyalty account
    let account = await prisma.loyaltyAccount.findUnique({
      where: { userId: session.user.id },
      include: {
        pointsHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!account) {
      account = await prisma.loyaltyAccount.create({
        data: {
          userId: session.user.id,
          totalPoints: 0,
          lifetimePoints: 0,
          currentTier: 'bronze',
        },
        include: {
          pointsHistory: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    }

    const currentTier = calculateTier(account.lifetimePoints);
    const progress = getTierProgress(account.lifetimePoints);
    const benefits = getTierBenefits(currentTier.name);

    // Sync tier if it changed
    if (account.currentTier !== currentTier.name) {
      await prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: {
          currentTier: currentTier.name,
          tierUpdatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      totalPoints: account.totalPoints,
      lifetimePoints: account.lifetimePoints,
      currentTier: {
        name: currentTier.name,
        label: currentTier.label,
        color: currentTier.color,
        icon: currentTier.icon,
        discountPercent: currentTier.discountPercent,
      },
      nextTier: progress.nextTier
        ? {
            name: progress.nextTier.name,
            label: progress.nextTier.label,
            color: progress.nextTier.color,
            minPoints: progress.nextTier.minPoints,
          }
        : null,
      pointsToNextTier: progress.pointsToNextTier,
      progressPercent: progress.progressPercent,
      benefits,
      allTiers: LOYALTY_TIERS.map((t) => ({
        name: t.name,
        label: t.label,
        minPoints: t.minPoints,
        color: t.color,
        icon: t.icon,
        discountPercent: t.discountPercent,
        benefits: getTierBenefits(t.name),
        isCurrent: t.name === currentTier.name,
      })),
      pointsHistory: account.pointsHistory.map((p) => ({
        id: p.id,
        points: p.points,
        reason: p.reason,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
      })),
      tierUpdatedAt: account.tierUpdatedAt.toISOString(),
    });
  });
}
