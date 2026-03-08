import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: send campaign ending notifications
 * Notifies merchants 3 days and 1 day before campaign ends.
 * Also creates in-app notifications for users with vouchers from ending campaigns.
 * Idempotent: skips if notification already sent today for the same campaign+user+type.
 * Schedule: daily at 10:00 AM
 */
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

    const runId = await startJobRun('campaign-ending-notifications', 'cron');
    try {
    const now = new Date();
    // Idempotency window: don't re-send notifications created in the last 20 hours
    const idempotencyWindow = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    const results: Record<string, { campaigns: number; notifications: number; skipped: number }> = {};

    for (const days of [3, 1]) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);
      const windowStart = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000);
      const windowEnd = new Date(targetDate.getTime() + 12 * 60 * 60 * 1000);

      const endingCampaigns = await prisma.campaign.findMany({
        where: {
          endDate: { gte: windowStart, lte: windowEnd },
          status: { in: ['active', 'published'] },
        },
        include: {
          merchant: {
            include: {
              members: {
                where: { role: { in: ['merchant_admin', 'merchant_owner'] } },
                include: { user: { select: { id: true } } },
              },
            },
          },
        },
      });

      let notificationCount = 0;
      let skippedCount = 0;

      if (endingCampaigns.length > 0) {
        // Collect all admin userIds and campaign URLs for batch idempotency check
        const adminChecks: Array<{ userId: string; url: string }> = [];
        for (const campaign of endingCampaigns) {
          const campaignUrl = `/merchant/${campaign.merchant.slug}/campaigns/${campaign.id}`;
          for (const member of campaign.merchant.members) {
            adminChecks.push({ userId: member.user.id, url: campaignUrl });
          }
        }

        // Batch load existing admin notifications
        const adminUserIds = [...new Set(adminChecks.map((c) => c.userId))];
        const adminUrls = [...new Set(adminChecks.map((c) => c.url))];
        const existingAdminNotifs = adminUserIds.length > 0 ? await prisma.notification.findMany({
          where: {
            userId: { in: adminUserIds },
            type: 'campaign_ending',
            url: { in: adminUrls },
            createdAt: { gte: idempotencyWindow },
          },
          select: { userId: true, url: true },
        }) : [];
        const existingAdminSet = new Set(existingAdminNotifs.map((n) => `${n.userId}:${n.url}`));

        // Batch load users with vouchers for all ending campaigns
        const campaignIds = endingCampaigns.map((c) => c.id);
        const allVoucherUsers = await prisma.voucherPurchase.findMany({
          where: { campaignId: { in: campaignIds }, status: 'paid' },
          select: { userId: true, campaignId: true },
          distinct: ['userId', 'campaignId'],
        });
        const voucherUsersByCampaign = new Map<string, string[]>();
        for (const vu of allVoucherUsers) {
          const list = voucherUsersByCampaign.get(vu.campaignId) || [];
          list.push(vu.userId);
          voucherUsersByCampaign.set(vu.campaignId, list);
        }

        // Batch load existing user notifications
        const allVoucherUserIds = [...new Set(allVoucherUsers.map((vu) => vu.userId))];
        const merchantIds = [...new Set(endingCampaigns.map((c) => c.merchantId))];
        const existingUserNotifs = allVoucherUserIds.length > 0 ? await prisma.notification.findMany({
          where: {
            userId: { in: allVoucherUserIds },
            type: 'campaign_ending',
            url: '/app/vouchers',
            merchantId: { in: merchantIds },
            createdAt: { gte: idempotencyWindow },
          },
          select: { userId: true, merchantId: true },
        }) : [];
        const existingUserSet = new Set(existingUserNotifs.map((n) => `${n.userId}:${n.merchantId}`));

        // Build batch of notifications to create
        const toCreate: Array<{
          userId: string;
          merchantId: string;
          type: string;
          title: string;
          body: string;
          url: string;
        }> = [];

        for (const campaign of endingCampaigns) {
          const campaignUrl = `/merchant/${campaign.merchant.slug}/campaigns/${campaign.id}`;

          // Admin notifications
          for (const member of campaign.merchant.members) {
            const key = `${member.user.id}:${campaignUrl}`;
            if (existingAdminSet.has(key)) { skippedCount++; continue; }
            toCreate.push({
              userId: member.user.id,
              merchantId: campaign.merchantId,
              type: 'campaign_ending',
              title: `Campaign "${campaign.name}" ends in ${days} ${days === 1 ? 'day' : 'days'}`,
              body: `Your campaign "${campaign.name}" is ending soon. Review performance and consider extending it.`,
              url: campaignUrl,
            });
          }

          // User notifications
          const userIds = voucherUsersByCampaign.get(campaign.id) || [];
          for (const userId of userIds) {
            const key = `${userId}:${campaign.merchantId}`;
            if (existingUserSet.has(key)) { skippedCount++; continue; }
            toCreate.push({
              userId,
              merchantId: campaign.merchantId,
              type: 'campaign_ending',
              title: `"${campaign.name}" ends in ${days} ${days === 1 ? 'day' : 'days'}`,
              body: `Don't forget to use your voucher before the campaign ends!`,
              url: '/app/vouchers',
            });
          }
        }

        if (toCreate.length > 0) {
          await prisma.notification.createMany({ data: toCreate, skipDuplicates: true });
          notificationCount = toCreate.length;
        }
      }

      results[`${days}day`] = {
        campaigns: endingCampaigns.length,
        notifications: notificationCount,
        skipped: skippedCount,
      };
    }

    await completeJobRun(runId, { status: 'succeeded', result: results });
    return NextResponse.json({ success: true, results });
    } catch (error) {
      await completeJobRun(runId, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}
