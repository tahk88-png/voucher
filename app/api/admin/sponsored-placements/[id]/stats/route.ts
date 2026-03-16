import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const adminEmails = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const isAdmin = adminEmails.includes(session.user.email!) || (session.user as any).adminRole;
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;

  const placement = await prisma.sponsoredGiftPlacement.findUnique({
    where: { id },
    include: {
      merchant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!placement) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = new Date();

  // CTR
  const ctr = placement.impressionCount > 0
    ? (placement.clickCount / placement.impressionCount) * 100
    : 0;

  // Spend rate
  const spendRate = placement.budgetCents > 0
    ? (placement.spentCents / placement.budgetCents) * 100
    : 0;
  const remainingBudgetCents = Math.max(0, placement.budgetCents - placement.spentCents);

  // Days remaining
  const totalDays = Math.max(1, Math.ceil(
    (placement.endAt.getTime() - placement.startAt.getTime()) / (1000 * 60 * 60 * 24)
  ));
  const elapsedDays = Math.max(0, Math.ceil(
    (now.getTime() - placement.startAt.getTime()) / (1000 * 60 * 60 * 24)
  ));
  const daysRemaining = Math.max(0, Math.ceil(
    (placement.endAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  ));

  // Daily spend rate and projected budget
  const dailySpendRate = elapsedDays > 0 ? placement.spentCents / elapsedDays : 0;
  const projectedTotalSpendCents = Math.round(dailySpendRate * totalDays);
  const projectedOverBudget = projectedTotalSpendCents > placement.budgetCents;

  // Limit utilization
  const clickLimitUsage = placement.clickLimit
    ? (placement.clickCount / placement.clickLimit) * 100
    : null;
  const impressionLimitUsage = placement.impressionsLimit
    ? (placement.impressionCount / placement.impressionsLimit) * 100
    : null;

  // Status
  const isLive = placement.isActive && placement.startAt <= now && placement.endAt >= now;
  const isExpired = placement.endAt < now;
  const isPending = placement.startAt > now;
  const status = !placement.isActive
    ? 'paused'
    : isExpired
      ? 'expired'
      : isPending
        ? 'pending'
        : 'live';

  return NextResponse.json({
    stats: {
      id: placement.id,
      sponsorName: placement.sponsorName,
      merchant: placement.merchant,
      status,
      isLive,

      // Budget
      budgetCents: placement.budgetCents,
      spentCents: placement.spentCents,
      remainingBudgetCents,
      spendRate: Math.round(spendRate * 100) / 100,
      dailySpendRateCents: Math.round(dailySpendRate),
      projectedTotalSpendCents,
      projectedOverBudget,

      // Engagement
      impressionCount: placement.impressionCount,
      clickCount: placement.clickCount,
      ctr: Math.round(ctr * 100) / 100,
      clickLimitUsage: clickLimitUsage !== null ? Math.round(clickLimitUsage * 100) / 100 : null,
      impressionLimitUsage: impressionLimitUsage !== null ? Math.round(impressionLimitUsage * 100) / 100 : null,

      // Timeline
      startAt: placement.startAt,
      endAt: placement.endAt,
      totalDays,
      elapsedDays,
      daysRemaining,

      // Targeting
      targetCategories: placement.targetCategories,
      targetOccasions: placement.targetOccasions,
      priority: placement.priority,
    },
  });
}
