import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccessControlError, accessErrorResponse, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { CacheKeys, invalidateCache } from '@/lib/cache';
import { z } from 'zod';

const bundleSchema = z.object({
  enabled: z.boolean(),
  minQty: z.number().int().min(2).max(100).optional(),
  freeQty: z.number().int().min(1).max(10).optional(),
  discountPercent: z.number().int().min(0).max(100).optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
  const { slug, id } = await params
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    const body = await req.json();
    const data = bundleSchema.parse(body);

    const voucher = await prisma.voucher.findFirst({
      where: { id: id, merchantId: merchant.id },
    });
    if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

    const existingConditions = (voucher.conditionsJson as Record<string, unknown>) || {};
    const updatedConditions = {
      ...existingConditions,
      bundle: data.enabled ? {
        minQty: data.minQty || 2,
        freeQty: data.freeQty || 1,
        discountPercent: data.discountPercent || 0,
      } : null,
    };

    const updated = await prisma.voucher.update({
      where: { id },
      data: { conditionsJson: updatedConditions },
    });

    await invalidateCache(CacheKeys.publicMerchantVouchers(merchant.id));

    return NextResponse.json(updated);
  });
}
