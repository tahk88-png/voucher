import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { exportAnalyticsCSV } from "@/lib/admin/analytics";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.analytics.export");

    const url = new URL(req.url);
    const metric = url.searchParams.get("metric") as
      | "revenue"
      | "users"
      | "merchants"
      | null;
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    if (!metric || !fromParam || !toParam) {
      return NextResponse.json(
        { error: "Missing required query parameters: metric, from, to" },
        { status: 400 }
      );
    }

    if (!["revenue", "users", "merchants"].includes(metric)) {
      return NextResponse.json(
        { error: "Invalid metric. Must be one of: revenue, users, merchants" },
        { status: 400 }
      );
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format for from/to parameters" },
        { status: 400 }
      );
    }

    const csv = await exportAnalyticsCSV(metric, from, to);

    const filename = `${metric}-export-${fromParam}-${toParam}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });
}
