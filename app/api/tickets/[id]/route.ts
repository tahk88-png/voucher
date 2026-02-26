import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
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

    // Check if user owns the ticket or is merchant staff
    const isOwner = ticket.purchase?.userId === session.user.id;
    const isMerchantStaff = await prisma.merchantMember.findFirst({
      where: {
        merchantId: ticket.merchantId,
        userId: session.user.id,
        role: { in: ['merchant_admin', 'merchant_staff'] },
      },
    });

    if (!isOwner && !isMerchantStaff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json({
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      qrToken: ticket.qrToken,
      status: ticket.status,
      usedAt: ticket.usedAt,
      event: {
        id: ticket.event.id,
        name: ticket.event.name,
        eventDate: ticket.event.eventDate,
        location: ticket.event.location,
        locationAddress: ticket.event.locationAddress,
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
