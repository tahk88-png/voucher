import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin')

    const body = await req.json()
    const { status, rejectionReason } = body

    const booking = await prisma.rentalBooking.findUnique({ where: { id } })
    if (!booking || booking.merchantId !== merchant.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (status === 'approved') {
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending bookings can be approved' }, { status: 400 })
      }

      // Check for conflicts before approving
      const overlapping = await prisma.rentalBooking.findFirst({
        where: {
          rentalItemId: booking.rentalItemId,
          id: { not: booking.id },
          status: { in: ['approved', 'paid', 'active'] },
          startDate: { lte: booking.endDate },
          endDate: { gte: booking.startDate },
        },
      })

      if (overlapping) {
        return NextResponse.json(
          { error: 'Another booking overlaps with these dates' },
          { status: 409 }
        )
      }

      const updated = await prisma.rentalBooking.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: profile.userId,
        },
        include: { rentalItem: { select: { name: true } } },
      })
      return NextResponse.json({ booking: updated })
    }

    if (status === 'rejected') {
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending bookings can be rejected' }, { status: 400 })
      }
      const updated = await prisma.rentalBooking.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason: rejectionReason || null,
        },
        include: { rentalItem: { select: { name: true } } },
      })
      return NextResponse.json({ booking: updated })
    }

    return NextResponse.json({ error: 'Invalid status. Use approved or rejected.' }, { status: 400 })
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff')

    const body = await req.json()
    const { action } = body

    const booking = await prisma.rentalBooking.findUnique({ where: { id } })
    if (!booking || booking.merchantId !== merchant.id) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (action === 'mark_returned') {
      if (!['active', 'paid'].includes(booking.status)) {
        return NextResponse.json(
          { error: 'Only active or paid bookings can be marked as returned' },
          { status: 400 }
        )
      }

      const updated = await prisma.rentalBooking.update({
        where: { id },
        data: {
          status: 'returned',
          returnedAt: new Date(),
        },
        include: { rentalItem: { select: { name: true } } },
      })
      return NextResponse.json({ booking: updated })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  })
}
