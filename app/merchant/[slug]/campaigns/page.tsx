import { pageMetadata } from '@/lib/seo/page-metadata';
export const metadata = pageMetadata({ title: 'Campaigns', noIndex: true });

import { notFound, redirect } from 'next/navigation';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { getMerchantBillingStatus } from '@/lib/billing';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { formatCurrency } from '@/lib/utils';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import { Megaphone, TrendingUp, Ticket, DollarSign } from 'lucide-react';
import { StartSubscriptionButton } from '@/components/billing-actions';
import { StatsCard } from '@/components/ui/stats-card';
import { AreaChart } from '@/components/ui/charts';
import CampaignsListClient from './campaigns-list-client';

export default async function CampaignsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  // Resolve effective role for UI gating
  const memberRecord = await prisma.merchantMember.findFirst({
    where: { merchantId: merchant.id, userId: session.user.id },
    select: { role: true },
  });
  const isAdmin = memberRecord?.role === 'merchant_admin';

  const t = await getTranslations('nav');
  const billing = await getMerchantBillingStatus(merchant.id);

  const campaigns = await prisma.campaign.findMany({
    where: { merchantId: merchant.id },
    include: {
      _count: {
        select: {
          vouchers: true,
          purchases: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const paidPurchases = await prisma.voucherPurchase.groupBy({
    by: ['campaignId'],
    where: {
      merchantId: merchant.id,
      status: 'paid',
      campaignId: { not: null },
    },
    _count: { _all: true },
    _sum: { amount: true },
  });

  const purchaseByCampaignId = new Map(
    paidPurchases
      .filter((purchase) => purchase.campaignId)
      .map((purchase) => [
        purchase.campaignId as string,
        {
          count: purchase._count._all,
          revenue: purchase._sum.amount ?? 0,
        },
      ])
  );

  const serializedCampaigns = campaigns.map((campaign) => {
    const purchaseSummary = purchaseByCampaignId.get(campaign.id);
    return {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      startDate: campaign.startDate.toISOString(),
      endDate: campaign.endDate.toISOString(),
      price: campaign.price,
      vouchers: campaign._count.vouchers,
      purchases: campaign._count.purchases,
      paidPurchases: purchaseSummary?.count ?? 0,
      revenue: purchaseSummary?.revenue ?? 0,
    };
  });

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;
  const totalRevenue = Array.from(purchaseByCampaignId.values()).reduce(
    (sum, item) => sum + item.revenue,
    0
  );
  const totalPaidPurchases = Array.from(purchaseByCampaignId.values()).reduce(
    (sum, item) => sum + item.count,
    0
  );

  const now = new Date();
  const rangeStart = startOfDay(subDays(now, 6));
  const rangeEnd = startOfDay(now);
  const weeklyPurchases = await prisma.voucherPurchase.findMany({
    where: {
      merchantId: merchant.id,
      status: 'paid',
      createdAt: { gte: rangeStart },
    },
    select: { createdAt: true, amount: true },
  });

  const dayBuckets = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const dayIndex = new Map(dayBuckets.map((day, index) => [format(day, 'yyyy-MM-dd'), index]));
  const chartData = dayBuckets.map((day) => ({
    date: format(day, 'EEE'),
    revenue: 0,
  }));

  for (const purchase of weeklyPurchases) {
    const key = format(startOfDay(purchase.createdAt), 'yyyy-MM-dd');
    const index = dayIndex.get(key);
    if (index !== undefined) {
      chartData[index].revenue += purchase.amount / 100;
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('campaigns') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text)]">{t('campaigns')}</h1>
            <p className="text-sm text-[var(--text-muted)]">Manage your voucher campaigns.</p>
          </div>
          {isAdmin && (billing.active || billing.inTrial) ? (
            <WarmButton asChild>
              <Link href={`/merchant/${slug}/campaigns/new`}>Create campaign</Link>
            </WarmButton>
          ) : isAdmin ? (
            <StartSubscriptionButton slug={slug} />
          ) : null}
        </div>

        {!billing.active && !billing.inTrial ? (
          <WarmCard padding="lg" className="bg-[var(--bg)] border border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--text)]">Subscription required</p>
                <p className="text-sm text-[var(--text-muted)]">
                  Your free 60-day campaign trial has ended. Start the 9.90/month plan to create new
                  campaigns.
                </p>
              </div>
              <StartSubscriptionButton slug={slug} />
            </div>
          </WarmCard>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total campaigns"
            value={totalCampaigns}
            description="All campaigns"
            icon={Megaphone}
          />
          <StatsCard
            title="Active"
            value={activeCampaigns}
            description="Currently running"
            icon={TrendingUp}
          />
          <StatsCard
            title="Paid purchases"
            value={totalPaidPurchases}
            description="Completed orders"
            icon={Ticket}
          />
          <StatsCard
            title="Revenue"
            value={formatCurrency(totalRevenue, merchant.defaultCurrency)}
            description="Paid voucher sales"
            icon={DollarSign}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CampaignsListClient
              campaigns={serializedCampaigns}
              merchantSlug={slug}
              currency={merchant.defaultCurrency}
              canCreate={billing.active || billing.inTrial}
            />
          </div>

          <div className="space-y-6">
            <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">Weekly revenue</h2>
                  <p className="text-sm text-[var(--text-muted)]">Paid campaign sales over 7 days.</p>
                </div>
                <span className="text-xs uppercase tracking-wide text-[var(--text-faint)]">{merchant.defaultCurrency}</span>
              </div>
              <AreaChart
                data={chartData}
                areas={[{ dataKey: 'revenue', name: 'Revenue', color: '#9DB5A5' }]}
                xAxisKey="date"
                height={240}
                showLegend={false}
              />
            </WarmCard>
          </div>
        </div>
      </div>
    </div>
  );
}
