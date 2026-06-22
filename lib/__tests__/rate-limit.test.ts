/**
 * Unit tests for lib/rate-limit.ts.
 *
 * Covers:
 * - `rateLimit` (synchronous, in-memory): first request, counting toward
 *   the limit, rejection after limit reached, window reset after expiry.
 * - `rateLimitDistributed`: delegates to Redis when REDIS_URL set, falls
 *   back to in-memory when unset.
 * - Separate keys have independent counters.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { checkRedisRateLimit } = vi.hoisted(() => ({
  checkRedisRateLimit: vi.fn(),
}));

vi.mock('../redis', () => ({
  checkRedisRateLimit,
}));

import { rateLimit, rateLimitDistributed } from '../rate-limit';

beforeEach(() => {
  vi.clearAllMocks();
  // Clear rate-limit state: use unique keys per test to avoid the in-memory
  // Map carrying over between cases.
});

describe('rateLimit (in-memory sync)', () => {
  it('allows the first request and reports accurate remaining', () => {
    const r = rateLimit('k-first', 3, 1000);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.resetAt).toBeGreaterThan(Date.now() - 10);
  });

  it('counts consecutive requests within the window', () => {
    const key = 'k-count';
    expect(rateLimit(key, 3, 1000).remaining).toBe(2);
    expect(rateLimit(key, 3, 1000).remaining).toBe(1);
    expect(rateLimit(key, 3, 1000).remaining).toBe(0);
  });

  it('rejects after limit is exceeded', () => {
    const key = 'k-reject';
    rateLimit(key, 2, 1000);
    rateLimit(key, 2, 1000);
    const third = rateLimit(key, 2, 1000);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('resets after the window expires', () => {
    const key = 'k-reset';
    // Use a 1ms window so it expires essentially immediately
    rateLimit(key, 1, 1);
    // Wait past the window
    const start = Date.now();
    while (Date.now() - start < 5) {
      /* spin */
    }
    const after = rateLimit(key, 1, 1000);
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(0);
  });

  it('keeps separate counters for different keys', () => {
    const a = rateLimit('k-a', 2, 1000);
    const b = rateLimit('k-b', 2, 1000);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
    // key k-a is independent of k-b
    rateLimit('k-a', 2, 1000);
    const aBlocked = rateLimit('k-a', 2, 1000);
    expect(aBlocked.allowed).toBe(false);
    // k-b still has capacity
    const bStillOk = rateLimit('k-b', 2, 1000);
    expect(bStillOk.allowed).toBe(true);
  });

  it('returns a resetAt timestamp that matches now + windowMs', () => {
    const before = Date.now();
    const r = rateLimit('k-reset-ts', 5, 60_000);
    const after = Date.now();
    expect(r.resetAt).toBeGreaterThanOrEqual(before + 60_000 - 5);
    expect(r.resetAt).toBeLessThanOrEqual(after + 60_000 + 5);
  });
});

describe('rateLimitDistributed', () => {
  it('delegates to Redis when REDIS_URL is set', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    checkRedisRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: Date.now() + 1000,
    });

    const r = await rateLimitDistributed('dist-key', 10, 60_000);
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(9);
    // Prefixed key + seconds from ms
    expect(checkRedisRateLimit).toHaveBeenCalledWith('rl:dist-key', 60, 10);
  });

  it('falls back to in-memory when REDIS_URL is unset', async () => {
    delete process.env.REDIS_URL;
    const r = await rateLimitDistributed('dist-mem', 2, 1000);
    expect(r.allowed).toBe(true);
    expect(checkRedisRateLimit).not.toHaveBeenCalled();
  });

  it('converts sub-second windows to at least 1 second for Redis', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    checkRedisRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 0,
      resetAt: 0,
    });
    await rateLimitDistributed('sub-sec', 5, 500); // 0.5s → ceil → 1s
    expect(checkRedisRateLimit).toHaveBeenCalledWith('rl:sub-sec', 1, 5);
  });

  it('in-memory fallback exhibits the same counting behavior as rateLimit', async () => {
    delete process.env.REDIS_URL;
    const key = 'dist-fallback-count';
    await rateLimitDistributed(key, 2, 1000);
    await rateLimitDistributed(key, 2, 1000);
    const third = await rateLimitDistributed(key, 2, 1000);
    expect(third.allowed).toBe(false);
  });
});

describe('rate-limit metrics integration', () => {
  it('bumps the rejection counter with backend="memory" when scope is provided', async () => {
    const { getMetrics } = await import('../metrics');
    const before =
      getMetrics().counters['rate_limit_rejections_total']?.find(
        (c) => c.labels.scope === 'test_scope_memory' && c.labels.backend === 'memory',
      )?.value ?? 0;

    // Exhaust the limit so the next call rejects.
    const key = 'k-metric-mem';
    rateLimit(key, 1, 1000, 'test_scope_memory');
    rateLimit(key, 1, 1000, 'test_scope_memory');

    const after =
      getMetrics().counters['rate_limit_rejections_total']?.find(
        (c) => c.labels.scope === 'test_scope_memory' && c.labels.backend === 'memory',
      )?.value ?? 0;

    expect(after).toBe(before + 1);
  });

  it('does NOT record rejections when scope is omitted (back-compat)', async () => {
    const { getMetrics } = await import('../metrics');
    const before =
      getMetrics().counters['rate_limit_rejections_total']?.reduce((sum, c) => sum + c.value, 0) ?? 0;

    const key = 'k-metric-noscope';
    rateLimit(key, 1, 1000);
    rateLimit(key, 1, 1000); // rejects

    const after =
      getMetrics().counters['rate_limit_rejections_total']?.reduce((sum, c) => sum + c.value, 0) ?? 0;

    expect(after).toBe(before);
  });

  it('tags rejections from the Redis path with backend="redis"', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';
    checkRedisRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: 0 });

    const { getMetrics } = await import('../metrics');
    const before =
      getMetrics().counters['rate_limit_rejections_total']?.find(
        (c) => c.labels.scope === 'test_scope_redis' && c.labels.backend === 'redis',
      )?.value ?? 0;

    await rateLimitDistributed('dist-metric', 1, 1000, 'test_scope_redis');

    const after =
      getMetrics().counters['rate_limit_rejections_total']?.find(
        (c) => c.labels.scope === 'test_scope_redis' && c.labels.backend === 'redis',
      )?.value ?? 0;

    expect(after).toBe(before + 1);
  });
});
