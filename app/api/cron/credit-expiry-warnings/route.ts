import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCreditExpiryWarning } from '@/lib/emails';
import { sendNotification } from '@/lib/notifications-smart';
import { withErrorHandler } from '@/lib/error-handler';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint to send credit expiry warnings
 * Call this daily via Vercel Cron, GitHub Actions, or external cron service
 * 
 * Checks for credits expiring in 7 days and 1 day, sends warnings
 */
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
      }
    } else if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runId = await startJobRun('credit-expiry-warnings', 'cron');
    try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);

    // Find credits expiring in 7 days (not yet warned)
    const creditsExpiringIn7Days = await prisma.creditLedger.findMany({
      where: {
        status: 'available',
        expiresAt: {
          gte: new Date(sevenDaysFromNow.getTime() - 24 * 60 * 60 * 1000), // 6 days from now
          lte: sevenDaysFromNow,
        },
      },
      include: {
        user: true,
        merchant: true,
      },
    });

    // Find credits expiring in 1 day
    const creditsExpiringIn1Day = await prisma.creditLedger.findMany({
      where: {
        status: 'available',
        expiresAt: {
          gte: new Date(oneDayFromNow.getTime() - 12 * 60 * 60 * 1000), // 12 hours from now
          lte: oneDayFromNow,
        },
      },
      include: {
        user: true,
        merchant: true,
      },
    });

    let sent7Day = 0;
    let sent1Day = 0;

    // Dedup: check which credits already had warnings sent today
    const allCreditIds = [
      ...creditsExpiringIn7Days.map((c) => c.id),
      ...creditsExpiringIn1Day.map((c) => c.id),
    ];
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const existingWarnings = allCreditIds.length > 0
      ? await prisma.notification.findMany({
          where: {
            type: { in: ['credit_expiry_7day', 'credit_expiry_1day'] },
            url: { in: allCreditIds.map((id) => `credit:${id}`) },
            createdAt: { gte: todayStart },
          },
          select: { url: true },
        })
      : [];
    const alreadyWarned = new Set(existingWarnings.map((n) => n.url));

    // Send 7-day warnings
    for (const credit of creditsExpiringIn7Days) {
      if (!credit.user.email || !credit.merchant) continue;
      if (alreadyWarned.has(`credit:${credit.id}`)) continue;

      try {
        const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/${credit.merchant.slug}/wallet`;
        await sendCreditExpiryWarning({
          to: credit.user.email,
          merchantName: credit.merchant.name,
          creditAmount: (credit.amount / 100).toFixed(2),
          currency: credit.currency.toUpperCase(),
          daysUntilExpiry: 7,
          walletUrl,
        });
        // Smart-scheduled: 7-day warning is not urgent, deliver at optimal time
        await sendNotification({
          userId: credit.userId,
          merchantId: credit.merchantId,
          type: 'credit_expiry_7day',
          title: 'Credit expiring soon',
          body: `Your credit of ${(credit.amount / 100).toFixed(2)} ${credit.currency.toUpperCase()} expires in 7 days.`,
          url: `credit:${credit.id}`,
          urgent: false,
        });
        sent7Day++;
      } catch (error) {
        logger.error(`Error sending 7-day warning for credit ${credit.id}`, { error: error instanceof Error ? error.message : String(error) });
      }
    }

    // Send 1-day warnings
    for (const credit of creditsExpiringIn1Day) {
      if (!credit.user.email || !credit.merchant) continue;
      if (alreadyWarned.has(`credit:${credit.id}`)) continue;

      try {
        const walletUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/${credit.merchant.slug}/wallet`;
        await sendCreditExpiryWarning({
          to: credit.user.email,
          merchantName: credit.merchant.name,
          creditAmount: (credit.amount / 100).toFixed(2),
          currency: credit.currency.toUpperCase(),
          daysUntilExpiry: 1,
          walletUrl,
        });
        // Urgent: 1-day warning — deliver immediately so the user sees it in time
        await sendNotification({
          userId: credit.userId,
          merchantId: credit.merchantId,
          type: 'credit_expiry_1day',
          title: 'Credit expiring tomorrow',
          body: `Your credit of ${(credit.amount / 100).toFixed(2)} ${credit.currency.toUpperCase()} expires tomorrow.`,
          url: `credit:${credit.id}`,
          urgent: true,
        });
        sent1Day++;
      } catch (error) {
        logger.error(`Error sending 1-day warning for credit ${credit.id}`, { error: error instanceof Error ? error.message : String(error) });
      }
    }

    const resultData = {
      sent: { '7day': sent7Day, '1day': sent1Day },
      checked: { '7day': creditsExpiringIn7Days.length, '1day': creditsExpiringIn1Day.length },
    };

    await completeJobRun(runId, { status: 'succeeded', result: resultData });
    return NextResponse.json({ success: true, ...resultData });
    } catch (error) {
      await completeJobRun(runId, { status: 'failed', error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  });
}
