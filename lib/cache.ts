/**
 * Caching layer using Redis (production) or in-memory (development)
 *
 * Usage:
 *   const cached = await getCached('key', async () => fetchData(), 3600);
 *   await set('key', data, 3600);
 *   await invalidateCache('key');
 */

import { getRedisClient } from './redis';
import { recordCacheHit, recordCacheMiss } from './metrics';
import { logger } from './logger';

// In-memory fallback cache
const memoryCache = new Map<string, { value: any; expiresAt: number }>();

/**
 * Get cached value or compute and cache
 */
export async function getCached<T>(
  key: string,
  computeFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cached = await get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await computeFn();
  await set(key, value, ttlSeconds);
  return value;
}

/**
 * Get cached value
 */
export async function get<T>(key: string): Promise<T | null> {
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const value = await redisClient.get(key);
      if (value) {
        recordCacheHit(key);
        return JSON.parse(value);
      }
      recordCacheMiss(key);
      return null;
    } catch (error) {
      logger.error('Redis get error', { key, error: error instanceof Error ? error.message : String(error) });
      recordCacheMiss(key);
      return null;
    }
  }

  // Fallback to memory cache
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    recordCacheHit(key);
    return cached.value as T;
  }
  if (cached) {
    memoryCache.delete(key);
  }
  recordCacheMiss(key);
  return null;
}

/**
 * Set cached value
 */
export async function set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
      return;
    } catch (error) {
      logger.error('Redis set error', { key, error: error instanceof Error ? error.message : String(error) });
    }
  }

  // Fallback to memory cache
  memoryCache.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate cache
 */
export async function invalidateCache(key: string): Promise<void> {
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Redis delete error', { key, error: error instanceof Error ? error.message : String(error) });
    }
  }

  memoryCache.delete(key);
}

/**
 * Invalidate cache by pattern (Redis only)
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const redisClient = await getRedisClient();
  if (redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      logger.error('Redis pattern delete error', { pattern, error: error instanceof Error ? error.message : String(error) });
    }
  }

  // For memory cache, iterate and delete matching keys
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Cache keys
 */
export const CacheKeys = {
  voucher: (id: string) => `voucher:${id}`,
  merchant: (slug: string) => `merchant:${slug}`,
  merchantVouchers: (merchantId: string) => `merchant:${merchantId}:vouchers`,
  publicMerchantVouchers: (merchantId: string) => `public:merchant:${merchantId}:vouchers`,
  publicMerchantCampaigns: (merchantId: string) => `public:merchant:${merchantId}:campaigns`,
  campaign: (id: string) => `campaign:${id}`,
  campaignDetails: (id: string) => `campaign:${id}:details`,
  userWallet: (userId: string, merchantId: string) => `wallet:${userId}:${merchantId}`,
};
