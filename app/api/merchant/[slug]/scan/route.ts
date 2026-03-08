import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { rateLimit } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/error-handler';

export async function POST(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  // Rate limit: 120 scans per minute per merchant slug
  const rl = rateLimit(`scan:${slug}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return withErrorHandler(async () => {
  const { slug } = await params
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');
    const { code } = await req.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const trimmed = code.trim().slice(0, 200); // cap length

    // 1. Search tickets by qrToken or ticketNumber
    const ticket = await prisma.ticket.findFirst({
      where: {
        merchantId: merchant.id,
        OR: [{ qrToken: trimmed }, { ticketNumber: trimmed }],
      },
      include: {
        event: { select: { name: true, eventDate: true, location: true } },
        purchase: { select: { attendeeName: true, attendeeEmail: true } },
      },
    });
    if (ticket) {
      return NextResponse.json({ type: 'ticket', data: ticket });
    }

    // 2. Search gift cards by code
    const giftCard = await prisma.giftCard.findFirst({
      where: { merchantId: merchant.id, code: trimmed },
    });
    if (giftCard) {
      return NextResponse.json({ type: 'gift_card', data: giftCard });
    }

    // 3. Search vouchers by id or codePrefix (case-insensitive)
    const voucher = await prisma.voucher.findFirst({
      where: {
        merchantId: merchant.id,
        OR: [
          { id: trimmed },
          { codePrefix: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
      include: {
        campaign: { select: { name: true } },
      },
    });
    if (voucher) {
      return NextResponse.json({ type: 'voucher', data: voucher });
    }

    return NextResponse.json({ error: 'No item found for this code' }, { status: 404 });
  });
}
