import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { redact } from "@/lib/admin/audit-diff";

/** POST /api/admin/users/[id]/actions/gdpr-export — export all user data */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{id: string}> },
) {
  const { id: userId } = await params;

  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.users.read");

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        voucherPurchases: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            amount: true,
            currency: true,
          },
        },
        redemptions: {
          select: {
            id: true,
            createdAt: true,
            method: true,
          },
        },
        creditLedgers: {
          select: {
            id: true,
            source: true,
            status: true,
            amount: true,
            currency: true,
            createdAt: true,
          },
        },
        notifications: {
          select: {
            id: true,
            type: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Redact sensitive fields from the export
    const exportData = redact(user as Record<string, unknown>);

    await recordAdminAudit({
      actorUserId: admin.userId,
      action: "user.gdpr_export",
      targetType: "User",
      targetId: userId,
    });

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      userId,
      data: exportData,
    });
  });
}
