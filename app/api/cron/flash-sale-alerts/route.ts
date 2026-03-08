import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pushNotifyUser } from '@/lib/push-notify';
import { withErrorHandler } from '@/lib/error-handler';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const cronSecret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret');
    if (cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runId = await startJobRun('flash-sale-alerts', 'cron');
    try {
    // Find flash sale vouchers that just started (within last hour) and are published
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const flashVouchers = await prisma.voucher.findMany({
      where: {
        isFlashSale: true,
        status: 'published',
        validFrom: { gte: oneHourAgo, lte: new Date() },
        flashSaleEndsAt: { gt: new Date() },
      },
      include: {
        merchant: { select: { name: true, id: true } },
      },
      take: 20,
    });

    let notified = 0;

    if (flashVouchers.length > 0) {
      // Batch load all subscriptions for the relevant merchants
      const merchantIds = [...new Set(flashVouchers.map((v) => v.merchantId))];
      const allSubscriptions = await prisma.notificationSubscription.findMany({
        where: { merchantId: { in: merchantIds }, pushEnabled: true },
        select: { userId: true, merchantId: true },
      });
      const subsByMerchant = new Map<string, string[]>();
      for (const sub of allSubscriptions) {
        const list = subsByMerchant.get(sub.merchantId) || [];
        list.push(sub.userId);
        subsByMerchant.set(sub.merchantId, list);
      }

      for (const voucher of flashVouchers) {
        const userIds = subsByMerchant.get(voucher.merchantId) || [];
        const pushPromises = userIds.map((userId) =>
          pushNotifyUser(userId, {
            title: `Flash Sale at ${voucher.merchant.name}!`,
            body: `Limited time offer — ends ${voucher.flashSaleEndsAt ? new Date(voucher.flashSaleEndsAt).toLocaleTimeString() : 'soon'}`,
            url: `/app`,
          }).catch(() => {})
        );
        await Promise.all(pushPromises);
        notified += userIds.length;
      }
    }

    const resultData = { flashVouchersFound: flashVouchers.length, notified };
    await completeJobRun(runId, { status: 'succeeded', result: resultData });
    return NextResponse.json(resultData);
    } catch (error) {
      await completeJobRun(runId, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}
