import { createClient } from 'redis';
import { logger } from './logger';

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined;
};

let redis: ReturnType<typeof createClient> | undefined = globalForRedis.redis;

// Initialize Redis client if configured
export async function getRedisClient() {
  if (!process.env.REDIS_URL) {
    return null; // Redis is optional
  }

  if (redis) {
    if (!redis.isOpen) {
      try {
        await redis.connect();
      } catch (error) {
        logger.error('Failed to reconnect to Redis', { error });
        return null;
      }
    }
    return redis;
  }

  try {
    redis = createClient({
      url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis: Max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          // Exponential backoff: 50ms, 100ms, 200ms, etc., capped at 3s
          const delay = Math.min(50 * Math.pow(2, retries), 3000);
          return delay;
        },
      },
    });

    redis.on('error', (error) => {
      logger.error('Redis client error', { error });
    });

    redis.on('connect', () => {
      logger.info('Redis client connected');
    });

    redis.on('disconnect', () => {
      logger.warn('Redis client disconnected');
    });

    await redis.connect();

    if (process.env.NODE_ENV !== 'production') {
      globalForRedis.redis = redis;
    }

    return redis;
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error });
    return null;
  }
}

/**
 * Distributed rate limiting using Redis
 * Falls back to allowing requests if Redis is unavailable
 */
export async function checkRedisRateLimit(
  key: string,
  windowSeconds: number,
  maxAttempts: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const client = await getRedisClient();

  if (!client) {
    // Redis not available - allow request but log warning
    logger.warn('Redis unavailable for rate limiting, allowing request', { key });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: Date.now() + windowSeconds * 1000 };
  }

  try {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const resetAt = now + windowMs;

    // Use Redis sorted set with timestamps as scores
    const multi = client.multi();

    // Remove old entries outside the window
    multi.zRemRangeByScore(key, 0, now - windowMs);

    // Count current entries
    multi.zCard(key);

    // Add current request
    multi.zAdd(key, { score: now, value: `${now}` });

    // Set expiration
    multi.expire(key, windowSeconds);

    const results = await multi.exec();
    const count = (results[1] as number) || 0;

    const allowed = count < maxAttempts;
    const remaining = Math.max(0, maxAttempts - count - 1);

    return { allowed, remaining, resetAt };
  } catch (error) {
    logger.error('Redis rate limit check failed, allowing request', { key, error });
    // Fail open - allow request if Redis fails
    return { allowed: true, remaining: maxAttempts - 1, resetAt: Date.now() + windowSeconds * 1000 };
  }
}

/**
 * Cache data in Redis with expiration
 */
export async function cacheSet(key: string, value: string, expirationSeconds: number): Promise<boolean> {
  const client = await getRedisClient();

  if (!client) {
    return false;
  }

  try {
    await client.setEx(key, expirationSeconds, value);
    return true;
  } catch (error) {
    logger.error('Redis cache set failed', { key, error });
    return false;
  }
}

/**
 * Get cached data from Redis
 */
export async function cacheGet(key: string): Promise<string | null> {
  const client = await getRedisClient();

  if (!client) {
    return null;
  }

  try {
    return await client.get(key);
  } catch (error) {
    logger.error('Redis cache get failed', { key, error });
    return null;
  }
}

/**
 * Delete cached data from Redis
 */
export async function cacheDelete(key: string): Promise<boolean> {
  const client = await getRedisClient();

  if (!client) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error('Redis cache delete failed', { key, error });
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis && redis.isOpen) {
    try {
      await redis.quit();
      logger.info('Redis client closed');
    } catch (error) {
      logger.error('Error closing Redis client', { error });
    }
  }
}
