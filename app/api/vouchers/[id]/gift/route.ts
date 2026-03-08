import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const giftSchema = z.object({
  toEmail: z.string().email(),
  giftMessage: z.string().max(500).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{id: string}> }) {
  return withErrorHandler(async () => {
  const { id } = await params
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { toEmail, giftMessage } = giftSchema.parse(body);

    if (toEmail.toLowerCase() === session.user.email?.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot gift to yourself' }, { status: 400 });
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id },
      select: { id: true, merchantId: true, status: true, validTo: true },
    });
    if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    if (voucher.status !== 'published') {
      return NextResponse.json({ error: 'Voucher is not available for gifting' }, { status: 400 });
    }
    if (voucher.validTo < new Date()) {
      return NextResponse.json({ error: 'Voucher has expired' }, { status: 400 });
    }

    const gift = await prisma.giftedVoucher.create({
      data: {
        fromUserId: session.user.id,
        toEmail,
        giftMessage,
        voucherId: id,
        merchantId: voucher.merchantId,
        status: 'pending',
      },
    });

    // In production: send email to toEmail with gift token
    // sendGiftEmail({ to: toEmail, token: gift.token, fromName: session.user.name, message: giftMessage, ... })

    return NextResponse.json({ gift, claimUrl: `/gifts/claim/${gift.token}` }, { status: 201 });
  });
}
