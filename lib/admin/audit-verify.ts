/**
 * Audit chain integrity verification.
 *
 * Walks the AdminAuditLog table in chronological order and re-computes every
 * hash to confirm that no record has been tampered with and that the chain
 * links are unbroken.
 *
 * Processing is done in cursor-based batches to keep memory usage bounded.
 */

import { prisma } from "@/lib/prisma"
import { computeEntryHash, GENESIS_HASH } from "./audit"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AuditChainVerificationResult = {
  valid: boolean
  totalEntries: number
  checkedEntries: number
  firstBrokenAt?: string
  error?: string
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

export async function verifyAuditChain(
  options?: { from?: Date; to?: Date; batchSize?: number },
): Promise<AuditChainVerificationResult> {
  const batchSize = options?.batchSize ?? 1000

  // ---- Build date filter ---------------------------------------------------
  const dateFilter: Record<string, Date> = {}
  if (options?.from) dateFilter.gte = options.from
  if (options?.to) dateFilter.lte = options.to

  const dateWhere =
    Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {}

  // ---- Total count ---------------------------------------------------------
  const totalEntries = await prisma.adminAuditLog.count({ where: dateWhere })

  if (totalEntries === 0) {
    return { valid: true, totalEntries: 0, checkedEntries: 0 }
  }

  // ---- Walk the chain in batches -------------------------------------------
  let checkedEntries = 0
  let cursor: string | undefined = undefined
  let prevHashSelf: string | null = null

  // If we are filtering with a "from" date we need the hash of the entry
  // immediately *before* the window to validate the first entry's hashPrev.
  if (options?.from) {
    const entryBefore = await prisma.adminAuditLog.findFirst({
      where: { createdAt: { lt: options.from } },
      orderBy: { createdAt: "desc" },
      select: { hashSelf: true },
    })
    prevHashSelf = entryBefore?.hashSelf ?? null
  }

  while (true) {
    const findArgs: Parameters<typeof prisma.adminAuditLog.findMany>[0] = {
      where: dateWhere,
      orderBy: { createdAt: "asc" },
      take: batchSize,
    }
    if (cursor) {
      findArgs.skip = 1
      findArgs.cursor = { id: cursor }
    }
    const batch = await prisma.adminAuditLog.findMany(findArgs)

    if (batch.length === 0) break

    for (const entry of batch) {
      // Determine expected previous hash
      const expectedPrev =
        prevHashSelf === null ? GENESIS_HASH : prevHashSelf

      // 1. Verify hashPrev link
      if (entry.hashPrev !== expectedPrev) {
        return {
          valid: false,
          totalEntries,
          checkedEntries,
          firstBrokenAt: entry.id,
          error: `hashPrev mismatch at entry ${entry.id}: expected ${expectedPrev}, got ${entry.hashPrev}`,
        }
      }

      // 2. Recompute hashSelf
      const recomputed = computeEntryHash({
        actorUserId: entry.actorUserId,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        reason: entry.reason,
        metadata: entry.metadata as Record<string, unknown> | null,
        hashPrev: entry.hashPrev,
        createdAt: entry.createdAt,
      })

      if (recomputed !== entry.hashSelf) {
        return {
          valid: false,
          totalEntries,
          checkedEntries,
          firstBrokenAt: entry.id,
          error: `hashSelf mismatch at entry ${entry.id}: expected ${recomputed}, got ${entry.hashSelf}`,
        }
      }

      prevHashSelf = entry.hashSelf
      checkedEntries++
    }

    cursor = batch[batch.length - 1].id

    // If we received fewer than batchSize, we have exhausted the table.
    if (batch.length < batchSize) break
  }

  return { valid: true, totalEntries, checkedEntries }
}
