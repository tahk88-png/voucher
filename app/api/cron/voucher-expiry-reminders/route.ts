import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendVoucherExpiryReminder } from '@/lib/emails';
import { withErrorHandler } from '@/lib/error-handler';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint: send voucher expiry reminders
 * Checks for vouchers expiring in 3 days and 1 day, sends warnings to users who purchased them
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

    const runId = await startJobRun('voucher-expiry-reminders', 'cron');
    try {
    const now = new Date();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Find vouchers expiring in ~3 days and ~1 day
    const windows = [
      { days: 3, label: '3day' },
      { days: 1, label: '1day' },
    ];

    const results: Record<string, { checked: number; sent: number }> = {};

    for (const { days, label } of windows) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + days);

      // Find vouchers expiring within a 24h window around the target
      const windowStart = new Date(targetDate.getTime() - 12 * 60 * 60 * 1000);
      const windowEnd = new Date(targetDate.getTime() + 12 * 60 * 60 * 1000);

      // Find purchases for vouchers that are expiring in this window
      const expiringPurchases = await prisma.voucherPurchase.findMany({
        where: {
          status: 'paid',
          voucher: {
            validTo: {
              gte: windowStart,
              lte: windowEnd,
            },
            status: 'published',
          },
        },
        include: {
          user: { select: { email: true } },
          voucher: {
            include: {
              campaign: { select: { name: true } },
              merchant: { select: { name: true } },
            },
          },
        },
      });

      let sent = 0;
      for (const purchase of expiringPurchases) {
        if (!purchase.user.email || !purchase.voucher) continue;

        try {
          await sendVoucherExpiryReminder({
            to: purchase.user.email,
            merchantName: purchase.voucher.merchant.name,
            voucherName: purchase.voucher.campaign?.name || 'Voucher',
            daysUntilExpiry: days,
            voucherUrl: `${appUrl}/app/voucher/${purchase.voucher.id}`,
          });
          sent++;
        } catch (error) {
          logger.error(`Error sending ${days}-day voucher expiry warning`, { error: error instanceof Error ? error.message : String(error) });
        }
      }

      results[label] = { checked: expiringPurchases.length, sent };
    }

    await completeJobRun(runId, { status: 'succeeded', result: results });
    return NextResponse.json({ success: true, results });
    } catch (error) {
      await completeJobRun(runId, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}
