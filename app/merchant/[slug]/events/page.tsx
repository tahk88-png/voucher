import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { eachDayOfInterval, format, startOfDay, subDays } from 'date-fns';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { formatCurrency } from '@/lib/utils';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getTranslations } from 'next-intl/server';
import { Calendar, DollarSign, Ticket, TrendingUp } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { StatsCard } from '@/components/ui/stats-card';
import { AreaChart } from '@/components/ui/charts/area-chart';

const statusLabel: Record<string, string> = {
  draft: 'Draft',
  published: 'Active',
  sold_out: 'Sold out',
  cancelled: 'Cancelled',
  ended: 'Ended',
};

const statusStyles: Record<string, string> = {
  draft: 'bg-[#F2EDE3] text-[#6B5744]',
  published: 'bg-[#9DB5A5] text-white',
  sold_out: 'bg-[#E17B5C] text-white',
  cancelled: 'bg-[#E5E7EB] text-[#6B7280]',
  ended: 'bg-[#6B5744] text-white',
};

export default async function EventsPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug: params.slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const t = await getTranslations('nav');

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
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${params.slug}/dashboard` },
            { label: t('events') },
          ]}
        />
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center shadow-warm">
              <Calendar className="h-6 w-6 text-[#2D2721]" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#2D2721]">{t('events')}</h1>
              <p className="text-sm text-[#6B5744]">Manage your events and tickets</p>
            </div>
          </div>
          <WarmButton asChild>
            <Link href={`/merchant/${params.slug}/events/new`}>Create event</Link>
          </WarmButton>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatsCard title="Total events" value={totalEvents} description="All events" icon={Calendar} />
          <StatsCard title="Active" value={activeEvents} description="Published or sold out" icon={TrendingUp} />
          <StatsCard title="Tickets sold" value={totalSoldTickets} description="Across all events" icon={Ticket} />
          <StatsCard
            title="Revenue"
            value={formatCurrency(revenueTotal, merchant.defaultCurrency)}
            description="Paid ticket sales"
            icon={DollarSign}
          />
        </div>

        {eventsWithStats.length === 0 ? (
          <WarmCard padding="lg" className="bg-white text-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#FAF7F2] flex items-center justify-center">
                <Calendar className="h-8 w-8 text-[#8B7355]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2 text-[#2D2721]">No events yet</h3>
                <p className="text-sm text-[#6B5744] mb-4">
                  Create an event to sell tickets and manage attendance.
                </p>
              </div>
              <WarmButton asChild>
                <Link href={`/merchant/${params.slug}/events/new`}>Create your first event</Link>
              </WarmButton>
            </div>
          </WarmCard>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="grid gap-4 sm:grid-cols-2">
                {eventsWithStats.map((event) => {
                  const statusText = statusLabel[event.status] || event.status;
                  const statusClass = statusStyles[event.status] || statusStyles.draft;
                  const pct = event.maxCapacity > 0 ? Math.min(100, (event.soldTickets / event.maxCapacity) * 100) : 0;
                  return (
                    <WarmCard key={event.id} padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-[#2D2721]">{event.name}</h3>
                          <p className="text-sm text-[#8B7355]">
                            {event.type === 'festival'
                              ? 'Festival'
                              : event.type === 'internal'
                              ? 'Internal event'
                              : event.type}
                          </p>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
                          {statusText}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2 text-sm text-[#6B5744]">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium text-[#2D2721]">
                            {new Date(event.eventDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex justify-between">
                            <span>Location:</span>
                            <span className="font-medium text-[#2D2721] truncate ml-2">{event.location}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-medium text-[#2D2721]">
                            {event.price > 0 ? formatCurrency(event.price, event.currency) : 'Free'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tickets:</span>
                          <span className="font-medium text-[#2D2721]">
                            {event.soldTickets} / {event.maxCapacity} sold
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-[#F2EDE3] overflow-hidden">
                          <div className="h-full rounded-full bg-[#FFC857]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <WarmButton asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/merchant/${params.slug}/events/${event.id}`}>View</Link>
                        </WarmButton>
                        <WarmButton asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/merchant/${params.slug}/events/${event.id}/edit`}>Edit</Link>
                        </WarmButton>
                      </div>
                    </WarmCard>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <WarmCard padding="lg" className="bg-white border border-[rgba(139,115,85,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-semibold text-[#2D2721]">Weekly ticket revenue</h2>
                    <p className="text-sm text-[#6B5744]">Paid ticket sales over 7 days.</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-[#8B7355]">{merchant.defaultCurrency}</span>
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
        )}
      </div>
    </div>
  );
}
