import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { getTimeSeries, calculateGrowthRate } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

type Granularity = 'hour' | 'day' | 'week' | 'month';

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
    const granularity = (searchParams.get('granularity') as Granularity) || 'day';

    // Previous period
    const periodLength = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLength);
    const prevTo = new Date(from.getTime());

    const [
      revenueTimeSeries,
      voucherRevenue,
      giftCardRevenue,
      ticketRevenue,
      subscriptionRevenue,
      prevVoucherRevenue,
      revenueByCountryRows,
      orderStats,
      prevOrderStats,
      refundCount,
      totalPaidCount,
      topMerchantRows,
    ] = await Promise.all([
      // Revenue time series
      getTimeSeries('VoucherPurchase', 'sum', from, to, granularity, {
        where: `"status" = 'paid'`,
        sumField: 'amount',
      }),

      // Revenue by product type: vouchers
      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),

      // Revenue by product type: gift cards
      prisma.giftCardPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),

      // Revenue by product type: tickets
      prisma.ticketPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),

      // Revenue by product type: subscriptions (box subscriptions)
      prisma.boxSubscription.count({
        where: { status: 'active', createdAt: { gte: from, lte: to } },
      }),

      // Previous period voucher revenue
      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: prevFrom, lte: prevTo } },
        _sum: { amount: true },
      }),

      // Revenue by country (from analytics events with type=purchase)
      prisma.$queryRawUnsafe<Array<{ country: string; revenue: bigint }>>(
        `SELECT ae.country, COALESCE(SUM(vp.amount), 0)::bigint as revenue
         FROM "AnalyticsEvent" ae
         JOIN "VoucherPurchase" vp ON ae."userId" = vp."userId"
           AND ae.type = 'purchase'
           AND vp.status = 'paid'
         WHERE ae."createdAt" >= $1 AND ae."createdAt" <= $2
           AND ae.country IS NOT NULL
         GROUP BY ae.country
         ORDER BY revenue DESC
         LIMIT 20`,
        from,
        to
      ),

      // Average order value
      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _avg: { amount: true },
        _count: true,
      }),

      // Previous period average order value
      prisma.voucherPurchase.aggregate({
        where: { status: 'paid', createdAt: { gte: prevFrom, lte: prevTo } },
        _avg: { amount: true },
      }),

      // Refund count
      prisma.voucherPurchase.count({
        where: { status: 'refunded', createdAt: { gte: from, lte: to } },
      }),

      // Total paid count for refund rate
      prisma.voucherPurchase.count({
        where: {
          status: { in: ['paid', 'refunded'] },
          createdAt: { gte: from, lte: to },
        },
      }),

      // Top revenue generators (merchants)
      prisma.voucherPurchase.groupBy({
        by: ['merchantId'],
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
    ]);

    // Enrich top merchants
    const merchantIds = topMerchantRows.map((r) => r.merchantId);
    const merchants = merchantIds.length > 0
      ? await prisma.merchant.findMany({
          where: { id: { in: merchantIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const merchantMap = new Map(merchants.map((m) => [m.id, m]));

    const topRevenueGenerators = topMerchantRows.map((r) => ({
      merchantId: r.merchantId,
      name: merchantMap.get(r.merchantId)?.name ?? 'Unknown',
      slug: merchantMap.get(r.merchantId)?.slug ?? '',
      revenue: r._sum.amount ?? 0,
      orders: r._count,
    }));

    const revenueByCountry = revenueByCountryRows.map((r) => ({
      country: r.country,
      revenue: Number(r.revenue),
    }));

    const averageOrderValue = orderStats._avg.amount ?? 0;
    const prevAverageOrderValue = prevOrderStats._avg.amount ?? 0;
    const refundRate = totalPaidCount > 0
      ? Math.round((refundCount / totalPaidCount) * 10000) / 100
      : 0;

    return NextResponse.json({
      revenueTimeSeries,
      revenueByProductType: {
        vouchers: voucherRevenue._sum.amount ?? 0,
        giftCards: giftCardRevenue._sum.amount ?? 0,
        tickets: ticketRevenue._sum.amount ?? 0,
        subscriptions: subscriptionRevenue, // count of active subs
      },
      revenueByCountry,
      averageOrderValue: Math.round(averageOrderValue),
      averageOrderValueChange: calculateGrowthRate(
        Math.round(averageOrderValue),
        Math.round(prevAverageOrderValue)
      ),
      refundRate,
      topRevenueGenerators,
      paymentMethodDistribution: [], // placeholder — would need Stripe data
    });
  } catch (error) {
    console.error('[analytics/revenue] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
