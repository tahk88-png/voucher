import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

type ComparisonPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
type Metric = 'revenue' | 'redemptions' | 'purchases' | 'referrals' | 'customers';

function getPeriodMs(period: ComparisonPeriod): number {
  switch (period) {
    case 'day': return 24 * 60 * 60 * 1000;
    case 'week': return 7 * 24 * 60 * 60 * 1000;
    case 'month': return 30 * 24 * 60 * 60 * 1000;
    case 'quarter': return 90 * 24 * 60 * 60 * 1000;
    case 'year': return 365 * 24 * 60 * 60 * 1000;
  }
}

/**
 * GET /api/merchant/[slug]/analytics/compare?metric=revenue&period=month
 *
 * Returns current vs previous period comparison with change% and daily trend
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const { searchParams } = new URL(req.url);
    const metric = (searchParams.get('metric') ?? 'revenue') as Metric;
    const period = (searchParams.get('period') ?? 'month') as ComparisonPeriod;

    const periodMs = getPeriodMs(period);
    const now = new Date();
    const currentStart = new Date(now.getTime() - periodMs);
    const previousStart = new Date(currentStart.getTime() - periodMs);

    let current: number = 0;
    let previous: number = 0;
    let sparklineData: Array<{ date: string; value: number }> = [];

    switch (metric) {
      case 'revenue': {
        const [curAgg, prevAgg, dailyPurchases] = await Promise.all([
          prisma.voucherPurchase.aggregate({
            where: { merchantId: merchant.id, status: 'paid', createdAt: { gte: currentStart, lte: now } },
            _sum: { amount: true },
          }),
          prisma.voucherPurchase.aggregate({
            where: { merchantId: merchant.id, status: 'paid', createdAt: { gte: previousStart, lt: currentStart } },
            _sum: { amount: true },
          }),
          prisma.voucherPurchase.findMany({
            where: { merchantId: merchant.id, status: 'paid', createdAt: { gte: currentStart } },
            select: { amount: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
          }),
        ]);

        current = (curAgg._sum.amount ?? 0) / 100;
        previous = (prevAgg._sum.amount ?? 0) / 100;
        sparklineData = buildDailySparkline(dailyPurchases, 'amount', currentStart, now);
        break;
      }

      case 'redemptions': {
        const [curCount, prevCount, dailyRedemptions] = await Promise.all([
          prisma.redemption.count({
            where: { merchantId: merchant.id, confirmedAt: { not: null, gte: currentStart, lte: now } },
          }),
          prisma.redemption.count({
            where: { merchantId: merchant.id, confirmedAt: { not: null, gte: previousStart, lt: currentStart } },
          }),
          prisma.redemption.findMany({
            where: { merchantId: merchant.id, confirmedAt: { not: null, gte: currentStart } },
            select: { confirmedAt: true },
            orderBy: { confirmedAt: 'asc' },
          }),
        ]);

        current = curCount;
        previous = prevCount;
        sparklineData = buildDailyCount(
          dailyRedemptions.map((r) => r.confirmedAt!),
          currentStart,
          now
        );
        break;
      }

      case 'purchases': {
        const [curCount, prevCount] = await Promise.all([
          prisma.voucherPurchase.count({
            where: { merchantId: merchant.id, createdAt: { gte: currentStart, lte: now } },
          }),
          prisma.voucherPurchase.count({
            where: { merchantId: merchant.id, createdAt: { gte: previousStart, lt: currentStart } },
          }),
        ]);

        current = curCount;
        previous = prevCount;
        break;
      }

      case 'referrals': {
        const [curCount, prevCount] = await Promise.all([
          prisma.referral.count({
            where: { merchantId: merchant.id, createdAt: { gte: currentStart, lte: now } },
          }),
          prisma.referral.count({
            where: { merchantId: merchant.id, createdAt: { gte: previousStart, lt: currentStart } },
          }),
        ]);

        current = curCount;
        previous = prevCount;
        break;
      }

      case 'customers': {
        const [curCustomers, prevCustomers] = await Promise.all([
          prisma.voucherPurchase.findMany({
            where: { merchantId: merchant.id, status: 'paid', createdAt: { gte: currentStart, lte: now } },
            select: { userId: true },
            distinct: ['userId'],
          }),
          prisma.voucherPurchase.findMany({
            where: { merchantId: merchant.id, status: 'paid', createdAt: { gte: previousStart, lt: currentStart } },
            select: { userId: true },
            distinct: ['userId'],
          }),
        ]);

        current = curCustomers.length;
        previous = prevCustomers.length;
        break;
      }
    }

    const changePercent = previous > 0
      ? Math.round(((current - previous) / previous) * 1000) / 10
      : current > 0 ? 100 : 0;

    const trend: 'up' | 'down' | 'flat' = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';

    return NextResponse.json({
      metric,
      period,
      current,
      previous,
      changePercent,
      trend,
      sparkline: sparklineData,
    });
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDailySparkline(
  items: Array<{ amount: number; createdAt: Date }>,
  _field: string,
  from: Date,
  to: Date
): Array<{ date: string; value: number }> {
  const map = new Map<string, number>();
  const d = new Date(from);
  while (d <= to) {
    map.set(d.toISOString().split('T')[0], 0);
    d.setDate(d.getDate() + 1);
  }

  for (const item of items) {
    const key = item.createdAt.toISOString().split('T')[0];
    map.set(key, (map.get(key) ?? 0) + item.amount / 100);
  }

  return [...map.entries()].map(([date, value]) => ({ date, value }));
}

function buildDailyCount(
  dates: Date[],
  from: Date,
  to: Date
): Array<{ date: string; value: number }> {
  const map = new Map<string, number>();
  const d = new Date(from);
  while (d <= to) {
    map.set(d.toISOString().split('T')[0], 0);
    d.setDate(d.getDate() + 1);
  }

  for (const date of dates) {
    const key = date.toISOString().split('T')[0];
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  return [...map.entries()].map(([date, value]) => ({ date, value }));
}
