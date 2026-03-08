import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { getReportQueue } from "@/lib/admin/moderation";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.moderation.read");

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as any;
    const category = searchParams.get("category") as any;
    const assignedAdminId = searchParams.get("assignedAdminId") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 1000);

    logger.info("Admin fetching report queue", {
      adminUserId: admin.userId,
      status,
      category,
    });

    const result = await getReportQueue({
      status: status || undefined,
      category: category || undefined,
      assignedAdminId,
      page,
      limit,
    });

    return NextResponse.json({
      reports: result.reports,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.moderation.action");

    const body = await req.json();
    const {
      reportedUserId,
      reportedMerchantId,
      reportedEntityType,
      reportedEntityId,
      category,
      description,
      evidenceUrls,
    } = body;

    if (!category || !description) {
      return NextResponse.json(
        { error: "category and description are required" },
        { status: 400 }
      );
    }

    logger.info("Admin creating system report", {
      adminUserId: admin.userId,
      reportedUserId,
      reportedMerchantId,
      category,
    });

    const report = await prisma.userReport.create({
      data: {
        reportedByUserId: admin.userId,
        reportedUserId,
        reportedMerchantId,
        reportedEntityType,
        reportedEntityId,
        category,
        description,
        evidenceUrls: evidenceUrls ?? [],
        status: "open",
      },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "moderation.report.create",
      targetType: reportedUserId ? "user" : "merchant",
      targetId: reportedUserId ?? reportedMerchantId,
      metadata: { reportId: report.id, category },
    });

    return NextResponse.json(report, { status: 201 });
  });
}
