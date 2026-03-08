import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; voucherId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId, voucherId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId)
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const voucher = await prisma.voucherInstance.findFirst({
      where: { id: voucherId, orgId },
    })

    if (!voucher) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json({ voucher })
  })
}
