import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Start a new job run, recording it in the database.
 */
export async function startJobRun(
  jobName: string,
  triggeredBy: string
): Promise<string> {
  const run = await prisma.jobRun.create({
    data: {
      jobName,
      status: "running",
      startedAt: new Date(),
      triggeredBy,
    },
  });

  logger.info("Job run started", { runId: run.id, jobName, triggeredBy });
  return run.id;
}

/**
 * Complete a job run with success or failure status.
 */
export async function completeJobRun(
  runId: string,
  result: {
    status: "succeeded" | "failed";
    result?: Record<string, unknown>;
    error?: string;
  }
): Promise<void> {
  const run = await prisma.jobRun.findUnique({ where: { id: runId } });

  if (!run) {
    logger.warn("Job run not found for completion", { runId });
    return;
  }

  const now = new Date();
  const durationMs = run.startedAt
    ? now.getTime() - new Date(run.startedAt).getTime()
    : null;

  await prisma.jobRun.update({
    where: { id: runId },
    data: {
      status: result.status,
      completedAt: now,
      durationMs,
      result: result.result ? (result.result as any) : undefined,
      error: result.error ?? null,
    },
  });

  logger.info("Job run completed", {
    runId,
    status: result.status,
    durationMs,
  });
}

/**
 * Retrieve job run history with optional filters and pagination.
 */
export async function getJobHistory(filters: {
  jobName?: string;
  status?: string;
  from?: Date;
  page?: number;
  limit?: number;
}): Promise<{ runs: any[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.jobName) {
    where.jobName = filters.jobName;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.from) {
    where.createdAt = { gte: filters.from };
  }

  const [runs, total] = await Promise.all([
    prisma.jobRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.jobRun.count({ where }),
  ]);

  return { runs, total };
}
