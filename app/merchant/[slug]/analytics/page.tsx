import { notFound, redirect } from 'next/navigation';
import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { formatCurrency } from '@/lib/utils';
import { StatsCard } from '@/components/ui/stats-card';
import { BarChart3, DollarSign, TrendingUp, Users } from 'lucide-react';
import { AnalyticsCharts } from './analytics-charts';
import { getRedemptionTrends } from '@/lib/analytics/get-redemption-trends';
import { getVoucherPerformance } from '@/lib/analytics/get-voucher-performance';
import { getCategoryBreakdown } from '@/lib/analytics/get-category-breakdown';
import { CardSkeleton } from '@/components/ui/loading-skeletons';

export default async function AnalyticsPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { slug: params.slug },
  });

  if (!merchant) {
    notFound();
  }

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  // Get analytics data
  const [
    totalRedemptions,
    totalRevenue,
    totalCreditsIssued,
    topVouchers,
    recentRedemptions,
  ] = await Promise.all([
    prisma.redemption.count({
      where: {
        merchantId: merchant.id,
        confirmedAt: { not: null },
      },
    }),
    prisma.redemption.aggregate({
      where: {
        merchantId: merchant.id,
        confirmedAt: { not: null },
      },
      _sum: {
        discountApplied: true,
      },
    }),
    prisma.creditLedger.aggregate({
      where: { merchantId: merchant.id },
      _sum: { amount: true },
    }),
    prisma.voucher.findMany({
      where: { merchantId: merchant.id },
      include: {
        _count: {
          select: {
            redemptions: {
              where: { confirmedAt: { not: null } },
            },
          },
        },
      },
      orderBy: {
        redemptions: {
          _count: 'desc',
        },
      },
      take: 5,
    }),
    prisma.redemption.findMany({
      where: {
        merchantId: merchant.id,
        confirmedAt: { not: null },
      },
      include: {
        voucher: {
          select: { id: true, type: true },
        },
      },
      orderBy: { confirmedAt: 'desc' },
      take: 10,
    }),
  ]);

  // Get chart data
  const [redemptionTrends, voucherPerformance, categoryBreakdown] = await Promise.all([
    getRedemptionTrends(merchant.id),
    getVoucherPerformance(merchant.id),
    getCategoryBreakdown(merchant.id),
  ]);

  const totalDiscounts = totalRevenue._sum.discountApplied || 0;
  const creditsIssued = totalCreditsIssued._sum.amount || 0;

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2721]">Analytics</h1>
          <p className="text-sm text-[#6B5744]">Track your voucher performance and revenue</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Redemptions"
            value={totalRedemptions}
            description="Confirmed redemptions"
            icon={Users}
          />
          <StatsCard
            title="Total Discounts"
            value={formatCurrency(totalDiscounts, merchant.defaultCurrency)}
            description="Given to customers"
            icon={DollarSign}
          />
          <StatsCard
            title="Credits Issued"
            value={formatCurrency(creditsIssued, merchant.defaultCurrency)}
            description="Total credits distributed"
            icon={TrendingUp}
          />
          <StatsCard
            title="Active Vouchers"
            value={topVouchers.filter((v) => v._count.redemptions > 0).length}
            description="With redemptions"
            icon={BarChart3}
          />
        </div>

        {/* Charts */}
        <Suspense fallback={<CardSkeleton />}>
          <AnalyticsCharts
            redemptionTrends={redemptionTrends}
            voucherPerformance={voucherPerformance}
            categoryBreakdown={categoryBreakdown}
          />
        </Suspense>
      </div>
    </div>
  );
}
