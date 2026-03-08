import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyCampaignDigest } from '@/lib/emails';
import { withErrorHandler } from '@/lib/error-handler';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';

export const dynamic = 'force-dynamic';

function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
}

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
      }
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runId = await startJobRun('weekly-campaign-digest', 'cron');
    try {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { startDate: { gte: weekAgo } },
          {
            promotedWeeklyEmail: true,
            OR: [{ promotedUntil: null }, { promotedUntil: { gte: now } }],
          },
          {
            promotedNotification: true,
            OR: [{ promotedUntil: null }, { promotedUntil: { gte: now } }],
          },
        ],
      },
      include: {
        merchant: {
          select: { id: true, name: true, slug: true },
        },
        vouchers: {
          where: { status: 'published', validFrom: { lte: now }, validTo: { gte: now } },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const campaignsByMerchant = new Map<string, typeof campaigns>();

    for (const campaign of campaigns) {
      const list = campaignsByMerchant.get(campaign.merchantId) || [];
      list.push(campaign);
      campaignsByMerchant.set(campaign.merchantId, list);
    }

    let emailSent = 0;
    let notificationsCreated = 0;

    // Batch-load all subscriptions for relevant merchants to avoid N+1 queries
    const merchantIds = Array.from(campaignsByMerchant.keys());
    const allSubscriptions = await prisma.notificationSubscription.findMany({
      where: { merchantId: { in: merchantIds } },
      include: { user: true },
    });
    const subscriptionsByMerchant = new Map<string, typeof allSubscriptions>();
    for (const sub of allSubscriptions) {
      const list = subscriptionsByMerchant.get(sub.merchantId) || [];
      list.push(sub);
      subscriptionsByMerchant.set(sub.merchantId, list);
    }

    for (const [merchantId, merchantCampaigns] of campaignsByMerchant) {
      const subscriptions = subscriptionsByMerchant.get(merchantId) || [];

      const emailSubs = subscriptions.filter((sub) => sub.emailEnabled && sub.user.email);
      if (emailSubs.length > 0) {
        const items = merchantCampaigns
          .filter((campaign) => campaign.promotedWeeklyEmail || campaign.startDate >= weekAgo)
          .map((campaign) => {
            const url = campaign.vouchers.length > 0
              ? `${baseUrl}/v/${campaign.vouchers[0].id}`
              : `${baseUrl}/campaigns`;
            return {
              name: campaign.name,
              merchantName: campaign.merchant.name,
              url,
              dateRange: formatDateRange(campaign.startDate, campaign.endDate),
              promoted: campaign.promotedWeeklyEmail,
            };
          })
          .sort((a, b) => Number(b.promoted) - Number(a.promoted));

        if (items.length > 0) {
          for (const sub of emailSubs) {
            await sendWeeklyCampaignDigest({
              to: sub.user.email,
              title: `${merchantCampaigns[0].merchant.name} weekly updates`,
              intro: 'Here are the latest campaigns and offers.',
              items,
              footer: 'You received this because you subscribed to merchant updates.',
            });
            emailSent++;
          }
        }
      }

      const promotedCampaigns = merchantCampaigns.filter((campaign) => campaign.promotedNotification);
      if (promotedCampaigns.length > 0) {
        const inAppSubs = subscriptions.filter((sub) => sub.inAppEnabled);
        if (inAppSubs.length > 0) {
          const userIds = inAppSubs.map((sub) => sub.userId);
          const campaignUrls = promotedCampaigns.map((campaign) =>
            campaign.vouchers.length > 0
              ? `${baseUrl}/v/${campaign.vouchers[0].id}`
              : `${baseUrl}/campaigns`
          );

          // Batch load existing notifications to avoid N+1
          const existingNotifications = await prisma.notification.findMany({
            where: {
              userId: { in: userIds },
              type: 'campaign_promoted',
              url: { in: campaignUrls },
              createdAt: { gte: weekAgo },
            },
            select: { userId: true, url: true },
          });
          const existingSet = new Set(
            existingNotifications.map((n) => `${n.userId}:${n.url}`)
          );

          const toCreate: Array<{
            userId: string;
            merchantId: string;
            type: string;
            title: string;
            body: string;
            url: string;
          }> = [];

          for (const sub of inAppSubs) {
            for (let i = 0; i < promotedCampaigns.length; i++) {
              const campaign = promotedCampaigns[i];
              const url = campaignUrls[i];
              if (existingSet.has(`${sub.userId}:${url}`)) continue;
              toCreate.push({
                userId: sub.userId,
                merchantId,
                type: 'campaign_promoted',
                title: `${campaign.merchant.name} spotlight`,
                body: `Featured campaign: ${campaign.name}.`,
                url,
              });
            }
          }

          if (toCreate.length > 0) {
            await prisma.notification.createMany({ data: toCreate, skipDuplicates: true });
            notificationsCreated += toCreate.length;
          }
        }
      }
    }

    const resultData = { emailsSent: emailSent, notificationsCreated, campaignsProcessed: campaigns.length };
    await completeJobRun(runId, { status: 'succeeded', result: resultData });
    return NextResponse.json({ success: true, ...resultData });
    } catch (error) {
      await completeJobRun(runId, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}
