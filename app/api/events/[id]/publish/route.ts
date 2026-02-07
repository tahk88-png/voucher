import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: { merchant: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, event.merchantId, 'merchant_admin');

    // Validate event can be published
    if (event.status === 'published') {
      return NextResponse.json({ error: 'Event already published' }, { status: 400 });
    }

    if (event.status === 'cancelled' || event.status === 'ended') {
      return NextResponse.json(
        { error: 'Cannot publish cancelled or ended event' },
        { status: 400 }
      );
    }

    // Check if event has tickets
    const ticketCount = await prisma.ticket.count({
      where: { eventId: event.id },
    });

    if (ticketCount === 0) {
      return NextResponse.json(
        { error: 'Cannot publish event without tickets. Generate tickets first.' },
        { status: 400 }
      );
    }

    // Update status to published
    const updated = await prisma.event.update({
      where: { id: params.id },
      data: { status: 'published' },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: event.merchantId,
        actorUserId: session.user.id,
        action: 'event.published',
        payloadJson: { eventId: params.id },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error publishing event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
