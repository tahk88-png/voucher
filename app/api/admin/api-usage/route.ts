import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { getApiUsageStats } from '@/lib/system-health';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.analytics.read');

    const url = new URL(req.url);
    const hours = Math.min(Math.max(parseInt(url.searchParams.get('hours') ?? '24', 10) || 24, 1), 720);
    const endpointFilter = url.searchParams.get('endpoint') ?? undefined;

    const stats = await getApiUsageStats(hours);

    // If a specific endpoint is requested, filter
    if (endpointFilter) {
      const filtered = {
        ...stats,
        topEndpoints: stats.topEndpoints.filter((e) =>
          e.endpoint.toLowerCase().includes(endpointFilter.toLowerCase()),
        ),
        slowestEndpoints: stats.slowestEndpoints.filter((e) =>
          e.endpoint.toLowerCase().includes(endpointFilter.toLowerCase()),
        ),
      };
      return NextResponse.json(filtered);
    }

    return NextResponse.json(stats);
  });
}
