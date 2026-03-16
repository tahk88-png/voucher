import { prisma } from '@/lib/prisma';

export interface StockInfo {
  voucherId: string;
  stockQuantity: number | null;
  lowStockThreshold: number | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

/**
 * Check current stock for a voucher.
 * Returns null stockQuantity if stock is unlimited.
 */
export async function checkStock(voucherId: string): Promise<StockInfo> {
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    select: { id: true, stockQuantity: true, lowStockThreshold: true },
  });

  if (!voucher) {
    throw new Error('Voucher not found');
  }

  const isOutOfStock = voucher.stockQuantity !== null && voucher.stockQuantity <= 0;
  const isLowStock =
    voucher.stockQuantity !== null &&
    voucher.lowStockThreshold !== null &&
    voucher.stockQuantity > 0 &&
    voucher.stockQuantity <= voucher.lowStockThreshold;

  return {
    voucherId: voucher.id,
    stockQuantity: voucher.stockQuantity,
    lowStockThreshold: voucher.lowStockThreshold,
    isLowStock,
    isOutOfStock,
  };
}

/**
 * Decrement stock for a voucher.
 * Uses optimistic concurrency to prevent overselling.
 * Returns true if stock was successfully decremented, false if out of stock.
 */
export async function decrementStock(
  voucherId: string,
  qty: number = 1
): Promise<boolean> {
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucherId },
    select: { stockQuantity: true },
  });

  if (!voucher) {
    throw new Error('Voucher not found');
  }

  // Unlimited stock — no need to decrement
  if (voucher.stockQuantity === null) {
    return true;
  }

  if (voucher.stockQuantity < qty) {
    return false;
  }

  // Atomically decrement, ensuring no oversell
  const result = await prisma.voucher.updateMany({
    where: {
      id: voucherId,
      stockQuantity: { gte: qty },
    },
    data: {
      stockQuantity: { decrement: qty },
    },
  });

  return result.count > 0;
}

export interface LowStockAlert {
  voucherId: string;
  voucherType: string;
  voucherValue: number;
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  campaignName: string | null;
  validTo: string;
}

/**
 * Get all vouchers with low stock for a merchant
 */
export async function getLowStockAlerts(
  merchantId: string
): Promise<LowStockAlert[]> {
  const vouchers = await prisma.voucher.findMany({
    where: {
      merchantId,
      stockQuantity: { not: null },
      status: { in: ['draft', 'published'] },
      lowStockThreshold: { not: null },
    },
    include: {
      campaign: { select: { name: true } },
    },
    orderBy: { stockQuantity: 'asc' },
  });

  return vouchers
    .filter(
      (v) =>
        v.stockQuantity !== null &&
        v.lowStockThreshold !== null &&
        v.stockQuantity <= v.lowStockThreshold
    )
    .map((v) => ({
      voucherId: v.id,
      voucherType: v.type,
      voucherValue: v.value,
      currency: v.currency,
      stockQuantity: v.stockQuantity!,
      lowStockThreshold: v.lowStockThreshold!,
      campaignName: v.campaign?.name ?? null,
      validTo: v.validTo.toISOString(),
    }));
}
