/**
 * Hybrid rate limiter: Redis (distributed) with in-memory fallback.
 * Uses Redis when REDIS_URL is set; otherwise in-memory per-process.
 */

import { checkRedisRateLimit } from './redis';
import { recordRateLimitRejection } from './metrics';

type RateLimitEntry = { count: number; resetAt: number };

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * In-memory rate limiter (per-process, not distributed).
 */
function rateLimitMemory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Synchronous rate limit check (in-memory only).
 * Use this for lightweight, non-critical rate limiting.
 *
 * `scope` is optional — when provided, rejections get recorded to the
 * Prometheus counter under that bucket so ops can alert on spikes.
 * Keep scope low-cardinality (e.g. "auth_password", not the raw key).
 */
export function rateLimit(key: string, limit: number, windowMs: number, scope?: string) {
  const res = rateLimitMemory(key, limit, windowMs);
  if (!res.allowed && scope) {
    recordRateLimitRejection(scope, 'memory');
  }
  return res;
}

/**
 * Distributed rate limiter using Redis (async).
 * Falls back to in-memory if Redis is unavailable.
 * Use this for production-critical rate limiting (auth, payments).
 */
export async function rateLimitDistributed(
  key: string,
  limit: number,
  windowMs: number,
  scope?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  let res: { allowed: boolean; remaining: number; resetAt: number };
  let backend: 'redis' | 'memory';

  if (process.env.REDIS_URL) {
    const windowSeconds = Math.ceil(windowMs / 1000);
    res = await checkRedisRateLimit(`rl:${key}`, windowSeconds, limit);
    backend = 'redis';
  } else {
    res = rateLimitMemory(key, limit, windowMs);
    backend = 'memory';
  }

  if (!res.allowed && scope) {
    recordRateLimitRejection(scope, backend);
  }
  return res;
}
