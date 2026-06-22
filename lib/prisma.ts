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
    loggers.database(params.action, params.model ?? 'unknown', Math.round(duration * 100) / 100);
  }
  return result;
});

// ─── Soft Delete Middleware ───
// Automatically filters deletedAt IS NULL on find queries for soft-delete models.
// To include soft-deleted records, pass { where: { deletedAt: { not: null } } } explicitly.
const SOFT_DELETE_MODELS = new Set([
  'User', 'Organization', 'Merchant', 'Campaign', 'Voucher',
]);

prisma.$use(async (params, next) => {
  if (!params.model || !SOFT_DELETE_MODELS.has(params.model)) {
    return next(params);
  }

  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  if (params.action === 'findUnique' || params.action === 'findUniqueOrThrow') {
    if (params.args?.where?.deletedAt === undefined) {
      params.action = 'findFirst' as any;
      params.args.where = { ...params.args.where, deletedAt: null };
    }
  }

  if (params.action === 'count') {
    if (!params.args) params.args = {};
    if (!params.args.where) params.args.where = {};
    if (params.args.where.deletedAt === undefined) {
      params.args.where.deletedAt = null;
    }
  }

  if (params.action === 'delete') {
    params.action = 'update' as any;
    params.args.data = { deletedAt: new Date() };
  }

  if (params.action === 'deleteMany') {
    params.action = 'updateMany' as any;
    if (!params.args) params.args = {};
    params.args.data = { deletedAt: new Date() };
  }

  return next(params);
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
