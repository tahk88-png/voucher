import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AccessControlError, accessErrorResponse, requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';
import { dispatchWebhook } from '@/lib/webhooks';

const flashSaleSchema = z.object({
  isFlashSale: z.boolean(),
  flashSaleEndsAt: z.string().datetime().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{slug: string; id: string}> }
) {
  return withErrorHandler(async () => {
  const { slug, id } = await params
    const { merchant, profile } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');
    const body = await req.json();
    const data = flashSaleSchema.parse(body);

    const voucher = await prisma.voucher.findFirst({
      where: { id: id, merchantId: merchant.id },
    });
    if (!voucher) return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });

    const updated = await prisma.voucher.update({
      where: { id },
      data: {
        isFlashSale: data.isFlashSale,
        flashSaleEndsAt: data.flashSaleEndsAt ? new Date(data.flashSaleEndsAt) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: profile.userId,
        action: data.isFlashSale ? 'voucher.flash_sale_started' : 'voucher.flash_sale_ended',
        payloadJson: { voucherId: id, flashSaleEndsAt: data.flashSaleEndsAt },
      },
    });

    if (data.isFlashSale) {
      await dispatchWebhook(merchant.id, 'voucher.flash_sale_started', {
        voucherId: id,
        flashSaleEndsAt: data.flashSaleEndsAt,
      }).catch(() => {});
    }

    return NextResponse.json(updated);
  });
}
