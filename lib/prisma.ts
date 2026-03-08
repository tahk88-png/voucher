import { PrismaClient } from '@prisma/client';
import { recordDbQuery } from './metrics';
import { loggers } from './logger';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma Client with optimized connection pooling
 * Connection pool size is configured via DATABASE_URL query params
 * Example: postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Prisma connection pool is configured via DATABASE_URL query parameters:
    // - connection_limit: Max connections (default: num_cpu_cores * 2 + 1)
    // - pool_timeout: Seconds to wait for connection (default: 10s)
    // Example DATABASE_URL with pooling:
    // postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20&connect_timeout=10
  });

// Query timing middleware for metrics and slow query detection
prisma.$use(async (params, next) => {
  const start = performance.now();
  const result = await next(params);
  const duration = performance.now() - start;
  recordDbQuery(params.model ?? 'unknown', params.action, duration);
  if (duration > 500) {
    loggers.database('Slow query detected', {
      model: params.model,
      action: params.action,
      durationMs: Math.round(duration * 100) / 100,
    });
  }
  return result;
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Gracefully disconnect Prisma on process termination
 */
async function disconnectPrisma() {
  await prisma.$disconnect();
}

if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', disconnectPrisma);
  process.on('SIGINT', disconnectPrisma);
  process.on('SIGTERM', disconnectPrisma);
}
