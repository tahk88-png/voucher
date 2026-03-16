/**
 * System health collector with in-memory caching.
 *
 * Provides memory/uptime/DB connectivity info, API usage stats,
 * error stats, and disk usage (where available).
 */

import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SystemHealthSnapshot = {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    heapUsedPercent: number;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs: number;
    error?: string;
  };
  activeConnectionsEstimate: number;
  timestamp: string;
};

export type ApiUsageStats = {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgResponseMs: number;
  requestsByHour: { hour: string; count: number; errors: number }[];
  topEndpoints: { endpoint: string; count: number; avgMs: number; errorPercent: number }[];
  slowestEndpoints: { endpoint: string; avgMs: number; count: number }[];
};

export type ErrorStats = {
  totalErrors: number;
  errorsByType: { type: string; count: number }[];
  recentErrors: {
    id: string;
    timestamp: string;
    action: string;
    resourceType?: string;
    message?: string;
    userId?: string;
    ipAddress?: string;
  }[];
};

// ---------------------------------------------------------------------------
// In-memory cache (30 seconds TTL)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30_000;

type CacheEntry<T> = { data: T; expiresAt: number };

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T): T {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

// ---------------------------------------------------------------------------
// getSystemHealth
// ---------------------------------------------------------------------------

export async function getSystemHealth(): Promise<SystemHealthSnapshot> {
  const cached = getCached<SystemHealthSnapshot>('system-health');
  if (cached) return cached;

  const mem = process.memoryUsage();

  // Database connectivity check
  let dbStatus: SystemHealthSnapshot['database'];
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = { status: 'connected', latencyMs: Date.now() - dbStart };
  } catch (err: any) {
    dbStatus = {
      status: 'disconnected',
      latencyMs: Date.now() - dbStart,
      error: err?.message ?? 'Unknown error',
    };
  }

  // Estimate active connections via Prisma metrics (approximate)
  let activeConnectionsEstimate = 0;
  try {
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'
    `;
    activeConnectionsEstimate = Number(result[0]?.count ?? 0);
  } catch {
    // Not available (e.g. insufficient permissions) — leave at 0
  }

  const snapshot: SystemHealthSnapshot = {
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: mem.external,
      arrayBuffers: mem.arrayBuffers,
      heapUsedPercent: mem.heapTotal > 0 ? Math.round((mem.heapUsed / mem.heapTotal) * 100) : 0,
    },
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    database: dbStatus,
    activeConnectionsEstimate,
    timestamp: new Date().toISOString(),
  };

  return setCache('system-health', snapshot);
}

// ---------------------------------------------------------------------------
// getApiUsageStats
// ---------------------------------------------------------------------------

export async function getApiUsageStats(hours: number = 24): Promise<ApiUsageStats> {
  const cacheKey = `api-usage-${hours}`;
  const cached = getCached<ApiUsageStats>(cacheKey);
  if (cached) return cached;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  // Pull from AuditLog where action starts with "api." or any action for generic tracking
  const logs = await prisma.auditLog.findMany({
    where: { createdAt: { gte: since } },
    select: {
      id: true,
      action: true,
      resourceType: true,
      createdAt: true,
      payloadJson: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10000,
  });

  const totalRequests = logs.length;

  // Extract duration and error status from payloadJson if available
  type LogWithMeta = {
    action: string;
    createdAt: Date;
    duration?: number;
    isError?: boolean;
  };

  const enriched: LogWithMeta[] = logs.map((log) => {
    const payload = log.payloadJson as Record<string, unknown> | null;
    return {
      action: log.action,
      createdAt: log.createdAt,
      duration: typeof payload?.durationMs === 'number' ? payload.durationMs : undefined,
      isError:
        payload?.statusCode != null
          ? Number(payload.statusCode) >= 400
          : log.action.toLowerCase().includes('error'),
    };
  });

  const errorCount = enriched.filter((l) => l.isError).length;
  const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;

  const durations = enriched.filter((l) => l.duration != null).map((l) => l.duration!);
  const avgResponseMs =
    durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  // Group by hour
  const hourBuckets = new Map<string, { count: number; errors: number }>();
  for (const log of enriched) {
    const hourKey = new Date(log.createdAt).toISOString().slice(0, 13) + ':00:00Z';
    const bucket = hourBuckets.get(hourKey) ?? { count: 0, errors: 0 };
    bucket.count++;
    if (log.isError) bucket.errors++;
    hourBuckets.set(hourKey, bucket);
  }
  const requestsByHour = Array.from(hourBuckets.entries())
    .map(([hour, data]) => ({ hour, ...data }))
    .sort((a, b) => a.hour.localeCompare(b.hour));

  // Group by endpoint (action)
  const endpointMap = new Map<
    string,
    { count: number; totalMs: number; errors: number }
  >();
  for (const log of enriched) {
    const ep = endpointMap.get(log.action) ?? { count: 0, totalMs: 0, errors: 0 };
    ep.count++;
    if (log.duration != null) ep.totalMs += log.duration;
    if (log.isError) ep.errors++;
    endpointMap.set(log.action, ep);
  }

  const topEndpoints = Array.from(endpointMap.entries())
    .map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      avgMs: data.count > 0 ? Math.round(data.totalMs / data.count) : 0,
      errorPercent: data.count > 0 ? Math.round((data.errors / data.count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const slowestEndpoints = Array.from(endpointMap.entries())
    .filter(([, d]) => d.totalMs > 0)
    .map(([endpoint, data]) => ({
      endpoint,
      avgMs: data.count > 0 ? Math.round(data.totalMs / data.count) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 10);

  const stats: ApiUsageStats = {
    totalRequests,
    errorCount,
    errorRate,
    avgResponseMs,
    requestsByHour,
    topEndpoints,
    slowestEndpoints,
  };

  return setCache(cacheKey, stats);
}

// ---------------------------------------------------------------------------
// getErrorStats
// ---------------------------------------------------------------------------

export async function getErrorStats(hours: number = 24): Promise<ErrorStats> {
  const cacheKey = `error-stats-${hours}`;
  const cached = getCached<ErrorStats>(cacheKey);
  if (cached) return cached;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const errorLogs = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: since },
      OR: [
        { action: { contains: 'error' } },
        { action: { contains: 'Error' } },
        { action: { contains: 'fail' } },
        { action: { contains: 'Fail' } },
      ],
    },
    select: {
      id: true,
      action: true,
      resourceType: true,
      reason: true,
      actorUserId: true,
      ipAddress: true,
      createdAt: true,
      payloadJson: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });

  const totalErrors = errorLogs.length;

  // Group by action type
  const typeMap = new Map<string, number>();
  for (const log of errorLogs) {
    const type = log.resourceType ?? log.action;
    typeMap.set(type, (typeMap.get(type) ?? 0) + 1);
  }
  const errorsByType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  const recentErrors = errorLogs.slice(0, 50).map((log) => {
    const payload = log.payloadJson as Record<string, unknown> | null;
    return {
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      resourceType: log.resourceType ?? undefined,
      message: (payload?.message as string) ?? log.reason ?? undefined,
      userId: log.actorUserId,
      ipAddress: log.ipAddress ?? undefined,
    };
  });

  const stats: ErrorStats = { totalErrors, errorsByType, recentErrors };
  return setCache(cacheKey, stats);
}

// ---------------------------------------------------------------------------
// getDiskUsage (best-effort, Node.js 18.15+ or skip)
// ---------------------------------------------------------------------------

export type DiskUsage = {
  available: boolean;
  totalBytes?: number;
  freeBytes?: number;
  usedPercent?: number;
};

export async function getDiskUsage(): Promise<DiskUsage> {
  const cached = getCached<DiskUsage>('disk-usage');
  if (cached) return cached;

  try {
    // Node 18.15+ has fs.statfs
    const fs = await import('fs/promises');
    if (typeof (fs as any).statfs === 'function') {
      const stat = await (fs as any).statfs('/');
      const totalBytes = stat.bsize * stat.blocks;
      const freeBytes = stat.bsize * stat.bavail;
      const usage: DiskUsage = {
        available: true,
        totalBytes,
        freeBytes,
        usedPercent: totalBytes > 0 ? Math.round(((totalBytes - freeBytes) / totalBytes) * 100) : 0,
      };
      return setCache('disk-usage', usage);
    }
  } catch {
    // Not available
  }

  return setCache('disk-usage', { available: false });
}
