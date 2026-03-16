import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.rentalBooking.findUnique({
      where: { id },
      include: {
        rentalItem: { select: { id: true, name: true, description: true, imageUrl: true } },
        merchant: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Only the booking user or merchant members can view
    if (booking.userId !== session.user.id) {
      const membership = await prisma.merchantMember.findFirst({
        where: { merchantId: booking.merchantId, userId: session.user.id },
      })
      if (!membership) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json({ booking })
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, rejectionReason } = body

    const booking = await prisma.rentalBooking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // User can only cancel their own bookings
    if (status === 'cancelled') {
      if (booking.userId !== session.user.id) {
        return NextResponse.json({ error: 'Only the booking owner can cancel' }, { status: 403 })
      }
      if (!['pending', 'approved'].includes(booking.status)) {
        return NextResponse.json(
          { error: 'Only pending or approved bookings can be cancelled' },
          { status: 400 }
        )
      }

      const updated = await prisma.rentalBooking.update({
        where: { id },
        data: { status: 'cancelled' },
      })
      return NextResponse.json({ booking: updated })
    }

    // Merchant actions: approve / reject
    const membership = await prisma.merchantMember.findFirst({
      where: { merchantId: booking.merchantId, userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ error: 'Merchant access required' }, { status: 403 })
    }

    if (status === 'approved') {
      if (booking.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending bookings can be approved' }, { status: 400 })
      }
      const updated = await prisma.rentalBooking.update({
        where: { id },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: session.user.id,
        },
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
      })
      return NextResponse.json({ booking: updated })
    }

    return NextResponse.json({ error: 'Invalid status update' }, { status: 400 })
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.rentalBooking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.userId !== session.user.id) {
      return NextResponse.json({ error: 'Only the booking owner can cancel' }, { status: 403 })
    }

    if (!['pending', 'approved'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Only pending or approved bookings can be cancelled' },
        { status: 400 }
      )
    }

    const updated = await prisma.rentalBooking.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ booking: updated })
  })
}
