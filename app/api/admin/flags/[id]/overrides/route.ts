import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { recordAdminAudit } from "@/lib/admin/audit"
import { prisma } from "@/lib/prisma"
import { cacheDelete } from "@/lib/redis"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.flags.read")

    const { id } = await params

    const flag = await prisma.featureFlag.findUnique({ where: { id } })
    if (!flag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 })
    }

    const overrides = await prisma.featureFlagOverride.findMany({
      where: { flagId: id },
      orderBy: { id: "desc" },
    })

    return NextResponse.json({ overrides, flagKey: flag.key })
  })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.flags.manage")

    const { id } = await params
    const body = await req.json()
    const { tenantId, userId, orgId, enabled } = body

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled must be a boolean" },
        { status: 400 }
      )
    }

    if (!tenantId && !userId && !orgId) {
      return NextResponse.json(
        { error: "At least one of tenantId, userId, or orgId is required" },
        { status: 400 }
      )
    }

    const flag = await prisma.featureFlag.findUnique({ where: { id } })
    if (!flag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 })
    }

    const override = await prisma.featureFlagOverride.create({
      data: {
        flagId: id,
        tenantId: tenantId ?? null,
        userId: userId ?? null,
        orgId: orgId ?? null,
        enabled,
      },
    })

    // Invalidate Redis cache entries for this flag
    await invalidateFlagCache(flag.key, { tenantId, userId, orgId })

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "flag.override.create",
      targetType: "feature_flag_override",
      targetId: override.id,
      metadata: {
        flagId: id,
        flagKey: flag.key,
        tenantId,
        userId,
        orgId,
        enabled,
      },
    })

    return NextResponse.json({ override }, { status: 201 })
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.flags.manage")

    const { id } = await params
    const url = new URL(req.url)
    const overrideId = url.searchParams.get("overrideId")

    if (!overrideId) {
      return NextResponse.json(
        { error: "overrideId query parameter is required" },
        { status: 400 }
      )
    }

    const override = await prisma.featureFlagOverride.findUnique({
      where: { id: overrideId },
    })
    if (!override || override.flagId !== id) {
      return NextResponse.json(
        { error: "Override not found for this flag" },
        { status: 404 }
      )
    }

    const flag = await prisma.featureFlag.findUnique({ where: { id } })

    await prisma.featureFlagOverride.delete({
      where: { id: overrideId },
    })

    // Invalidate Redis cache entries for this flag
    if (flag) {
      await invalidateFlagCache(flag.key, {
        tenantId: override.tenantId,
        userId: override.userId,
        orgId: override.orgId,
      })
    }

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "flag.override.delete",
      targetType: "feature_flag_override",
      targetId: overrideId,
      metadata: {
        flagId: id,
        flagKey: flag?.key,
        tenantId: override.tenantId,
        userId: override.userId,
        orgId: override.orgId,
      },
    })

    return NextResponse.json({ success: true })
  })
}

// ---------------------------------------------------------------------------
// Cache invalidation helper
// ---------------------------------------------------------------------------

async function invalidateFlagCache(
  flagKey: string,
  context: { tenantId?: string | null; userId?: string | null; orgId?: string | null }
): Promise<void> {
  try {
    // Invalidate the specific cache key that matches this override context
    const cacheKey = `ff:${flagKey}:${context.tenantId ?? ""}:${context.userId ?? ""}:${context.orgId ?? ""}`
    await cacheDelete(cacheKey)
  } catch {
    // Cache invalidation failure is non-fatal
  }
}
