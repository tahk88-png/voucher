import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.email.read");

    const message = await prisma.emailMessage.findUnique({
      where: { id },
      include: {
        events: { orderBy: { occurredAt: "desc" } },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Email message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message });
  });
}
