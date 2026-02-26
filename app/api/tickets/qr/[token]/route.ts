import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  return withErrorHandler(async () => {
    const ticket = await prisma.ticket.findUnique({
      where: { qrToken: params.token },
      include: {
        event: {
          include: { merchant: true },
        },
        purchase: {
          include: { user: true },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Return minimal ticket info for QR scanning
    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      status: ticket.status,
      event: {
        id: ticket.event.id,
        name: ticket.event.name,
        eventDate: ticket.event.eventDate,
      },
      purchase: ticket.purchase
        ? {
            attendeeName: ticket.purchase.attendeeName,
            attendeeEmail: ticket.purchase.attendeeEmail,
          }
        : null,
    });
  });
}
