import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { isMerchantActive } from "@/lib/merchant-status"
import { withErrorHandler } from "@/lib/error-handler"

const checkoutSchema = z.object({
  type: z.enum(["product", "rental"]),
  merchantId: z.string().min(3),
  currency: z.string().min(2).max(6),
  items: z
    .array(
      z.object({
        id: z.string().min(3),
        name: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPrice: z.number().int().min(0),
      })
    )
    .min(1),
  meta: z.record(z.any()).optional(),
})

export async function POST(req: Request) {
  return withErrorHandler(async () => {
    const body = await req.json()
    const data = checkoutSchema.parse(body)
    const merchant = await prisma.merchant.findUnique({ where: { id: data.merchantId } })
    if (!merchant) {
      return NextResponse.json({ error: "Merchant not found" }, { status: 404 })
    }
    const active = await isMerchantActive(merchant.id)
    if (!active) {
      return NextResponse.json({ error: "Merchant inactive" }, { status: 403 })
    }

    const total = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    const intent = await prisma.checkoutIntent.create({
      data: {
        merchantId: data.merchantId,
        type: data.type,
        currency: data.currency,
        total,
        itemsJson: data.items,
        metaJson: data.meta ?? undefined,
      },
    })

    return NextResponse.json({ intentId: intent.id, total })
  })
}
