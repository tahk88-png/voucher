import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { requireMerchantRole } from "@/lib/rbac"
import { getMerchantRevenueSummary } from "@/lib/merchant-finance"

const requestSchema = z.object({
  amount: z.number().int().positive(),
})

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const merchant = await prisma.merchant.findUnique({ where: { slug: params.slug } })
  if (!merchant) {
    return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
  }

  await requireMerchantRole(session.user.id, merchant.id, "merchant_staff")

  const payload = await req.json().catch(() => null)
  const parsed = requestSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { paidTotal } = await getMerchantRevenueSummary(merchant.id)
  const minPayout = 10000
  if (parsed.data.amount < minPayout) {
    return NextResponse.json({ error: "Minimum payout is 100.00" }, { status: 400 })
  }

  if (parsed.data.amount > paidTotal) {
    return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 })
  }

  await prisma.auditLog.create({
    data: {
      merchantId: merchant.id,
      actorUserId: session.user.id,
      action: "payout_request",
      payloadJson: {
        amount: parsed.data.amount,
        currency: merchant.defaultCurrency,
        status: "requested",
      },
    },
  })

  return NextResponse.json({ ok: true })
}
