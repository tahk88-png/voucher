import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { getSystemHealth } from '@/lib/admin/health';
import { getMetrics } from '@/lib/metrics';
import { getAllCircuitStatuses } from '@/lib/circuit-breaker';

export async function GET() {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.ops.dashboard');

    const [health, metrics, circuits] = await Promise.all([
      getSystemHealth(),
      Promise.resolve(getMetrics()),
      Promise.resolve(getAllCircuitStatuses()),
    ]);

    return NextResponse.json({
      health,
      metrics,
      circuits,
      timestamp: new Date().toISOString(),
    });
  });
}
