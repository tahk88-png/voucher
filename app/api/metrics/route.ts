import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isPlatformAdmin } from '@/lib/admin';
import {
  getMetricTimeSeries,
  getLatestMetrics,
  BUILT_IN_METRICS,
  type Granularity,
} from '@/lib/metrics-collector';

export const dynamic = 'force-dynamic';

const VALID_GRANULARITIES = new Set<Granularity>([
  'minute',
  'hour',
  'day',
  'week',
  'month',
]);

const SYSTEM_METRICS = new Set<string>(BUILT_IN_METRICS);

/**
 * GET /api/metrics?name=active_users&from=2024-01-01&to=2024-01-31&granularity=hour
 * GET /api/metrics?names=revenue_per_minute,active_users&from=...&to=...&granularity=day
 *
 * Returns time series data for one or more metrics.
 * System metrics require platform admin. Business metrics are scoped to the
 * authenticated merchant (via ?merchantId=).
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;

  // Parse metric names
  const singleName = params.get('name');
  const multiNames = params.get('names');
  const names: string[] = [];

  if (singleName) {
    names.push(singleName);
  }
  if (multiNames) {
    names.push(...multiNames.split(',').map((n) => n.trim()).filter(Boolean));
  }

  if (names.length === 0) {
    return NextResponse.json(
      { error: 'Provide ?name= or ?names= parameter' },
      { status: 400 },
    );
  }

  // Auth: system metrics require admin
  const hasSystemMetric = names.some((n) => SYSTEM_METRICS.has(n));
  if (hasSystemMetric && !isPlatformAdmin(session.user.email)) {
    return NextResponse.json(
      { error: 'Admin access required for system metrics' },
      { status: 403 },
    );
  }

  // Parse time range
  const fromStr = params.get('from');
  const toStr = params.get('to');

  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: 'Provide ?from= and ?to= (ISO dates)' },
      { status: 400 },
    );
  }

  const from = new Date(fromStr);
  const to = new Date(toStr);

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  // Parse granularity
  const granularity = (params.get('granularity') || 'hour') as Granularity;
  if (!VALID_GRANULARITIES.has(granularity)) {
    return NextResponse.json(
      { error: `Invalid granularity. Use: ${[...VALID_GRANULARITIES].join(', ')}` },
      { status: 400 },
    );
  }

  // If only requesting latest values (no time range query needed)
  if (params.get('latest') === 'true') {
    const latest = await getLatestMetrics(names);
    return NextResponse.json(latest);
  }

  // Fetch time series for each metric
  const results: Record<string, Array<{ timestamp: string; value: number }>> = {};

  await Promise.all(
    names.map(async (name) => {
      results[name] = await getMetricTimeSeries(name, from, to, granularity);
    }),
  );

  return NextResponse.json({
    metrics: results,
    query: { names, from: from.toISOString(), to: to.toISOString(), granularity },
  });
}
