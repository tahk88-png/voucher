/**
 * GET /api/admin/audit/export
 *
 * Exports admin audit log entries as a CSV file with UTF-8 BOM for
 * correct display in Excel.
 *
 * Query params: from, to, action
 * Max 10 000 entries per export.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"

export const dynamic = "force-dynamic"

const MAX_EXPORT_ENTRIES = 10_000

/** Escape a value for safe inclusion in a CSV cell. */
function csvEscape(value: string | null | undefined): string {
  if (value == null) return ""
  const str = String(value)
  // Wrap in quotes if the value contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.audit.export")

    const searchParams = req.nextUrl.searchParams
    const from = searchParams.get("from") || undefined
    const to = searchParams.get("to") || undefined
    const action = searchParams.get("action") || undefined

    // ---- Build filter ------------------------------------------------------
    const where: Record<string, unknown> = {}

    if (action) where.action = action

    if (from || to) {
      const createdAt: Record<string, Date> = {}
      if (from) createdAt.gte = new Date(from)
      if (to) createdAt.lte = new Date(to)
      where.createdAt = createdAt
    }

    // ---- Query (capped) ----------------------------------------------------
    const entries = await prisma.adminAuditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: MAX_EXPORT_ENTRIES,
    })

    // ---- Build CSV ---------------------------------------------------------
    const header = [
      "id",
      "createdAt",
      "actorEmail",
      "action",
      "targetType",
      "targetId",
      "reason",
      "hashSelf",
    ]

    const rows = entries.map((e) =>
      [
        csvEscape(e.id),
        csvEscape(e.createdAt.toISOString()),
        csvEscape(e.actor?.email),
        csvEscape(e.action),
        csvEscape(e.targetType),
        csvEscape(e.targetId),
        csvEscape(e.reason),
        csvEscape(e.hashSelf),
      ].join(","),
    )

    // UTF-8 BOM so Excel opens the file with correct encoding
    const BOM = "\uFEFF"
    const csv = BOM + [header.join(","), ...rows].join("\r\n")

    const filename = `admin-audit-export-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  })
}
