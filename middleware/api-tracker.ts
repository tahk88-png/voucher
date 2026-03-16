/**
 * API request tracking middleware helper.
 *
 * Buffers API request metadata in-memory and batch-writes to the
 * AuditLog table every 10 seconds. Call `trackApiRequest()` from
 * any API route to record a request.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrackedRequest = {
  method: string;
  path: string;
  status: number;
  durationMs: number;
  userId?: string;
  ip?: string;
  timestamp: Date;
};

// ---------------------------------------------------------------------------
// In-memory buffer
// ---------------------------------------------------------------------------

const buffer: TrackedRequest[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;

const FLUSH_INTERVAL_MS = 10_000;
const MAX_BUFFER_SIZE = 5_000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Track an API request. Call this at the end of your API route handler.
 *
 * ```ts
 * const start = Date.now();
 * // ... handle request ...
 * trackApiRequest({
 *   method: req.method,
 *   path: new URL(req.url).pathname,
 *   status: 200,
 *   durationMs: Date.now() - start,
 *   userId: session?.user?.id,
 *   ip: req.headers.get('x-forwarded-for') ?? undefined,
 * });
 * ```
 */
export function trackApiRequest(req: TrackedRequest): void {
  buffer.push({ ...req, timestamp: req.timestamp ?? new Date() });

  // Auto-flush if buffer is large
  if (buffer.length >= MAX_BUFFER_SIZE) {
    flushBuffer().catch(() => {});
  }

  // Ensure the periodic flush timer is running
  ensureFlushTimer();
}

/**
 * Get current buffer size (for monitoring).
 */
export function getTrackerBufferSize(): number {
  return buffer.length;
}

/**
 * Get aggregate stats from the in-memory buffer (for real-time dashboard).
 */
export function getRealtimeStats(): {
  buffered: number;
  recentRequests: TrackedRequest[];
} {
  return {
    buffered: buffer.length,
    recentRequests: buffer.slice(-20),
  };
}

// ---------------------------------------------------------------------------
// Flush logic
// ---------------------------------------------------------------------------

function ensureFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flushBuffer().catch((err) => {
      logger.error('API tracker flush failed', { error: err?.message });
    });
  }, FLUSH_INTERVAL_MS);

  // Don't block process exit
  if (flushTimer && typeof flushTimer === 'object' && 'unref' in flushTimer) {
    flushTimer.unref();
  }
}

async function flushBuffer(): Promise<void> {
  if (buffer.length === 0) return;

  // Drain the buffer atomically
  const batch = buffer.splice(0, buffer.length);

  try {
    // Use a system user ID for automated tracking entries
    const SYSTEM_USER_ID = 'system';

    // Batch create audit log entries
    await prisma.auditLog.createMany({
      data: batch.map((req) => ({
        actorUserId: req.userId ?? SYSTEM_USER_ID,
        action: `api.${req.method.toLowerCase()}.${req.path.replace(/\//g, '.')}`,
        resourceType: 'api_request',
        ipAddress: req.ip ?? null,
        payloadJson: {
          method: req.method,
          path: req.path,
          statusCode: req.status,
          durationMs: req.durationMs,
        },
        createdAt: req.timestamp,
      })),
      skipDuplicates: true,
    });

    logger.info(`API tracker flushed ${batch.length} entries`);
  } catch (err: any) {
    // On failure, put entries back at the front of the buffer
    // (capped to prevent unbounded growth)
    const requeue = [...batch, ...buffer].slice(0, MAX_BUFFER_SIZE);
    buffer.length = 0;
    buffer.push(...requeue);
    logger.error('API tracker flush error', { error: err?.message, batchSize: batch.length });
  }
}

// Flush on process exit
if (typeof process !== 'undefined') {
  process.on('beforeExit', () => {
    flushBuffer().catch(() => {});
  });
}
