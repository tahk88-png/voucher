/**
 * Recover stale email job locks.
 *
 * If a Vercel function times out (30s) while processing a job,
 * the lock stays set. This cron resets stale locks so they can be retried.
 *
 * Vercel cron: every 10 minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization') || req.headers.get('x-cron-secret');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const threshold = new Date(Date.now() - STALE_THRESHOLD_MS);

  const result = await prisma.emailJob.updateMany({
    where: {
      status: 'processing',
      lockedAt: { lt: threshold },
    },
    data: {
      status: 'queued',
      lockedAt: null,
      lockedBy: null,
    },
  });

  if (result.count > 0) {
    logger.warn('[email-stale-locks] Recovered stale locks', { count: result.count });
  }

  return NextResponse.json({ recovered: result.count });
}
