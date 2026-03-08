import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

const schema = z.object({
  campaignId: z.string().uuid(),
  quantity: z.number().int().min(1),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const membership = await requireOrgMembership(session.user.id, orgId)
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const orders = await prisma.b2BOrder.findMany({
      where: { orgId },
      include: { campaign: true, invoice: true },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ orders })
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const membership = await requireOrgMembership(session.user.id, orgId, ["owner", "admin", "finance", "marketing"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const campaign = await prisma.voucherCampaign.findFirst({
      where: { id: parsed.data.campaignId, orgId },
    })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    const unitPriceAmount = campaign.valueAmount
    const totalAmount = unitPriceAmount * parsed.data.quantity

    const order = await prisma.b2BOrder.create({
      data: {
        orgId,
        campaignId: campaign.id,
        quantity: parsed.data.quantity,
        unitPriceAmount,
        totalAmount,
        currency: campaign.currency,
        status: "draft",
      },
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "order",
      entityId: order.id,
      eventType: "create",
      after: order,
    })

    return NextResponse.json({ order })
  })
}
