import { NextRequest, NextResponse } from "next/server";
import { AppealStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { parseCursorParams, buildCursorQuery, buildCursorResult } from "@/lib/cursor-pagination";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission(
      "admin.moderation.appeal_review"
    );

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const { cursor, limit } = parseCursorParams(searchParams);

    // Only real AppealStatus values reach Prisma; anything else used to
    // throw a validation error and surface as a 500.
    const validStatuses = Object.values(AppealStatus) as string[];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Unknown status. Use one of: ${validStatuses.join(", ")}.` },
        { status: 400 }
      );
    }

    const where: { status?: AppealStatus } = {};
    if (status) where.status = status as AppealStatus;

    logger.info("Admin fetching appeals list", {
      adminUserId: admin.userId,
      status,
      cursor,
      limit,
    });

    const paginationArgs = buildCursorQuery({ cursor, limit });
    const appeals = await prisma.appeal.findMany({
      where,
      include: {
        moderationAction: {
          select: {
            id: true,
            actionType: true,
            reason: true,
            targetUserId: true,
            targetMerchantId: true,
            createdAt: true,
          },
        },
        appealUser: {
          select: { id: true, email: true, name: true },
        },
        reviewer: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      ...paginationArgs,
    });

    const result = buildCursorResult(appeals, limit, cursor);

    return NextResponse.json({
      appeals: result.data,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasMore: result.hasMore,
    });
  });
}
