import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getUserTimeline } from "@/lib/admin/user-timeline";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.users.read");
    const userId = id;

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const typesParam = searchParams.get("types");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 1000);

    const types = typesParam
      ? typesParam.split(",").map((t) => t.trim())
      : undefined;

    logger.info("Admin fetching user timeline", {
      adminUserId: admin.userId,
      targetUserId: userId,
      page,
      limit,
    });

    const result = await getUserTimeline(userId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      types,
      page,
      limit,
    });

    return NextResponse.json({
      events: result.events,
      total: result.total,
      page,
      limit,
      totalPages: Math.ceil(result.total / limit),
    });
  });
}
