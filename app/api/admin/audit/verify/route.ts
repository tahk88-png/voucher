/**
 * POST /api/admin/audit/verify
 *
 * Verifies the integrity of the admin audit hash chain.
 * Accepts optional date range filters in the request body.
 */

import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { verifyAuditChain } from "@/lib/admin/audit-verify"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.audit.verify")

    // ---- Parse optional body -----------------------------------------------
    let from: Date | undefined
    let to: Date | undefined

    try {
      const body = (await req.json()) as {
        from?: string
        to?: string
      } | null

      if (body?.from) from = new Date(body.from)
      if (body?.to) to = new Date(body.to)
    } catch {
      // Empty body is acceptable -- verify entire chain.
    }

    // ---- Run verification --------------------------------------------------
    const result = await verifyAuditChain({ from, to })

    return NextResponse.json(result)
  })
}
