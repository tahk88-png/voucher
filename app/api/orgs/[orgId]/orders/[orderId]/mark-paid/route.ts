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

    // Flip status, mark the invoice, and issue+link vouchers in one
    // transaction. Two concurrent mark-paid calls would otherwise both pass
    // the `status === "paid"` check above and each issue a full batch of
    // vouchers (double-issuance). The status flip is a compare-and-swap
    // (`status` NOT already paid/cancelled/refunded): only the first caller
    // matches a row, the loser gets count 0 and 409s — so vouchers are issued
    // exactly once and a mid-flight failure rolls the status flip back too.
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.b2BOrder.updateMany({
        where: { id: order.id, status: { notIn: ["paid", "cancelled", "refunded"] } },
        data: { status: "paid" },
      })
      if (claimed.count === 0) {
        return { conflict: true as const }
      }

      await tx.b2BInvoice.updateMany({
        where: { orderId: order.id },
        data: { status: "paid" },
      })

      // On paid: issue vouchers linked to order (if none already issued)
      let issuedCount = 0
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

        await tx.voucherInstance.createMany({ data: voucherData, skipDuplicates: true })

        // Link vouchers to order
        const createdVouchers = await tx.voucherInstance.findMany({
          where: {
            orgId: campaign.orgId,
            campaignId: campaign.id,
            code: { in: voucherData.map((v) => v.code) },
          },
          select: { id: true },
        })

        if (createdVouchers.length > 0) {
          await tx.orderVoucher.createMany({
            data: createdVouchers.map((v) => ({
              orderId: order.id,
              voucherId: v.id,
            })),
            skipDuplicates: true,
          })
        }

        issuedCount = createdVouchers.length
      }

      const updated = await tx.b2BOrder.findUniqueOrThrow({ where: { id: order.id } })
      return { conflict: false as const, updated, issuedCount, campaignId: order.campaign.id }
    })

    if (result.conflict) {
      // Lost the race — another request marked it paid first.
      return NextResponse.json({ error: "Order already paid" }, { status: 409 })
    }

    // Audit events after commit (best-effort; they write via the global
    // client and must not hold the transaction open).
    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "order",
      entityId: result.updated.id,
      eventType: "update",
      before: { status: beforeStatus },
      after: { status: result.updated.status },
    })

    if (result.issuedCount > 0) {
      await recordAuditEvent({
        orgId,
        actorUserId: session.user.id,
        entityType: "voucher",
        entityId: result.campaignId,
        eventType: "issue",
        after: { quantity: result.issuedCount, triggeredBy: "order_paid", orderId: order.id },
      })
    }

    return NextResponse.json({ order: result.updated })
  })
}
