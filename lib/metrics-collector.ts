import { prisma } from '@/lib/prisma';
import { broadcastMetric } from '@/lib/realtime';
import { logger } from '@/lib/logger';

// ── Types ────────────────────────────────────────────────────────────────────

export type Granularity = 'minute' | 'hour' | 'day' | 'week' | 'month';

export interface MetricPoint {
  timestamp: string; // ISO
  value: number;
}

interface BufferedMetric {
  name: string;
  value: number;
  dimensions?: Record<string, string>;
  timestamp: Date;
}

// ── Built-in metric names ────────────────────────────────────────────────────

export const BUILT_IN_METRICS = [
  'active_users',
  'revenue_per_minute',
  'api_requests',
  'error_rate',
  'conversion_rate',
] as const;

export type BuiltInMetric = (typeof BUILT_IN_METRICS)[number];

// ── In-memory buffer (flushes every 10s) ─────────────────────────────────────

const GLOBAL_BUFFER_KEY = Symbol.for('voucher_metrics_buffer');
const GLOBAL_TIMER_KEY = Symbol.for('voucher_metrics_timer');

function getBuffer(): BufferedMetric[] {
  const g = globalThis as unknown as Record<symbol, BufferedMetric[] | undefined>;
  if (!g[GLOBAL_BUFFER_KEY]) {
    g[GLOBAL_BUFFER_KEY] = [];
  }
  return g[GLOBAL_BUFFER_KEY]!;
}

function ensureFlushTimer() {
  const g = globalThis as unknown as Record<symbol, ReturnType<typeof setInterval> | undefined>;
  if (!g[GLOBAL_TIMER_KEY]) {
    g[GLOBAL_TIMER_KEY] = setInterval(flushBuffer, 10_000);
    // Don't prevent Node from exiting
    if (g[GLOBAL_TIMER_KEY] && typeof g[GLOBAL_TIMER_KEY] === 'object' && 'unref' in g[GLOBAL_TIMER_KEY]!) {
      (g[GLOBAL_TIMER_KEY] as NodeJS.Timeout).unref();
    }
  }
}

async function flushBuffer() {
  const buffer = getBuffer();
  if (buffer.length === 0) return;

  // Drain
  const batch = buffer.splice(0, buffer.length);

  try {
    await prisma.systemMetric.createMany({
      data: batch.map((m) => ({
        name: m.name,
        value: m.value,
        dimensions: m.dimensions ?? undefined,
        timestamp: m.timestamp,
      })),
    });
  } catch (err) {
    // Put items back on failure so they're retried next flush
    buffer.unshift(...batch);
    logger.error('[metrics-collector] flush failed', { error: err instanceof Error ? err.message : String(err) });
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Record a metric value. Buffers in memory and flushes to DB every 10 seconds.
 * Also broadcasts the value over the realtime event emitter for SSE.
 */
export function recordMetric(
  name: string,
  value: number,
  dimensions?: Record<string, string>,
) {
  const now = new Date();
  const buffer = getBuffer();
  buffer.push({ name, value, dimensions, timestamp: now });
  ensureFlushTimer();

  // Also push to realtime SSE listeners
  broadcastMetric(name, value, { dimensions });
}

/**
 * Query a time series for a metric within a time range at a given granularity.
 */
export async function getMetricTimeSeries(
  name: string,
  from: Date,
  to: Date,
  granularity: Granularity,
): Promise<MetricPoint[]> {
  const truncExpr = granularityToTrunc(granularity);

  const rows = await prisma.$queryRaw<
    Array<{ bucket: Date; avg_value: number }>
  >`SELECT date_trunc(${truncExpr}, "timestamp") AS bucket,
          AVG("value") AS avg_value
     FROM "SystemMetric"
    WHERE "name" = ${name}
      AND "timestamp" >= ${from}
      AND "timestamp" <= ${to}
    GROUP BY bucket
    ORDER BY bucket ASC`;

  return rows.map((r) => ({
    timestamp: new Date(r.bucket).toISOString(),
    value: Number(r.avg_value),
  }));
}

/**
 * Get the latest recorded value for each of the supplied metric names.
 */
export async function getLatestMetrics(
  names: string[],
): Promise<Record<string, { value: number; timestamp: string }>> {
  if (names.length === 0) return {};

  // Use DISTINCT ON to get the latest row per metric name
  const rows = await prisma.$queryRaw<
    Array<{ name: string; value: number; timestamp: Date }>
  >`SELECT DISTINCT ON ("name") "name", "value", "timestamp"
     FROM "SystemMetric"
    WHERE "name" = ANY(${names})
    ORDER BY "name", "timestamp" DESC`;

  const result: Record<string, { value: number; timestamp: string }> = {};
  for (const row of rows) {
    result[row.name] = {
      value: Number(row.value),
      timestamp: new Date(row.timestamp).toISOString(),
    };
  }
  return result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function granularityToTrunc(g: Granularity): string {
  switch (g) {
    case 'minute':
      return 'minute';
    case 'hour':
      return 'hour';
    case 'day':
      return 'day';
    case 'week':
      return 'week';
    case 'month':
      return 'month';
  }
}

/**
 * Force-flush the in-memory buffer (useful before shutdown or in tests).
 */
export async function forceFlush() {
  await flushBuffer();
}
