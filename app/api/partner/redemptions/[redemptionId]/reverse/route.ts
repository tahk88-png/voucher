import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePartnerApiKey } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"

const schema = z.object({
  reason: z.string().min(3),
})

export async function POST(
  req: Request,
  { params }: { params: { redemptionId: string } }
) {
  const apiKey = await requirePartnerApiKey(req.headers.get("x-partner-key"))
  if (!apiKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const redemption = await prisma.voucherRedemption.findFirst({
    where: { id: params.redemptionId, partnerOrgId: apiKey.orgId },
    include: { voucher: { include: { campaign: true } } },
  })
  if (!redemption) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (redemption.status === "reversed") {
    return NextResponse.json({ error: "Already reversed" }, { status: 409 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.voucherRedemption.update({
      where: { id: redemption.id },
      data: { status: "reversed", metadata: { ...(redemption.metadata as object), reversalReason: parsed.data.reason } },
    })

    const voucher = redemption.voucher
    if (voucher.campaign.valueType === "fixed") {
      const nextRemaining = (voucher.remainingValueAmount ?? voucher.initialValueAmount) + redemption.amountRedeemed
      await tx.voucherInstance.update({
        where: { id: voucher.id },
        data: {
          remainingValueAmount: nextRemaining,
          status: voucher.status === "redeemed" ? "active" : voucher.status,
        },
      })
    }

    return updated
  })

  await recordAuditEvent({
    orgId: redemption.voucher.orgId,
    actorType: "partner_api",
    entityType: "redemption",
    entityId: result.id,
    eventType: "refund",
    after: { reason: parsed.data.reason },
  })

  return NextResponse.json({ redemption: result })
}
