import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: Request,
  { params }: { params: { orgId: string; orderId: string } }
) {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await requireOrgMembership(session.user.id, params.orgId)
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const order = await prisma.b2BOrder.findFirst({
    where: { id: params.orderId, orgId: params.orgId },
    include: { campaign: true, invoice: true, vouchers: true },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ order })
}
