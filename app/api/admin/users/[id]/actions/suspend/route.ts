import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { captureAuditDiff } from "@/lib/admin/audit-diff";

const suspendSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  durationDays: z.number().int().positive().optional(),
});

/** POST /api/admin/users/[id]/actions/suspend */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> },
) {
  const { id: userId } = await params;

  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.users.ban");

    const body = await req.json();
    const { reason, durationDays } = suspendSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.status === "disabled") {
      return NextResponse.json({ error: "User is already suspended/banned" }, { status: 409 });
    }

    const { diff } = await captureAuditDiff(
      () => prisma.user.findUnique({ where: { id: userId } }) as any,
      () => prisma.user.update({ where: { id: userId }, data: { status: "disabled" } }) as any,
    );

    // Clear active sessions
    await prisma.session.deleteMany({ where: { userId } });

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "user.suspend",
      targetType: "User",
      targetId: userId,
      reason,
      metadata: { durationDays: durationDays ?? null, diff },
    });

    return NextResponse.json({ success: true, userId, action: "suspended" });
  });
}
