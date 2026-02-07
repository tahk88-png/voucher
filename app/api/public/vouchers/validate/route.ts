import { NextResponse } from "next/server"
import { z } from "zod"
import { requirePartnerApiKey } from "@/lib/b2b/auth"
import { validateVoucherCode } from "@/lib/b2b/vouchers"

const schema = z.object({
  code_or_qr: z.string().min(3),
  partner_org_id: z.string().uuid(),
  location_id: z.string().optional(),
  cart_total: z.number().int().optional(),
})

export async function POST(req: Request) {
  const apiKey = await requirePartnerApiKey(req.headers.get("x-partner-key"))
  if (!apiKey) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

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
}
