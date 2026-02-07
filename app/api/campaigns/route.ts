import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { requireActiveMerchant } from '@/lib/merchant-status';
import { requireCampaignCreationAccess } from '@/lib/billing';
import { checkCampaignCreationRateLimit } from '@/lib/fraud';
import { handleError } from '@/lib/errors';
import { z } from 'zod';

const createCampaignSchema = z.object({
  merchantId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['weekly', 'limited']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  price: z.number().int().nonnegative().nullable().optional(),
  discountRules: z.record(z.any()).optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  maxPurchases: z.number().int().positive().nullable().optional(),
  terms: z.string().optional(),
  creditPercentage: z.number().int().min(0).max(10000).nullable().optional(), // basis points (0-10000 = 0-100%)
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const data = createCampaignSchema.parse(body);

    const merchant = await prisma.merchant.findUnique({
      where: { id: data.merchantId },
    });

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    await requireActiveMerchant(merchant.id);
    await requireMerchantRole(session.user.id, merchant.id, 'merchant_admin');
    await requireCampaignCreationAccess(merchant.id);

    // Check rate limit
    const rateLimit = await checkCampaignCreationRateLimit(session.user.id, merchant.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', remaining: rateLimit.remaining },
        { status: 429 }
      );
    }

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

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    // Check if user has access to merchant
    if (session?.user?.id) {
      try {
        await requireMerchantRole(session.user.id, merchantId, 'merchant_staff');
      } catch {
        // Not a merchant member - return empty or public campaigns only
        const campaigns = await prisma.campaign.findMany({
          where: {
            merchantId,
            status: 'active',
          },
          include: {
            vouchers: {
              where: { status: 'published' },
              take: 5,
            },
          },
          orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(campaigns);
      }
    }

    // Merchant member - return all campaigns
    const campaigns = await prisma.campaign.findMany({
      where: { merchantId },
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
