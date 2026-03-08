import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { releaseLegalHold } from "@/lib/admin/legal-hold";

const releaseSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

/** PATCH /api/admin/legal-holds/[id] — release a hold (step-up required) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> },
) {
  const { id } = await params;

  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.legal_hold.manage");

    const body = await req.json();
    const { reason } = releaseSchema.parse(body);

    await releaseLegalHold({
      holdId: id,
      actorUserId: admin.userId,
      reason,
    });

    return NextResponse.json({ success: true });
  });
}
