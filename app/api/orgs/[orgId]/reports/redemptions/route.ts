import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId, [
      "owner", "admin", "finance", "auditor", "support",
    ])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const partnerOrgId = searchParams.get("partnerOrgId")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      voucher: { orgId },
    }
    if (partnerOrgId) where.partnerOrgId = partnerOrgId
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to) } : {}),
      }
    }

    const [redemptions, total] = await Promise.all([
      prisma.voucherRedemption.findMany({
        where,
        include: {
          voucher: {
            select: { id: true, code: false, status: true, campaignId: true, initialValueAmount: true },
          },
          partner: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.voucherRedemption.count({ where }),
    ])

    const aggregations = await prisma.voucherRedemption.aggregate({
      where,
      _sum: { amountRedeemed: true },
      _count: true,
    })

    return NextResponse.json({
      redemptions: redemptions.map((r) => ({
        id: r.id,
        voucherId: r.voucherId,
        partnerOrg: r.partner,
        amountRedeemed: r.amountRedeemed,
        currency: r.currency,
        status: r.status,
        locationId: r.locationId,
        createdAt: r.createdAt,
        campaignId: r.voucher.campaignId,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary: {
        totalRedemptions: aggregations._count,
        totalAmountRedeemed: aggregations._sum.amountRedeemed ?? 0,
      },
    })
  })
}
