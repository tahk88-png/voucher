/**
 * In-process metrics collector for monitoring and observability.
 *
 * Collects counters, histograms, and gauges. Exposes data as JSON
 * or Prometheus exposition format. Resets on process restart.
 *
 * Usage:
 *   recordHttpRequest('GET', '/api/health', 200, 12.5);
 *   recordCacheHit('merchant:abc');
 *   recordDbQuery('User', 'findMany', 45.2);
 *   const data = getMetrics();
 *   const text = getMetricsPrometheus();
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CounterEntry {
  labels: Record<string, string>;
  value: number;
}

interface HistogramEntry {
  count: number;
  sum: number;
  values: number[]; // kept sorted for percentile calculation
  maxValues: number; // cap stored values to prevent unbounded memory
}

interface MetricsState {
  counters: Map<string, CounterEntry[]>;
  histograms: Map<string, HistogramEntry>;
  startedAt: number;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const globalForMetrics = globalThis as unknown as {
  __metrics: MetricsState | undefined;
};

function getState(): MetricsState {
  if (!globalForMetrics.__metrics) {
    globalForMetrics.__metrics = {
      counters: new Map(),
      histograms: new Map(),
      startedAt: Date.now(),
    };
  }
  return globalForMetrics.__metrics;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_HISTOGRAM_VALUES = 10_000;

function labelsKey(labels: Record<string, string>): string {
  return Object.entries(labels)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}="${v}"`)
    .join(',');
}

function incrementCounter(name: string, labels: Record<string, string>, delta = 1): void {
  const state = getState();
  let entries = state.counters.get(name);
  if (!entries) {
    entries = [];
    state.counters.set(name, entries);
  }

  const key = labelsKey(labels);
  const existing = entries.find((e) => labelsKey(e.labels) === key);
  if (existing) {
    existing.value += delta;
  } else {
    entries.push({ labels, value: delta });
  }
}

function recordHistogram(name: string, value: number): void {
  const state = getState();
  let entry = state.histograms.get(name);
  if (!entry) {
    entry = { count: 0, sum: 0, values: [], maxValues: MAX_HISTOGRAM_VALUES };
    state.histograms.set(name, entry);
  }

  entry.count++;
  entry.sum += value;

  // Keep sorted array capped at maxValues (drop oldest when full)
  if (entry.values.length < entry.maxValues) {
    insertSorted(entry.values, value);
  } else {
    // Remove first (oldest-ish) element and insert new
    entry.values.shift();
    insertSorted(entry.values, value);
  }
}

function insertSorted(arr: number[], val: number): void {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (arr[mid] < val) lo = mid + 1;
    else hi = mid;
  }
  arr.splice(lo, 0, val);
}

function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const idx = Math.ceil((p / 100) * arr.length) - 1;
  return arr[Math.max(0, idx)];
}

// ---------------------------------------------------------------------------
// Public API — Recording
// ---------------------------------------------------------------------------

export function recordHttpRequest(
  method: string,
  path: string,
  status: number,
  durationMs: number
): void {
  incrementCounter('http_requests_total', {
    method,
    path: normalizePath(path),
    status: String(status),
  });
  recordHistogram('http_request_duration_ms', durationMs);
}

export function recordCacheHit(key: string): void {
  incrementCounter('cache_hits_total', { key: cacheKeyBucket(key) });
}

export function recordCacheMiss(key: string): void {
  incrementCounter('cache_misses_total', { key: cacheKeyBucket(key) });
}

export function recordDbQuery(model: string, action: string, durationMs: number): void {
  incrementCounter('db_queries_total', { model, action });
  recordHistogram('db_query_duration_ms', durationMs);
}

export function recordCircuitTransition(
  name: string,
  fromState: string,
  toState: string
): void {
  incrementCounter('circuit_breaker_transitions_total', { name, from: fromState, to: toState });
}

/**
 * Record a rate-limit rejection. `scope` is a stable bucket (e.g.
 * "auth_otp", "api_public", "checkout") so we never feed raw user
 * identifiers to the metric labels — that would explode cardinality.
 */
