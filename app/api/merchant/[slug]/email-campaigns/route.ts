import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const createCampaignSchema = z.object({
  name: z.string().min(1).max(200),
  subject: z.string().min(1).max(200),
  sections: z.array(z.object({
    type: z.enum(['header', 'text', 'image', 'button', 'divider', 'voucher-card']),
    id: z.string(),
    title: z.string().optional(),
    subtitle: z.string().optional(),
    content: z.string().optional(),
    src: z.string().optional(),
    alt: z.string().optional(),
    width: z.number().optional(),
    label: z.string().optional(),
    href: z.string().optional(),
    color: z.string().optional(),
    voucherTitle: z.string().optional(),
    voucherValue: z.string().optional(),
    voucherCode: z.string().optional(),
    voucherExpiry: z.string().optional(),
  })),
  recipientFilter: z.enum(['all', 'redeemed_30d', 'inactive']).default('all'),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const campaigns = await prisma.emailCampaign.findMany({
      where: { merchantId: merchant.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { deliveries: true } },
      },
    });

    return NextResponse.json({ campaigns });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const body = await req.json();
    const data = createCampaignSchema.parse(body);

    const status = data.scheduledAt ? 'scheduled' : 'draft';

    const campaign = await prisma.emailCampaign.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        subject: data.subject,
        sectionsJson: data.sections,
        recipientFilter: data.recipientFilter,
        status,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  });
}
