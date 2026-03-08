import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getJobHistory } from "@/lib/admin/jobs";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.ops.read");

    const url = new URL(req.url);
    const jobName = url.searchParams.get("jobName") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const fromParam = url.searchParams.get("from");
    const from = fromParam ? new Date(fromParam) : undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 1000);

    const result = await getJobHistory({ jobName, status, from, page, limit });

    return NextResponse.json(result);
  });
}
