import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const generateVouchersSchema = z.object({
  count: z.number().int().positive().max(100), // Limit to 100 at a time
  voucherData: z.object({
    type: z.enum(['percentage', 'fixed_amount', 'credit_amount']),
    value: z.number().int().positive(),
    currency: z.string(),
    validFrom: z.string().datetime(),
    validTo: z.string().datetime(),
    usageLimitTotal: z.number().int().positive().nullable().optional(),
    usageLimitPerUser: z.number().int().positive().nullable().optional(),
    codePrefix: z.string().optional(),
    designJson: z.record(z.any()).optional(),
  }),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, campaign.merchantId, 'merchant_admin');

    const body = await req.json();
    const { count, voucherData } = generateVouchersSchema.parse(body);

    // Generate vouchers
    const vouchers = [];
    for (let i = 0; i < count; i++) {
      const voucher = await prisma.voucher.create({
        data: {
          merchantId: campaign.merchantId,
          campaignId: campaign.id,
          status: 'draft', // Start as draft, merchant can publish later
          type: voucherData.type,
          value: voucherData.value,
          currency: voucherData.currency,
          validFrom: new Date(voucherData.validFrom),
          validTo: new Date(voucherData.validTo),
          usageLimitTotal: voucherData.usageLimitTotal ?? null,
          usageLimitPerUser: voucherData.usageLimitPerUser ?? null,
          codePrefix: voucherData.codePrefix ?? null,
          designJson: voucherData.designJson ? JSON.stringify(voucherData.designJson) : Prisma.DbNull,
        },
      });
      vouchers.push(voucher);
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: campaign.merchantId,
        actorUserId: session.user.id,
        action: 'vouchers.generated',
        payloadJson: {
          campaignId: campaign.id,
          count: vouchers.length,
        },
      },
    });

    return NextResponse.json({ vouchers, count: vouchers.length });
  });
}
