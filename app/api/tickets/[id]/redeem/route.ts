import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const redeemTicketSchema = z.object({
  qrToken: z.string().optional(), // If provided, verify by QR token
  location: z.string().optional(), // Optional location for redemption
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { qrToken, location } = redeemTicketSchema.parse(body);

    // Get ticket
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

    // Verify QR token if provided
    if (qrToken && ticket.qrToken !== qrToken) {
      return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 });
    }

    // Check if ticket is sold
    if (ticket.status !== 'sold') {
      return NextResponse.json(
        { error: `Ticket is not valid for redemption. Current status: ${ticket.status}` },
        { status: 400 }
      );
    }

    // Check if already used
    if (ticket.usedAt) {
      return NextResponse.json({ error: 'Ticket has already been used' }, { status: 400 });
    }

    // Check if user is merchant staff (can redeem any ticket) or ticket owner
    const isMerchantStaff = await prisma.merchantMember.findFirst({
      where: {
        merchantId: ticket.merchantId,
        userId: session.user.id,
        role: { in: ['merchant_admin', 'merchant_staff'] },
      },
    });

    const isTicketOwner = ticket.purchase?.userId === session.user.id;

    if (!isMerchantStaff && !isTicketOwner) {
      return NextResponse.json({ error: 'Unauthorized to redeem this ticket' }, { status: 403 });
    }

    // If merchant staff is redeeming, require merchant role check
    if (isMerchantStaff) {
      await requireMerchantRole(session.user.id, ticket.merchantId, 'merchant_staff');
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: 'used',
        usedAt: new Date(),
      },
      include: {
        event: true,
        purchase: {
          include: { user: true },
        },
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: ticket.merchantId,
        actorUserId: session.user.id,
        action: 'ticket.redeemed',
        payloadJson: {
          ticketId: ticket.id,
          ticketNumber: ticket.ticketNumber,
          eventId: ticket.eventId,
          location: location || null,
          redeemedBy: isMerchantStaff ? 'staff' : 'owner',
        },
      },
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: updatedTicket.id,
        ticketNumber: updatedTicket.ticketNumber,
        status: updatedTicket.status,
        usedAt: updatedTicket.usedAt,
        event: {
          name: updatedTicket.event.name,
          eventDate: updatedTicket.event.eventDate,
        },
      },
    });
  });
}
