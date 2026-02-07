import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { requireCampaignCreationAccess } from '@/lib/billing';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['weekly', 'limited']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  price: z.number().int().nonnegative().nullable(),
  discountRules: z.record(z.any()).optional(),
  maxRedemptions: z.number().int().positive().nullable(),
  maxPurchases: z.number().int().positive().nullable(),
  terms: z.string().optional(),
  creditPercentage: z.number().int().min(0).max(10000).nullable(), // basis points (0-10000 = 0-100%)
});

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');
    await requireCampaignCreationAccess(merchant.id);

    const body = await req.json();
    const data = createCampaignSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        merchantId: merchant.id,
        name: data.name,
        description: data.description,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        price: data.price,
        discountRules: data.discountRules ? JSON.stringify(data.discountRules) : Prisma.DbNull,
        maxRedemptions: data.maxRedemptions,
        maxPurchases: data.maxPurchases,
        terms: data.terms,
        creditPercentage: data.creditPercentage,
        status: 'draft',
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: merchant.id,
        actorUserId: session.user.id,
        action: 'campaign.created',
        payloadJson: {
          campaignId: campaign.id,
          name: campaign.name,
          type: campaign.type,
        },
      },
    });

    return NextResponse.json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    const handled = handleError(error);
    return NextResponse.json({ error: handled.error }, { status: handled.status });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchant = await prisma.merchant.findUnique({
      where: { slug: params.slug },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, merchant.id, 'merchant_staff');

    const campaigns = await prisma.campaign.findMany({
      where: { merchantId: merchant.id },
      include: {
        vouchers: true,
        _count: {
          select: {
            vouchers: true,
            purchases: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
