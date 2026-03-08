import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { reviewAppeal } from "@/lib/admin/appeals";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission(
      "admin.moderation.appeal_review"
    );
    const appealId = id;

    const body = await req.json();
    const { status, reviewNote } = body;

    if (!status || !["approved", "denied", "escalated"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved', 'denied', or 'escalated'" },
        { status: 400 }
      );
    }

    if (!reviewNote) {
      return NextResponse.json(
        { error: "reviewNote is required" },
        { status: 400 }
      );
    }

    logger.info("Admin reviewing appeal", {
      adminUserId: admin.userId,
      appealId,
      status,
    });

    const updatedAppeal = await reviewAppeal(appealId, admin.userId, {
      status,
      reviewNote,
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "moderation.appeal.review",
      targetType: "appeal",
      targetId: appealId,
      metadata: {
        status,
        moderationActionId: updatedAppeal.moderationActionId,
        targetUserId: updatedAppeal.moderationAction?.targetUserId,
      },
    });

    return NextResponse.json(updatedAppeal);
  });
}
