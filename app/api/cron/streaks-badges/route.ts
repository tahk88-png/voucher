/**
 * Streak decay + badge sweep cron.
 *
 * Vercel cron: daily at 02:30 UTC.
 *
 * Two jobs in one handler because they share the user-loop:
 *
 *  1. Streak decay: any UserStreak whose `lastActiveDate` is strictly
 *     older than yesterday gets `currentDays` reset to 0. We keep
 *     `longestDays` intact — that's the all-time high. Without this,
 *     the streak counter would lie the day after a user skips.
 *
 *  2. Badge sweep: call `checkAndAwardBadges` for every user so
 *     retroactive badges (e.g. streak_30 when we added the badge
 *     *after* they already hit 30 days) get granted without waiting
 *     for the user's next action.
 *
 * Emits one job run for the whole sweep so ops has a heartbeat.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';
import { checkAndAwardBadges } from '@/lib/gamification';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 250;

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization') || req.headers.get('x-cron-secret');
  if (
    cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startJobRun('streaks-badges', 'cron');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let scannedStreaks = 0;
  let resetStreaks = 0;
  let usersSwept = 0;
  let badgesGranted = 0;

  try {
    // Step 1: decay streaks whose last active is older than yesterday.
    // `lastActiveDate < yesterday` means "not today, not yesterday" — so
    // they missed a day and the streak is broken.
    const staleStreaks = await prisma.userStreak.findMany({
      where: {
        currentDays: { gt: 0 },
        lastActiveDate: { lt: yesterday },
      },
      select: { id: true, userId: true },
    });
    scannedStreaks = staleStreaks.length;
    if (staleStreaks.length > 0) {
      const res = await prisma.userStreak.updateMany({
        where: { id: { in: staleStreaks.map((s) => s.id) } },
        data: { currentDays: 0 },
      });
      resetStreaks = res.count;
    }

    // Step 2: sweep badges for everyone with any activity signal.
    // We scope to users who have a UserStreak or UserBadge row — that's
    // anyone who has ever earned a point or opened the achievements
    // page. Fresh sign-ups without activity can't earn anything yet, so
    // skipping them here is harmless and keeps the sweep bounded.
    const candidateIds = new Set<string>();
    const streaks = await prisma.userStreak.findMany({ select: { userId: true } });
    for (const s of streaks) candidateIds.add(s.userId);
    const badges = await prisma.userBadge.findMany({ select: { userId: true } });
    for (const b of badges) candidateIds.add(b.userId);

    const ids = Array.from(candidateIds);
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      for (const userId of batch) {
        usersSwept++;
        try {
          const granted = await checkAndAwardBadges(userId);
          badgesGranted += granted.length;
        } catch (err) {
          // Don't let one user's bad data kill the sweep — log and move on.
          logger.warn('Badge sweep failed for user', {
            userId,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }

    await completeJobRun(runId, {
      status: 'succeeded',
      result: { scannedStreaks, resetStreaks, usersSwept, badgesGranted },
    });

    logger.info('Streak/badge sweep complete', {
      scannedStreaks,
      resetStreaks,
      usersSwept,
      badgesGranted,
    });
    return NextResponse.json({
      ok: true,
      scannedStreaks,
      resetStreaks,
      usersSwept,
      badgesGranted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await completeJobRun(runId, {
      status: 'failed',
      result: { scannedStreaks, resetStreaks, usersSwept, badgesGranted },
      error: message,
    });
    logger.error('Streak/badge sweep failed', {
      error: message,
      scannedStreaks,
      usersSwept,
    });
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}
