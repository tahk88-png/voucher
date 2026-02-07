import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"

function buildInvoiceNumber() {
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `INV-${stamp}-${rand}`
}

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

  const invoice = await prisma.b2BInvoice.create({
    data: {
      orderId: order.id,
      invoiceNumber: buildInvoiceNumber(),
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      subtotalAmount: order.totalAmount,
      vatAmount: 0,
      totalAmount: order.totalAmount,
      status: "issued",
    },
  })

  await prisma.b2BOrder.update({
    where: { id: order.id },
    data: { status: "invoiced" },
  })

  await recordAuditEvent({
    orgId: params.orgId,
    actorUserId: session.user.id,
    entityType: "invoice",
    entityId: invoice.id,
    eventType: "create",
    after: invoice,
  })

  return NextResponse.json({ invoice })
}
