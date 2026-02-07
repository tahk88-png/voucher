import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { z } from 'zod';

const createEventSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['festival', 'internal', 'concert', 'workshop', 'other']),
  eventDate: z.string().datetime(),
  eventEndDate: z.string().datetime().optional(),
  location: z.string().optional(),
  locationAddress: z.string().optional(),
  maxCapacity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
  currency: z.string().default('USD'),
  ticketTypesJson: z
    .array(
      z.object({
        name: z.string(),
        price: z.number().int().nonnegative(),
        capacity: z.number().int().positive(),
      })
    )
    .optional(),
  terms: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');

    const body = await req.json();
    const data = createEventSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        description: data.description,
        type: data.type,
        eventDate: new Date(data.eventDate),
        eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : null,
        location: data.location,
        locationAddress: data.locationAddress,
        maxCapacity: data.maxCapacity,
        price: data.price,
        currency: data.currency,
        ticketTypesJson: data.ticketTypesJson ? JSON.stringify(data.ticketTypesJson) : Prisma.DbNull,
        terms: data.terms,
        status: 'draft',
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: session.user.id,
        action: 'event.created',
        payloadJson: { eventId: event.id },
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

    const events = await prisma.event.findMany({
      where: { merchantId: merchant.id },
      include: {
        _count: {
          select: {
            tickets: true,
            purchases: true,
          },
        },
      },
      orderBy: { eventDate: 'desc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
