import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";

/** POST /api/admin/users/[id]/actions/force-logout */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{id: string}> },
) {
  const { id: userId } = await params;

  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.users.ban");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deleted = await prisma.session.deleteMany({ where: { userId } });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "user.force_logout",
      targetType: "User",
      targetId: userId,
      metadata: { sessionsRevoked: deleted.count },
    });

    return NextResponse.json({
      success: true,
      userId,
      sessionsRevoked: deleted.count,
    });
  });
}
