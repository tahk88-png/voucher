import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { addDays, eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { AreaChart } from '@/components/ui/charts';
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
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ range?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const rawRange = Array.isArray(sp?.range) ? sp?.range[0] : sp?.range;
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
          href: `/merchant/${slug}/redemptions`,
          tone: 'urgent',
        }
      : null,
    expiringVouchers > 0
      ? {
          label: `${expiringVouchers} vouchers expiring soon`,
          detail: 'Review voucher validity dates',
          href: `/merchant/${slug}/vouchers`,
          tone: 'warning',
        }
      : null,
    endingCampaigns > 0
      ? {
          label: `${endingCampaigns} campaigns ending this week`,
          detail: 'Extend or duplicate your best campaigns',
          href: `/merchant/${slug}/campaigns`,
          tone: 'warning',
        }
      : null,
    upcomingEvents.length > 0
      ? {
          label: `${upcomingEvents.length} upcoming events`,
          detail: 'Prepare ticket check-ins and staffing',
          href: `/merchant/${slug}/events`,
          tone: 'info',
        }
      : null,
  ].filter(Boolean) as ActionItem[];

  const toneStyles: Record<ActionItem['tone'], string> = {
    urgent: 'bg-[var(--danger)]',
    warning: 'bg-[#be8a2e]',
    info: 'bg-[#5e7e92]',
  };

  const topVoucherMax = topVouchers.reduce((max, voucher) => {
    return Math.max(max, voucher._count.redemptions);
  }, 0);

  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text)]">Merchant Dashboard</h1>
            <p className="text-sm text-[var(--text-muted)]">Welcome back, {merchant.name}</p>
            <div className="mt-2">
              <LiveStats
                slug={slug}
                initialToday={weeklyRedemptions.filter(r =>
                  new Date(r.createdAt) >= startOfDay(now)
                ).length}
                initialPending={pendingRedemptions}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <WarmButton asChild variant="outline">
              <Link href={`/merchant/${slug}/campaigns`}>View campaigns</Link>
            </WarmButton>
            <WarmButton asChild>
              <Link href={`/merchant/${slug}/vouchers/new`}>Create voucher</Link>
            </WarmButton>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Performance overview</h2>
            <p className="text-sm text-[var(--text-muted)]">Live campaign activity and redemptions.</p>
          </div>
          <DashboardStats merchantId={merchant.id} merchantSlug={slug} />
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">Revenue and credits</h2>
            <p className="text-sm text-[var(--text-muted)]">Sales, credits, and outstanding liability.</p>
          </div>
          <RevenueStats merchantId={merchant.id} merchantSlug={slug} currency={merchant.defaultCurrency} />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">Performance trend</h2>
                  <p className="text-sm text-[var(--text-muted)]">
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
                          href={`/merchant/${slug}/dashboard?range=${option.value}`}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            isActive
                              ? 'bg-[#2D2721] text-white'
                              : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[#f6e1d7]'
                          }`}
                        >
                          {option.label}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs uppercase tracking-wide text-[var(--text-faint)]">Revenue</p>
                    <p className="text-lg font-semibold text-[var(--text)]">
                      {formatCurrency(weeklyRevenueMinor, merchant.defaultCurrency)}
                    </p>
                  </div>
                </div>
              </div>
              <AreaChart
                data={activityData}
                areas={[
                  { dataKey: 'redemptions', name: 'Redemptions', color: '#cc785c' },
                  { dataKey: 'revenue', name: 'Revenue', color: '#5e7e92' },
                ]}
                xAxisKey="date"
                height={260}
                showLegend
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[#fcfbf8] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-faint)]">Paid orders</p>
                  <p className="text-lg font-semibold text-[var(--text)]">{paidOrderCount}</p>
                  <Link href={`/merchant/${slug}/campaigns`} className="mt-2 inline-flex text-xs font-semibold text-[#cc785c]">
                    Open orders view
                  </Link>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[#fcfbf8] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-faint)]">Avg order</p>
                  <p className="text-lg font-semibold text-[var(--text)]">
                    {formatCurrency(averageOrderValueMinor, merchant.defaultCurrency)}
                  </p>
                  <Link href={`/merchant/${slug}/campaigns`} className="mt-2 inline-flex text-xs font-semibold text-[#cc785c]">
                    Open campaign revenue
                  </Link>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[#fcfbf8] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[var(--text-faint)]">Redemption rate</p>
                  <p className="text-lg font-semibold text-[var(--text)]">{redemptionRatePct.toFixed(1)}%</p>
                  <Link href={`/merchant/${slug}/redemptions`} className="mt-2 inline-flex text-xs font-semibold text-[#cc785c]">
                    Open redemption queue
                  </Link>
                </div>
              </div>
            </WarmCard>

            <RecentActivity merchantId={merchant.id} />

            {pendingRedemptions > 0 && (
              <WarmCard
                padding="lg"
                className="bg-gradient-to-br from-[#fcfbf8] to-[#f6e1d7] border border-[var(--border)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--text)]">{pendingRedemptions} pending confirmation</p>
                    <p className="text-sm text-[var(--text-muted)]">In-store redemptions waiting for your approval.</p>
                  </div>
                  <WarmButton asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={`/merchant/${slug}/redemptions`}>View redemptions</Link>
                  </WarmButton>
                </div>
              </WarmCard>
            )}
          </div>

          <div className="space-y-6">
            <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">Action center</h2>
                  <p className="text-sm text-[var(--text-muted)]">Priority items to review.</p>
                </div>
                <Sparkles className="h-5 w-5 text-[#cc785c]" />
              </div>
              {actionItems.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <CheckCircle2 className="h-4 w-4 text-[#4e8a5b]" />
                  You are all caught up.
                </div>
              ) : (
                <div className="space-y-3">
                  {actionItems.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className={`mt-2 h-2 w-2 rounded-full ${toneStyles[item.tone]}`} />
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{item.label}</p>
                          <p className="text-xs text-[var(--text-muted)]">{item.detail}</p>
                        </div>
                      </div>
                      <Link
                        href={item.href}
                        className="text-xs font-semibold text-[#cc785c] whitespace-nowrap"
                      >
                        Open
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </WarmCard>

            <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">Upcoming events</h2>
                  <p className="text-sm text-[var(--text-muted)]">Next scheduled events.</p>
                </div>
                <Calendar className="h-5 w-5 text-[var(--text-faint)]" />
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text)]">{event.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {format(new Date(event.eventDate), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-faint)] uppercase">
                        {event.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <WarmButton asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/merchant/${slug}/events`}>Manage events</Link>
                </WarmButton>
              </div>
            </WarmCard>

            <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-[var(--text)]">Top vouchers</h2>
                  <p className="text-sm text-[var(--text-muted)]">Most redeemed offers.</p>
                </div>
                <Ticket className="h-5 w-5 text-[var(--text-faint)]" />
              </div>
              {topVouchers.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">No voucher activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {topVouchers.map((voucher) => {
                    const design = safeParseJson<{ headline?: string }>(voucher.designJson);
                    const headline = design?.headline ?? 'Voucher';
                    const pct = topVoucherMax > 0 ? (voucher._count.redemptions / topVoucherMax) * 100 : 0;
                    return (
                      <div key={voucher.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text)] font-medium truncate max-w-[160px]">{headline}</span>
                          <span className="text-[var(--text-muted)]">{voucher._count.redemptions}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-[#F2EDE3] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#cc785c]"
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
