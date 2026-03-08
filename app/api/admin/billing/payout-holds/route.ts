import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { recordAdminAudit } from "@/lib/admin/audit"
import { createPayoutHold } from "@/lib/admin/billing"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.billing.read")

    const url = new URL(req.url)
    const merchantId = url.searchParams.get("merchantId") ?? undefined
    const activeParam = url.searchParams.get("active")
    const page = parseInt(url.searchParams.get("page") ?? "1", 10)
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100)
    const skip = (page - 1) * limit

    const where: any = {}
    if (merchantId) where.merchantId = merchantId
    if (activeParam !== null && activeParam !== undefined) {
      where.isActive = activeParam === "true"
    }

    const [holds, total] = await Promise.all([
      prisma.payoutHold.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.payoutHold.count({ where }),
    ])

    // If merchant data is needed, fetch separately
    const merchantIds = [...new Set(holds.map((h: any) => h.merchantId))]
    const merchants = merchantIds.length > 0
      ? await prisma.merchant.findMany({
          where: { id: { in: merchantIds } },
          select: { id: true, name: true, slug: true },
        })
      : []
    const merchantMap = Object.fromEntries(merchants.map((m) => [m.id, m]))

    const holdsWithMerchant = holds.map((h: any) => ({
      ...h,
      merchant: merchantMap[h.merchantId] ?? null,
    }))

    return NextResponse.json({ holds: holdsWithMerchant, total, page, limit })
  })
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.billing.payout_hold")

    const body = await req.json()
    const { merchantId, reason, notes } = body

    if (!merchantId || !reason || !notes) {
      return NextResponse.json(
        { error: "merchantId, reason, and notes are required" },
        { status: 400 }
      )
    }

    const validReasons = [
      "fraud_investigation",
      "chargeback",
      "compliance",
      "manual_review",
      "other",
    ]
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: `reason must be one of: ${validReasons.join(", ")}` },
        { status: 400 }
      )
    }

    const hold = await createPayoutHold({
      merchantId,
      reason,
      notes,
      actorUserId: admin.userId,
    })

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "payout.hold",
      targetType: "merchant",
      targetId: merchantId,
      reason: notes,
      metadata: { holdId: hold.id, holdReason: reason },
    })

    return NextResponse.json({ hold }, { status: 201 })
  })
}
