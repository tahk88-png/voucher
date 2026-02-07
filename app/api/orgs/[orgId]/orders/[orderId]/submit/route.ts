import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"

export async function POST(
  req: Request,
  { params }: { params: { orgId: string; orderId: string } }
) {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await requireOrgMembership(session.user.id, params.orgId, ["owner", "admin", "finance"])
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const order = await prisma.b2BOrder.findFirst({
    where: { id: params.orderId, orgId: params.orgId },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const updated = await prisma.b2BOrder.update({
    where: { id: order.id },
    data: { status: "submitted" },
  })

  await recordAuditEvent({
    orgId: params.orgId,
    actorUserId: session.user.id,
    entityType: "order",
    entityId: updated.id,
    eventType: "update",
    before: order,
    after: updated,
  })

  return NextResponse.json({ order: updated })
}
