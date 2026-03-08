import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission(
      "admin.moderation.appeal_review"
    );

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50", 10), 1000);
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    logger.info("Admin fetching appeals list", {
      adminUserId: admin.userId,
      status,
      page,
      limit,
    });

    const [appeals, total] = await Promise.all([
      prisma.appeal.findMany({
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
        skip: offset,
        take: limit,
      }),
      prisma.appeal.count({ where }),
    ]);

    return NextResponse.json({
      appeals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  });
}
