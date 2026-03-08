import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePartnerApiKey } from "@/lib/b2b/auth"
import { redeemVoucher } from "@/lib/b2b/vouchers"
import { withErrorHandler } from "@/lib/error-handler"
import { rateLimitDistributed } from "@/lib/rate-limit"

const IDEMPOTENCY_KEY_PATTERN = /^[a-zA-Z0-9_\-:.]{8,128}$/

const schema = z.object({
  code_or_qr: z.string().min(3).max(256),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  location_id: z.string().max(128).optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const apiKey = await requirePartnerApiKey(req.headers.get("x-partner-key"))
    if (!apiKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await rateLimitDistributed(`partner:redeem:${apiKey.orgId}`, 60, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const idempotencyKey = req.headers.get("idempotency-key")
    if (!idempotencyKey) {
      return NextResponse.json({ error: "Missing Idempotency-Key header" }, { status: 400 })
    }
    if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
      return NextResponse.json(
        { error: "Invalid Idempotency-Key: must be 8-128 chars, alphanumeric with _-:." },
        { status: 400 }
      )
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

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
  })
}
