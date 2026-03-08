import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminProfile } from "@/lib/admin/guards";

export const dynamic = "force-dynamic";

/** GET /api/admin/auth/me — return the authenticated admin's profile */
export async function GET() {
  return withErrorHandler(async () => {
    const admin = await requireAdminProfile();

    return NextResponse.json({
      userId: admin.userId,
      email: admin.email,
      adminRole: admin.adminRole,
      permissions: admin.permissions,
    });
  });
}
