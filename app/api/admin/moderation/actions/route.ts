import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { createModerationAction } from "@/lib/admin/moderation";

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.moderation.action");

    const body = await req.json();
    const {
      targetUserId,
      targetMerchantId,
      reportId,
      actionType,
      reason,
      details,
      expiresAt,
    } = body;

    if (!actionType || !reason) {
      return NextResponse.json(
        { error: "actionType and reason are required" },
        { status: 400 }
      );
    }

    if (!targetUserId && !targetMerchantId) {
      return NextResponse.json(
        { error: "targetUserId or targetMerchantId is required" },
        { status: 400 }
      );
    }

    const validActionTypes = [
      "warning",
      "content_removal",
      "suspension",
      "ban",
      "unban",
      "feature_restriction",
    ];
    if (!validActionTypes.includes(actionType)) {
      return NextResponse.json(
        { error: `actionType must be one of: ${validActionTypes.join(", ")}` },
        { status: 400 }
      );
    }

    logger.info("Admin creating moderation action", {
      adminUserId: admin.userId,
      targetUserId,
      targetMerchantId,
      actionType,
    });

    const moderationAction = await createModerationAction({
      moderatorUserId: admin.userId,
      targetUserId,
      targetMerchantId,
      reportId,
      actionType,
      reason,
      details,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "moderation.action",
      targetType: targetUserId ? "user" : "merchant",
      targetId: targetUserId ?? targetMerchantId,
      reason,
      metadata: {
        moderationActionId: moderationAction.id,
        actionType: moderationAction.actionType,
        strikeNumber: moderationAction.strikeNumber,
        reportId,
      },
    });

    return NextResponse.json(moderationAction, { status: 201 });
  });
}
