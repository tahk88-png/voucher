import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { getFailedPayments } from "@/lib/admin/billing"

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.billing.read")

    const url = new URL(req.url)
    const merchantId = url.searchParams.get("merchantId") ?? undefined
    const fromParam = url.searchParams.get("from")
    const toParam = url.searchParams.get("to")
    const page = parseInt(url.searchParams.get("page") ?? "1", 10)
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100)

    const from = fromParam ? new Date(fromParam) : undefined
    const to = toParam ? new Date(toParam) : undefined

    const result = await getFailedPayments({ merchantId, from, to, page, limit })

    return NextResponse.json({
      payments: result.payments,
      total: result.total,
      page,
      limit,
    })
  })
}
