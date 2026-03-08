import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { getSupportCases, createSupportCase } from "@/lib/admin/support";

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.support.read");

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") ?? undefined;
    const assignedAdminId =
      url.searchParams.get("assignedAdminId") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const priority = url.searchParams.get("priority") ?? undefined;
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 1000);

    const result = await getSupportCases({
      userId,
      assignedAdminId,
      status,
      priority,
      page,
      limit,
    });

    return NextResponse.json(result);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const adminCtx = await requireAdminPermission("admin.support.manage");

    const body = await req.json();
    const { userId, subject, description, priority, category } = body;

    if (!userId || !subject || !description) {
      return NextResponse.json(
        { error: "Missing required fields: userId, subject, description" },
        { status: 400 }
      );
    }

    const supportCase = await createSupportCase({
      userId,
      subject,
      description,
      priority,
      category,
    });

    await recordAdminAudit({
      actorUserId: adminCtx.userId,
      action: "support_case.create",
      targetType: "SupportCase",
      targetId: supportCase.id,
      metadata: {
        caseNumber: supportCase.caseNumber,
        userId,
        subject,
      },
    });

    return NextResponse.json({ case: supportCase }, { status: 201 });
  });
}
