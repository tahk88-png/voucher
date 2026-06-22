import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { queueWebhook } from '@/lib/webhooks'

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { merchantId, rentalItemId, startDate, endDate, notes } = body

    if (!merchantId || !rentalItemId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'merchantId, rentalItemId, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
    }

    if (start < now) {
      return NextResponse.json({ error: 'Start date must be in the future' }, { status: 400 })
    }

    if (end <= start) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Validate rental item exists and is active
    const rentalItem = await prisma.rentalItem.findUnique({
      where: { id: rentalItemId },
    })

    if (!rentalItem || rentalItem.status !== 'active') {
      return NextResponse.json({ error: 'Rental item not found or not available' }, { status: 404 })
    }

    if (rentalItem.merchantId !== merchantId) {
      return NextResponse.json({ error: 'Rental item does not belong to this merchant' }, { status: 400 })
    }

    // Check minimum days
    if (rentalItem.minDays && days < rentalItem.minDays) {
      return NextResponse.json(
        { error: `Minimum rental period is ${rentalItem.minDays} days` },
        { status: 400 }
      )
    }

    // Check availability window
    if (rentalItem.availableFrom && start < rentalItem.availableFrom) {
      return NextResponse.json({ error: 'Item not available on the selected start date' }, { status: 400 })
    }
    if (rentalItem.availableTo && end > rentalItem.availableTo) {
      return NextResponse.json({ error: 'Item not available on the selected end date' }, { status: 400 })
    }

    // Check for overlapping approved/active bookings
    const overlapping = await prisma.rentalBooking.findFirst({
      where: {
        rentalItemId,
        status: { in: ['approved', 'paid', 'active'] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'This item is already booked for the selected dates' },
        { status: 409 }
      )
    }

    // Calculate total price (weekly rate discount if applicable)
    const fullWeeks = Math.floor(days / 7)
    const remainingDays = days % 7
    const weeklyRate = rentalItem.weeklyRate || rentalItem.dailyRate * 7
    const totalPrice = fullWeeks * weeklyRate + remainingDays * rentalItem.dailyRate

    const booking = await prisma.rentalBooking.create({
      data: {
        merchantId,
        rentalItemId,
        userId: session.user.id,
        startDate: start,
        endDate: end,
        days,
        dailyRate: rentalItem.dailyRate,
        totalPrice,
        currency: rentalItem.currency,
        notes: notes || null,
      },
      include: {
        rentalItem: { select: { name: true } },
      },
    })

    // Bookings default to status='pending' — merchants wire the webhook
    // to trigger their approval workflow (email/Slack).
    queueWebhook(merchantId, 'booking.created', {
      bookingId: booking.id,
      merchantId,
      rentalItemId,
      rentalItemName: booking.rentalItem.name,
      userId: session.user.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      days,
      dailyRate: rentalItem.dailyRate,
      totalPrice,
      currency: rentalItem.currency,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
    })

    return NextResponse.json({ booking }, { status: 201 })
  })
}

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: Record<string, unknown> = { userId: session.user.id }
    if (status) {
      where.status = status
    }

    const bookings = await prisma.rentalBooking.findMany({
      where,
      include: {
        rentalItem: { select: { id: true, name: true, imageUrl: true } },
        merchant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ bookings })
  })
}
