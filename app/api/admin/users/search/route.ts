import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { globalUserSearch } from "@/lib/admin/user-search";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.users.read");

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const email = searchParams.get("email") ?? undefined;
    const userId = searchParams.get("userId") ?? undefined;
    const ip = searchParams.get("ip") ?? undefined;
    const paymentId = searchParams.get("paymentId") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 1000);

    logger.info("Admin searching users", {
      adminUserId: admin.userId,
      q,
      email,
      userId,
      ip,
      paymentId,
    });

    // If general query "q" is provided and no specific field, try email then name
    let searchEmail = email;
    let searchName: string | undefined;

    if (q && !email && !userId && !ip && !paymentId) {
      // If it looks like an email (contains @), search by email
      if (q.includes("@")) {
        searchEmail = q;
      } else {
        // Otherwise search by name
        searchName = q;
      }
    }

    const result = await globalUserSearch({
      email: searchEmail,
      userId,
      name: searchName,
      ip,
      paymentId,
      page,
      limit,
    });

    return NextResponse.json({
      users: result.users,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  });
}
