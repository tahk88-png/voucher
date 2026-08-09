import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { recordAdminAudit } from "@/lib/admin/audit"
import { releasePayoutHold } from "@/lib/admin/billing"
import { prisma } from "@/lib/prisma"
import { getClientIp } from "@/lib/get-client-ip"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.billing.payout_hold")

    const { id } = await params
    const body = await req.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: "reason is required" },
        { status: 400 }
      )
    }

    // Verify the hold exists and is active
    const existing = await prisma.payoutHold.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Payout hold not found" },
        { status: 404 }
      )
    }
    if (!existing.isActive) {
      return NextResponse.json(
        { error: "Payout hold is already released" },
        { status: 409 }
      )
    }

    await releasePayoutHold(id, admin.userId, reason)

    const ipRaw = getClientIp(req)
    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: ipRaw === "unknown" ? undefined : ipRaw,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "payout.release",
      targetType: "payout_hold",
      targetId: id,
      reason,
      metadata: { merchantId: existing.merchantId },
    })

    return NextResponse.json({ success: true })
  })
}
