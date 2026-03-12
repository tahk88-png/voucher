import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { addDays, eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { AreaChart } from '@/components/ui/charts/area-chart';
import { formatCurrency, safeParseJson } from '@/lib/utils';
import { Calendar, CheckCircle2, Sparkles, Ticket } from 'lucide-react';
import { DashboardStats } from './dashboard-stats';
import { RevenueStats } from './revenue-stats';
import { RecentActivity } from './recent-activity';
import { LiveStats } from './live-stats';

type ActionItem = {
  label: string;
  detail: string;
  href: string;
  tone: 'urgent' | 'warning' | 'info';
};

type DashboardRange = '7d' | '30d';

const rangeOptions: { value: DashboardRange; label: string; days: number }[] = [
  { value: '7d', label: '7D', days: 7 },
  { value: '30d', label: '30D', days: 30 },
];

function resolveDashboardRange(rawRange: string | undefined): { value: DashboardRange; label: string; days: number } {
  return rangeOptions.find((option) => option.value === rawRange) ?? rangeOptions[0];
}

export default async function MerchantDashboardPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { range?: string | string[] };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug: params.slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const rawRange = Array.isArray(searchParams?.range) ? searchParams?.range[0] : searchParams?.range;
  const selectedRange = resolveDashboardRange(rawRange);
  const now = new Date();
  const rangeStart = startOfDay(subDays(now, selectedRange.days - 1));
  const rangeEnd = startOfDay(now);

  const [
    pendingRedemptions,
    expiringVouchers,
    endingCampaigns,
    upcomingEvents,
    topVouchers,
    weeklyRedemptions,
    weeklyVoucherPurchases,
    weeklyTicketPurchases,
  ] = await Promise.all([
    prisma.redemption.count({
      where: { merchantId: merchant.id, confirmedAt: null },
    }),
    prisma.voucher.count({
      where: {
        merchantId: merchant.id,
        status: 'published',
        validTo: {
          gte: now,
          lte: addDays(now, 7),
        },
      },
    }),
    prisma.campaign.count({
      where: {
        merchantId: merchant.id,
        status: 'active',
        endDate: {
          gte: now,
          lte: addDays(now, 7),
        },
      },
    }),
    prisma.event.findMany({
      where: {
        merchantId: merchant.id,
        status: { in: ['published', 'sold_out'] },
        eventDate: { gte: now },
      },
      orderBy: { eventDate: 'asc' },
      take: 3,
    }),
    prisma.voucher.findMany({
      where: { merchantId: merchant.id },
      include: { _count: { select: { redemptions: true } } },
      orderBy: { redemptions: { _count: 'desc' } },
      take: 3,
    }),
    prisma.redemption.findMany({
      where: {
        merchantId: merchant.id,
        createdAt: { gte: rangeStart },
      },
      select: { createdAt: true },
    }),
    prisma.voucherPurchase.findMany({
      where: {
        merchantId: merchant.id,
        status: 'paid',
        createdAt: { gte: rangeStart },
      },
      select: { createdAt: true, amount: true },
    }),
    prisma.ticketPurchase.findMany({
      where: {
        merchantId: merchant.id,
        status: 'paid',
        createdAt: { gte: rangeStart },
      },
      select: { createdAt: true, amount: true },
    }),
  ]);

  const dayBuckets = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const dayIndex = new Map(dayBuckets.map((day, index) => [format(day, 'yyyy-MM-dd'), index]));
  const activityData = dayBuckets.map((day) => ({
    date: format(day, 'EEE'),
    redemptions: 0,
    revenue: 0,
  }));

  for (const redemption of weeklyRedemptions) {
    const key = format(startOfDay(redemption.createdAt), 'yyyy-MM-dd');
    const index = dayIndex.get(key);
    if (index !== undefined) {
      activityData[index].redemptions += 1;
    }
  }

  for (const purchase of weeklyVoucherPurchases) {
    const key = format(startOfDay(purchase.createdAt), 'yyyy-MM-dd');
    const index = dayIndex.get(key);
    if (index !== undefined) {
      activityData[index].revenue += purchase.amount / 100;
    }
  }

  for (const purchase of weeklyTicketPurchases) {
    const key = format(startOfDay(purchase.createdAt), 'yyyy-MM-dd');
    const index = dayIndex.get(key);
    if (index !== undefined) {
      activityData[index].revenue += purchase.amount / 100;
    }
  }

  const weeklyRevenueMinor =
    weeklyVoucherPurchases.reduce((sum, purchase) => sum + purchase.amount, 0) +
    weeklyTicketPurchases.reduce((sum, purchase) => sum + purchase.amount, 0);
  const paidOrderCount = weeklyVoucherPurchases.length + weeklyTicketPurchases.length;
  const averageOrderValueMinor = paidOrderCount > 0 ? Math.round(weeklyRevenueMinor / paidOrderCount) : 0;
  const redemptionRatePct = paidOrderCount > 0 ? (weeklyRedemptions.length / paidOrderCount) * 100 : 0;

  const actionItems: ActionItem[] = [
    pendingRedemptions > 0
      ? {
          label: `${pendingRedemptions} pending redemptions`,
          detail: 'Confirm in-store redemptions',
          href: `/merchant/${params.slug}/redemptions`,
          tone: 'urgent',
        }
      : null,
    expiringVouchers > 0
      ? {
          label: `${expiringVouchers} vouchers expiring soon`,
          detail: 'Review voucher validity dates',
          href: `/merchant/${params.slug}/vouchers`,
          tone: 'warning',
        }
      : null,
    endingCampaigns > 0
      ? {
          label: `${endingCampaigns} campaigns ending this week`,
          detail: 'Extend or duplicate your best campaigns',
          href: `/merchant/${params.slug}/campaigns`,
          tone: 'warning',
        }
      : null,
    upcomingEvents.length > 0
      ? {
          label: `${upcomingEvents.length} upcoming events`,
          detail: 'Prepare ticket check-ins and staffing',
          href: `/merchant/${params.slug}/events`,
          tone: 'info',
        }
      : null,
  ].filter(Boolean) as ActionItem[];

  const toneStyles: Record<ActionItem['tone'], string> = {
    urgent: 'bg-[#E17B5C]',
    warning: 'bg-[#FFC857]',
    info: 'bg-[#9DB5A5]',
  };

  const topVoucherMax = topVouchers.reduce((max, voucher) => {
    return Math.max(max, voucher._count.redemptions);
  }, 0);

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[#2D2721]">Merchant Dashboard</h1>
            <p className="text-sm text-[#6B5744]">Welcome back, {merchant.name}</p>
            <div className="mt-2">
              <LiveStats
                slug={params.slug}
                initialToday={weeklyRedemptions.filter(r =>
                  new Date(r.createdAt) >= startOfDay(now)
                ).length}
                initialPending={pendingRedemptions}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <WarmButton asChild variant="outline">
              <Link href={`/merchant/${params.slug}/campaigns`}>View campaigns</Link>
            </WarmButton>
            <WarmButton asChild>
              <Link href={`/merchant/${params.slug}/vouchers/new`}>Create voucher</Link>
            </WarmButton>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#2D2721]">Performance overview</h2>
            <p className="text-sm text-[#6B5744]">Live campaign activity and redemptions.</p>
          </div>
          <DashboardStats merchantId={merchant.id} merchantSlug={params.slug} />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[#2D2721]">Revenue and credits</h2>
            <p className="text-sm text-[#6B5744]">Sales, credits, and outstanding liability.</p>
          </div>
          <RevenueStats merchantId={merchant.id} merchantSlug={params.slug} currency={merchant.defaultCurrency} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#2D2721]">Performance trend</h2>
                  <p className="text-sm text-[#6B5744]">
                    Last {selectedRange.days} days of redemption and revenue activity.
                  </p>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="flex items-center gap-2">
                    {rangeOptions.map((option) => {
                      const isActive = option.value === selectedRange.value;
                      return (
                        <Link
                          key={option.value}
                          href={`/merchant/${params.slug}/dashboard?range=${option.value}`}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            isActive
                              ? 'bg-[#2D2721] text-white'
                              : 'bg-[#FFF9ED] text-[#6B5744] hover:bg-[#FFECC6]'
                          }`}
                        >
                          {option.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-wide text-[#8B7355]">Revenue</p>
                    <p className="text-lg font-semibold text-[#2D2721]">
                      {formatCurrency(weeklyRevenueMinor, merchant.defaultCurrency)}
                    </p>
                  </div>
                </div>
              </div>
              <AreaChart
                data={activityData}
                areas={[
                  { dataKey: 'redemptions', name: 'Redemptions', color: '#FFC857' },
                  { dataKey: 'revenue', name: 'Revenue', color: '#9DB5A5' },
                ]}
                xAxisKey="date"
                height={260}
                showLegend
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[rgba(139,115,85,0.15)] bg-[#FFFDF8] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#8B7355]">Paid orders</p>
                  <p className="text-lg font-semibold text-[#2D2721]">{paidOrderCount}</p>
                  <Link href={`/merchant/${params.slug}/campaigns`} className="mt-2 inline-flex text-xs font-semibold text-[#E17B5C]">
                    Open orders view
                  </Link>
                </div>
                <div className="rounded-2xl border border-[rgba(139,115,85,0.15)] bg-[#FFFDF8] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#8B7355]">Avg order</p>
                  <p className="text-lg font-semibold text-[#2D2721]">
                    {formatCurrency(averageOrderValueMinor, merchant.defaultCurrency)}
                  </p>
                  <Link href={`/merchant/${params.slug}/campaigns`} className="mt-2 inline-flex text-xs font-semibold text-[#E17B5C]">
                    Open campaign revenue
                  </Link>
                </div>
                <div className="rounded-2xl border border-[rgba(139,115,85,0.15)] bg-[#FFFDF8] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#8B7355]">Redemption rate</p>
                  <p className="text-lg font-semibold text-[#2D2721]">{redemptionRatePct.toFixed(1)}%</p>
                  <Link href={`/merchant/${params.slug}/redemptions`} className="mt-2 inline-flex text-xs font-semibold text-[#E17B5C]">
                    Open redemption queue
                  </Link>
                </div>
              </div>
            </WarmCard>

            <RecentActivity merchantId={merchant.id} />

            {pendingRedemptions > 0 && (
              <WarmCard
                padding="lg"
                className="bg-gradient-to-br from-[#FFF9ED] to-[#FFE5B4] border border-[rgba(139,115,85,0.15)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#2D2721]">{pendingRedemptions} pending confirmation</p>
                    <p className="text-sm text-[#6B5744]">In-store redemptions waiting for your approval.</p>
                  </div>
                  <WarmButton asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={`/merchant/${params.slug}/redemptions`}>View redemptions</Link>
                  </WarmButton>
                </div>
              </WarmCard>
            )}
          </div>

          <div className="space-y-6">
            <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#2D2721]">Action center</h2>
                  <p className="text-sm text-[#6B5744]">Priority items to review.</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#FFC857]" />
              </div>
              {actionItems.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-[#6B5744]">
                  <CheckCircle2 className="h-4 w-4 text-[#9DB5A5]" />
                  You are all caught up.
                </div>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`mt-2 h-2 w-2 rounded-full ${toneStyles[item.tone]}`} />
                        <div>
                          <p className="text-sm font-medium text-[#2D2721]">{item.label}</p>
                          <p className="text-xs text-[#6B5744]">{item.detail}</p>
                        </div>
                      </div>
                      <Link
                        href={item.href}
                        className="text-xs font-semibold text-[#E17B5C] whitespace-nowrap"
                      >
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </WarmCard>

            <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#2D2721]">Upcoming events</h2>
                  <p className="text-sm text-[#6B5744]">Next scheduled events.</p>
                </div>
                <Calendar className="h-5 w-5 text-[#8B7355]" />
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-[#6B5744]">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[#2D2721]">{event.name}</p>
                        <p className="text-xs text-[#6B5744]">
                          {format(new Date(event.eventDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#8B7355] uppercase">
                        {event.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <WarmButton asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/merchant/${params.slug}/events`}>Manage events</Link>
                </WarmButton>
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[#2D2721]">Top vouchers</h2>
                  <p className="text-sm text-[#6B5744]">Most redeemed offers.</p>
                </div>
                <Ticket className="h-5 w-5 text-[#8B7355]" />
              </div>
              {topVouchers.length === 0 ? (
                <p className="text-sm text-[#6B5744]">No voucher activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {topVouchers.map((voucher) => {
                    const design = safeParseJson<{ headline?: string }>(voucher.designJson);
                    const headline = design?.headline ?? 'Voucher';
                    const pct = topVoucherMax > 0 ? (voucher._count.redemptions / topVoucherMax) * 100 : 0;
                    return (
                      <div key={voucher.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[#2D2721] font-medium truncate max-w-[160px]">{headline}</span>
                          <span className="text-[#6B5744]">{voucher._count.redemptions}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#F2EDE3] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#FFC857]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </WarmCard>

          </div>
        </div>
      </div>
    </div>
  );
}
