import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getTimeSeries, calculateGrowthRate } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isPlatformAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now;
    const from = searchParams.get('from')
      ? new Date(searchParams.get('from')!)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Previous period for comparison
    const periodLength = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLength);
    const prevTo = new Date(from.getTime());

    // Run all queries in parallel
    const [
      totalUsers,
      prevTotalUsers,
      totalMerchants,
      prevTotalMerchants,
      totalVouchers,
      currentRevenue,
      prevRevenue,
      revenueTimeSeries,
      userGrowthTimeSeries,
      topMerchantRows,
      recentActivity,
      currentRedemptions,
      currentPurchaseViews,
    ] = await Promise.all([
      // Total users in period
      prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.user.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),

      // Total merchants in period
      prisma.merchant.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.merchant.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),

      // Total vouchers
      prisma.voucher.count({ where: { createdAt: { gte: from, lte: to } } }),

      // Revenue (sum of paid purchases)
      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: prevFrom, lte: prevTo } },
        _sum: { amount: true },
      }),

      // Revenue time series
      getTimeSeries('VoucherPurchase', 'sum', from, to, 'day', {
        where: `"status" = 'paid'`,
        sumField: 'amount',
      }),

      // User growth time series
      getTimeSeries('User', 'count', from, to, 'day'),

      // Top merchants by revenue
      prisma.voucherPurchase.groupBy({
        by: ['merchantId'],
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),

      // Recent analytics events
      prisma.analyticsEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Redemptions for conversion rate
      prisma.redemption.count({ where: { createdAt: { gte: from, lte: to } } }),

      // Total purchase attempts (all statuses)
      prisma.voucherPurchase.count({ where: { createdAt: { gte: from, lte: to } } }),
    ]);

    // Enrich top merchants with names
    const merchantIds = topMerchantRows.map((r) => r.merchantId);
    const merchants = merchantIds.length > 0
      ? await prisma.merchant.findMany({
          where: { id: { in: merchantIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const merchantMap = new Map(merchants.map((m) => [m.id, m]));

    const topMerchants = topMerchantRows.map((r) => ({
      merchantId: r.merchantId,
      name: merchantMap.get(r.merchantId)?.name ?? 'Unknown',
      slug: merchantMap.get(r.merchantId)?.slug ?? '',
      revenue: r._sum.amount ?? 0,
    }));

    const currentRevenueTotal = currentRevenue._sum.amount ?? 0;
    const prevRevenueTotal = prevRevenue._sum.amount ?? 0;
    const conversionRate =
      currentPurchaseViews > 0
        ? Math.round((currentRedemptions / currentPurchaseViews) * 10000) / 100
        : 0;

    return NextResponse.json({
      totalRevenue: currentRevenueTotal,
      revenueChange: calculateGrowthRate(currentRevenueTotal, prevRevenueTotal),
      totalUsers,
      usersChange: calculateGrowthRate(totalUsers, prevTotalUsers),
      totalMerchants,
      merchantsChange: calculateGrowthRate(totalMerchants, prevTotalMerchants),
      totalVouchers,
      revenueTimeSeries,
      userGrowthTimeSeries,
      topMerchants,
      recentActivity,
      conversionRate,
    });
  } catch (error) {
    logger.error('[analytics/overview] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
