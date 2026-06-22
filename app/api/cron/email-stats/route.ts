/**
 * Cron: Email daily stats aggregation.
 *
 * Runs once per day (recommended: shortly after midnight UTC).
 * Aggregates yesterday's EmailMessage records into EmailDailyStats.
 */

import { NextRequest, NextResponse } from 'next/server';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';
import { aggregateDailyStats } from '@/lib/email/stats';

export async function GET(req: NextRequest) {
  const cronSecret =
    req.headers.get('authorization') || req.headers.get('x-cron-secret');

  if (
    cronSecret !== `Bearer ${process.env.CRON_SECRET}` &&
    process.env.NODE_ENV === 'production'
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startJobRun('email-stats', 'cron');

  try {
    // Aggregate yesterday's stats
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    await aggregateDailyStats(yesterday);

    await completeJobRun(runId, {
      status: 'succeeded',
      result: { date: yesterday.toISOString().slice(0, 10) },
    });

    return NextResponse.json({
      success: true,
      date: yesterday.toISOString().slice(0, 10),
    });
  } catch (error) {
    await completeJobRun(runId, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Email stats aggregation failed' },
      { status: 500 }
    );
  }
}
