import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';

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

    const { allowed } = await rateLimitDistributed(`event-publish:${session.user.id}`, 20, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const event = await prisma.event.findUnique({
      where: { id },
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
      where: { id },
      data: { status: 'published' },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: event.merchantId,
        actorUserId: session.user.id,
        action: 'event.published',
        payloadJson: { eventId: id },
      },
    });

    return NextResponse.json(updated);
  });
}
