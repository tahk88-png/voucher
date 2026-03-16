import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { getLowStockAlerts } from '@/lib/inventory';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const vouchers = await prisma.voucher.findMany({
      where: {
        merchantId: merchant.id,
        status: { in: ['draft', 'published', 'paused'] },
      },
      select: {
        id: true,
        type: true,
        value: true,
        currency: true,
        status: true,
        stockQuantity: true,
        lowStockThreshold: true,
        validFrom: true,
        validTo: true,
        campaign: { select: { name: true } },
        _count: {
          select: {
            purchases: { where: { status: 'paid' } },
            redemptions: true,
          },
        },
      },
      orderBy: [
        { stockQuantity: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    const lowStockAlerts = await getLowStockAlerts(merchant.id);

    const inventory = vouchers.map((v) => ({
      id: v.id,
      type: v.type,
      value: v.value,
      currency: v.currency,
      status: v.status,
      stockQuantity: v.stockQuantity,
      lowStockThreshold: v.lowStockThreshold,
      campaignName: v.campaign?.name ?? null,
      validFrom: v.validFrom.toISOString(),
      validTo: v.validTo.toISOString(),
      totalPurchases: v._count.purchases,
      totalRedemptions: v._count.redemptions,
      isLowStock:
        v.stockQuantity !== null &&
        v.lowStockThreshold !== null &&
        v.stockQuantity > 0 &&
        v.stockQuantity <= v.lowStockThreshold,
      isOutOfStock: v.stockQuantity !== null && v.stockQuantity <= 0,
    }));

    return NextResponse.json({
      inventory,
      lowStockAlerts,
      totalItems: vouchers.length,
      outOfStockCount: inventory.filter((v) => v.isOutOfStock).length,
      lowStockCount: inventory.filter((v) => v.isLowStock).length,
    });
  });
}
