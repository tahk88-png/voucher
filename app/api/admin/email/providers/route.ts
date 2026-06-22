import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { prisma } from "@/lib/prisma";

// ---------------------------------------------------------------------------
// GET — list all email provider configs
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.email.config");

    const providers = await prisma.emailProviderConfig.findMany({
      orderBy: [{ isPrimary: "desc" }, { priority: "asc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ providers });
  });
}
