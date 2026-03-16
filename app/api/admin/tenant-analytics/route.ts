import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { prisma } from '@/lib/prisma';

type TenantStats = {
  merchantId: string;
  merchantName: string;
  slug: string;
  revenue: number;
  previousRevenue: number;
  revenueGrowth: number;
  users: number;
  vouchers: number;
  redemptions: number;
  activityScore: number;
  lastActive: string | null;
  inactive: boolean;
};

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.analytics.read');

    const url = new URL(req.url);
    const sortBy = url.searchParams.get('sortBy') ?? 'revenue';
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all active merchants
    const merchants = await prisma.merchant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            vouchers: true,
            redemptions: true,
          },
        },
      },
    });

    // Fetch redemption data for revenue calculations (current period: last 30 days)
    const currentRedemptions = await prisma.redemption.groupBy({
      by: ['merchantId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _sum: { discountApplied: true },
      _count: true,
    });

    // Previous period (30-60 days ago)
    const previousRedemptions = await prisma.redemption.groupBy({
      by: ['merchantId'],
      where: {
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _sum: { discountApplied: true },
    });

    // Last activity per merchant (most recent redemption)
    const lastActivities = await prisma.redemption.groupBy({
      by: ['merchantId'],
      _max: { createdAt: true },
    });

    // Build lookup maps
    const currentRevenueMap = new Map(
      currentRedemptions.map((r) => [r.merchantId, r._sum.discountApplied ?? 0]),
    );
    const currentCountMap = new Map(
      currentRedemptions.map((r) => [r.merchantId, r._count]),
    );
    const previousRevenueMap = new Map(
      previousRedemptions.map((r) => [r.merchantId, r._sum.discountApplied ?? 0]),
    );
    const lastActiveMap = new Map(
      lastActivities.map((r) => [r.merchantId, r._max.createdAt]),
    );

    // Build tenant stats
    const tenants: TenantStats[] = merchants.map((m) => {
      const revenue = currentRevenueMap.get(m.id) ?? 0;
      const previousRevenue = previousRevenueMap.get(m.id) ?? 0;
      const revenueGrowth =
        previousRevenue > 0 ? (revenue - previousRevenue) / previousRevenue : revenue > 0 ? 1 : 0;

      const lastActiveDate = lastActiveMap.get(m.id);
      const inactive = !lastActiveDate || lastActiveDate < thirtyDaysAgo;

      // Activity score: 0-100 based on redemptions, vouchers, and recency
      const recentRedemptions = currentCountMap.get(m.id) ?? 0;
      const recencyScore = lastActiveDate
        ? Math.max(0, 1 - (now.getTime() - lastActiveDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
        : 0;
      const activityScore = Math.min(
        100,
        Math.round(
          recentRedemptions * 2 + m._count.vouchers * 5 + recencyScore * 50,
        ),
      );

      return {
        merchantId: m.id,
        merchantName: m.name,
        slug: m.slug,
        revenue,
        previousRevenue,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100,
        users: m._count.members,
        vouchers: m._count.vouchers,
        redemptions: m._count.redemptions,
        activityScore,
        lastActive: lastActiveDate?.toISOString() ?? null,
        inactive,
      };
    });

    // Sort
    const validSortKeys: (keyof TenantStats)[] = [
      'revenue',
      'users',
      'vouchers',
      'redemptions',
      'activityScore',
      'revenueGrowth',
      'merchantName',
    ];
    const sortKey = validSortKeys.includes(sortBy as keyof TenantStats)
      ? (sortBy as keyof TenantStats)
      : 'revenue';

    tenants.sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });

    // Summary
    const totalRevenue = tenants.reduce((sum, t) => sum + t.revenue, 0);
    const activeTenants = tenants.filter((t) => !t.inactive).length;
    const inactiveTenants = tenants.filter((t) => t.inactive).length;
    const growthLeaders = [...tenants]
      .filter((t) => t.revenueGrowth > 0)
      .sort((a, b) => b.revenueGrowth - a.revenueGrowth)
      .slice(0, 5);
    const declining = [...tenants]
      .filter((t) => t.revenueGrowth < 0)
      .sort((a, b) => a.revenueGrowth - b.revenueGrowth)
      .slice(0, 5);

    return NextResponse.json({
      tenants,
      summary: {
        totalMerchants: tenants.length,
        activeTenants,
        inactiveTenants,
        totalRevenue,
        growthLeaders,
        declining,
      },
    });
  });
}
