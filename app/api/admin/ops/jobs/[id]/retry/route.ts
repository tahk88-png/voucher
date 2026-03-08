import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const adminCtx = await requireAdminPermission("admin.ops.retry_jobs");

    const failedJob = await prisma.jobRun.findUnique({
      where: { id },
    });

    if (!failedJob) {
      return NextResponse.json({ error: "Job run not found" }, { status: 404 });
    }

    if (failedJob.status !== "failed") {
      return NextResponse.json(
        { error: "Only failed jobs can be retried" },
        { status: 400 }
      );
    }

    const newRun = await prisma.jobRun.create({
      data: {
        jobName: failedJob.jobName,
        status: "pending",
        triggeredBy: adminCtx.userId,
      },
    });

    await recordAdminAudit({
      actorUserId: adminCtx.userId,
      action: "job.retry",
      targetType: "JobRun",
      targetId: newRun.id,
      metadata: {
        originalRunId: id,
        jobName: failedJob.jobName,
      },
    });

    return NextResponse.json({ run: newRun }, { status: 201 });
  });
}
