import { NextRequest, NextResponse } from 'next/server';
import { getMetricsPrometheus } from '@/lib/metrics';

/**
 * Prometheus scrape endpoint.
 * Authenticated via METRICS_TOKEN bearer token (no session required).
 */
export async function GET(req: NextRequest) {
  const token = process.env.METRICS_TOKEN;
  if (token) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${token}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  return new NextResponse(getMetricsPrometheus(), {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' },
  });
}
