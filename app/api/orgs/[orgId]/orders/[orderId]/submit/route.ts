import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; orderId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId, orderId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId, ["owner", "admin", "finance"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const order = await prisma.b2BOrder.findFirst({
      where: { id: orderId, orgId },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.b2BOrder.update({
      where: { id: order.id },
      data: { status: "submitted" },
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "order",
      entityId: updated.id,
      eventType: "update",
      before: order,
      after: updated,
    })

    return NextResponse.json({ order: updated })
  })
}
