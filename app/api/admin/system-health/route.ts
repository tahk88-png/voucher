import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { getSystemHealth, getDiskUsage } from '@/lib/system-health';
import { getRealtimeStats, getTrackerBufferSize } from '@/middleware/api-tracker';
import { prisma } from '@/lib/prisma';

export async function GET() {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.ops.health');

    const [health, disk] = await Promise.all([
      getSystemHealth(),
      getDiskUsage(),
    ]);

    // Active sessions estimate (sessions created in last 24h)
    let activeSessionsCount = 0;
    try {
      activeSessionsCount = await prisma.session.count({
        where: { expires: { gt: new Date() } },
      });
    } catch {
      // Session table might not exist or use JWT only
    }

    // Cache status from tracker buffer
    const trackerStats = getRealtimeStats();

    return NextResponse.json({
      ...health,
      disk,
      activeSessionsCount,
      cache: {
        trackerBufferSize: getTrackerBufferSize(),
        recentTrackedRequests: trackerStats.recentRequests.length,
      },
      server: {
        nodeVersion: health.nodeVersion,
        platform: health.platform,
        arch: health.arch,
        pid: health.pid,
        uptime: health.uptime,
        memoryMB: {
          rss: Math.round(health.memory.rss / 1024 / 1024),
          heapTotal: Math.round(health.memory.heapTotal / 1024 / 1024),
          heapUsed: Math.round(health.memory.heapUsed / 1024 / 1024),
          external: Math.round(health.memory.external / 1024 / 1024),
        },
      },
    });
  });
}
