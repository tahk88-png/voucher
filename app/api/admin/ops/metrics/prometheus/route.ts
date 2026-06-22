import { NextRequest, NextResponse } from 'next/server';
import { getMetricsPrometheus } from '@/lib/metrics';
import { collectOpsGauges, renderGaugesPrometheus } from '@/lib/ops-gauges';
import { logger } from '@/lib/logger';

/**
 * Prometheus scrape endpoint.
 *
 * Emits two blocks concatenated:
 *   1. In-process counters/histograms (http, cache, db, rate-limits…)
 *   2. DB-backed live gauges (email queue depth, payout backlog)
 *
 * Auth: optional bearer token via METRICS_TOKEN. When unset (dev),
 * the endpoint is open — production deployments must set the var.
 */
export async function GET(req: NextRequest) {
  const token = process.env.METRICS_TOKEN;
  if (token) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${token}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  let gaugeBlock = '';
  try {
    const gauges = await collectOpsGauges();
    gaugeBlock = renderGaugesPrometheus(gauges);
  } catch (err) {
    // A DB hiccup must never blank the whole scrape — the in-process
    // block is still useful. Log and move on with an empty gauge block.
    logger.warn('ops gauges failed', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const body = getMetricsPrometheus() + gaugeBlock;
  return new NextResponse(body, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
}
