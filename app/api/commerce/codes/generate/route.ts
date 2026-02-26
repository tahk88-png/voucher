import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { requireMerchantRole } from '@/lib/rbac';
import { withErrorHandler } from '@/lib/error-handler';

const generateSchema = z.object({
  campaignId: z.string(),
  count: z.number().int().positive().max(100),
  prefix: z.string().optional(),
});

function buildVoucherFromCampaign(campaign: {
  merchantId: string;
  startDate: Date;
  endDate: Date;
  discountRules: unknown;
  maxRedemptions: number | null;
  merchant: { defaultCurrency: string };
}, prefix?: string) {
  const rules = (campaign.discountRules || {}) as { type?: string; value?: number; currency?: string };
  let type = 'fixed_amount';
  let value = 0;
  let currency = rules.currency || campaign.merchant.defaultCurrency || 'USD';

  if (rules.type === 'percentage') {
    type = 'percentage';
    value = Math.round((rules.value || 0) * 100);
  } else if (rules.type === 'fixed_amount') {
    type = 'fixed_amount';
    value = Math.round(rules.value || 0);
  } else if (rules.type === 'credit_amount') {
    type = 'credit_amount';
    value = Math.round(rules.value || 0);
  }

  return {
    type,
    value: value > 0 ? value : 100,
    currency,
    validFrom: campaign.startDate,
    validTo: campaign.endDate,
    usageLimitTotal: campaign.maxRedemptions ?? null,
    usageLimitPerUser: null,
    codePrefix: prefix ?? null,
  };
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = generateSchema.parse(body);

    const campaign = await prisma.campaign.findUnique({
      where: { id: data.campaignId },
      include: { merchant: true },
    });
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, campaign.merchantId, 'merchant_admin');

    const template = buildVoucherFromCampaign(campaign, data.prefix);
    const vouchers = [];
    for (let i = 0; i < data.count; i++) {
      const voucher = await prisma.voucher.create({
        data: {
          merchantId: campaign.merchantId,
          campaignId: campaign.id,
          status: 'draft',
          type: template.type,
          value: template.value,
          currency: template.currency,
          validFrom: template.validFrom,
          validTo: template.validTo,
          usageLimitTotal: template.usageLimitTotal,
          usageLimitPerUser: template.usageLimitPerUser,
          codePrefix: template.codePrefix,
        },
      });
      vouchers.push(voucher);
    }

    const codes = vouchers.map(
      (voucher) => `${voucher.codePrefix || 'V'}-${voucher.id.slice(0, 8).toUpperCase()}`
    );

    return NextResponse.json({ codes });
  });
}
