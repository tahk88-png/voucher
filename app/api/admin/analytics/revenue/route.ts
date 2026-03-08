import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getRevenueTimeseries } from "@/lib/admin/analytics";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.analytics.read");

    const url = new URL(req.url);
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");
    const granularity =
      (url.searchParams.get("granularity") as "day" | "week" | "month") ?? "day";

    if (!fromParam || !toParam) {
      return NextResponse.json(
        { error: "Missing required query parameters: from, to" },
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

    const data = await getRevenueTimeseries(from, to, granularity);

    return NextResponse.json({ data });
  });
}
