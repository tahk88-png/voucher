import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { getSubscriptionOverview } from "@/lib/admin/billing"

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.billing.read")

    const url = new URL(req.url)
    const status = url.searchParams.get("status") ?? undefined
    const merchantId = url.searchParams.get("merchantId") ?? undefined
    const page = parseInt(url.searchParams.get("page") ?? "1", 10)
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100)

    const result = await getSubscriptionOverview({ status, merchantId, page, limit })

    return NextResponse.json({
      subscriptions: result.subscriptions,
      total: result.total,
      page,
      limit,
    })
  })
}
