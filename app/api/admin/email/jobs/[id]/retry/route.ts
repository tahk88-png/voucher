import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/get-client-ip";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.send");

    const job = await prisma.emailJob.findUnique({ where: { id } });

    if (!job) {
      return NextResponse.json(
        { error: "Email job not found" },
        { status: 404 }
      );
    }

    if (job.status !== "dead" && job.status !== "failed") {
      return NextResponse.json(
        { error: "Only dead or failed jobs can be retried" },
        { status: 400 }
      );
    }

    await prisma.emailJob.update({
      where: { id },
      data: {
        status: "queued",
        attempts: 0,
        lastError: null,
        nextRetryAt: null,
        lockedAt: null,
        lockedBy: null,
      },
    });

    const ipRaw = getClientIp(req);
    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: ipRaw === "unknown" ? undefined : ipRaw,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.job.retry",
      targetType: "email_job",
      targetId: id,
      metadata: { previousStatus: job.status, to: job.to, subject: job.subject },
    });

    return NextResponse.json({ retried: true });
  });
}
