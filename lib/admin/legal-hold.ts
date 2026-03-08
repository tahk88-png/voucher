/**
 * Legal hold management.
 *
 * A legal hold prevents a user's data from being deleted or anonymised
 * (e.g. during a GDPR deletion request) until the hold is released.
 */

import { prisma } from "@/lib/prisma";
import { recordAdminAudit } from "./audit";
import { logger } from "@/lib/logger";

// ---------------------------------------------------------------------------
// Check
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the given user has at least one active legal hold.
 */
export async function hasActiveLegalHold(userId: string): Promise<boolean> {
  const count = await prisma.legalHold.count({
    where: { userId, releasedAt: null },
  });
  return count > 0;
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createLegalHold(input: {
  userId: string;
  holdType: "gdpr_request" | "law_enforcement" | "litigation";
  reason: string;
  actorUserId: string;
}): Promise<{ id: string }> {
  const hold = await prisma.legalHold.create({
    data: {
      userId: input.userId,
      holdType: input.holdType,
      notes: input.reason,
      actorUserId: input.actorUserId,
    },
  });

  await recordAdminAudit({
    actorUserId: input.actorUserId,
    action: "legal_hold.create",
    targetType: "User",
    targetId: input.userId,
    reason: input.reason,
    metadata: { holdId: hold.id, holdType: input.holdType },
  });

  logger.info("Legal hold created", {
    holdId: hold.id,
    userId: input.userId,
    holdType: input.holdType,
  });

  return { id: hold.id };
}

// ---------------------------------------------------------------------------
// Release
// ---------------------------------------------------------------------------

export async function releaseLegalHold(input: {
  holdId: string;
  actorUserId: string;
  reason: string;
}): Promise<void> {
  const hold = await prisma.legalHold.findUnique({
    where: { id: input.holdId },
  });

  if (!hold) {
    throw new Error("Legal hold not found");
  }

  if (hold.releasedAt) {
    throw new Error("Legal hold already released");
  }

  await prisma.legalHold.update({
    where: { id: input.holdId },
    data: {
      releasedAt: new Date(),
      releasedBy: input.actorUserId,
    },
  });

  await recordAdminAudit({
    actorUserId: input.actorUserId,
    action: "legal_hold.release",
    targetType: "User",
    targetId: hold.userId ?? hold.merchantId ?? hold.id,
    reason: input.reason,
    metadata: { holdId: hold.id, holdType: hold.holdType },
  });

  logger.info("Legal hold released", {
    holdId: hold.id,
    userId: hold.userId,
  });
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function getLegalHolds(filters: {
  userId?: string;
  active?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ holds: any[]; total: number }> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.active === true) where.releasedAt = null;
  if (filters.active === false) where.releasedAt = { not: null };

  const [holds, total] = await Promise.all([
    prisma.legalHold.findMany({
      where,
      include: {
        actor: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.legalHold.count({ where }),
  ]);

  return { holds, total };
}
