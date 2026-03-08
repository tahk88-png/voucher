import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;

    const giftCard = await prisma.giftCard.findUnique({
      where: { id },
      include: { merchant: { select: { name: true } } },
    });

    if (!giftCard || giftCard.status !== 'active' || !giftCard.purchasable) {
      return NextResponse.json({ error: 'Gift card not available' }, { status: 404 });
    }

    // Check expiry
    if (giftCard.validTo && new Date(giftCard.validTo) < new Date()) {
      return NextResponse.json({ error: 'Gift card has expired' }, { status: 404 });
    }

    return NextResponse.json({
      giftCard: {
        id: giftCard.id,
        amount: giftCard.amount,
        currency: giftCard.currency,
        price: giftCard.price,
        designJson: giftCard.designJson,
        message: giftCard.message,
        imageUrl: giftCard.imageUrl,
        logoUrl: giftCard.logoUrl,
        validTo: giftCard.validTo,
      },
      merchantName: giftCard.merchant.name,
    });
  });
}
