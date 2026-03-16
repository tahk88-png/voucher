import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import { LoadingSkeleton } from '@/components/dashboard';
import AnalyticsOverviewClient from './analytics-overview-client';

export const metadata: Metadata = {
  title: 'Analytics Overview — Admin',
  robots: { index: false, follow: false },
};

async function fetchOverviewData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalRevenue,
    prevPeriodRevenue,
    totalUsers,
    prevPeriodUsers,
    totalRedemptions,
    prevPeriodRedemptions,
    recentPurchases,
    topMerchants,
    recentActivity,
    usersByCountry,
  ] = await Promise.all([
    // Total revenue (last 30 days)
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    // Previous 30 days revenue
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
    }),
    // Active users (last 30 days)
    prisma.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
    // Previous period users
    prisma.user.count({ where: { lastActiveAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    // Conversions (last 30 days)
    prisma.redemption.count({
      where: { confirmedAt: { not: null }, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Previous period conversions
    prisma.redemption.count({
      where: { confirmedAt: { not: null }, createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    // Recent purchases for revenue trend
    prisma.voucherPurchase.findMany({
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // Top merchants by revenue
    prisma.voucherPurchase.groupBy({
      by: ['merchantId'],
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    }),
    // Recent audit logs for activity feed
    prisma.auditLog.findMany({
      take: 20,
      include: {
        actor: { select: { email: true, name: true } },
        merchant: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Users by country
    prisma.user.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 20,
    }),
  ]);

  // Build daily revenue trend
  const revenueTrend: { date: string; value: number }[] = [];
  const dailyMap = new Map<string, number>();
  for (const p of recentPurchases) {
    const day = p.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + (p.amount ?? 0));
  }
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    revenueTrend.push({ date: key, value: (dailyMap.get(key) ?? 0) / 100 });
  }

  // Build user growth (new users per day)
  const newUsersByDay = await prisma.user.groupBy({
    by: ['createdAt'],
    where: { createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });
  const userGrowthMap = new Map<string, number>();
  for (const u of newUsersByDay) {
    const day = u.createdAt.toISOString().slice(0, 10);
    userGrowthMap.set(day, (userGrowthMap.get(day) ?? 0) + u._count);
  }
  const userGrowth: { date: string; value: number }[] = [];
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    userGrowth.push({ date: key, value: userGrowthMap.get(key) ?? 0 });
  }

  // Resolve merchant names for top merchants
  const merchantIds = topMerchants.map((m) => m.merchantId);
  const merchants = await prisma.merchant.findMany({
    where: { id: { in: merchantIds } },
    select: { id: true, name: true, slug: true },
  });
  const merchantMap = new Map(merchants.map((m) => [m.id, m]));

  const topMerchantsData = topMerchants.map((m) => ({
    id: m.merchantId,
    name: merchantMap.get(m.merchantId)?.name ?? 'Unknown',
    slug: merchantMap.get(m.merchantId)?.slug ?? '',
    revenue: (m._sum.amount ?? 0) / 100,
    transactions: m._count,
  }));

  const currentRevenue = (totalRevenue._sum.amount ?? 0) / 100;
  const previousRevenue = (prevPeriodRevenue._sum.amount ?? 0) / 100;
  const avgOrderValue =
    totalRevenue._count > 0 ? currentRevenue / totalRevenue._count : 0;
  const prevAvgOrder =
    prevPeriodRevenue._count > 0 ? previousRevenue / prevPeriodRevenue._count : 0;

  const activityFeed = recentActivity.map((log) => ({
    id: log.id,
    action: log.action,
    actorName: log.actor?.name ?? log.actor?.email ?? 'System',
    merchantName: log.merchant?.name ?? null,
    createdAt: log.createdAt.toISOString(),
  }));

  const geoData = usersByCountry
    .filter((u) => u.country)
    .map((u) => ({
      country: u.country!,
      count: u._count,
    }));

  return {
    metrics: {
      totalRevenue: currentRevenue,
      revenueChange: previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0,
      activeUsers: totalUsers,
      usersChange: prevPeriodUsers > 0
        ? ((totalUsers - prevPeriodUsers) / prevPeriodUsers) * 100
        : 0,
      conversions: totalRedemptions,
      conversionsChange: prevPeriodRedemptions > 0
        ? ((totalRedemptions - prevPeriodRedemptions) / prevPeriodRedemptions) * 100
        : 0,
      avgOrderValue,
      aovChange: prevAvgOrder > 0
        ? ((avgOrderValue - prevAvgOrder) / prevAvgOrder) * 100
        : 0,
    },
    revenueTrend,
    userGrowth,
    topMerchants: topMerchantsData,
    activityFeed,
    geoData,
  };
}

export default async function AnalyticsOverviewPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const data = await fetchOverviewData();

  return (
    <Suspense fallback={<LoadingSkeleton rows={6} />}>
      <AnalyticsOverviewClient data={data} />
    </Suspense>
  );
}
