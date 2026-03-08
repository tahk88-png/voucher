/**
 * GET /api/admin/audit
 *
 * Paginated query endpoint for the immutable admin audit log.
 * Returns entries with actor user info and supports filtering by action,
 * actor, target, and date range.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.audit.read")

    const searchParams = req.nextUrl.searchParams

    // ---- Pagination --------------------------------------------------------
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10)),
    )
    const skip = (page - 1) * limit

    // ---- Filters -----------------------------------------------------------
    const action = searchParams.get("action") || undefined
    const actorId = searchParams.get("actorId") || undefined
    const targetType = searchParams.get("targetType") || undefined
    const targetId = searchParams.get("targetId") || undefined
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined

    const where: Record<string, unknown> = {}

    if (action) where.action = action
    if (actorId) where.actorUserId = actorId
    if (targetType) where.targetType = targetType
    if (targetId) where.targetId = targetId

    if (from || to) {
      const createdAt: Record<string, Date> = {}
      if (from) createdAt.gte = new Date(from)
      if (to) createdAt.lte = new Date(to)
      where.createdAt = createdAt
    }

    // ---- Query -------------------------------------------------------------
    const [entries, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip,
      }),
      prisma.adminAuditLog.count({ where }),
    ])

    return NextResponse.json({
      entries,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  })
}
