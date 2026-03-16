import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { getLatestMetrics } from '@/lib/metrics-collector';

export const dynamic = 'force-dynamic';

/**
 * GET /api/metrics/live
 * GET /api/metrics/live?names=active_users,revenue_today
 *
 * Returns current live values for all (or specific) dashboard metrics.
 * Admin-only endpoint.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Specific metric names requested (for polling fallback)
  const namesParam = req.nextUrl.searchParams.get('names');
  if (namesParam) {
    const names = namesParam.split(',').map((n) => n.trim()).filter(Boolean);
    const latest = await getLatestMetrics(names);
    return NextResponse.json(latest);
  }

  // Full dashboard view requires admin
  if (!isPlatformAdmin(session.user.email)) {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 },
    );
  }

  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const hourStart = new Date(now);
  hourStart.setMinutes(0, 0, 0);

  // Run all queries in parallel
  const [
    activeUsers,
    revenueToday,
    revenueThisHour,
    latestDbMetrics,
  ] = await Promise.all([
    // Active users: sessions with activity in last 5 minutes
    prisma.session.count({
      where: { lastActiveAt: { gte: fiveMinAgo } },
    }),

    // Revenue today: sum of voucher purchases (amount is in minor units / cents)
    prisma.voucherPurchase
      .aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: todayStart }, status: 'paid' },
      })
      .then((r) => (r._sum.amount ?? 0) / 100),

    // Revenue this hour
    prisma.voucherPurchase
      .aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: hourStart }, status: 'paid' },
      })
      .then((r) => (r._sum.amount ?? 0) / 100),

    // Latest buffered metrics from DB
    getLatestMetrics([
      'api_requests',
      'error_rate',
      'conversion_rate',
      'revenue_per_minute',
    ]),
  ]);

  // Server health
  const memUsage = process.memoryUsage();
  const memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const uptimeSeconds = Math.round(process.uptime());

  return NextResponse.json({
    active_users: activeUsers,
    revenue_today: revenueToday,
    revenue_this_hour: revenueThisHour,
    api_requests_per_minute: latestDbMetrics.api_requests?.value ?? 0,
    error_rate: latestDbMetrics.error_rate?.value ?? 0,
    conversion_rate: latestDbMetrics.conversion_rate?.value ?? 0,
    server_health: {
      memory_usage_mb: memoryUsageMB,
      uptime_seconds: uptimeSeconds,
    },
    timestamp: now.toISOString(),
  });
}
