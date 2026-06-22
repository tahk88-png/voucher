import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { removeSuppression } from "@/lib/email/suppression";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// DELETE — remove a suppression entry
// ---------------------------------------------------------------------------

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.suppressions");

    const existing = await prisma.emailSuppression.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Suppression entry not found" },
        { status: 404 }
      );
    }

    await removeSuppression(id);

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.suppression.remove",
      targetType: "email_suppression",
      targetId: id,
      metadata: {
        email: existing.email,
        reason: existing.reason,
        source: existing.source,
      },
    });

    return NextResponse.json({ success: true });
  });
}
