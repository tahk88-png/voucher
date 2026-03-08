import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;

    const merchant = await prisma.merchant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, brandLogoUrl: true },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    const now = new Date();

    const giftCards = await prisma.giftCard.findMany({
      where: {
        merchantId: merchant.id,
        purchasable: true,
        status: 'active',
        validFrom: { lte: now },
        OR: [
          { validTo: null },
          { validTo: { gt: now } },
        ],
      },
      select: {
        id: true,
        amount: true,
        currency: true,
        price: true,
        designJson: true,
        message: true,
        imageUrl: true,
        logoUrl: true,
        validTo: true,
      },
      orderBy: { amount: 'asc' },
    });

    return NextResponse.json({
      merchant: {
        name: merchant.name,
        slug: merchant.slug,
        logoUrl: merchant.brandLogoUrl,
      },
      giftCards,
    });
  });
}
