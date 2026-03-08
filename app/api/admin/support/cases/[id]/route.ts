import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import {
  getSupportCaseDetail,
  updateSupportCase,
} from "@/lib/admin/support";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.support.read");

    const supportCase = await getSupportCaseDetail(id);

    if (!supportCase) {
      return NextResponse.json(
        { error: "Support case not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ case: supportCase });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const adminCtx = await requireAdminPermission("admin.support.manage");

    const body = await req.json();
    const { status, assignedAdminId, priority } = body;

    if (!status && assignedAdminId === undefined && !priority) {
      return NextResponse.json(
        {
          error:
            "At least one field required: status, assignedAdminId, priority",
        },
        { status: 400 }
      );
    }

    const updated = await updateSupportCase(id, {
      status,
      assignedAdminId,
      priority,
    });

    await recordAdminAudit({
      actorUserId: adminCtx.userId,
      action: "support_case.update",
      targetType: "SupportCase",
      targetId: id,
      metadata: {
        changes: { status, assignedAdminId, priority },
      },
    });

    return NextResponse.json({ case: updated });
  });
}
