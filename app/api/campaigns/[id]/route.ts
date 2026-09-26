import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireMerchantCapability, requireMerchantProfileAccessById } from '@/lib/access-control';
import { requireCampaignActivationAccess } from '@/lib/billing';
import { dispatchMerchantAnnouncement } from '@/lib/notifications';
import { queueWebhook } from '@/lib/webhooks';
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
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;
    const campaign = await getCached(
      CacheKeys.campaignDetails(id),
      () =>
        prisma.campaign.findUnique({
          where: { id },
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
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { merchant: true },
    });

    if (!campaign || campaign.deletedAt) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Throws AccessControlError (401 not signed in / 403 not an admin member
    // of THIS campaign's merchant), which withErrorHandler maps to a JSON
    // response. requireMerchantRole threw a plain Error and surfaced as 500.
    const { profile } = await requireMerchantProfileAccessById(campaign.merchantId, 'merchant_admin');
    const userId = profile.userId;

    const body = await req.json();
    const data = updateCampaignSchema.parse(body);

    const nextStart = data.startDate !== undefined ? new Date(data.startDate) : campaign.startDate;
    const nextEnd = data.endDate !== undefined ? new Date(data.endDate) : campaign.endDate;
    if (nextEnd.getTime() <= nextStart.getTime()) {
      return NextResponse.json({ error: 'The end date must be after the start date.' }, { status: 400 });
    }
    if (data.status === 'active' && campaign.status !== 'active' && nextEnd.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'This campaign has already ended. Move the end date into the future before publishing it.' },
        { status: 400 }
      );
    }

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

    // Promotion boosts (weekly-email feature + push notification + a paid
    // promoted window) are a Pro+ capability — they place the campaign in
    // platform-wide channels. Gate ENABLING them behind promotion.boost so
    // they aren't free on Starter. Turning a boost OFF never needs the
    // entitlement.
    const enablingBoost =
      data.promotedWeeklyEmail === true ||
      data.promotedNotification === true ||
      (data.promotedUntil !== undefined && data.promotedUntil !== null);
    if (enablingBoost) {
      await requireMerchantCapability(campaign.merchantId, campaign.merchant.slug, 'promotion.boost');
    }
    if (data.promotedWeeklyEmail !== undefined) updateData.promotedWeeklyEmail = data.promotedWeeklyEmail;
    if (data.promotedNotification !== undefined) updateData.promotedNotification = data.promotedNotification;
    if (data.promotedUntil !== undefined) {
      updateData.promotedUntil = data.promotedUntil ? new Date(data.promotedUntil) : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    const previousStatus = campaign.status;

    // Activating a draft must respect the plan's activeCampaigns limit.
    // Campaigns are created as drafts (which don't count as active), so the
    // create-time check can't enforce this — gate the transition here.
    if (data.status === 'active' && previousStatus !== 'active') {
      await requireCampaignActivationAccess(campaign.merchantId);
    }

    const updated = await prisma.campaign.update({
      where: { id },
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
      // Notify merchant webhooks subscribed to campaign.started. The
      // auto-expire cron emits campaign.ended from the reverse side;
      // merchants can wire both events to track campaign lifecycle.
      queueWebhook(campaign.merchantId, 'campaign.started', {
        campaignId: updated.id,
        merchantId: campaign.merchantId,
        name: updated.name,
        type: updated.type,
        startDate: updated.startDate.toISOString(),
        endDate: updated.endDate.toISOString(),
        startedAt: new Date().toISOString(),
      });
    }

    // Symmetric path: merchant manually ends a campaign before its
    // endDate. The cron fires the same event when endDate passes
    // naturally; either way merchants get one campaign.ended webhook
    // per campaign-close transition.
    if (previousStatus !== 'ended' && updated.status === 'ended') {
      queueWebhook(campaign.merchantId, 'campaign.ended', {
        campaignId: updated.id,
        merchantId: campaign.merchantId,
        name: updated.name,
        type: updated.type,
        endDate: updated.endDate.toISOString(),
        endedAt: new Date().toISOString(),
      });
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        merchantId: campaign.merchantId,
        actorUserId: userId,
        action: 'campaign.updated',
        resourceType: 'campaign',
        resourceId: campaign.id,
        payloadJson: {
          campaignId: campaign.id,
          name: updated.name,
          changes: Object.keys(updateData),
          ...(data.status !== undefined && data.status !== previousStatus
            ? { fromStatus: previousStatus, toStatus: data.status }
            : {}),
        },
      },
    });

    await Promise.all([
      invalidateCache(CacheKeys.campaignDetails(id)),
      invalidateCache(CacheKeys.publicMerchantCampaigns(campaign.merchantId)),
    ]);

    return NextResponse.json(updated);
  });
}
