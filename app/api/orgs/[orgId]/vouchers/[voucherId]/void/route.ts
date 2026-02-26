import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

export async function POST(
  req: Request,
  { params }: { params: { orgId: string; voucherId: string } }
) {
  return withErrorHandler(async () => {
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, params.orgId, ["owner", "admin"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const voucher = await prisma.voucherInstance.findFirst({
      where: { id: params.voucherId, orgId: params.orgId },
    })
    if (!voucher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (voucher.status === "redeemed") {
      return NextResponse.json({ error: "Redeemed vouchers cannot be voided" }, { status: 400 })
    }

    const updated = await prisma.voucherInstance.update({
      where: { id: voucher.id },
      data: { status: "voided" },
    })

    await recordAuditEvent({
      orgId: params.orgId,
      actorUserId: session.user.id,
      entityType: "voucher",
      entityId: updated.id,
      eventType: "void",
      before: voucher,
      after: updated,
    })

    return NextResponse.json({ voucher: updated })
  })
}
