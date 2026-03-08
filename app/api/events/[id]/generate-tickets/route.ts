import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { z } from 'zod';
import crypto from 'crypto';

const generateTicketsSchema = z.object({
  count: z.number().int().positive().max(1000),
  ticketType: z.string().optional(), // For tiered tickets
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

    const { allowed } = await rateLimitDistributed(`generate-tickets:${session.user.id}`, 10, 60_000);
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

    const body = await req.json();
    const { count, ticketType } = generateTicketsSchema.parse(body);

    // Check current ticket count
    const currentTickets = await prisma.ticket.count({
      where: { eventId: event.id },
    });

    if (currentTickets + count > event.maxCapacity) {
      return NextResponse.json(
        { error: `Cannot generate ${count} tickets. Would exceed max capacity of ${event.maxCapacity}.` },
        { status: 400 }
      );
    }

    // Generate tickets
    const tickets = [];
    const eventPrefix = event.name.slice(0, 3).toUpperCase().replace(/\s/g, '');

    for (let i = 0; i < count; i++) {
      const ticketNumber = `${eventPrefix}-${String(currentTickets + i + 1).padStart(6, '0')}`;
      const qrToken = crypto.randomBytes(32).toString('hex');

      tickets.push({
        eventId: event.id,
        merchantId: event.merchantId,
        ticketType: ticketType || null,
        ticketNumber,
        qrToken,
        status: 'available',
      });
    }

    await prisma.ticket.createMany({
      data: tickets,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: event.merchantId,
        actorUserId: session.user.id,
        action: 'tickets.generated',
        payloadJson: { eventId: event.id, count, ticketType },
      },
    });

    return NextResponse.json({ count, message: `Generated ${count} tickets successfully` });
  });
}
