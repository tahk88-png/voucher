import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const createSlotSchema = z.object({
  serviceName: z.string().min(1).max(200),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  priceCents: z.number().int().nonnegative().default(0),
  currency: z.string().default('EUR'),
  notes: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const isSlot = url.searchParams.get('isSlot');

    const where: Record<string, unknown> = { merchantId: merchant.id };
    if (status) where.status = status;
    if (isSlot !== null) where.isSlot = isSlot === 'true';
    if (from || to) {
      where.startTime = {};
      if (from) (where.startTime as Record<string, Date>).gte = new Date(from);
      if (to) (where.startTime as Record<string, Date>).lte = new Date(to);
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({ appointments });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const data = createSlotSchema.parse(body);

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    // Check for overlapping slots
    const overlap = await prisma.appointment.findFirst({
      where: {
        merchantId: merchant.id,
        isSlot: true,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (overlap) {
      return NextResponse.json({ error: 'Time slot overlaps with existing slot' }, { status: 409 });
    }

    const slot = await prisma.appointment.create({
      data: {
        merchantId: merchant.id,
        serviceName: data.serviceName,
        startTime: start,
        endTime: end,
        priceCents: data.priceCents,
        currency: data.currency,
        notes: data.notes,
        isSlot: true,
        status: 'confirmed', // Availability slots are immediately confirmed
      },
    });

    return NextResponse.json(slot, { status: 201 });
  });
}
