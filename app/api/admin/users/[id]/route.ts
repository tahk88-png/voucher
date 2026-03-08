import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getStrikeCount } from "@/lib/admin/moderation";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.users.read");
    const userId = id;

    logger.info("Admin fetching user profile", {
      adminUserId: admin.userId,
      targetUserId: userId,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        adminRole: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch related data in parallel
    const [
      merchantMemberships,
      orgMemberships,
      strikeCount,
      openSupportCases,
      activeLegalHolds,
      recentModerationActions,
    ] = await Promise.all([
      prisma.merchantMember.findMany({
        where: { userId },
        include: {
          merchant: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.orgMembership.findMany({
        where: { userId },
        include: {
          org: { select: { id: true, name: true } },
        },
      }),
      getStrikeCount(userId),
      prisma.supportCase.count({
        where: { userId, status: { in: ["open", "in_progress"] } },
      }),
      prisma.legalHold.findMany({
        where: { userId, isActive: true },
        select: {
          id: true,
          holdType: true,
          notes: true,
          createdAt: true,
          actorUserId: true,
        },
      }),
      prisma.moderationAction.findMany({
        where: { targetUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          actionType: true,
          reason: true,
          createdAt: true,
          moderatorUserId: true,
          strikeNumber: true,
          reversedAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      user,
      merchantMemberships,
      orgMemberships,
      strikeCount,
      openSupportCases,
      activeLegalHolds,
      recentModerationActions,
    });
  });
}
