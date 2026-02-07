import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCreditExpiryWarning } from '@/lib/emails';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint to send credit expiry warnings
 * Call this daily via Vercel Cron, GitHub Actions, or external cron service
 * 
 * Checks for credits expiring in 7 days and 1 day, sends warnings
 */
export async function GET(req: NextRequest) {
  try {
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

    // Send 7-day warnings
    for (const credit of creditsExpiringIn7Days) {
      if (!credit.user.email || !credit.merchant) continue;

      const daysUntilExpiry = Math.ceil(
        (credit.expiresAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilExpiry === 7) {
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
          sent7Day++;
        } catch (error) {
          console.error(`Error sending 7-day warning for credit ${credit.id}:`, error);
        }
      }
    }

    // Send 1-day warnings
    for (const credit of creditsExpiringIn1Day) {
      if (!credit.user.email || !credit.merchant) continue;

      const daysUntilExpiry = Math.ceil(
        (credit.expiresAt!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysUntilExpiry === 1) {
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
          sent1Day++;
        } catch (error) {
          console.error(`Error sending 1-day warning for credit ${credit.id}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent: {
        '7day': sent7Day,
        '1day': sent1Day,
      },
      checked: {
        '7day': creditsExpiringIn7Days.length,
        '1day': creditsExpiringIn1Day.length,
      },
    });
  } catch (error) {
    console.error('Error processing credit expiry warnings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
