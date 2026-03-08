import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

const addPartnerSchema = z.object({
  type: z.literal("partner"),
  partnerOrgId: z.string().uuid(),
})

const addProductSchema = z.object({
  type: z.literal("product"),
  productId: z.string().min(1),
})

const addLocationSchema = z.object({
  type: z.literal("location"),
  locationId: z.string().min(1),
})

const addRestrictionSchema = z.discriminatedUnion("type", [
  addPartnerSchema,
  addProductSchema,
  addLocationSchema,
])

const deleteRestrictionSchema = z.object({
  type: z.enum(["partner", "product", "location"]),
  id: z.string().uuid(),
})

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string; campaignId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId, campaignId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId)
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const campaign = await prisma.voucherCampaign.findFirst({
      where: { id: campaignId, orgId },
    })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    const [partners, products, locations] = await Promise.all([
      prisma.campaignAllowedPartner.findMany({
        where: { campaignId },
        include: { partner: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      }),
      prisma.campaignAllowedProduct.findMany({
        where: { campaignId },
        orderBy: { id: "asc" },
      }),
      prisma.campaignAllowedLocation.findMany({
        where: { campaignId },
        orderBy: { id: "asc" },
      }),
    ])

    return NextResponse.json({ partners, products, locations })
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string; campaignId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId, campaignId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId, ["owner", "admin", "marketing"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = addRestrictionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const campaign = await prisma.voucherCampaign.findFirst({
      where: { id: campaignId, orgId },
    })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    let restriction: unknown

    if (parsed.data.type === "partner") {
      const partner = await prisma.organization.findUnique({
        where: { id: parsed.data.partnerOrgId },
      })
      if (!partner) return NextResponse.json({ error: "Partner org not found" }, { status: 404 })

      restriction = await prisma.campaignAllowedPartner.create({
        data: { campaignId, partnerOrgId: parsed.data.partnerOrgId },
      })
    } else if (parsed.data.type === "product") {
      restriction = await prisma.campaignAllowedProduct.create({
        data: { campaignId, productId: parsed.data.productId },
      })
    } else {
      restriction = await prisma.campaignAllowedLocation.create({
        data: { campaignId, locationId: parsed.data.locationId },
      })
    }

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "campaign",
      entityId: campaignId,
      eventType: "update",
      after: { action: "restriction_added", type: parsed.data.type, restriction },
    })

    return NextResponse.json({ restriction }, { status: 201 })
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orgId: string; campaignId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId, campaignId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId, ["owner", "admin", "marketing"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = deleteRestrictionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const campaign = await prisma.voucherCampaign.findFirst({
      where: { id: campaignId, orgId },
    })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    if (parsed.data.type === "partner") {
      await prisma.campaignAllowedPartner.delete({ where: { id: parsed.data.id } })
    } else if (parsed.data.type === "product") {
      await prisma.campaignAllowedProduct.delete({ where: { id: parsed.data.id } })
    } else {
      await prisma.campaignAllowedLocation.delete({ where: { id: parsed.data.id } })
    }

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "campaign",
      entityId: campaignId,
      eventType: "update",
      after: { action: "restriction_removed", type: parsed.data.type, id: parsed.data.id },
    })

    return NextResponse.json({ deleted: true })
  })
}
