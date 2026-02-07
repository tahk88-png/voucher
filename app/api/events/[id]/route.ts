import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { z } from 'zod';

const updateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['festival', 'internal', 'concert', 'workshop', 'other']).optional(),
  eventDate: z.string().datetime().optional(),
  eventEndDate: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
  locationAddress: z.string().optional().nullable(),
  maxCapacity: z.number().int().positive().optional(),
  price: z.number().int().nonnegative().optional(),
  currency: z.string().optional(),
  ticketTypesJson: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().int().nonnegative(),
        capacity: z.number().int().positive(),
      })
    )
    .optional()
    .nullable(),
  terms: z.string().optional().nullable(),
  status: z.enum(['draft', 'published', 'sold_out', 'cancelled', 'ended']).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: params.id },
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
        _count: {
          select: {
            tickets: true,
            purchases: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Count sold tickets
    const soldTickets = await prisma.ticket.count({
      where: {
        eventId: event.id,
        status: { in: ['sold', 'used'] },
      },
    });

    return NextResponse.json({
      ...event,
      soldTickets,
      availableTickets: event.maxCapacity - soldTickets,
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await req.json();
    const data = updateEventSchema.parse(body);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.eventDate !== undefined) updateData.eventDate = new Date(data.eventDate);
    if (data.eventEndDate !== undefined) updateData.eventEndDate = data.eventEndDate ? new Date(data.eventEndDate) : null;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.locationAddress !== undefined) updateData.locationAddress = data.locationAddress;
    if (data.maxCapacity !== undefined) updateData.maxCapacity = data.maxCapacity;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.ticketTypesJson !== undefined) {
      updateData.ticketTypesJson = data.ticketTypesJson ? JSON.stringify(data.ticketTypesJson) : Prisma.DbNull;
    }
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.status !== undefined) updateData.status = data.status;

    const updated = await prisma.event.update({
      where: { id: params.id },
      data: updateData,
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: event.merchantId,
        actorUserId: session.user.id,
        action: 'event.updated',
        payloadJson: { eventId: params.id, changes: Object.keys(updateData) },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