export function recordRateLimitRejection(scope: string, backend: 'redis' | 'memory'): void {
  incrementCounter('rate_limit_rejections_total', { scope, backend });
}

// ---------------------------------------------------------------------------
// Public API — Reading
// ---------------------------------------------------------------------------

export interface MetricsSnapshot {
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  counters: Record<string, { labels: Record<string, string>; value: number }[]>;
  histograms: Record<
    string,
    {
      count: number;
      sum: number;
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    }
  >;
}

export function getMetrics(): MetricsSnapshot {
  const state = getState();
  const mem = process.memoryUsage();

  const counters: MetricsSnapshot['counters'] = {};
  for (const [name, entries] of state.counters) {
    counters[name] = entries.map((e) => ({ labels: { ...e.labels }, value: e.value }));
  }

  const histograms: MetricsSnapshot['histograms'] = {};
  for (const [name, entry] of state.histograms) {
    histograms[name] = {
      count: entry.count,
      sum: Math.round(entry.sum * 100) / 100,
      avg: entry.count > 0 ? Math.round((entry.sum / entry.count) * 100) / 100 : 0,
      p50: Math.round(percentile(entry.values, 50) * 100) / 100,
      p95: Math.round(percentile(entry.values, 95) * 100) / 100,
      p99: Math.round(percentile(entry.values, 99) * 100) / 100,
    };
  }

  return {
    uptime: Math.round((Date.now() - state.startedAt) / 1000),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      external: mem.external,
    },
    counters,
    histograms,
  };
}

export function getMetricsPrometheus(): string {
  const state = getState();
  const lines: string[] = [];
  const mem = process.memoryUsage();

  // Process metrics
  lines.push('# HELP process_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${Math.round((Date.now() - state.startedAt) / 1000)}`);

  lines.push('# HELP process_memory_rss_bytes Resident set size');
  lines.push('# TYPE process_memory_rss_bytes gauge');
  lines.push(`process_memory_rss_bytes ${mem.rss}`);

  lines.push('# HELP process_memory_heap_used_bytes Heap used');
  lines.push('# TYPE process_memory_heap_used_bytes gauge');
  lines.push(`process_memory_heap_used_bytes ${mem.heapUsed}`);

  // Counters
  for (const [name, entries] of state.counters) {
    lines.push(`# HELP ${name} Counter`);
    lines.push(`# TYPE ${name} counter`);
    for (const entry of entries) {
      const labelStr = labelsKey(entry.labels);
      lines.push(`${name}{${labelStr}} ${entry.value}`);
    }
  }

  // Histograms (as summary-style output)
  for (const [name, entry] of state.histograms) {
    lines.push(`# HELP ${name} Histogram`);
    lines.push(`# TYPE ${name} summary`);
    lines.push(`${name}_count ${entry.count}`);
    lines.push(`${name}_sum ${Math.round(entry.sum * 100) / 100}`);
    lines.push(`${name}{quantile="0.5"} ${Math.round(percentile(entry.values, 50) * 100) / 100}`);
    lines.push(`${name}{quantile="0.95"} ${Math.round(percentile(entry.values, 95) * 100) / 100}`);
    lines.push(`${name}{quantile="0.99"} ${Math.round(percentile(entry.values, 99) * 100) / 100}`);
  }

  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

/** Normalize API path to a pattern (collapse IDs into :id) */
function normalizePath(path: string): string {
  return path
    .replace(/\/[0-9a-f]{24,}/g, '/:id')       // MongoDB-style IDs
    .replace(/\/c[a-z0-9]{20,}/g, '/:id')       // CUID
    .replace(/\/[0-9a-f-]{36}/g, '/:id')         // UUID
    .replace(/\/\d+/g, '/:id');                   // Numeric IDs
}

/** Bucket cache keys to prevent high cardinality (e.g., "merchant:abc" → "merchant") */
function cacheKeyBucket(key: string): string {
  const idx = key.indexOf(':');
  return idx > 0 ? key.substring(0, idx) : key;
}
