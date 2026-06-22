/**
 * Loyalty tier recomputation cron.
 *
 * Vercel cron: nightly at 03:00 UTC.
 *
 * Walks every LoyaltyAccount and syncs `currentTier` with the tier
 * derived from `lifetimePoints`. Normally the GET /api/loyalty
 * handler syncs on read, but:
 *   - users who never open the loyalty page would stay on a stale tier
 *   - after a tier config change (e.g. we raise the gold threshold),
 *     existing users need to be re-bucketed globally
 *
 * Emits a single job run so it shows up in /admin/ops.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';
import { calculateTier } from '@/lib/loyalty-tiers';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 500;

export async function GET(req: NextRequest) {
  // Cron auth — identical pattern to other cron handlers in this repo.
  const cronSecret = req.headers.get('authorization') || req.headers.get('x-cron-secret');
  if (
    cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startJobRun('loyalty-tiers', 'cron');
  const now = new Date();
  let scanned = 0;
  let updated = 0;
  let cursor: string | undefined;

  try {
    // Paginate with a cursor so we don't load the whole table into memory
    // on a big user base. The `id` field is a cuid, so cursor pagination
    // is deterministic.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const batch = await prisma.loyaltyAccount.findMany({
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        select: {
          id: true,
          currentTier: true,
          lifetimePoints: true,
        },
      });
      if (batch.length === 0) break;

      for (const acct of batch) {
        scanned++;
        const derived = calculateTier(acct.lifetimePoints);
        if (derived.name !== acct.currentTier) {
          await prisma.loyaltyAccount.update({
            where: { id: acct.id },
            data: {
              currentTier: derived.name,
              tierUpdatedAt: now,
            },
          });
          updated++;
        }
      }

      cursor = batch[batch.length - 1].id;
      if (batch.length < BATCH_SIZE) break;
    }

    await completeJobRun(runId, {
      status: 'succeeded',
      result: { scanned, updated },
    });

    logger.info('Loyalty tier recompute complete', { scanned, updated });
    return NextResponse.json({ ok: true, scanned, updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await completeJobRun(runId, {
      status: 'failed',
      result: { scanned, updated },
      error: message,
    });
    logger.error('Loyalty tier recompute failed', { scanned, updated, error: message });
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
