import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

function buildInvoiceNumber() {
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `INV-${stamp}-${rand}`
}

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

    const existingInvoice = await prisma.b2BInvoice.findUnique({
      where: { orderId: order.id },
    })
    if (existingInvoice) {
      return NextResponse.json({ error: "Invoice already exists for this order" }, { status: 409 })
    }

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

    const beforeOrderStatus = order.status
    await prisma.b2BOrder.update({
      where: { id: order.id },
      data: { status: "invoiced" },
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "create",
      after: invoice,
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "order",
      entityId: order.id,
      eventType: "update",
      before: { status: beforeOrderStatus },
      after: { status: "invoiced" },
    })

    return NextResponse.json({ invoice })
  })
}
