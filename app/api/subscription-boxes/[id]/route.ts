import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

// Public box detail — box info + upcoming curated items (voucher previews),
// so a consumer can see what they'd receive before subscribing.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withErrorHandler(async () => {
    const { id } = await params;

    const box = await prisma.subscriptionBox.findFirst({
      where: { id, isActive: true },
      include: {
        merchant: { select: { name: true, slug: true } },
        items: {
          include: {
            voucher: { select: { id: true, type: true, value: true, currency: true } },
          },
          orderBy: [{ month: 'asc' }, { createdAt: 'asc' }],
        },
        _count: { select: { subscriptions: true } },
      },
    });

    if (!box) {
      return NextResponse.json({ error: 'Subscription box not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: box.id,
      name: box.name,
      description: box.description,
      priceCents: box.priceCents,
      currency: box.currency,
      interval: box.interval,
      maxItems: box.maxItems,
      merchantName: box.merchant.name,
      merchantSlug: box.merchant.slug,
      subscriberCount: box._count.subscriptions,
      items: box.items.map((it) => ({
        id: it.id,
        month: it.month,
        voucher: it.voucher
          ? { id: it.voucher.id, type: it.voucher.type, value: it.voucher.value, currency: it.voucher.currency }
          : null,
      })),
    });
  });
}
