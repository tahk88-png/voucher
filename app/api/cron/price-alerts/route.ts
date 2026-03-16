import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendNotification } from '@/lib/notifications-smart';
import { withErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: check wishlist price alerts and notify users
 * when a voucher's value has dropped below their alertPrice threshold.
 */
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find wishlist items with price alerts enabled that haven't been notified recently
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const alertItems = await prisma.wishlistItem.findMany({
      where: {
        priceAlert: true,
        alertPrice: { not: null },
        voucherId: { not: null },
        OR: [
          { notifiedAt: null },
          { notifiedAt: { lt: oneDayAgo } },
        ],
      },
      include: {
        voucher: {
          select: {
            id: true,
            value: true,
            currency: true,
            type: true,
            status: true,
            merchant: { select: { name: true } },
          },
        },
        user: { select: { id: true, name: true } },
      },
    });

    let notified = 0;

    for (const item of alertItems) {
      if (!item.voucher || !item.alertPrice) continue;
      if (item.voucher.status !== 'published') continue;

      // Compare voucher value with alert price
      // For fixed_amount and credit_amount, the value is the price in minor units
      if (item.voucher.value <= item.alertPrice) {
        try {
          // Smart scheduling: price alerts are time-sensitive but not
          // urgent — deliver at the user's optimal engagement time.
          await sendNotification({
            userId: item.user.id,
            type: 'price_alert',
            title: 'Price Drop Alert',
            body: `The voucher from ${item.voucher.merchant?.name || 'a merchant'} has dropped to ${(item.voucher.value / 100).toFixed(2)} ${item.voucher.currency}!`,
            url: `/app/voucher/${item.voucher.id}`,
            urgent: false,
          });

          await prisma.wishlistItem.update({
            where: { id: item.id },
            data: { notifiedAt: new Date() },
          });

          notified++;
        } catch (err) {
          logger.error('Failed to send price alert notification', { itemId: item.id, err });
        }
      }
    }

    logger.info(`Price alerts: checked ${alertItems.length}, notified ${notified}`);

    return NextResponse.json({
      checked: alertItems.length,
      notified,
    });
  });
}
