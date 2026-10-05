import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import GenerateTicketsButton from './generate-tickets-button';
import PublishEventButton from './publish-button';
import Breadcrumbs from '@/components/navigation/breadcrumbs';
import { getLocale, getTranslations } from 'next-intl/server';
import { isSupportedLocale, localeToIntlLocale } from '@/lib/locale-config';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

const EVENT_STATUSES = ['draft', 'published', 'sold_out', 'cancelled', 'ended'] as const;
type EventStatus = (typeof EVENT_STATUSES)[number];
const isEventStatus = (value: string): value is EventStatus =>
  (EVENT_STATUSES as readonly string[]).includes(value);

const EVENT_TYPES = ['festival', 'internal', 'concert', 'workshop', 'other'] as const;
type EventType = (typeof EVENT_TYPES)[number];
const isEventType = (value: string): value is EventType => (EVENT_TYPES as readonly string[]).includes(value);

const TICKET_STATUSES = ['available', 'sold', 'used', 'cancelled', 'refunded'] as const;
type TicketStatus = (typeof TICKET_STATUSES)[number];
const isTicketStatus = (value: string): value is TicketStatus =>
  (TICKET_STATUSES as readonly string[]).includes(value);

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const merchant = await prisma.merchant.findUnique({ where: { slug } });
  if (!merchant) notFound();

  await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tickets: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      _count: {
        select: {
          tickets: true,
          purchases: true,
        },
      },
    },
  });

  if (!event || event.merchantId !== merchant.id) {
    notFound();
  }

  const soldTickets = await prisma.ticket.count({
    where: {
      eventId: event.id,
      status: { in: ['sold', 'used'] },
    },
  });

  const availableTickets = event.maxCapacity - soldTickets;
  const t = await getTranslations('nav');
  const tE = await getTranslations('merchantEvents');
  const locale = await getLocale();
  const intlLocale = isSupportedLocale(locale) ? localeToIntlLocale[locale] : 'en-GB';

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: t('dashboard'), href: `/merchant/${slug}/dashboard` },
            { label: t('events'), href: `/merchant/${slug}/events` },
            { label: event.name },
          ]}
        />
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--text)]">{event.name}</h1>
              <p className="text-sm text-[var(--text-muted)]">{event.description || tE('detail.noDescription')}</p>
            </div>
            <div className="flex gap-2">
              <WarmButton asChild variant="outline" size="sm">
                <Link href={`/merchant/${slug}/events/${event.id}/edit`}>{tE('detail.edit')}</Link>
              </WarmButton>
              <PublishEventButton eventId={event.id} currentStatus={event.status} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {[
            {
              label: tE('detail.status'),
              value: isEventStatus(event.status) ? tE(`statusName.${event.status}`) : event.status,
            },
            { label: tE('detail.type'), value: isEventType(event.type) ? tE(`type.${event.type}`) : event.type },
            {
              label: tE('detail.eventDate'),
              value: new Date(event.eventDate).toLocaleString(intlLocale, { dateStyle: 'medium', timeStyle: 'short' }),
            },
            {
              label: tE('detail.price'),
              value: event.price > 0 ? formatCurrency(event.price, event.currency) : tE('detail.free'),
            },
          ].map((item) => (
            <WarmCard key={item.label} padding="lg" className="bg-[var(--surface)]">
              <p className="text-sm text-[var(--text-faint)]">{item.label}</p>
              <p className="text-lg font-semibold text-[var(--text)] mt-1 capitalize">{item.value}</p>
            </WarmCard>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          {[
            { label: tE('detail.totalTickets'), value: event._count.tickets },
            { label: tE('detail.sold'), value: soldTickets },
            { label: tE('detail.available'), value: availableTickets },
          ].map((item) => (
            <WarmCard key={item.label} padding="lg" className="bg-[var(--surface)] text-center">
              <p className="text-sm text-[var(--text-faint)]">{item.label}</p>
              <p className="text-2xl font-semibold text-[var(--text)] mt-2">{item.value}</p>
            </WarmCard>
          ))}
        </div>

        {event.location && (
          <WarmCard padding="lg" className="bg-[var(--surface)] mb-6">
            <p className="text-sm text-[var(--text-faint)]">{tE('detail.location')}</p>
            <p className="text-sm text-[var(--text)] mt-1">{event.location}</p>
            {event.locationAddress && (
              <p className="text-sm text-[var(--text-muted)]">{event.locationAddress}</p>
            )}
          </WarmCard>
        )}

        {event.terms && (
          <WarmCard padding="lg" className="bg-[var(--surface)] mb-6">
            <p className="text-sm text-[var(--text-faint)]">{tE('detail.terms')}</p>
            <p className="text-sm text-[var(--text)] mt-1 whitespace-pre-wrap">{event.terms}</p>
          </WarmCard>
        )}

        <WarmCard padding="lg" className="bg-[var(--surface)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text)]">{tE('detail.ticketsTitle')}</h2>
              <p className="text-sm text-[var(--text-muted)]">{tE('detail.ticketsDescription')}</p>
            </div>
            <GenerateTicketsButton
              eventId={event.id}
              merchantSlug={slug}
              event={{
                name: event.name,
                maxCapacity: event.maxCapacity,
                currentTickets: event._count.tickets,
              }}
            />
          </div>
          {event.tickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-muted)] text-sm mb-4">{tE('detail.noTickets')}</p>
              <GenerateTicketsButton
                eventId={event.id}
                merchantSlug={slug}
                event={{
                  name: event.name,
                  maxCapacity: event.maxCapacity,
                  currentTickets: 0,
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {event.tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[var(--text)]">{ticket.ticketNumber}</p>
                    <p className="text-sm text-[var(--text-faint)] capitalize">
                      {isTicketStatus(ticket.status) ? tE(`ticketStatus.${ticket.status}`) : ticket.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <WarmButton asChild variant="outline" size="sm">
                      <Link href={`/tickets/${ticket.id}`}>{tE('detail.view')}</Link>
                    </WarmButton>
                    {ticket.status === 'sold' && (
                      <WarmButton asChild variant="outline" size="sm">
                        <Link href={`/merchant/${slug}/events/${event.id}/redeem?ticket=${ticket.id}`}>
                          {tE('detail.redeem')}
                        </Link>
                      </WarmButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
