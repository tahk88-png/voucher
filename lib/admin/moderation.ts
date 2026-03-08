import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";
type ReportCategory =
  | "spam"
  | "fraud"
  | "offensive_content"
  | "trademark_violation"
  | "other";
type ModerationActionType =
  | "warning"
  | "content_removal"
  | "suspension"
  | "ban"
  | "unban"
  | "feature_restriction";

export async function getReportQueue(filters: {
  status?: ReportStatus;
  category?: ReportCategory;
  assignedAdminId?: string;
  page?: number;
  limit?: number;
}): Promise<{ reports: any[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const offset = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.assignedAdminId)
    where.assignedAdminId = filters.assignedAdminId;

  const [reports, total] = await Promise.all([
    prisma.userReport.findMany({
      where,
      include: {
        reportedBy: { select: { id: true, email: true, name: true } },
        reportedUser: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: offset,
      take: limit,
    }),
    prisma.userReport.count({ where }),
  ]);

  logger.info("Report queue fetched", {
    total,
    page,
    limit,
    filters,
  });

  return { reports, total };
}

export async function assignReport(
  reportId: string,
  adminUserId: string
): Promise<void> {
  await prisma.userReport.update({
    where: { id: reportId },
    data: {
      assignedAdminId: adminUserId,
      status: "under_review",
    },
  });

  logger.info("Report assigned", { reportId, adminUserId });
}

export async function resolveReport(
  reportId: string,
  adminUserId: string,
  resolution: { status: "resolved" | "dismissed"; resolution: string }
): Promise<void> {
  await prisma.userReport.update({
    where: { id: reportId },
    data: {
      status: resolution.status,
      resolution: resolution.resolution,
      resolvedAt: new Date(),
      assignedAdminId: adminUserId,
    },
  });

  logger.info("Report resolved", {
    reportId,
    adminUserId,
    status: resolution.status,
  });
}

export async function createModerationAction(input: {
  moderatorUserId: string;
  targetUserId?: string;
  targetMerchantId?: string;
  reportId?: string;
  actionType: ModerationActionType;
  reason: string;
  details?: Record<string, unknown>;
  expiresAt?: Date;
}): Promise<any> {
  let strikeNumber = 0;
  let actionType = input.actionType;

  if (input.targetUserId) {
    // Count existing non-reversed strikes
    const existingStrikes = await prisma.moderationAction.count({
      where: {
        targetUserId: input.targetUserId,
        actionType: { in: ["warning", "content_removal", "suspension"] },
        reversedAt: null,
      },
    });

    strikeNumber = existingStrikes + 1;

    // Auto-escalate if 3+ strikes and not already a ban
    if (strikeNumber >= 3 && actionType !== "ban") {
      logger.warn("Auto-escalating to suspension due to 3+ strikes", {
        targetUserId: input.targetUserId,
        strikeNumber,
        originalAction: actionType,
      });
      actionType = "suspension";
    }
  }

  const moderationAction = await prisma.moderationAction.create({
    data: {
      moderatorUserId: input.moderatorUserId,
      targetUserId: input.targetUserId,
      targetMerchantId: input.targetMerchantId,
      reportId: input.reportId,
      actionType,
      reason: input.reason,
      details: (input.details ?? {}) as any,
      expiresAt: input.expiresAt,
      strikeNumber,
    },
  });

  // Apply user status changes for ban/suspension
  if (
    input.targetUserId &&
    (actionType === "ban" || actionType === "suspension")
  ) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: input.targetUserId },
        data: { status: "disabled" },
      }),
      prisma.session.deleteMany({
        where: { userId: input.targetUserId },
      }),
    ]);

    logger.info("User disabled and sessions cleared", {
      targetUserId: input.targetUserId,
      actionType,
    });
  }

  // Restore user for unban
  if (input.targetUserId && actionType === "unban") {
    await prisma.user.update({
      where: { id: input.targetUserId },
      data: { status: "active" },
    });

    logger.info("User unbanned and status restored to active", {
      targetUserId: input.targetUserId,
    });
  }

  logger.info("Moderation action created", {
    moderationActionId: moderationAction.id,
    actionType,
    strikeNumber,
    targetUserId: input.targetUserId,
  });

  return moderationAction;
}

export async function getStrikeCount(userId: string): Promise<number> {
  const count = await prisma.moderationAction.count({
    where: {
      targetUserId: userId,
      actionType: { in: ["warning", "content_removal", "suspension"] },
      reversedAt: null,
    },
  });

  return count;
}
