import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { cacheGet, cacheSet } from "@/lib/redis"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FlagRules = {
  percentage?: number // 0-100
  tenantIds?: string[] // merchantId allowlist
  userIds?: string[] // userId allowlist
  cohorts?: string[] // "beta", "early_access"
  orgIds?: string[] // B2B org allowlist
}

type EvaluationContext = {
  tenantId?: string
  userId?: string
  orgId?: string
}

// ---------------------------------------------------------------------------
// Consistent hashing helper
// ---------------------------------------------------------------------------

export function isInPercentageRollout(
  flagKey: string,
  entityId: string,
  percentage: number
): boolean {
  const hash = crypto
    .createHash("sha256")
    .update(flagKey + ":" + entityId)
    .digest("hex")
  const bucket = parseInt(hash.substring(0, 8), 16) % 100
  return bucket < percentage
}

// ---------------------------------------------------------------------------
// Single flag evaluation
// ---------------------------------------------------------------------------

export async function evaluateFlag(
  flagKey: string,
  context: EvaluationContext
): Promise<boolean> {
  const cacheKey = `ff:${flagKey}:${context.tenantId ?? ""}:${context.userId ?? ""}:${context.orgId ?? ""}`

  // 1. Check Redis cache
  try {
    const cached = await cacheGet(cacheKey)
    if (cached !== null && cached !== undefined) {
      return cached === "true"
    }
  } catch {
    // Cache miss or error — continue to DB
  }

  // 2. Fetch flag from DB with overrides
  const flag = await prisma.featureFlag.findUnique({
    where: { key: flagKey },
    include: { overrides: true },
  })

  if (!flag) {
    await safeCacheSet(cacheKey, "false", 30)
    return false
  }

  // 3. Check overrides first (highest priority)
  if (flag.overrides && flag.overrides.length > 0) {
    for (const override of flag.overrides) {
      if (
        context.tenantId &&
        override.tenantId &&
        override.tenantId === context.tenantId
      ) {
        await safeCacheSet(cacheKey, String(override.enabled), 30)
        return override.enabled
      }
      if (
        context.userId &&
        override.userId &&
        override.userId === context.userId
      ) {
        await safeCacheSet(cacheKey, String(override.enabled), 30)
        return override.enabled
      }
      if (
        context.orgId &&
        override.orgId &&
        override.orgId === context.orgId
      ) {
        await safeCacheSet(cacheKey, String(override.enabled), 30)
        return override.enabled
      }
    }
  }

  // 4. Evaluate based on flag status
  const rules = (flag.rules as FlagRules) ?? {}
  let result = false

  switch (flag.status) {
    case "off":
      result = false
      break

    case "on":
      result = true
      break

    case "percentage": {
      const entityId =
        context.tenantId ?? context.userId ?? context.orgId ?? ""
      const pct = rules.percentage ?? 0
      result = isInPercentageRollout(flagKey, entityId, pct)
      break
    }

    case "allowlist": {
      if (context.tenantId && rules.tenantIds?.includes(context.tenantId)) {
        result = true
      } else if (context.userId && rules.userIds?.includes(context.userId)) {
        result = true
      } else if (context.orgId && rules.orgIds?.includes(context.orgId)) {
        result = true
      }
      break
    }

    default:
      result = false
  }

  // 5. Cache and return
  await safeCacheSet(cacheKey, String(result), 30)
  return result
}

// ---------------------------------------------------------------------------
// Batch evaluation
// ---------------------------------------------------------------------------

export async function evaluateFlagBatch(
  flagKeys: string[],
  context: EvaluationContext
): Promise<Record<string, boolean>> {
  const results = await Promise.all(
    flagKeys.map(async (key) => {
      const value = await evaluateFlag(key, context)
      return [key, value] as const
    })
  )

  return Object.fromEntries(results)
}

// ---------------------------------------------------------------------------
// Cache helper (swallows errors)
// ---------------------------------------------------------------------------

async function safeCacheSet(
  key: string,
  value: string,
  ttl: number
): Promise<void> {
  try {
    await cacheSet(key, value, ttl)
  } catch (err) {
    // Redis cache write failure is non-fatal
  }
}
