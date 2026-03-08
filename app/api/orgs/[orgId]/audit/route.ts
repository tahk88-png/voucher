import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId)
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get("entityType") ?? undefined
    const entityId = searchParams.get("entityId") ?? undefined
    const eventType = searchParams.get("eventType") ?? undefined
    const actorUserId = searchParams.get("actorUserId") ?? undefined
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))

    const where: Record<string, unknown> = { orgId }
    if (entityType) where.entityType = entityType
    if (entityId) where.entityId = entityId
    if (eventType) where.eventType = eventType
    if (actorUserId) where.actorUserId = actorUserId
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditEvent.count({ where }),
    ])

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  })
}
