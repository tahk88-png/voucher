import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminPermission } from '@/lib/admin/guards';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.merchants.read');
    const { id } = await params;

    const placement = await prisma.sponsoredGiftPlacement.findUnique({
      where: { id },
      include: { merchant: { select: { id: true, name: true, slug: true } } },
    });

    if (!placement) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const now = new Date();

    const ctr = placement.impressionCount > 0
      ? (placement.clickCount / placement.impressionCount) * 100 : 0;
    const spendRate = placement.budgetCents > 0
      ? (placement.spentCents / placement.budgetCents) * 100 : 0;
    const remainingBudgetCents = Math.max(0, placement.budgetCents - placement.spentCents);

    const totalDays = Math.max(1, Math.ceil(
      (placement.endAt.getTime() - placement.startAt.getTime()) / (1000 * 60 * 60 * 24)
    ));
    const elapsedDays = Math.max(0, Math.ceil(
      (now.getTime() - placement.startAt.getTime()) / (1000 * 60 * 60 * 24)
    ));
    const daysRemaining = Math.max(0, Math.ceil(
      (placement.endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    ));

    const dailySpendRate = elapsedDays > 0 ? placement.spentCents / elapsedDays : 0;
    const projectedTotalSpendCents = Math.round(dailySpendRate * totalDays);
    const projectedOverBudget = projectedTotalSpendCents > placement.budgetCents;

    const clickLimitUsage = placement.clickLimit
      ? (placement.clickCount / placement.clickLimit) * 100 : null;
    const impressionLimitUsage = placement.impressionsLimit
      ? (placement.impressionCount / placement.impressionsLimit) * 100 : null;

    const isExpired = placement.endAt < now;
    const isPending = placement.startAt > now;
    const isLive = placement.isActive && !isExpired && !isPending;
    const status = !placement.isActive ? 'paused'
      : isExpired ? 'expired'
      : isPending ? 'pending'
      : 'live';

    return NextResponse.json({
      stats: {
        id: placement.id,
        sponsorName: placement.sponsorName,
        merchant: placement.merchant,
        status,
        isLive,
        budgetCents: placement.budgetCents,
        spentCents: placement.spentCents,
        remainingBudgetCents,
        spendRate: Math.round(spendRate * 100) / 100,
        dailySpendRateCents: Math.round(dailySpendRate),
        projectedTotalSpendCents,
        projectedOverBudget,
        impressionCount: placement.impressionCount,
        clickCount: placement.clickCount,
        ctr: Math.round(ctr * 100) / 100,
        clickLimitUsage: clickLimitUsage !== null ? Math.round(clickLimitUsage * 100) / 100 : null,
        impressionLimitUsage: impressionLimitUsage !== null ? Math.round(impressionLimitUsage * 100) / 100 : null,
        startAt: placement.startAt,
        endAt: placement.endAt,
        totalDays,
        elapsedDays,
        daysRemaining,
        targetCategories: placement.targetCategories,
        targetOccasions: placement.targetOccasions,
        priority: placement.priority,
      },
    });
  });
}
