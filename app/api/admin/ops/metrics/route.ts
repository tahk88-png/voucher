import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { getMetrics, getMetricsPrometheus } from '@/lib/metrics';
import { collectOpsGauges, renderGaugesPrometheus } from '@/lib/ops-gauges';
import { logger } from '@/lib/logger';

/**
 * Admin-authenticated metrics endpoint.
 *
 * Returns the in-process counters/histograms (from getMetrics) plus
 * the DB-backed live gauges (email-queue depth, payout backlog). The
 * separate /prometheus sibling returns the same data in Prometheus
 * text format for scrapers — this route is what the /admin/ops UI
 * tab consumes as JSON.
 *
 * A gauge-collection failure does not blank the whole response; the
 * in-process block is always useful on its own.
 */
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.ops.metrics');

    const gauges = await collectOpsGauges().catch((err) => {
      logger.warn('admin metrics: gauge collection failed', {
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    });

    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/plain')) {
      return new NextResponse(getMetricsPrometheus() + renderGaugesPrometheus(gauges), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return NextResponse.json({ ...getMetrics(), gauges });
  });
}
