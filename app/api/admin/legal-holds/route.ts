import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { getLegalHolds, createLegalHold } from "@/lib/admin/legal-hold";

export const dynamic = "force-dynamic";

/** GET /api/admin/legal-holds — list holds with optional filters */
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.legal_hold.manage");

    const sp = req.nextUrl.searchParams;

    const holds = await getLegalHolds({
      userId: sp.get("userId") ?? undefined,
      active: sp.get("active") === "true" ? true : sp.get("active") === "false" ? false : undefined,
      page: sp.has("page") ? Number(sp.get("page")) : undefined,
      limit: sp.has("limit") ? Number(sp.get("limit")) : undefined,
    });

    return NextResponse.json(holds);
  });
}

const createSchema = z.object({
  userId: z.string().min(1),
  holdType: z.enum(["gdpr_request", "law_enforcement", "litigation"]),
  reason: z.string().min(1, "Reason is required"),
});

/** POST /api/admin/legal-holds — create a hold (step-up required) */
export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.legal_hold.manage");

    const body = await req.json();
    const data = createSchema.parse(body);

    const hold = await createLegalHold({
      ...data,
      actorUserId: admin.userId,
    });

    return NextResponse.json(hold, { status: 201 });
  });
}
