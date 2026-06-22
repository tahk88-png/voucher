/**
 * Admin API: Email analytics / daily stats.
 *
 * Returns the last 30 days of pre-aggregated EmailDailyStats (roll-up rows
 * where category="all" and provider="all") plus today's realtime counts
 * computed directly from EmailMessage.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.email.read');

    // --- 30 days of pre-aggregated stats ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

    const dailyStats = await prisma.emailDailyStats.findMany({
      where: {
        date: { gte: thirtyDaysAgo },
        category: 'all',
        provider: 'all',
      },
      orderBy: { date: 'asc' },
    });

    // --- Today's realtime counts from EmailMessage ---
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayCounts = await prisma.emailMessage.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: todayStart },
      },
      _count: { id: true },
    });

    const realtime: Record<string, number> = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      complained: 0,
      failed: 0,
      total: 0,
    };

    for (const row of todayCounts) {
      const status = row.status.toLowerCase();
      const count = row._count.id;
      realtime.total += count;

      switch (status) {
        case 'sent':
          realtime.sent += count;
          break;
        case 'delivered':
          realtime.delivered += count;
          break;
        case 'opened':
          realtime.opened += count;
          break;
        case 'clicked':
          realtime.clicked += count;
          break;
        case 'bounced':
          realtime.bounced += count;
          break;
        case 'complained':
          realtime.complained += count;
          break;
        case 'failed':
        case 'suppressed':
          realtime.failed += count;
          break;
        default:
          realtime.sent += count;
      }
    }

    // --- Category breakdown for today ---
    const categoryBreakdown = await prisma.emailMessage.groupBy({
      by: ['category'],
      where: {
        createdAt: { gte: todayStart },
      },
      _count: { id: true },
    });

    const categories: Record<string, number> = {};
    for (const row of categoryBreakdown) {
      categories[row.category] = row._count.id;
    }

    return NextResponse.json({
      dailyStats,
      today: {
        date: todayStart.toISOString().slice(0, 10),
        ...realtime,
        categories,
      },
    });
  });
}
