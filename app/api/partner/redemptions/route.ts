import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePartnerApiKey } from "@/lib/b2b/auth"
import { redeemVoucher } from "@/lib/b2b/vouchers"

const schema = z.object({
  code_or_qr: z.string().min(3),
  amount: z.number().int().positive(),
  currency: z.string().min(3),
  location_id: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(req: Request) {
  const apiKey = await requirePartnerApiKey(req.headers.get("x-partner-key"))
  if (!apiKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const idempotencyKey = req.headers.get("idempotency-key")
  if (!idempotencyKey) {
    return NextResponse.json({ error: "Missing Idempotency-Key" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await redeemVoucher({
      codeOrQr: parsed.data.code_or_qr,
      partnerOrgId: apiKey.orgId,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      idempotencyKey,
      locationId: parsed.data.location_id,
      metadata: parsed.data.metadata,
    })

    return NextResponse.json({
      redemption_id: result.redemption.id,
      voucher_status: result.voucher?.status ?? "active",
      remaining_value: result.voucher?.remainingValueAmount ?? null,
      reused: result.reused,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Redeem failed" }, { status: 400 })
  }
}
