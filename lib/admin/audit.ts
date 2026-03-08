/**
 * Immutable hash-chain audit log for admin actions.
 *
 * Every entry stores a SHA-256 hash of its own payload plus the hash of the
 * previous entry, forming a tamper-evident chain. The first entry chains from
 * a well-known genesis hash (64 zeroes).
 */

import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { logger } from "@/lib/logger"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Hash used as `hashPrev` for the very first entry in the chain. */
export const GENESIS_HASH = "0".repeat(64)

/** Actions that *must* include a human-readable reason. */
export const REASON_REQUIRED_ACTIONS = [
  "user.ban",
  "user.unban",
  "user.delete",
  "user.suspend",
  "merchant.deactivate",
  "refund.issue",
  "payout.hold",
  "payout.release",
  "moderation.action",
  "legal_hold.create",
  "legal_hold.release",
  "impersonation.start",
] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminAuditInput = {
  actorUserId: string
  actorIp?: string
  actorUserAgent?: string
  action: string
  targetType?: string
  targetId?: string
  reason?: string
  metadata?: Record<string, unknown>
  idempotencyKey?: string
}

// ---------------------------------------------------------------------------
// Hash computation
// ---------------------------------------------------------------------------

/**
 * Compute the SHA-256 hash for an audit entry.
 *
 * The hash covers all semantically meaningful fields so that any mutation of a
 * stored record can be detected during verification.
 */
export function computeEntryHash(entry: {
  actorUserId: string
  action: string
  targetType?: string | null
  targetId?: string | null
  reason?: string | null
  metadata?: Record<string, unknown> | Prisma.JsonValue | null
  hashPrev: string
  createdAt: Date
}): string {
  const payload = JSON.stringify({
    actorUserId: entry.actorUserId,
    action: entry.action,
    targetType: entry.targetType ?? null,
    targetId: entry.targetId ?? null,
    reason: entry.reason ?? null,
    metadata: entry.metadata ?? null,
    hashPrev: entry.hashPrev,
    createdAt: entry.createdAt.toISOString(),
  })

  return crypto.createHash("sha256").update(payload).digest("hex")
}

// ---------------------------------------------------------------------------
// Record helper
// ---------------------------------------------------------------------------

/**
 * Append a new entry to the admin audit chain.
 *
 * Optionally accepts a Prisma transaction client so the audit row can be
 * created inside the same DB transaction as the action it records.
 *
 * @returns The id of the newly created AdminAuditLog entry.
 */
export async function recordAdminAudit(
  input: AdminAuditInput,
  tx?: Prisma.TransactionClient,
): Promise<string> {
  const db = tx ?? prisma

  // ---- Reason validation ---------------------------------------------------
  if (
    REASON_REQUIRED_ACTIONS.includes(input.action as (typeof REASON_REQUIRED_ACTIONS)[number]) &&
    !input.reason
  ) {
    throw new Error(`Reason required for action: ${input.action}`)
  }

  // ---- Idempotency ---------------------------------------------------------
  if (input.idempotencyKey) {
    const existing = await db.adminAuditLog.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      select: { id: true },
    })

    if (existing) {
      return existing.id
    }
  }

  // ---- Resolve previous hash -----------------------------------------------
  const lastEntry = await db.adminAuditLog.findFirst({
    orderBy: { createdAt: "desc" },
    select: { hashSelf: true },
  })

  const hashPrev = lastEntry?.hashSelf ?? GENESIS_HASH

  // ---- Compute self hash ---------------------------------------------------
  const createdAt = new Date()

  const hashSelf = computeEntryHash({
    actorUserId: input.actorUserId,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    reason: input.reason,
    metadata: input.metadata,
    hashPrev,
    createdAt,
  })

  // ---- Persist -------------------------------------------------------------
  const entry = await db.adminAuditLog.create({
    data: {
      actorUserId: input.actorUserId,
      actorIp: input.actorIp ?? null,
      actorUserAgent: input.actorUserAgent ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      reason: input.reason ?? null,
      metadata: (input.metadata as Prisma.JsonObject) ?? Prisma.JsonNull,
      idempotencyKey: input.idempotencyKey ?? null,
      hashPrev,
      hashSelf,
      createdAt,
    },
  })

  logger.info("Admin audit recorded", {
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    actorUserId: input.actorUserId,
    entryId: entry.id,
  })

  return entry.id
}
