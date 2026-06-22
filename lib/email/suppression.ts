/**
 * Email suppression check and management.
 *
 * Before any email is sent, the system checks this list.
 * Hard bounces, complaints, and manual entries block sending.
 * Soft bounces have an expiration date.
 */

import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet } from '@/lib/redis';
import { logger } from '@/lib/logger';

const CACHE_TTL = 300; // 5 minutes

/**
 * Check if an email address is suppressed.
 * Uses Redis cache for performance (5 min TTL).
 */
export async function isEmailSuppressed(email: string): Promise<{
  suppressed: boolean;
  reason?: string;
}> {
  const normalized = email.toLowerCase().trim();
  const cacheKey = `email:suppressed:${normalized}`;

  // Check cache first
  try {
    const cached = await cacheGet(cacheKey);
    if (cached === 'no') return { suppressed: false };
    if (cached) return { suppressed: true, reason: cached };
  } catch {
    // Cache miss or Redis unavailable — continue to DB
  }

  const suppression = await prisma.emailSuppression.findFirst({
    where: {
      email: normalized,
      OR: [
        { expiresAt: null },         // permanent
        { expiresAt: { gt: new Date() } }, // not yet expired
      ],
    },
    select: { reason: true },
  });

  if (suppression) {
    try { await cacheSet(cacheKey, suppression.reason, CACHE_TTL); } catch {}
    return { suppressed: true, reason: suppression.reason };
  }

  try { await cacheSet(cacheKey, 'no', CACHE_TTL); } catch {}
  return { suppressed: false };
}

/**
 * Add an email to the suppression list.
 */
export async function addSuppression(params: {
  email: string;
  reason: 'hard_bounce' | 'soft_bounce' | 'complaint' | 'unsubscribe' | 'manual';
  source?: string;
  notes?: string;
  expiresAt?: Date;
  createdBy?: string;
}): Promise<void> {
  const normalized = params.email.toLowerCase().trim();

  await prisma.emailSuppression.upsert({
    where: {
      email_reason: {
        email: normalized,
        reason: params.reason,
      },
    },
    create: {
      email: normalized,
      reason: params.reason,
      source: params.source ?? 'webhook',
      notes: params.notes,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
    },
    update: {
      source: params.source ?? 'webhook',
      notes: params.notes,
      expiresAt: params.expiresAt,
    },
  });

  // Invalidate cache
  try {
    const { cacheDelete } = await import('@/lib/redis');
    await cacheDelete(`email:suppressed:${normalized}`);
  } catch (err) {
    // Log but don't block — cache will expire in 5 min
    logger.error('[suppression] Cache invalidation failed', { email: normalized, error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Remove a suppression entry.
 */
export async function removeSuppression(id: string): Promise<void> {
  const entry = await prisma.emailSuppression.findUnique({
    where: { id },
    select: { email: true },
  });

  await prisma.emailSuppression.delete({ where: { id } });

  if (entry) {
    try {
      const { cacheDelete } = await import('@/lib/redis');
      await cacheDelete(`email:suppressed:${entry.email}`);
    } catch {}
  }
}
