import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { CacheKeys, invalidateCache } from '@/lib/cache';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; voucherId: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, voucherId } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const { stockQuantity, lowStockThreshold } = body;

    // Verify voucher belongs to this merchant
    const voucher = await prisma.voucher.findFirst({
      where: { id: voucherId, merchantId: merchant.id },
    });
    if (!voucher) {
      return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (stockQuantity !== undefined) {
      if (stockQuantity !== null && (typeof stockQuantity !== 'number' || stockQuantity < 0)) {
        return NextResponse.json(
          { error: 'stockQuantity must be a non-negative number or null' },
          { status: 400 }
        );
      }
      updateData.stockQuantity = stockQuantity;
    }

    if (lowStockThreshold !== undefined) {
      if (
        lowStockThreshold !== null &&
        (typeof lowStockThreshold !== 'number' || lowStockThreshold < 0)
      ) {
        return NextResponse.json(
          { error: 'lowStockThreshold must be a non-negative number or null' },
          { status: 400 }
        );
      }
      updateData.lowStockThreshold = lowStockThreshold;
    }

    const updated = await prisma.voucher.update({
      where: { id: voucherId },
      data: updateData,
      select: {
        id: true,
        type: true,
        value: true,
        currency: true,
        stockQuantity: true,
        lowStockThreshold: true,
        status: true,
      },
    });

    await invalidateCache(CacheKeys.publicMerchantVouchers(merchant.id));

    return NextResponse.json(updated);
  });
}
