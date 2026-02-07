import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { B2BVoucherStatus } from "@prisma/client"

export async function GET(
  req: Request,
  { params }: { params: { orgId: string } }
) {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await requireOrgMembership(session.user.id, params.orgId)
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const statusParam = searchParams.get("status")
  const campaignId = searchParams.get("campaignId")
  const q = searchParams.get("q")
  const status = statusParam && Object.values(B2BVoucherStatus).includes(statusParam as B2BVoucherStatus)
    ? (statusParam as B2BVoucherStatus)
    : undefined

  const vouchers = await prisma.voucherInstance.findMany({
    where: {
      orgId: params.orgId,
      ...(status ? { status } : {}),
      ...(campaignId ? { campaignId } : {}),
      ...(q
        ? {
            OR: [
              { code: { contains: q, mode: "insensitive" } },
              { issuedToEmail: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ vouchers })
}
