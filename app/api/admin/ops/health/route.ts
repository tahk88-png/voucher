import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getSystemHealth } from "@/lib/admin/health";

export async function GET() {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.ops.health");

    const health = await getSystemHealth();

    return NextResponse.json(health);
  });
}
