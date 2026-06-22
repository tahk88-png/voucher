import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import { ChartSkeleton } from '@/components/dashboard';
import UserAnalyticsClient from './user-analytics-client';

export const metadata: Metadata = {
  title: 'User Analytics — Admin',
  robots: { index: false, follow: false },
};

async function fetchUserAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    dau,
    wau,
    mau,
    newUsersRaw,
    topUsersByPurchases,
    usersByCountry,
    verifiedUsers,
    usersWithPurchases,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { updatedAt: { gte: oneDayAgo } } }),
    prisma.user.count({ where: { updatedAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { updatedAt: { gte: thirtyDaysAgo } } }),
    // New users per day (last 30 days)
    prisma.user.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    // Top users by activity (purchases)
    prisma.voucherPurchase.groupBy({
      by: ['userId'],
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      _sum: { amount: true },
      orderBy: { _count: { userId: 'desc' } },
      take: 20,
    }),
    // Demographics by language (as geographic proxy)
    prisma.user.groupBy({
      by: ['preferredLanguage'],
      _count: true,
      orderBy: { _count: { preferredLanguage: 'desc' } },
      take: 15,
    }),
    // Verified users count
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    // Users who made at least one purchase
    prisma.voucherPurchase.groupBy({
      by: ['userId'],
      where: { status: 'paid' },
      _count: true,
    }),
  ]);

  // Build daily new users bar chart data
  const dailyNewUsers = new Map<string, number>();
  for (const u of newUsersRaw) {
    const day = u.createdAt.toISOString().slice(0, 10);
    dailyNewUsers.set(day, (dailyNewUsers.get(day) ?? 0) + 1);
  }
  const newUsersOverTime: { date: string; value: number }[] = [];
  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    newUsersOverTime.push({ date: key, value: dailyNewUsers.get(key) ?? 0 });
  }

  // Build signup funnel
  const registeredCount = totalUsers;
  const visitedEstimate = Math.round(totalUsers * 3.2); // Estimate
  const signupFunnel = [
    { stage: 'Visited', value: visitedEstimate },
    { stage: 'Registered', value: registeredCount },
    { stage: 'Verified', value: verifiedUsers },
    { stage: 'First Purchase', value: usersWithPurchases.length },
  ];

  // Build retention cohort data (last 6 months)
  const cohorts: { cohort: string; size: number; retention: number[] }[] = [];
  for (let i = 5; i >= 0; i--) {
    const cohortStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const cohortEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const cohortUsers = await prisma.user.count({
      where: { createdAt: { gte: cohortStart, lt: cohortEnd } },
    });

    const retention: number[] = [1.0]; // Month 0 = 100%
    for (let m = 1; m <= i; m++) {
      const checkStart = new Date(now.getFullYear(), now.getMonth() - i + m, 1);
      const checkEnd = new Date(now.getFullYear(), now.getMonth() - i + m + 1, 1);
      const activeInMonth = await prisma.user.count({
        where: {
          createdAt: { gte: cohortStart, lt: cohortEnd },
          updatedAt: { gte: checkStart, lt: checkEnd },
        },
      });
      retention.push(cohortUsers > 0 ? activeInMonth / cohortUsers : 0);
    }

    cohorts.push({
      cohort: cohortStart.toISOString().slice(0, 7),
      size: cohortUsers,
      retention,
    });
  }

  // Build active users by hour heatmap (day of week x hour)
  // Simplified: generate from last 7 days of activity
  const activityHeatmap: { day: number; hour: number; value: number }[] = [];
  const recentActive = await prisma.user.findMany({
    where: { updatedAt: { gte: sevenDaysAgo } },
    select: { updatedAt: true },
  });
  const heatmapMap = new Map<string, number>();
  for (const u of recentActive) {
    if (!u.updatedAt) continue;
    const day = u.updatedAt.getDay();
    const hour = u.updatedAt.getHours();
    const key = `${day}-${hour}`;
    heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
  }
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      activityHeatmap.push({
        day,
        hour,
        value: heatmapMap.get(`${day}-${hour}`) ?? 0,
      });
    }
  }

  // Resolve top user names
  const buyerIds = topUsersByPurchases.map((u) => u.userId);
  const buyers = await prisma.user.findMany({
    where: { id: { in: buyerIds } },
    select: { id: true, name: true, email: true },
  });
  const buyerMap = new Map(buyers.map((b) => [b.id, b]));

  const topUsers = topUsersByPurchases.map((u) => ({
    id: u.userId,
    name: buyerMap.get(u.userId)?.name ?? buyerMap.get(u.userId)?.email ?? 'Unknown',
    purchases: u._count,
    totalSpent: (u._sum?.amount ?? 0) / 100,
  }));

  const demographics = usersByCountry
    .filter((u) => u.preferredLanguage)
    .map((u) => ({
      header: (u.preferredLanguage ?? 'unknown').toUpperCase(),
      value: u._count,
    }));

  return {
    dauWauMau: { dau, wau, mau },
    newUsersOverTime,
    signupFunnel,
    cohorts,
    activityHeatmap,
    topUsers,
    demographics,
  };
}

export default async function UserAnalyticsPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const data = await fetchUserAnalytics();

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <UserAnalyticsClient data={data} />
    </Suspense>
  );
}
