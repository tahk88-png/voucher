import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  codePrefix: z.string().optional(),
  valueType: z.enum(["fixed", "percent"]).optional(),
  valueAmount: z.number().int().positive().optional(),
  currency: z.string().optional(),
  usageType: z.enum(["single", "multi"]).optional(),
  maxRedemptionsPerVoucher: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  minPurchaseAmount: z.number().int().positive().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
})

export async function GET(
  req: Request,
  { params }: { params: { orgId: string; campaignId: string } }
) {
  return withErrorHandler(async () => {
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, params.orgId)
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const campaign = await prisma.voucherCampaign.findFirst({
      where: { id: params.campaignId, orgId: params.orgId },
      include: { allowedPartners: true },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ campaign })
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: { orgId: string; campaignId: string } }
) {
  return withErrorHandler(async () => {
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, params.orgId, ["owner", "admin", "marketing"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const existing = await prisma.voucherCampaign.findFirst({
      where: { id: params.campaignId, orgId: params.orgId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const campaign = await prisma.voucherCampaign.update({
      where: { id: existing.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        codePrefix: parsed.data.codePrefix,
        valueType: parsed.data.valueType,
        valueAmount: parsed.data.valueAmount,
        currency: parsed.data.currency,
        usageType: parsed.data.usageType,
        maxRedemptionsPerVoucher: parsed.data.maxRedemptionsPerVoucher,
        validFrom: parsed.data.validFrom ? new Date(parsed.data.validFrom) : undefined,
        validTo: parsed.data.validTo ? new Date(parsed.data.validTo) : undefined,
        minPurchaseAmount: parsed.data.minPurchaseAmount,
        status: parsed.data.status,
      },
    })

    await recordAuditEvent({
      orgId: params.orgId,
      actorUserId: session.user.id,
      entityType: "campaign",
      entityId: campaign.id,
      eventType: "update",
      before: existing,
      after: campaign,
    })

    return NextResponse.json({ campaign })
  })
}
