import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { B2BVoucherStatus } from "@prisma/client"
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
      "owner", "admin", "finance", "marketing", "auditor", "support",
    ])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { searchParams } = new URL(req.url)
    const statusParam = searchParams.get("status")
    const campaignId = searchParams.get("campaignId")
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))
    const skip = (page - 1) * limit

    const status = statusParam && Object.values(B2BVoucherStatus).includes(statusParam as B2BVoucherStatus)
      ? (statusParam as B2BVoucherStatus)
      : undefined

    const where: Record<string, unknown> = {
      orgId,
      ...(status ? { status } : {}),
      ...(campaignId ? { campaignId } : {}),
    }

    const [vouchers, total] = await Promise.all([
      prisma.voucherInstance.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true, valueType: true, currency: true } },
          _count: { select: { redemptions: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.voucherInstance.count({ where }),
    ])

    const statusCounts = await prisma.voucherInstance.groupBy({
      by: ["status"],
      where: {
        orgId,
        ...(campaignId ? { campaignId } : {}),
      },
      _count: true,
    })

    return NextResponse.json({
      vouchers: vouchers.map((v) => ({
        id: v.id,
        campaignId: v.campaignId,
        campaignName: v.campaign.name,
        status: v.status,
        valueType: v.campaign.valueType,
        initialValue: v.initialValueAmount,
        remainingValue: v.remainingValueAmount,
        currency: v.campaign.currency,
        redeemedCount: v.redeemedCount,
        redemptionCount: v._count.redemptions,
        issuedToEmail: v.issuedToEmail,
        issuedToOrgId: v.issuedToOrgId,
        activatedAt: v.activatedAt,
        expiresAt: v.expiresAt,
        createdAt: v.createdAt,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      statusBreakdown: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    })
  })
}
