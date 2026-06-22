import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { calculateGrowthRate } from '@/lib/analytics';

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

    const periodLength = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLength);
    const prevTo = new Date(from.getTime());

    const [
      currentUsers,
      prevUsers,
      currentRevenue,
      prevRevenue,
      currentMerchants,
      prevMerchants,
      // Conversion funnel data
      viewEvents,
      clickEvents,
      cartEvents,
      purchaseEvents,
      redeemEvents,
      // Channel acquisition
      organicCount,
      referralCount,
      socialCount,
      directCount,
      // Churn: users active in prev period but not in current
      prevActiveUsers,
      currentActiveUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.user.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),

      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: prevFrom, lte: prevTo } },
        _sum: { amount: true },
      }),

      prisma.merchant.count({ where: { createdAt: { gte: from, lte: to } } }),
      prisma.merchant.count({ where: { createdAt: { gte: prevFrom, lte: prevTo } } }),

      // Conversion funnel from analytics events
      prisma.analyticsEvent.count({
        where: { type: 'page_view', createdAt: { gte: from, lte: to } },
      }),
      prisma.analyticsEvent.count({
        where: { type: 'click', createdAt: { gte: from, lte: to } },
      }),
      prisma.analyticsEvent.count({
        where: { type: 'add_to_cart', createdAt: { gte: from, lte: to } },
      }),
      prisma.analyticsEvent.count({
        where: { type: 'purchase', createdAt: { gte: from, lte: to } },
      }),
      prisma.analyticsEvent.count({
        where: { type: 'redemption', createdAt: { gte: from, lte: to } },
      }),

      // Channel acquisition from referrer field
      prisma.analyticsEvent.count({
        where: {
          type: 'signup',
          createdAt: { gte: from, lte: to },
          referrer: { contains: 'google', mode: 'insensitive' },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          type: 'signup',
          createdAt: { gte: from, lte: to },
          referrer: { not: null, contains: 'ref=' },
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          type: 'signup',
          createdAt: { gte: from, lte: to },
          OR: [
            { referrer: { contains: 'facebook', mode: 'insensitive' } },
            { referrer: { contains: 'twitter', mode: 'insensitive' } },
            { referrer: { contains: 'instagram', mode: 'insensitive' } },
            { referrer: { contains: 'linkedin', mode: 'insensitive' } },
            { referrer: { contains: 'tiktok', mode: 'insensitive' } },
          ],
        },
      }),
      prisma.analyticsEvent.count({
        where: {
          type: 'signup',
          createdAt: { gte: from, lte: to },
          OR: [{ referrer: null }, { referrer: '' }],
        },
      }),

      // Distinct active users in previous period
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "userId")::bigint as count
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${prevFrom} AND "createdAt" <= ${prevTo}
          AND "userId" IS NOT NULL`,

      // Distinct active users in current period
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT "userId")::bigint as count
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND "userId" IS NOT NULL`,
    ]);

    const currentRevenueTotal = currentRevenue._sum.amount ?? 0;
    const prevRevenueTotal = prevRevenue._sum.amount ?? 0;

    const prevActiveCount = Number(prevActiveUsers[0]?.count ?? 0);
    const currentActiveCount = Number(currentActiveUsers[0]?.count ?? 0);

    // Churn = users active before but not now / users active before
    // We approximate — true churn requires cross-referencing user IDs
    const churnRate =
      prevActiveCount > 0
        ? Math.round(
            (Math.max(0, prevActiveCount - currentActiveCount) / prevActiveCount) * 10000
          ) / 100
        : 0;

    return NextResponse.json({
      userGrowthRate: calculateGrowthRate(currentUsers, prevUsers),
      revenueGrowthRate: calculateGrowthRate(currentRevenueTotal, prevRevenueTotal),
      merchantGrowthRate: calculateGrowthRate(currentMerchants, prevMerchants),
      conversionFunnel: {
        view: viewEvents,
        click: clickEvents,
        cart: cartEvents,
        purchase: purchaseEvents,
        redeem: redeemEvents,
      },
      channelAcquisition: {
        organic: organicCount,
        referral: referralCount,
        social: socialCount,
        direct: directCount,
      },
      churnRate,
    });
  } catch (error) {
    logger.error('[analytics/growth] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
