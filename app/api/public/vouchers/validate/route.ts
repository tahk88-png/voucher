import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePartnerApiKey } from "@/lib/b2b/auth"
import { validateVoucherCode } from "@/lib/b2b/vouchers"
import { rateLimitDistributed } from "@/lib/rate-limit"
import { withErrorHandler } from "@/lib/error-handler"

const schema = z.object({
  code_or_qr: z.string().min(3).max(256),
  partner_org_id: z.string().uuid(),
  location_id: z.string().max(128).optional(),
  cart_total: z.number().int().nonnegative().optional(),
})

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const apiKey = await requirePartnerApiKey(req.headers.get("x-partner-key"))
    if (!apiKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rl = await rateLimitDistributed(`partner:validate:${apiKey.orgId}`, 120, 60_000)
    if (!rl.allowed) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    if (apiKey.orgId !== parsed.data.partner_org_id) {
      return NextResponse.json({ error: "Partner mismatch" }, { status: 403 })
    }

    const result = await validateVoucherCode({
      codeOrQr: parsed.data.code_or_qr,
      partnerOrgId: parsed.data.partner_org_id,
      cartTotal: parsed.data.cart_total ?? null,
    })

    return NextResponse.json({
      valid: result.valid,
      reason: result.reason,
      value_preview: result.valuePreview ?? null,
      restrictions: result.restrictions ?? null,
    })
  })
}
