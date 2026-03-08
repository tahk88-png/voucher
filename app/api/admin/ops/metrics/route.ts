import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { getMetrics, getMetricsPrometheus } from '@/lib/metrics';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.ops.metrics');

    const accept = req.headers.get('accept') || '';
    if (accept.includes('text/plain')) {
      return new NextResponse(getMetricsPrometheus(), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    return NextResponse.json(getMetrics());
  });
}
