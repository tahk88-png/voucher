import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export async function GET() {
  return withErrorHandler(async () => {
    const boxes = await prisma.subscriptionBox.findMany({
      where: { isActive: true },
      include: {
        merchant: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(
      boxes.map((b: any) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        priceCents: b.priceCents,
        currency: b.currency,
        interval: b.interval,
        merchantName: b.merchant.name,
        merchantSlug: b.merchant.slug,
      })),
    );
  });
}
