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

    const membership = await requireOrgMembership(session.user.id, params.orgId, ["owner", "admin", "marketing"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const voucher = await prisma.voucherInstance.findFirst({
      where: { id: params.voucherId, orgId: params.orgId },
    })
    if (!voucher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (voucher.status !== "issued" && voucher.status !== "created") {
      return NextResponse.json({ error: "Voucher cannot be activated" }, { status: 400 })
    }

    const updated = await prisma.voucherInstance.update({
      where: { id: voucher.id },
      data: { status: "active", activatedAt: new Date() },
    })

    await recordAuditEvent({
      orgId: params.orgId,
      actorUserId: session.user.id,
      entityType: "voucher",
      entityId: updated.id,
      eventType: "activate",
      before: voucher,
      after: updated,
    })

    return NextResponse.json({ voucher: updated })
  })
}
