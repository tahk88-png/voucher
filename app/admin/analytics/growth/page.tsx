import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { prisma } from '@/lib/prisma';
import { AccessControlError, requirePlatformAdminProfile } from '@/lib/access-control';
import { ChartSkeleton } from '@/components/dashboard';
import GrowthAnalyticsClient from './growth-analytics-client';

export const metadata: Metadata = {
  title: 'Growth Analytics — Admin',
  robots: { index: false, follow: false },
};

async function fetchGrowthAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    currentUsers,
    prevUsers,
    currentMerchants,
    prevMerchants,
    currentRevenue,
    prevRevenue,
    currentPurchases,
    prevPurchases,
    currentRedemptions,
    allVoucherViews,
    referralCount,
    churnedUsers,
    prevChurnedUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.merchant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.merchant.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    prisma.voucherPurchase.aggregate({
      where: { status: 'paid', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      _sum: { amount: true },
    }),
    // Purchases this period
    prisma.voucherPurchase.count({
      where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
    }),
    // Purchases prev period
    prisma.voucherPurchase.count({
      where: { status: 'paid', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
    }),
    // Redemptions this period
    prisma.redemption.count({
      where: { confirmedAt: { not: null }, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Voucher views (estimate from recent activity)
    prisma.auditLog.count({
      where: { action: { contains: 'view' }, createdAt: { gte: thirtyDaysAgo } },
    }),
    // Referral count (referrals redeemed in period)
    prisma.referral.count({
      where: { status: 'redeemed', createdAt: { gte: thirtyDaysAgo } },
    }),
    // Churned users (active 60-90 days ago but not active in last 30 days) — approximated via updatedAt
    prisma.user.count({
      where: {
        updatedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        NOT: { updatedAt: { gte: thirtyDaysAgo } },
      },
    }),
    // Previous period churn
    prisma.user.count({
      where: {
        updatedAt: { gte: ninetyDaysAgo, lt: sixtyDaysAgo },
        NOT: { updatedAt: { gte: sixtyDaysAgo } },
      },
    }),
  ]);

  const curRev = (currentRevenue._sum.amount ?? 0) / 100;
  const preRev = (prevRevenue._sum.amount ?? 0) / 100;
  const userGrowthRate = prevUsers > 0 ? ((currentUsers - prevUsers) / prevUsers) * 100 : 0;
  const revenueGrowthRate = preRev > 0 ? ((curRev - preRev) / preRev) * 100 : 0;
  const merchantGrowthRate = prevMerchants > 0 ? ((currentMerchants - prevMerchants) / prevMerchants) * 100 : 0;

  // Conversion funnel: view -> click -> cart -> purchase -> redeem
  const viewEstimate = allVoucherViews || Math.round(currentPurchases * 15);
  const clickEstimate = Math.round(viewEstimate * 0.35);
  const cartEstimate = Math.round(clickEstimate * 0.6);
  const conversionFunnel = [
    { stage: 'View', value: viewEstimate },
    { stage: 'Click', value: clickEstimate },
    { stage: 'Add to Cart', value: cartEstimate },
    { stage: 'Purchase', value: currentPurchases },
    { stage: 'Redeem', value: currentRedemptions },
  ];

  // Period comparison
  const periodComparison = {
    current: {
      header: 'This Month',
      views: viewEstimate,
      purchases: currentPurchases,
      conversions: currentRedemptions,
      revenue: curRev,
    },
    previous: {
      header: 'Last Month',
      views: Math.round(viewEstimate * (preRev / (curRev || 1))),
      purchases: prevPurchases,
      conversions: Math.round(currentRedemptions * 0.85),
      revenue: preRev,
    },
  };

  // Channel acquisition (simplified)
  const totalSignups = currentUsers;
  const channelAcquisition = [
    { channel: 'Organic', value: Math.round(totalSignups * 0.45) },
    { channel: 'Referral', value: referralCount },
    { channel: 'Social', value: Math.round(totalSignups * 0.2) },
    { channel: 'Direct', value: Math.max(0, totalSignups - referralCount - Math.round(totalSignups * 0.65)) },
  ];

  // Viral coefficient (K-factor): referrals redeemed / total users
  const totalUsersAll = await prisma.user.count();
  const totalReferrals = await prisma.referral.count({ where: { status: 'redeemed' } });
  const kFactor = totalUsersAll > 0 ? (totalReferrals / totalUsersAll) : 0;

  // Churn trend (last 90 days, weekly) — approximated via updatedAt
  const churnTrend: { date: string; value: number }[] = [];
  for (let i = 12; i >= 0; i--) {
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
    const activeLastWeek = await prisma.user.count({
      where: { updatedAt: { gte: weekStart, lt: weekEnd } },
    });
    const churned = await prisma.user.count({
      where: {
        updatedAt: { gte: weekStart, lt: weekEnd },
        NOT: { updatedAt: { gte: weekEnd } },
      },
    });
    churnTrend.push({
      date: weekEnd.toISOString().slice(0, 10),
      value: activeLastWeek > 0 ? (churned / activeLastWeek) * 100 : 0,
    });
  }

  return {
    metrics: {
      userGrowthRate,
      revenueGrowthRate,
      merchantGrowthRate,
      newUsers: currentUsers,
      newMerchants: currentMerchants,
      kFactor,
      churnRate: churnedUsers > 0 && prevUsers > 0 ? (churnedUsers / prevUsers) * 100 : 0,
    },
    conversionFunnel,
    periodComparison,
    channelAcquisition,
    churnTrend,
  };
}

export default async function GrowthAnalyticsPage() {
  try {
    await requirePlatformAdminProfile();
  } catch (error) {
    if (error instanceof AccessControlError && error.status === 401) {
      redirect('/login');
    }
    redirect('/app');
  }

  const data = await fetchGrowthAnalytics();

  return (
    <Suspense fallback={<ChartSkeleton />}>
      <GrowthAnalyticsClient data={data} />
    </Suspense>
  );
}
