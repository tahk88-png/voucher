import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { hasActiveLegalHold } from "@/lib/admin/legal-hold";

const eraseSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  confirmUserId: z.string().min(1, "Confirm the userId to erase"),
});

/**
 * POST /api/admin/users/[id]/actions/gdpr-erase
 *
 * Dangerous action — requires step-up auth.
 * Anonymises user data and deletes private records.
 * Blocked if user has an active legal hold.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> },
) {
  const { id: userId } = await params;

  return withErrorHandler(async () => {
    // Requires admin.users.delete which is a step-up action
    const admin = await requireAdminPermission("admin.users.delete");

    const body = await req.json();
    const { reason, confirmUserId } = eraseSchema.parse(body);

    // Confirmation safeguard
    if (confirmUserId !== userId) {
      return NextResponse.json(
        { error: "confirmUserId does not match the target user" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Legal hold check
    const legalHold = await hasActiveLegalHold(userId);
    if (legalHold) {
      return NextResponse.json(
        {
          error: "Cannot erase user data: active legal hold exists",
          code: "LEGAL_HOLD_ACTIVE",
        },
        { status: 403 },
      );
    }

    // Perform GDPR erasure inside a transaction
    await prisma.$transaction(async (tx) => {
      // Delete private data
      await tx.pushSubscription.deleteMany({ where: { userId } });
      await tx.notificationSubscription.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      // Anonymize user record
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@removed.local`,
          name: "Deleted User",
          image: null,
          passwordHash: null,
          emailVerified: null,
          status: "disabled",
        },
      });

      // Log in the basic audit trail too
      await tx.auditLog.create({
        data: {
          actorUserId: admin.userId,
          action: "gdpr_erase",
          payloadJson: { targetUserId: userId, reason, gdpr: true },
        },
      });
    });

    // Record in admin audit chain
    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "user.delete",
      targetType: "User",
      targetId: userId,
      reason,
      metadata: { gdpr: true, originalEmail: "[REDACTED]" },
    });

    return NextResponse.json({ success: true, userId, action: "gdpr_erased" });
  });
}
