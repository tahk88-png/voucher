import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { safeParseJson } from '@/lib/utils';
import { createCheckoutSession, isStripeConfigured } from '@/lib/stripe';
import { PLATFORM_FEE_PERCENT } from '@/lib/access-control/monetization';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { z } from 'zod';

const purchaseSchema = z.object({
  attendeeName: z.string().optional(),
  attendeeEmail: z.string().email().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { allowed } = await rateLimitDistributed(`ticket-purchase:${session.user.id}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Payment processing unavailable.' },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { attendeeName, attendeeEmail } = purchaseSchema.parse(body);

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        event: {
          include: { merchant: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status !== 'available') {
      return NextResponse.json({ error: 'Ticket not available for purchase' }, { status: 400 });
    }

    // Check event status
    if (ticket.event.status !== 'published') {
      return NextResponse.json({ error: 'Event is not published' }, { status: 400 });
    }

    // Check event date
    const now = new Date();
    if (ticket.event.eventDate < now) {
      return NextResponse.json({ error: 'Event has already passed' }, { status: 400 });
    }

    // Check capacity
    const soldTickets = await prisma.ticket.count({
      where: {
        eventId: ticket.event.id,
        status: { in: ['sold', 'used'] },
      },
    });

    if (soldTickets >= ticket.event.maxCapacity) {
      return NextResponse.json({ error: 'Event is sold out' }, { status: 400 });
    }

    // Determine price (use ticket type price if available, otherwise event price)
    let price = ticket.event.price;
    if (ticket.ticketType && ticket.event.ticketTypesJson) {
      const ticketTypes = safeParseJson(ticket.event.ticketTypesJson);
      const ticketType = Array.isArray(ticketTypes)
        ? ticketTypes.find((t: any) => t.name === ticket.ticketType)
        : null;
      if (ticketType) {
        price = ticketType.price;
      }
    }

    // Atomically claim the seat and open the purchase in one transaction.
    // The status CAS (`status: 'available'`) is what prevents a double-sell:
    // between the read above and this write, two concurrent buyers of the
    // SAME ticket would both pass the `status === 'available'` check, but only
    // one can match the row here (count 1) — the loser sees count 0 and is
    // turned away, so a seat is never sold twice.
    const purchase = await prisma.$transaction(async (tx) => {
      const claimed = await tx.ticket.updateMany({
        where: { id: ticket.id, status: 'available' },
        data: { status: 'sold', purchasedAt: new Date() },
      });
      if (claimed.count === 0) return null;

      return tx.ticketPurchase.create({
        data: {
          ticketId: ticket.id,
          eventId: ticket.event.id,
          merchantId: ticket.merchantId,
          userId: session.user.id,
          amount: price,
          currency: ticket.event.currency,
          status: 'pending',
          attendeeName: attendeeName || session.user.name || null,
          attendeeEmail: attendeeEmail || session.user.email || null,
        },
      });
    });

    if (!purchase) {
      // Lost the race — another buyer claimed this seat first.
      return NextResponse.json({ error: 'Ticket not available for purchase' }, { status: 400 });
    }

    // Create Stripe checkout session. If this fails, release the seat we just
    // claimed (and fail the pending purchase) so it isn't stranded as 'sold'
    // with no completed payment — otherwise the seat is lost for good.
    // Route the net-of-fee amount to the merchant's connected account when
    // they've completed Connect onboarding (mirrors the voucher/gift-card
    // purchase paths). Un-onboarded merchants keep the direct-charge flow.
    const platformFeeAmount = Math.round((price * PLATFORM_FEE_PERCENT) / 100);
    const useConnect =
      !!ticket.event.merchant.stripeAccountId && ticket.event.merchant.payoutsEnabled;

    let checkoutSession;
    try {
      checkoutSession = await createCheckoutSession({
        lineItems: [
          {
            price_data: {
              currency: ticket.event.currency.toLowerCase(),
              product_data: {
                name: `Ticket: ${ticket.event.name}`,
                description: ticket.event.description || undefined,
              },
              unit_amount: price,
            },
            quantity: 1,
          },
        ],
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}&event_id=${ticket.event.id}`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/cancel?event_id=${ticket.event.id}`,
        metadata: {
          purchaseId: purchase.id,
          ticketId: ticket.id,
          eventId: ticket.event.id,
          merchantId: ticket.merchantId,
          userId: session.user.id,
          platformFeeAmount: String(platformFeeAmount),
        },
        customerEmail: attendeeEmail || session.user.email || undefined,
        connectedAccountId: useConnect ? ticket.event.merchant.stripeAccountId : null,
        applicationFeeAmount: useConnect ? platformFeeAmount : undefined,
      });
    } catch (err) {
      await prisma.$transaction([
        prisma.ticket.update({
          where: { id: ticket.id },
          data: { status: 'available', purchasedAt: null },
        }),
        prisma.ticketPurchase.update({
          where: { id: purchase.id },
          data: { status: 'failed' },
        }),
      ]);
      throw err;
    }

    // Update purchase with Stripe session ID
    await prisma.ticketPurchase.update({
      where: { id: purchase.id },
      data: { stripeSessionId: checkoutSession.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  });
}
