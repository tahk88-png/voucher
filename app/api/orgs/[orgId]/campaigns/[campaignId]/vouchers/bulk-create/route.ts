import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { generateCode } from "@/lib/b2b/codes"
import { hashToken } from "@/lib/b2b/crypto"
import { recordAuditEvent } from "@/lib/b2b/audit"

const schema = z.object({
  quantity: z.number().int().min(1).max(500),
  expiresAt: z.string().datetime().optional(),
  issuedToOrgId: z.string().uuid().optional(),
  issuedToEmail: z.string().email().optional(),
  activateNow: z.boolean().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { orgId: string; campaignId: string } }
) {
  const session = await requireSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const membership = await requireOrgMembership(session.user.id, params.orgId, ["owner", "admin", "marketing"])
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const campaign = await prisma.voucherCampaign.findFirst({
    where: { id: params.campaignId, orgId: params.orgId },
  })
  if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

  const vouchers: Prisma.VoucherInstanceCreateManyInput[] = []
  for (let i = 0; i < parsed.data.quantity; i += 1) {
    const code = generateCode(campaign.codePrefix ?? undefined, 8)
    vouchers.push({
      campaignId: campaign.id,
      orgId: campaign.orgId,
      code,
      codeHash: hashToken(code),
      status: parsed.data.activateNow ? "active" : "issued",
      issuedToType: parsed.data.issuedToOrgId ? "company" : parsed.data.issuedToEmail ? "person" : undefined,
      issuedToOrgId: parsed.data.issuedToOrgId,
      issuedToEmail: parsed.data.issuedToEmail,
      initialValueAmount: campaign.valueAmount,
      remainingValueAmount: campaign.valueType === "fixed" ? campaign.valueAmount : undefined,
      activatedAt: parsed.data.activateNow ? new Date() : undefined,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    })
  }

  const created = await prisma.voucherInstance.createMany({
    data: vouchers,
    skipDuplicates: true,
  })

  await recordAuditEvent({
    orgId: params.orgId,
    actorUserId: session.user.id,
    entityType: "voucher",
    entityId: campaign.id,
    eventType: "issue",
    after: { quantity: created.count },
  })

  return NextResponse.json({ created: created.count })
}
