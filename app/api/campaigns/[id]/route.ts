import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireMerchantRole } from '@/lib/rbac';
import { dispatchMerchantAnnouncement } from '@/lib/notifications';
import { CacheKeys, getCached, invalidateCache } from '@/lib/cache';
import { withErrorHandler } from '@/lib/error-handler';
import { z } from 'zod';

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['weekly', 'limited']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  price: z.number().int().nonnegative().nullable().optional(),
  discountRules: z.record(z.any()).optional(),
  maxRedemptions: z.number().int().positive().nullable().optional(),
  maxPurchases: z.number().int().positive().nullable().optional(),
  terms: z.string().optional(),
  creditPercentage: z.number().int().min(0).max(10000).nullable().optional(),
  promotedWeeklyEmail: z.boolean().optional(),
  promotedNotification: z.boolean().optional(),
  promotedUntil: z.string().datetime().nullable().optional(),
  status: z.enum(['draft', 'active', 'ended']).optional(),
});

const CAMPAIGN_DETAILS_CACHE_TTL_SECONDS = 45;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    const campaign = await getCached(
      CacheKeys.campaignDetails(params.id),
      () =>
        prisma.campaign.findUnique({
          where: { id: params.id },
          include: {
            merchant: true,
            vouchers: true,
            _count: {
              select: {
                vouchers: true,
                purchases: true,
              },
            },
          },
        }),
      CAMPAIGN_DETAILS_CACHE_TTL_SECONDS
    );

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    return NextResponse.json(campaign);
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: params.id },
      include: { merchant: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await requireMerchantRole(session.user.id, campaign.merchantId, 'merchant_admin');

    const body = await req.json();
    const data = updateCampaignSchema.parse(body);

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discountRules !== undefined) updateData.discountRules = JSON.stringify(data.discountRules);
    if (data.maxRedemptions !== undefined) updateData.maxRedemptions = data.maxRedemptions;
    if (data.maxPurchases !== undefined) updateData.maxPurchases = data.maxPurchases;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.creditPercentage !== undefined) updateData.creditPercentage = data.creditPercentage;
    if (data.promotedWeeklyEmail !== undefined) updateData.promotedWeeklyEmail = data.promotedWeeklyEmail;
    if (data.promotedNotification !== undefined) updateData.promotedNotification = data.promotedNotification;
    if (data.promotedUntil !== undefined) {
      updateData.promotedUntil = data.promotedUntil ? new Date(data.promotedUntil) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    const previousStatus = campaign.status;
    const updated = await prisma.campaign.update({
      where: { id: params.id },
      data: updateData,
    });

    if (previousStatus !== 'active' && updated.status === 'active') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const url = `${baseUrl}/campaigns`;
      await dispatchMerchantAnnouncement({
        merchantId: campaign.merchantId,
        type: 'campaign_started',
        title: `${campaign.merchant.name} launched a new campaign`,
        body: `New campaign: ${updated.name}. Check out the latest offer.`,
        url,
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: campaign.merchantId,
        actorUserId: session.user.id,
        action: 'campaign.updated',
        payloadJson: {
          campaignId: campaign.id,
          changes: Object.keys(updateData),
        },
      },
    });

    await Promise.all([
      invalidateCache(CacheKeys.campaignDetails(params.id)),
      invalidateCache(CacheKeys.publicMerchantCampaigns(campaign.merchantId)),
    ]);

    return NextResponse.json(updated);
  });
}
