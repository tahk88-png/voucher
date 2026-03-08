import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { generateCode } from "@/lib/b2b/codes"
import { hashToken } from "@/lib/b2b/crypto"
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
      include: { campaign: true, vouchers: true },
    })
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (order.status === "paid") {
      return NextResponse.json({ error: "Order already paid" }, { status: 409 })
    }
    if (order.status === "cancelled" || order.status === "refunded") {
      return NextResponse.json({ error: "Order is cancelled/refunded" }, { status: 400 })
    }

    const beforeStatus = order.status

    const updated = await prisma.b2BOrder.update({
      where: { id: order.id },
      data: { status: "paid" },
    })

    await prisma.b2BInvoice.updateMany({
      where: { orderId: order.id },
      data: { status: "paid" },
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "order",
      entityId: updated.id,
      eventType: "update",
      before: { status: beforeStatus },
      after: { status: updated.status },
    })

    // On paid: issue vouchers linked to order (if none already issued)
    const existingLinks = order.vouchers.length
    if (existingLinks === 0 && order.quantity > 0) {
      const campaign = order.campaign

      const voucherData: Prisma.VoucherInstanceCreateManyInput[] = []
      for (let i = 0; i < order.quantity; i += 1) {
        const code = generateCode(campaign.codePrefix ?? undefined, 8)
        voucherData.push({
          campaignId: campaign.id,
          orgId: campaign.orgId,
          code,
          codeHash: hashToken(code),
          status: "active",
          issuedToType: "company",
          issuedToOrgId: order.orgId,
          initialValueAmount: campaign.valueAmount,
          remainingValueAmount: campaign.valueType === "fixed" ? campaign.valueAmount : undefined,
          activatedAt: new Date(),
          expiresAt: campaign.validTo ?? undefined,
        })
      }

      await prisma.voucherInstance.createMany({ data: voucherData, skipDuplicates: true })

      // Link vouchers to order
      const createdVouchers = await prisma.voucherInstance.findMany({
        where: {
          orgId: campaign.orgId,
          campaignId: campaign.id,
          code: { in: voucherData.map((v) => v.code) },
        },
        select: { id: true },
      })

      if (createdVouchers.length > 0) {
        await prisma.orderVoucher.createMany({
          data: createdVouchers.map((v) => ({
            orderId: order.id,
            voucherId: v.id,
          })),
          skipDuplicates: true,
        })
      }

      await recordAuditEvent({
        orgId,
        actorUserId: session.user.id,
        entityType: "voucher",
        entityId: campaign.id,
        eventType: "issue",
        after: { quantity: createdVouchers.length, triggeredBy: "order_paid", orderId: order.id },
      })
    }

    return NextResponse.json({ order: updated })
  })
}
