/**
 * Email queue worker — polls EmailJob table and sends emails.
 *
 * Vercel cron: every 2 minutes
 * Batch size: 50 jobs per invocation
 * Concurrency: 10 parallel sends per batch
 * Retry: exponential backoff stored in job record
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startJobRun, completeJobRun } from '@/lib/admin/jobs';
import { isEmailSuppressed } from '@/lib/email/suppression';
import { sendWithFailover } from '@/lib/email/providers/factory';
import { renderDbTemplate } from '@/lib/email/template-renderer';
import { logger } from '@/lib/logger';

const BATCH_SIZE = 30; // Reduced from 50 to stay safely under 30s Vercel timeout
const CONCURRENCY = 10;
const JOB_TIMEOUT_MS = 8000; // 8s per job — ensures batch completes within Vercel limit

export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('authorization') || req.headers.get('x-cron-secret');
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const runId = await startJobRun('email-queue', 'cron');
  const lockId = `cron-${crypto.randomUUID()}`;
  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let suppressed = 0;

  try {
    // Claim a batch of queued jobs atomically
    await prisma.$executeRaw`
      UPDATE "EmailJob"
      SET "lockedAt" = NOW(), "lockedBy" = ${lockId}, "status" = 'processing', "updatedAt" = NOW()
      WHERE id IN (
        SELECT id FROM "EmailJob"
        WHERE "status" = 'queued'
          AND "scheduledAt" <= NOW()
          AND "lockedAt" IS NULL
        ORDER BY
          CASE "priority"
            WHEN 'urgent' THEN 0
            WHEN 'normal' THEN 1
            WHEN 'low' THEN 2
          END ASC,
          "createdAt" ASC
        LIMIT ${BATCH_SIZE}
        FOR UPDATE SKIP LOCKED
      )
    `;

    // Fetch the claimed jobs
    const jobs = await prisma.emailJob.findMany({
      where: { lockedBy: lockId, status: 'processing' },
    });

    // Process in batches of CONCURRENCY
    for (let i = 0; i < jobs.length; i += CONCURRENCY) {
      const batch = jobs.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(batch.map((job) =>
        Promise.race([
          processJob(job),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Job timeout')), JOB_TIMEOUT_MS)
          ),
        ])
      ));

      for (const result of results) {
        processed++;
        if (result.status === 'fulfilled') {
          if (result.value === 'suppressed') suppressed++;
          else succeeded++;
        } else {
          failed++;
        }
      }
    }

    await completeJobRun(runId, {
      status: 'succeeded',
      result: { processed, succeeded, failed, suppressed },
    });

    return NextResponse.json({ processed, succeeded, failed, suppressed });
  } catch (error) {
    await completeJobRun(runId, {
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Queue processing failed' }, { status: 500 });
  }
}

async function processJob(
  job: Awaited<ReturnType<typeof prisma.emailJob.findMany>>[number]
): Promise<'sent' | 'suppressed'> {
  try {
    // Check suppression
    const suppression = await isEmailSuppressed(job.to);
    if (suppression.suppressed) {
      await prisma.$transaction([
        prisma.emailJob.update({
          where: { id: job.id },
          data: { status: 'completed', completedAt: new Date() },
        }),
        prisma.emailMessage.create({
          data: {
            jobId: job.id,
            from: job.from || 'noreply@vouchr.app',
            to: job.to,
            subject: job.subject,
            templateSlug: job.templateSlug,
            category: job.category,
            tags: job.tags ?? undefined,
            metadata: job.metadata ?? undefined,
            status: 'suppressed',
            errorMessage: `Suppressed: ${suppression.reason}`,
          },
        }),
      ]);
      return 'suppressed';
    }

    // Resolve HTML content
    let html = job.html;
    let subject = job.subject;
    if (job.templateSlug && !html) {
      const vars = (job.templateData as Record<string, string>) || {};
      const rendered = await renderDbTemplate(job.templateSlug, vars);
      if (rendered) {
        html = rendered.html;
        subject = rendered.subject;
      }
    }

    // Send via provider
    const result = await sendWithFailover({
      to: job.to,
      from: job.from || process.env.RESEND_FROM_EMAIL || 'noreply@vouchr.app',
      subject,
      html: html || undefined,
      text: job.text || undefined,
    });

    // Mark completed + log message
    await prisma.$transaction([
      prisma.emailJob.update({
        where: { id: job.id },
        data: { status: 'completed', completedAt: new Date() },
      }),
      prisma.emailMessage.create({
        data: {
          jobId: job.id,
          providerId: result.providerId,
          providerType: result.providerType,
          from: job.from || 'noreply@vouchr.app',
          to: job.to,
          subject,
          templateSlug: job.templateSlug,
          category: job.category,
          tags: job.tags ?? undefined,
          metadata: job.metadata ?? undefined,
          status: 'sent',
          sentAt: new Date(),
        },
      }),
    ]);

    return 'sent';
  } catch (error) {
    const attempts = job.attempts + 1;
    const maxAttempts = job.maxAttempts;
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (attempts >= maxAttempts) {
      // Dead letter
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: 'dead',
          attempts,
          lastError: errorMsg,
          lockedAt: null,
          lockedBy: null,
        },
      });
    } else {
      // Retry with exponential backoff
      const delayMs = Math.pow(2, attempts) * 1000; // 2s, 4s, 8s...
      const nextRetryAt = new Date(Date.now() + delayMs);

      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: 'queued',
          attempts,
          lastError: errorMsg,
          nextRetryAt,
          lockedAt: null,
          lockedBy: null,
        },
      });
    }

    logger.error('[email-queue] Job failed', { jobId: job.id, attempts, error: errorMsg });
    throw error; // Re-throw for Promise.allSettled
  }
}
