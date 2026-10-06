import { pageMetadata } from '@/lib/seo/page-metadata';

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { formatCurrency } from '@/lib/utils';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getLocale, getTranslations } from 'next-intl/server';
import { isSupportedLocale, localeToIntlLocale } from '@/lib/locale-config';
import { Calendar, DollarSign, Ticket, TrendingUp } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { StatsCard } from '@/components/ui/stats-card';
import { AreaChart } from '@/components/ui/charts';

const EVENT_STATUSES = ['draft', 'published', 'sold_out', 'cancelled', 'ended'] as const;
type EventStatus = (typeof EVENT_STATUSES)[number];
const isEventStatus = (value: string): value is EventStatus =>
  (EVENT_STATUSES as readonly string[]).includes(value);

const EVENT_TYPES = ['festival', 'internal', 'concert', 'workshop', 'other'] as const;
type EventType = (typeof EVENT_TYPES)[number];
const isEventType = (value: string): value is EventType => (EVENT_TYPES as readonly string[]).includes(value);

export async function generateMetadata() {
  const t = await getTranslations('merchantEvents');
  return pageMetadata({ title: t('meta.title'), noIndex: true });
}

const statusStyles: Record<string, string> = {
  draft: 'bg-[#F2EDE3] text-[var(--text-muted)]',
  published: 'bg-[#4e8a5b] text-white',
  sold_out: 'bg-[var(--danger)] text-white',
  cancelled: 'bg-[#E5E7EB] text-[#6B7280]',
  ended: 'bg-[#6B5744] text-white',
};

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');
  const tE = await getTranslations('merchantEvents');
  const locale = await getLocale();
  const intlLocale = isSupportedLocale(locale) ? localeToIntlLocale[locale] : 'en-GB';
  const weekdayFormat = new Intl.DateTimeFormat(intlLocale, { weekday: 'short' });

  const events = await prisma.event.findMany({
    where: { merchantId: merchant.id },
    include: {
      _count: {
        select: {
          tickets: true,
          purchases: true,
        },
      },
    },
    orderBy: { eventDate: 'desc' },
  });

  const eventIds = events.map((event) => event.id);

  const [soldTicketsByEvent, totalRevenue, weeklyPurchases] = await Promise.all([
    eventIds.length > 0
      ? prisma.ticket.groupBy({
          by: ['eventId'],
          where: {
            eventId: { in: eventIds },
            status: { in: ['sold', 'used'] },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    prisma.ticketPurchase.aggregate({
      where: { merchantId: merchant.id, status: 'paid' },
      _sum: { amount: true },
    }),
    prisma.ticketPurchase.findMany({
      where: {
        merchantId: merchant.id,
        status: 'paid',
        createdAt: { gte: startOfDay(subDays(new Date(), 6)) },
      },
      select: { createdAt: true, amount: true },
    }),
  ]);

  const soldTicketMap = new Map(
    soldTicketsByEvent.map((item) => [item.eventId, item._count._all])
  );

  const eventsWithStats = events.map((event) => {
    const soldTickets = soldTicketMap.get(event.id) ?? 0;
    return {
      ...event,
      soldTickets,
      availableTickets: Math.max(0, event.maxCapacity - soldTickets),
    };
  });

  const totalEvents = events.length;
  const activeEvents = events.filter((event) => ['published', 'sold_out'].includes(event.status)).length;
  const totalSoldTickets = eventsWithStats.reduce((sum, event) => sum + event.soldTickets, 0);
  const revenueTotal = totalRevenue._sum.amount ?? 0;

  const now = new Date();
  const rangeStart = startOfDay(subDays(now, 6));
  const rangeEnd = startOfDay(now);
  const dayBuckets = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const dayIndex = new Map(dayBuckets.map((day, index) => [format(day, 'yyyy-MM-dd'), index]));
  const chartData = dayBuckets.map((day) => ({
    date: weekdayFormat.format(day),
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
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('events') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-warm">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text)]">{t('events')}</h1>
              <p className="text-sm text-[var(--text-muted)]">{tE('list.subtitle')}</p>
            </div>
          </div>
          <WarmButton asChild>
            <Link href={`/merchant/${slug}/events/new`}>{tE('list.createEvent')}</Link>
          </WarmButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard
            title={tE('list.stats.totalTitle')}
            value={totalEvents}
            description={tE('list.stats.totalDescription')}
            icon={Calendar}
          />
          <StatsCard
            title={tE('list.stats.activeTitle')}
            value={activeEvents}
            description={tE('list.stats.activeDescription')}
            icon={TrendingUp}
          />
          <StatsCard
            title={tE('list.stats.soldTitle')}
            value={totalSoldTickets}
            description={tE('list.stats.soldDescription')}
            icon={Ticket}
          />
          <StatsCard
            title={tE('list.stats.revenueTitle')}
            value={formatCurrency(revenueTotal, merchant.defaultCurrency)}
            description={tE('list.stats.revenueDescription')}
            icon={DollarSign}
          />
        </div>

        {eventsWithStats.length === 0 ? (
          <WarmCard padding="lg" className="bg-[var(--surface)] text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center">
                <Calendar className="h-8 w-8 text-[var(--text-faint)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-[var(--text)]">{tE('list.empty.title')}</h3>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {tE('list.empty.description')}
                </p>
              </div>
              <WarmButton asChild>
                <Link href={`/merchant/${slug}/events/new`}>{tE('list.empty.cta')}</Link>
              </WarmButton>
            </div>
          </WarmCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {eventsWithStats.map((event) => {
                  const statusText = isEventStatus(event.status) ? tE(`status.${event.status}`) : event.status;
                  const statusClass = statusStyles[event.status] || statusStyles.draft;
                  const pct = event.maxCapacity > 0 ? Math.min(100, (event.soldTickets / event.maxCapacity) * 100) : 0;
                  return (
                    <WarmCard key={event.id} padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--text)]">{event.name}</h3>
                          <p className="text-sm text-[var(--text-faint)]">
                            {isEventType(event.type) ? tE(`type.${event.type}`) : event.type}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                        <div className="flex justify-between">
                          <span>{tE('list.card.date')}</span>
                          <span className="font-medium text-[var(--text)]">
                            {new Date(event.eventDate).toLocaleDateString(intlLocale, { dateStyle: 'medium' })}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex justify-between">
                            <span>{tE('list.card.location')}</span>
                            <span className="font-medium text-[var(--text)] truncate ml-2">{event.location}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>{tE('list.card.price')}</span>
                          <span className="font-medium text-[var(--text)]">
                            {event.price > 0 ? formatCurrency(event.price, event.currency) : tE('list.card.free')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>{tE('list.card.tickets')}</span>
                          <span className="font-medium text-[var(--text)]">
                            {tE('list.card.sold', { sold: event.soldTickets, capacity: event.maxCapacity })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-[#F2EDE3] overflow-hidden">
                          <div className="h-full rounded-full bg-[#cc785c]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <WarmButton asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/merchant/${slug}/events/${event.id}`}>{tE('list.card.view')}</Link>
                        </WarmButton>
                        <WarmButton asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/merchant/${slug}/events/${event.id}/edit`}>{tE('list.card.edit')}</Link>
                        </WarmButton>
                      </div>
                    </WarmCard>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <WarmCard padding="lg" className="bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--text)]">{tE('list.weeklyRevenue.title')}</h2>
                    <p className="text-sm text-[var(--text-muted)]">{tE('list.weeklyRevenue.description')}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-[var(--text-faint)]">{merchant.defaultCurrency}</span>
                </div>
                <AreaChart
                  data={chartData}
                  areas={[{ dataKey: 'revenue', name: tE('list.weeklyRevenue.series'), color: '#cc785c' }]}
                  xAxisKey="date"
                  height={240}
                  showLegend={false}
                />
              </WarmCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
