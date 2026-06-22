import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { calculateGrowthRate } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now;
    const from = searchParams.get('from')
      ? new Date(searchParams.get('from')!)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const periodLength = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - periodLength);
    const prevTo = new Date(from.getTime());

    const merchantId = merchant.id;

    const [
      currentRevenue,
      prevRevenue,
      currentRedemptions,
      prevRedemptions,
      currentCustomers,
      prevCustomers,
      orderStats,
      prevOrderStats,
      revenueTimeSeriesRows,
      topVoucherRows,
      customerCountryRows,
      customerDeviceRows,
      peakHourRows,
    ] = await Promise.all([
      // Revenue
      prisma.voucherPurchase.aggregate({
        where: { merchantId, status: 'paid', createdAt: { gte: from, lte: to } },
        _sum: { amount: true },
      }),
      prisma.voucherPurchase.aggregate({
        where: { merchantId, status: 'paid', createdAt: { gte: prevFrom, lte: prevTo } },
        _sum: { amount: true },
      }),

      // Redemptions
      prisma.redemption.count({
        where: { merchantId, createdAt: { gte: from, lte: to } },
      }),
      prisma.redemption.count({
        where: { merchantId, createdAt: { gte: prevFrom, lte: prevTo } },
      }),

      // Unique customers
      prisma.voucherPurchase.groupBy({
        by: ['userId'],
        where: { merchantId, status: 'paid', createdAt: { gte: from, lte: to } },
      }).then((rows) => rows.length),
      prisma.voucherPurchase.groupBy({
        by: ['userId'],
        where: { merchantId, status: 'paid', createdAt: { gte: prevFrom, lte: prevTo } },
      }).then((rows) => rows.length),

      // AOV
      prisma.voucherPurchase.aggregate({
        where: { merchantId, status: 'paid', createdAt: { gte: from, lte: to } },
        _avg: { amount: true },
        _count: true,
      }),
      prisma.voucherPurchase.aggregate({
        where: { merchantId, status: 'paid', createdAt: { gte: prevFrom, lte: prevTo } },
        _avg: { amount: true },
      }),

      // Revenue time series
      prisma.$queryRaw<Array<{ date: Date; value: bigint }>>`
        SELECT date_trunc('day', "createdAt") as date, COALESCE(SUM("amount"), 0)::bigint as value
        FROM "VoucherPurchase"
        WHERE "merchantId" = ${merchantId} AND "status" = 'paid'
          AND "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date ASC`,

      // Top vouchers by revenue
      prisma.voucherPurchase.groupBy({
        by: ['voucherId'],
        where: { merchantId, status: 'paid', createdAt: { gte: from, lte: to }, voucherId: { not: null } },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),

      // Customer demographics: country (from analytics events)
      prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
        SELECT country, COUNT(DISTINCT "userId")::bigint as count
        FROM "AnalyticsEvent"
        WHERE "merchantId" = ${merchantId}
          AND "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND country IS NOT NULL AND "userId" IS NOT NULL
        GROUP BY country
        ORDER BY count DESC
        LIMIT 15`,

      // Customer demographics: device
      prisma.$queryRaw<Array<{ device: string; count: bigint }>>`
        SELECT device, COUNT(*)::bigint as count
        FROM "AnalyticsEvent"
        WHERE "merchantId" = ${merchantId}
          AND "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND device IS NOT NULL
        GROUP BY device
        ORDER BY count DESC`,

      // Peak hours heatmap (hour of day x day of week)
      prisma.$queryRaw<Array<{ dow: number; hour: number; count: bigint }>>`
        SELECT
          EXTRACT(DOW FROM "createdAt")::int as dow,
          EXTRACT(HOUR FROM "createdAt")::int as hour,
          COUNT(*)::bigint as count
        FROM "AnalyticsEvent"
        WHERE "merchantId" = ${merchantId}
          AND "createdAt" >= ${from} AND "createdAt" <= ${to}
        GROUP BY dow, hour
        ORDER BY dow, hour`,
    ]);

    // Enrich top vouchers with names
    const voucherIds = topVoucherRows
      .map((r) => r.voucherId)
      .filter((id): id is string => id !== null);
    const vouchers = voucherIds.length > 0
      ? await prisma.voucher.findMany({
          where: { id: { in: voucherIds } },
          select: { id: true, type: true, value: true, currency: true },
        })
      : [];
    const voucherMap = new Map(vouchers.map((v) => [v.id, v]));

    const topVouchers = topVoucherRows.map((r) => {
      const v = r.voucherId ? voucherMap.get(r.voucherId) : null;
      return {
        voucherId: r.voucherId,
        type: v?.type ?? 'unknown',
        value: v?.value ?? 0,
        currency: v?.currency ?? 'EUR',
        revenue: r._sum.amount ?? 0,
        orders: r._count,
      };
    });

    const currentRevenueTotal = currentRevenue._sum.amount ?? 0;
    const prevRevenueTotal = prevRevenue._sum.amount ?? 0;
    const currentAOV = Math.round(orderStats._avg.amount ?? 0);
    const prevAOV = Math.round(prevOrderStats._avg.amount ?? 0);

    const revenueTimeSeries = revenueTimeSeriesRows.map((r) => ({
      date: new Date(r.date).toISOString(),
      value: Number(r.value),
    }));

    const customerDemographics = {
      byCountry: customerCountryRows.map((r) => ({
        country: r.country,
        count: Number(r.count),
      })),
      byDevice: customerDeviceRows.map((r) => ({
        device: r.device,
        count: Number(r.count),
      })),
    };

    const peakHours = peakHourRows.map((r) => ({
      dayOfWeek: r.dow,
      hour: r.hour,
      count: Number(r.count),
    }));

    return NextResponse.json({
      revenue: currentRevenueTotal,
      revenueChange: calculateGrowthRate(currentRevenueTotal, prevRevenueTotal),
      redemptions: currentRedemptions,
      redemptionsChange: calculateGrowthRate(currentRedemptions, prevRedemptions),
      customers: currentCustomers,
      customersChange: calculateGrowthRate(currentCustomers, prevCustomers),
      averageOrderValue: currentAOV,
      averageOrderValueChange: calculateGrowthRate(currentAOV, prevAOV),
      revenueTimeSeries,
      topVouchers,
      customerDemographics,
      peakHours,
    });
  });
}
