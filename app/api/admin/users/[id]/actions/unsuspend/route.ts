import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";

const unsuspendSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

/** POST /api/admin/users/[id]/actions/unsuspend */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> },
) {
  const { id: userId } = await params;

  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.users.unban");

    const body = await req.json();
    const { reason } = unsuspendSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status !== "disabled") {
      return NextResponse.json({ error: "User is not suspended" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "active" },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "user.unban",
      targetType: "User",
      targetId: userId,
      reason,
    });

    return NextResponse.json({ success: true, userId, action: "unsuspended" });
  });
}
