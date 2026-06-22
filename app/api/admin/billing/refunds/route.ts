import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { recordAdminAudit } from "@/lib/admin/audit"
import { issueRefund } from "@/lib/admin/billing"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.billing.read")

    const url = new URL(req.url)
    const status = url.searchParams.get("status") ?? undefined
    const purchaseType = url.searchParams.get("purchaseType") ?? undefined
    const page = parseInt(url.searchParams.get("page") ?? "1", 10)
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (status) where.status = status
    if (purchaseType) where.purchaseType = purchaseType

    const [refunds, total] = await Promise.all([
      prisma.refundRecord.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.refundRecord.count({ where }),
    ])

    return NextResponse.json({ refunds, total, page, limit })
  })
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.billing.refund")

    const body = await req.json()
    const { purchaseId, purchaseType, amount, reason, idempotencyKey } = body

    if (!purchaseId || !purchaseType || !reason) {
      return NextResponse.json(
        { error: "purchaseId, purchaseType, and reason are required" },
        { status: 400 }
      )
    }

    if (!["voucher_purchase", "ticket_purchase"].includes(purchaseType)) {
      return NextResponse.json(
        { error: "purchaseType must be voucher_purchase or ticket_purchase" },
        { status: 400 }
      )
    }

    // Validate a partial-refund amount: must be a positive integer (minor
    // units). Without this a negative / NaN / float / absurdly-large value
    // (e.g. Number("1e9")) would flow into Stripe + the RefundRecord ledger.
    // issueRefund additionally clamps it to the captured charge amount.
    let refundAmount: number | undefined
    if (amount != null) {
      refundAmount = Number(amount)
      if (!Number.isInteger(refundAmount) || refundAmount <= 0) {
        return NextResponse.json(
          { error: "amount must be a positive integer (minor units)" },
          { status: 400 }
        )
      }
    }

    const refund = await issueRefund({
      purchaseId,
      purchaseType,
      actorUserId: admin.userId,
      amount: refundAmount,
      reason,
      idempotencyKey,
    })

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "refund.issue",
      targetType: purchaseType,
      targetId: purchaseId,
      reason,
      metadata: {
        refundId: refund.id,
        amount: refund.amount,
        stripeRefundId: refund.stripeRefundId,
      },
      idempotencyKey,
    })

    return NextResponse.json({ refund }, { status: 201 })
  })
}
