import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getKPIs } from "@/lib/admin/analytics";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.analytics.read");

    const kpis = await getKPIs();

    return NextResponse.json(kpis);
  });
}
