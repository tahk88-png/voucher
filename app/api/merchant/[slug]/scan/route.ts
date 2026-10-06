import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { rateLimit } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/error-handler';
import { DEFAULT_VOUCHER_CODE_PREFIX, parseScanCode } from '@/lib/voucher-code';

export async function POST(req: NextRequest, { params }: { params: Promise<{slug: string}> }) {
  const { slug } = await params;
  // Rate limit: 120 scans per minute per merchant slug
  const rl = rateLimit(`scan:${slug}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  return withErrorHandler(async () => {
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

    // 3. Vouchers. Customers are shown "PREFIX-XXXXXXXX" (prefix + first 8
    // chars of the id) and a QR code encoding the public /v/<id> URL, so
    // accept both, plus the raw id and the legacy prefix-only lookup.
    // Every lookup is scoped to this merchant.
    const parsed = parseScanCode(trimmed);
    const voucherInclude = { campaign: { select: { name: true } } } as const;

    if (parsed.kind === 'voucher_id') {
      const byUrl = await prisma.voucher.findFirst({
        where: { merchantId: merchant.id, id: parsed.id, deletedAt: null },
        include: voucherInclude,
      });
      if (byUrl) return NextResponse.json({ type: 'voucher', data: byUrl });
      return NextResponse.json(
        { error: 'This voucher link does not belong to your business or no longer exists.' },
        { status: 404 }
      );
    }

    if (parsed.kind === 'voucher_code') {
      const matches = await prisma.voucher.findMany({
        where: {
          merchantId: merchant.id,
          deletedAt: null,
          id: { startsWith: parsed.idFragment, mode: 'insensitive' },
          ...(parsed.prefix === DEFAULT_VOUCHER_CODE_PREFIX
            ? { OR: [{ codePrefix: null }, { codePrefix: '' }, { codePrefix: { equals: parsed.prefix, mode: 'insensitive' as const } }] }
            : { codePrefix: { equals: parsed.prefix, mode: 'insensitive' as const } }),
        },
        include: voucherInclude,
        take: 2,
      });
      if (matches.length === 1) {
        return NextResponse.json({ type: 'voucher', data: matches[0] });
      }
      if (matches.length > 1) {
        return NextResponse.json(
          { error: 'More than one voucher matches this code. Scan the QR code instead.' },
          { status: 409 }
        );
      }
    }

    const voucher = await prisma.voucher.findFirst({
      where: {
        merchantId: merchant.id,
        deletedAt: null,
        OR: [
          { id: trimmed },
          { codePrefix: { equals: trimmed, mode: 'insensitive' } },
        ],
      },
      include: voucherInclude,
    });
    if (voucher) {
      return NextResponse.json({ type: 'voucher', data: voucher });
    }

    return NextResponse.json({ error: 'No item found for this code' }, { status: 404 });
  });
}
