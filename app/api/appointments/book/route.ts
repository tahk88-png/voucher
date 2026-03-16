import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { withErrorHandler } from '@/lib/error-handler';

const bookSchema = z.object({
  slotId: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = bookSchema.parse(body);

    // Find the availability slot
    const slot = await prisma.appointment.findUnique({
      where: { id: data.slotId },
    });

    if (!slot) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 });
    }

    if (!slot.isSlot) {
      return NextResponse.json({ error: 'This is not an availability slot' }, { status: 400 });
    }

    if (slot.startTime <= new Date()) {
      return NextResponse.json({ error: 'This time slot has already passed' }, { status: 400 });
    }

    // Check if this slot already has a booking
    const existingBooking = await prisma.appointment.findFirst({
      where: {
        merchantId: slot.merchantId,
        isSlot: false,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: { in: ['pending', 'confirmed'] },
      },
    });

    if (existingBooking) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
    }

    // Check if user already has a booking at this time for this merchant
    const userConflict = await prisma.appointment.findFirst({
      where: {
        userId: session.user.id,
        merchantId: slot.merchantId,
        isSlot: false,
        status: { in: ['pending', 'confirmed'] },
        startTime: { lt: slot.endTime },
        endTime: { gt: slot.startTime },
      },
    });

    if (userConflict) {
      return NextResponse.json({ error: 'You already have a booking at this time' }, { status: 409 });
    }

    // Create the booking
    const booking = await prisma.appointment.create({
      data: {
        merchantId: slot.merchantId,
        userId: session.user.id,
        serviceName: slot.serviceName,
        startTime: slot.startTime,
        endTime: slot.endTime,
        priceCents: slot.priceCents,
        currency: slot.currency,
        notes: data.notes,
        isSlot: false,
        status: 'pending',
      },
      include: {
        merchant: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(booking, { status: 201 });
  });
}
