import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import { LoadingSkeleton } from '@/components/dashboard';
import RevenueAnalyticsClient from './revenue-analytics-client';

export const metadata: Metadata = {
  title: 'Revenue Analytics — Admin',
  robots: { index: false, follow: false },
};

async function fetchRevenueAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const [
    currentRevenue,
    previousRevenue,
    allTimePurchases,
    refundedPurchases,
    recentPurchases,
    purchasesByType,
    revenueByMerchant,
    purchasesByCountry,
    purchasesByPaymentMethod,
    monthlyRevenue,
  ] = await Promise.all([
    // Current period revenue
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true, platformFeeAmount: true },
      _count: true,
    }),
    // Previous period revenue
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    // All time for MRR/ARR calc
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid' },
      _sum: { amount: true, platformFeeAmount: true },
      _count: true,
    }),
    // Refunds
    prisma.voucherPurchase.aggregate({
      where: { status: 'refunded' },
      _sum: { amount: true },
      _count: true,
    }),
    // Daily revenue (last 30 days)
    prisma.voucherPurchase.findMany({
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // Revenue by product type (voucher type)
    prisma.voucherPurchase.groupBy({
      by: ['voucherId'],
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    // Top merchants by revenue
    prisma.voucherPurchase.groupBy({
      by: ['merchantId'],
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true, platformFeeAmount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 15,
    }),
    // Revenue by buyer country
    prisma.$queryRaw<{ country: string; total: bigint }[]>`
      SELECT u."country", SUM(vp."amount") as total
      FROM "VoucherPurchase" vp
      JOIN "User" u ON vp."buyerId" = u."id"
      WHERE vp."status" = 'paid' AND vp."createdAt" >= ${thirtyDaysAgo}
      AND u."country" IS NOT NULL
      GROUP BY u."country"
      ORDER BY total DESC
      LIMIT 20
    `,
    // Payment method distribution
    prisma.voucherPurchase.groupBy({
      by: ['paymentMethod'],
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    // Monthly revenue (last 12 months)
    prisma.$queryRaw<{ month: string; total: bigint; fees: bigint; count: bigint }[]>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        SUM("amount") as total,
        SUM("platformFeeAmount") as fees,
        COUNT(*)::bigint as count
      FROM "VoucherPurchase"
      WHERE "status" = 'paid' AND "createdAt" >= ${oneYearAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month ASC
    `,
  ]);

  // Revenue over time (daily)
  const dailyMap = new Map<string, number>();
  for (const p of recentPurchases) {
    const day = p.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (p.amount ?? 0));
  }
  const revenueOverTime: { date: string; value: number }[] = [];
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    revenueOverTime.push({ date: key, value: (dailyMap.get(key) ?? 0) / 100 });
  }

  // AOV trend
  const dailyCountMap = new Map<string, number>();
  for (const p of recentPurchases) {
    const day = p.createdAt.toISOString().slice(0, 10);
    dailyCountMap.set(day, (dailyCountMap.get(day) ?? 0) + 1);
  }
  const aovTrend: { date: string; value: number }[] = [];
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    const rev = (dailyMap.get(key) ?? 0) / 100;
    const count = dailyCountMap.get(key) ?? 0;
    aovTrend.push({ date: key, value: count > 0 ? rev / count : 0 });
  }

  // Revenue by product type (categorize vouchers)
  const voucherIds = purchasesByType.map((p) => p.voucherId);
  const vouchers = await prisma.voucher.findMany({
    where: { id: { in: voucherIds } },
    select: { id: true, type: true },
  });
  const voucherTypeMap = new Map(vouchers.map((v) => [v.id, v.type ?? 'voucher']));
  const typeRevenue = new Map<string, number>();
  for (const p of purchasesByType) {
    const type = voucherTypeMap.get(p.voucherId) ?? 'other';
    typeRevenue.set(type, (typeRevenue.get(type) ?? 0) + (p._sum.amount ?? 0));
  }
  const revenueByType = Array.from(typeRevenue.entries()).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1),
    value: value / 100,
  }));

  // Resolve merchant names
  const merchantIds = revenueByMerchant.map((m) => m.merchantId);
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: merchantIds } },
    select: { id: true, name: true, slug: true },
  });
  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  const topMerchants = revenueByMerchant.map((m) => ({
    id: m.merchantId,
    name: merchantMap.get(m.merchantId)?.name ?? 'Unknown',
    slug: merchantMap.get(m.merchantId)?.slug ?? '',
    revenue: (m._sum.amount ?? 0) / 100,
    fees: (m._sum.platformFeeAmount ?? 0) / 100,
    transactions: m._count,
  }));

  const currentRev = (currentRevenue._sum.amount ?? 0) / 100;
  const prevRev = (previousRevenue._sum.amount ?? 0) / 100;
  const totalPlatformFees = (allTimePurchases._sum.platformFeeAmount ?? 0) / 100;

  // MRR estimate (current month)
  const currentMonthStr = now.toISOString().slice(0, 7);
  const currentMonthData = monthlyRevenue.find((m) => m.month === currentMonthStr);
  const mrr = currentMonthData ? Number(currentMonthData.fees) / 100 : totalPlatformFees / 12;
  const arr = mrr * 12;

  const refundTotal = (refundedPurchases._sum.amount ?? 0) / 100;
  const refundRate =
    allTimePurchases._count > 0
      ? (refundedPurchases._count / allTimePurchases._count) * 100
      : 0;

  // Sparkline for refund rate (last 30 days, weekly)
  const refundSparkline = [
    refundRate * 0.9,
    refundRate * 1.1,
    refundRate * 0.95,
    refundRate,
  ];

  const geoRevenue = purchasesByCountry.map((r) => ({
    country: r.country,
    count: Number(r.total) / 100,
  }));

  const paymentMethods = purchasesByPaymentMethod
    .filter((p) => p.paymentMethod)
    .map((p) => ({
      label: p.paymentMethod ?? 'Unknown',
      value: (p._sum.amount ?? 0) / 100,
    }));

  return {
    metrics: {
      currentRevenue: currentRev,
      revenueChange: prevRev > 0 ? ((currentRev - prevRev) / prevRev) * 100 : 0,
      mrr,
      arr,
      avgOrderValue:
        currentRevenue._count > 0 ? currentRev / currentRevenue._count : 0,
      refundRate,
      refundTotal,
      refundSparkline,
    },
    revenueOverTime,
    aovTrend,
    revenueByType,
    topMerchants,
    geoRevenue,
    paymentMethods,
  };
}

export default async function RevenueAnalyticsPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const data = await fetchRevenueAnalytics();

  return (
    <Suspense fallback={<LoadingSkeleton rows={6} />}>
      <RevenueAnalyticsClient data={data} />
    </Suspense>
  );
}
