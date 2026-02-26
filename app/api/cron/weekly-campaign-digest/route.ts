import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyCampaignDigest } from '@/lib/emails';
import { withErrorHandler } from '@/lib/error-handler';

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

    for (const [merchantId, merchantCampaigns] of campaignsByMerchant) {
      const subscriptions = await prisma.notificationSubscription.findMany({
        where: { merchantId },
        include: { user: true },
      });

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
        for (const sub of inAppSubs) {
          for (const campaign of promotedCampaigns) {
            const url = campaign.vouchers.length > 0
              ? `${baseUrl}/v/${campaign.vouchers[0].id}`
              : `${baseUrl}/campaigns`;
            const recent = await prisma.notification.findFirst({
              where: {
                userId: sub.userId,
                type: 'campaign_promoted',
                url,
                createdAt: { gte: weekAgo },
              },
            });
            if (recent) continue;
            await prisma.notification.create({
              data: {
                userId: sub.userId,
                merchantId,
                type: 'campaign_promoted',
                title: `${campaign.merchant.name} spotlight`,
                body: `Featured campaign: ${campaign.name}.`,
                url,
              },
            });
            notificationsCreated++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailSent,
      notificationsCreated,
      campaignsProcessed: campaigns.length,
    });
  });
}
