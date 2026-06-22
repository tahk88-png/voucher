import { notFound } from 'next/navigation';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { WarmCard } from '@/components/warm-card';
import EventPurchaseClient from './event-purchase-client';

export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      merchant: {
        select: {
          id: true,
          name: true,
          slug: true,
          brandLogoUrl: true,
          brandColorsJson: true,
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  if (event.status !== 'published') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#fcfbf8] via-[#f4f1ea] to-[#f6e1d7]">
        <WarmCard padding="lg" className="max-w-md text-center bg-white">
          <p className="text-sm text-[#6B5744]">
            This event is not available for ticket purchase.
          </p>
        </WarmCard>
      </div>
    );
  }

  // Count available tickets
  const soldTickets = await prisma.ticket.count({
    where: {
      eventId: event.id,
      status: { in: ['sold', 'used'] },
    },
  });

  const availableTickets = event.maxCapacity - soldTickets;
  const isSoldOut = availableTickets <= 0;

  // Get available tickets for purchase
  const availableTicketRecords = await prisma.ticket.findMany({
    where: {
      eventId: event.id,
      status: 'available',
    },
    take: 10, // Show first 10 available tickets
  });

  const brandColors = safeParseJson(event.merchant.brandColorsJson) as {
    primary?: string;
    secondary?: string;
    background?: string;
  } | null;

  const accentColor = brandColors?.primary || '#cc785c';

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-[#fcfbf8] via-[#f4f1ea] to-[#f6e1d7]">
      <div className="container mx-auto max-w-4xl space-y-6">
        <WarmCard padding="lg" className="bg-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[#8B7355]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: accentColor }}
                  aria-hidden="true"
                />
                {event.merchant?.name || 'Event'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-[#2D2721] mt-2">
                {event.name}
              </h1>
              <p className="text-sm text-[#6B5744] mt-2">
                {event.description || 'Join us for this amazing event!'}
              </p>
            </div>
            {event.merchant?.brandLogoUrl && (
              <Image
                src={event.merchant.brandLogoUrl}
                alt={`${event.merchant?.name || 'Merchant'} logo`}
                width={160}
                height={48}
                className="h-12 w-auto object-contain"
                unoptimized
              />
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mt-6 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">
                Date & Time
              </p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {new Date(event.eventDate).toLocaleString()}
              </p>
            </div>
            {event.location && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">
                  Location
                </p>
                <p className="text-lg font-semibold text-[#2D2721]">{event.location}</p>
                {event.locationAddress && (
                  <p className="text-sm text-[#6B5744]">{event.locationAddress}</p>
                )}
              </div>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">Price</p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {event.price > 0 ? formatCurrency(event.price, event.currency) : 'Free'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#8B7355]">
                Available Tickets
              </p>
              <p className="text-lg font-semibold text-[#2D2721]">
                {isSoldOut ? 'Sold Out' : `${availableTickets} available`}
              </p>
            </div>
          </div>

          {event.terms && (
            <div className="pt-4 mt-6 border-t border-[rgba(139,115,85,0.15)]">
              <p className="text-sm font-semibold text-[#2D2721] mb-2">Terms & Conditions</p>
              <p className="text-sm text-[#6B5744] whitespace-pre-wrap">{event.terms}</p>
            </div>
          )}
        </WarmCard>

        {isSoldOut ? (
          <WarmCard padding="lg" className="text-center bg-white">
            <p className="text-lg font-semibold text-[#2D2721] mb-2">This event is sold out</p>
            <p className="text-sm text-[#6B5744]">All tickets have been purchased.</p>
          </WarmCard>
        ) : (
          <EventPurchaseClient
            event={event}
            availableTickets={availableTicketRecords}
            brandColors={brandColors}
          />
        )}
      </div>
    </div>
  );
}
