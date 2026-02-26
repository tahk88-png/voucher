import { NextResponse } from "next/server"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

export async function POST(
  req: Request,
  { params }: { params: { orgId: string; campaignId: string } }
) {
  return withErrorHandler(async () => {
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, params.orgId, ["owner", "admin", "marketing"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const campaign = await prisma.voucherCampaign.findFirst({
      where: { id: params.campaignId, orgId: params.orgId },
    })
    if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (campaign.status === "archived") {
      return NextResponse.json({ error: "Campaign is archived" }, { status: 400 })
    }

    const updated = await prisma.voucherCampaign.update({
      where: { id: campaign.id },
      data: { status: "active" },
    })

    await recordAuditEvent({
      orgId: params.orgId,
      actorUserId: session.user.id,
      entityType: "campaign",
      entityId: updated.id,
      eventType: "resume",
      before: campaign,
      after: updated,
    })

    return NextResponse.json({ campaign: updated })
  })
}
