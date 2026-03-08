import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function submitAppeal(input: {
  moderationActionId: string;
  appealUserId: string;
  reason: string;
  evidenceUrls?: string[];
}): Promise<any> {
  // Verify the moderation action exists
  const moderationAction = await prisma.moderationAction.findUnique({
    where: { id: input.moderationActionId },
  });

  if (!moderationAction) {
    throw new Error("Moderation action not found");
  }

  // Check for duplicate appeal on this moderation action
  const existingAppeal = await prisma.appeal.findFirst({
    where: { moderationActionId: input.moderationActionId },
  });

  if (existingAppeal) {
    throw new Error(
      "An appeal already exists for this moderation action"
    );
  }

  const appeal = await prisma.appeal.create({
    data: {
      moderationActionId: input.moderationActionId,
      appealUserId: input.appealUserId,
      reason: input.reason,
      evidenceUrls: input.evidenceUrls ?? [],
      status: "submitted",
    },
  });

  logger.info("Appeal submitted", {
    appealId: appeal.id,
    moderationActionId: input.moderationActionId,
    appealUserId: input.appealUserId,
  });

  return appeal;
}

export async function reviewAppeal(
  appealId: string,
  reviewerUserId: string,
  decision: {
    status: "approved" | "denied" | "escalated";
    reviewNote: string;
  }
): Promise<any> {
  const appeal = await prisma.appeal.findUnique({
    where: { id: appealId },
    include: { moderationAction: true },
  });

  if (!appeal) {
    throw new Error("Appeal not found");
  }

  const updateData: Record<string, unknown> = {
    status: decision.status,
    reviewerUserId,
    reviewNote: decision.reviewNote,
  };

  if (decision.status === "approved" || decision.status === "denied") {
    updateData.resolvedAt = new Date();
  }

  const updatedAppeal = await prisma.appeal.update({
    where: { id: appealId },
    data: updateData,
    include: { moderationAction: true },
  });

  // If approved, reverse the moderation action
  if (decision.status === "approved" && appeal.moderationAction) {
    await prisma.moderationAction.update({
      where: { id: appeal.moderationAction.id },
      data: {
        reversedAt: new Date(),
        reversedBy: reviewerUserId,
        reversalReason: decision.reviewNote,
      },
    });

    // If the user was banned or suspended, restore their status
    const actionType = appeal.moderationAction.actionType;
    const targetUserId = appeal.moderationAction.targetUserId;

    if (
      targetUserId &&
      (actionType === "ban" || actionType === "suspension")
    ) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: { status: "active" },
      });

      logger.info("User status restored to active after appeal approval", {
        targetUserId,
        appealId,
      });
    }

    logger.info("Moderation action reversed via approved appeal", {
      appealId,
      moderationActionId: appeal.moderationAction.id,
      reviewerUserId,
    });
  }

  if (decision.status === "escalated") {
    logger.info("Appeal escalated for super_admin review", {
      appealId,
      reviewerUserId,
    });
  }

  logger.info("Appeal reviewed", {
    appealId,
    status: decision.status,
    reviewerUserId,
  });

  return updatedAppeal;
}
