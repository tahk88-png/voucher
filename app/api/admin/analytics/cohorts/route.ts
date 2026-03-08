import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getCohortRetention } from "@/lib/admin/analytics";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.analytics.read");

    const url = new URL(req.url);
    const granularity =
      (url.searchParams.get("granularity") as "month" | "week") ?? "month";
    const count = parseInt(url.searchParams.get("count") ?? "6", 10);

    const data = await getCohortRetention(granularity, count);

    return NextResponse.json({ data });
  });
}
