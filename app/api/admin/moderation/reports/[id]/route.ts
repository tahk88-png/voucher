import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { assignReport, resolveReport } from "@/lib/admin/moderation";
import { z } from "zod";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.moderation.read");
    const reportId = id;

    logger.info("Admin fetching report detail", {
      adminUserId: admin.userId,
      reportId,
    });

    const report = await prisma.userReport.findUnique({
      where: { id: reportId },
      include: {
        reportedBy: { select: { id: true, email: true, name: true } },
        reportedUser: { select: { id: true, email: true, name: true } },
        moderationActions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.moderation.action");
    const reportId = id;

    const body = await req.json();
    const patchSchema = z.object({
      action: z.enum(["assign", "resolve"]),
      resolution: z.string().optional(),
      status: z.enum(["resolved", "dismissed"]).optional(),
    });
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { action, resolution, status } = parsed.data;

    logger.info("Admin updating report", {
      adminUserId: admin.userId,
      reportId,
      action,
    });

    if (action === "assign") {
      await assignReport(reportId, admin.userId);

      await recordAdminAudit({
        actorUserId: admin.userId,
        action: "moderation.report.assign",
        targetType: "report",
        targetId: reportId,
      });

      return NextResponse.json({ success: true, message: "Report assigned" });
    }

    if (action === "resolve") {
      if (!status || !["resolved", "dismissed"].includes(status)) {
        return NextResponse.json(
          { error: "status must be 'resolved' or 'dismissed'" },
          { status: 400 }
        );
      }
      if (!resolution) {
        return NextResponse.json(
          { error: "resolution is required" },
          { status: 400 }
        );
      }

      await resolveReport(reportId, admin.userId, {
        status,
        resolution,
      });

      await recordAdminAudit({
        actorUserId: admin.userId,
        action: "moderation.report.resolve",
        targetType: "report",
        targetId: reportId,
        metadata: { status, resolution },
      });

      return NextResponse.json({
        success: true,
        message: `Report ${status}`,
      });
    }
  });
}
