import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getTimeSeries, getAggregation } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

type Granularity = 'hour' | 'day' | 'week' | 'month';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isPlatformAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : now;
    const from = searchParams.get('from')
      ? new Date(searchParams.get('from')!)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    const granularity = (searchParams.get('granularity') as Granularity) || 'day';

    const [
      newUsersTimeSeries,
      dauTimeSeries,
      usersByCountry,
      usersByDevice,
      visitedCount,
      registeredCount,
      verifiedCount,
      firstPurchaseCount,
      retentionData,
    ] = await Promise.all([
      // New users time series
      getTimeSeries('User', 'count', from, to, granularity),

      // DAU from analytics events (distinct userId per day)
      prisma.$queryRaw<Array<{ date: Date; value: bigint }>>`
        SELECT date_trunc('day', "createdAt") as date, COUNT(DISTINCT "userId")::bigint as value
        FROM "AnalyticsEvent"
        WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
          AND "userId" IS NOT NULL
        GROUP BY date_trunc('day', "createdAt")
        ORDER BY date ASC`,

      // Users by country
      getAggregation('AnalyticsEvent', 'count', from, to, 'country', { limit: 20 }),

      // Users by device
      getAggregation('AnalyticsEvent', 'count', from, to, 'device'),

      // Signup funnel: visited (page views)
      prisma.pageView.count({ where: { createdAt: { gte: from, lte: to } } }),

      // Signup funnel: registered
      prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),

      // Signup funnel: verified
      prisma.user.count({
        where: {
          createdAt: { gte: from, lte: to },
          emailVerified: { not: null },
        },
      }),

      // Signup funnel: first purchase (users who made at least one purchase)
      prisma.voucherPurchase.groupBy({
        by: ['userId'],
        where: { status: 'paid', createdAt: { gte: from, lte: to } },
      }).then((rows) => rows.length),

      // Retention cohort — weekly retention for last 8 weeks
      prisma.$queryRaw<Array<{ cohort_week: Date; active_week: number; users: bigint }>>`
        WITH cohorts AS (
          SELECT id, date_trunc('week', "createdAt") as cohort_week
          FROM "User"
          WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
        ),
        activity AS (
          SELECT "userId", date_trunc('week', "createdAt") as active_week
          FROM "AnalyticsEvent"
          WHERE "createdAt" >= ${from} AND "createdAt" <= ${to}
            AND "userId" IS NOT NULL
          GROUP BY "userId", date_trunc('week', "createdAt")
        )
        SELECT
          c.cohort_week,
          EXTRACT(WEEK FROM (a.active_week - c.cohort_week))::int as active_week,
          COUNT(DISTINCT c.id)::bigint as users
        FROM cohorts c
        JOIN activity a ON c.id = a."userId"
        GROUP BY c.cohort_week, active_week
        ORDER BY c.cohort_week, active_week`,
    ]);

    const dauFormatted = dauTimeSeries.map((r) => ({
      date: new Date(r.date).toISOString(),
      value: Number(r.value),
    }));

    // Format retention into a matrix
    const retentionCohort = retentionData.reduce<
      Record<string, Record<number, number>>
    >((acc, row) => {
      const week = new Date(row.cohort_week).toISOString();
      if (!acc[week]) acc[week] = {};
      acc[week][row.active_week] = Number(row.users);
      return acc;
    }, {});

    return NextResponse.json({
      newUsersTimeSeries,
      dauTimeSeries: dauFormatted,
      usersByCountry,
      usersByDevice,
      signupFunnel: {
        visited: visitedCount,
        registered: registeredCount,
        verified: verifiedCount,
        firstPurchase: firstPurchaseCount,
      },
      retentionCohort,
    });
  } catch (error) {
    logger.error('[analytics/users] Error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
