import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
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
  } catch (error) {
    console.error('QR ticket lookup error:', error);
    return NextResponse.json({ error: 'Failed to lookup ticket' }, { status: 500 });
  }
}
