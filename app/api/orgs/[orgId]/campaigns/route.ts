import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

const campaignSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  codePrefix: z.string().optional(),
  valueType: z.enum(["fixed", "percent"]),
  valueAmount: z.number().int().positive(),
  currency: z.string().default("EUR"),
  usageType: z.enum(["single", "multi"]).default("single"),
  maxRedemptionsPerVoucher: z.number().int().positive().optional(),
  validFrom: z.string().datetime().optional(),
  validTo: z.string().datetime().optional(),
  minPurchaseAmount: z.number().int().positive().optional(),
  status: z.enum(["draft", "active", "paused", "archived"]).optional(),
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

    const campaigns = await prisma.voucherCampaign.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ campaigns })
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

    const membership = await requireOrgMembership(session.user.id, orgId, ["owner", "admin", "marketing"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = campaignSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const campaign = await prisma.voucherCampaign.create({
      data: {
        orgId,
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
        status: parsed.data.status ?? "draft",
      },
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "campaign",
      entityId: campaign.id,
      eventType: "create",
      after: campaign,
    })

    return NextResponse.json({ campaign })
  })
}
