import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(200).optional(),
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
  })).optional(),
  recipientFilter: z.enum(['all', 'redeemed_30d', 'inactive']).optional(),
  scheduledAt: z.string().datetime().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_staff');

    const campaign = await prisma.emailCampaign.findFirst({
      where: { id, merchantId: merchant.id },
      include: {
        deliveries: {
          take: 50,
          orderBy: { sentAt: 'desc' },
          select: { id: true, email: true, status: true, sentAt: true, openedAt: true, clickedAt: true },
        },
        _count: { select: { deliveries: true } },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, merchantId: merchant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (existing.status === 'sent') {
      return NextResponse.json({ error: 'Cannot edit a sent campaign' }, { status: 400 });
    }

    const body = await req.json();
    const data = updateCampaignSchema.parse(body);

    const updated = await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.subject !== undefined && { subject: data.subject }),
        ...(data.sections !== undefined && { sectionsJson: data.sections }),
        ...(data.recipientFilter !== undefined && { recipientFilter: data.recipientFilter }),
        ...(data.scheduledAt !== undefined && {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          status: data.scheduledAt ? 'scheduled' : 'draft',
        }),
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const existing = await prisma.emailCampaign.findFirst({
      where: { id, merchantId: merchant.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await prisma.emailCampaign.delete({ where: { id } });

    return NextResponse.json({ success: true });
  });
}
