import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { addSupportNote } from "@/lib/admin/support";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.support.read");

    // Verify the case exists
    const supportCase = await prisma.supportCase.findUnique({
      where: { id },
    });

    if (!supportCase) {
      return NextResponse.json(
        { error: "Support case not found" },
        { status: 404 }
      );
    }

    const notes = await prisma.supportNote.findMany({
      where: { caseId: id },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json({ notes });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const adminCtx = await requireAdminPermission("admin.support.manage");

    const body = await req.json();
    const { body: noteBody, isInternal } = body;

    if (!noteBody) {
      return NextResponse.json(
        { error: "Missing required field: body" },
        { status: 400 }
      );
    }

    // Verify the case exists
    const supportCase = await prisma.supportCase.findUnique({
      where: { id },
    });

    if (!supportCase) {
      return NextResponse.json(
        { error: "Support case not found" },
        { status: 404 }
      );
    }

    const note = await addSupportNote({
      caseId: id,
      authorUserId: adminCtx.userId,
      body: noteBody,
      isInternal: isInternal ?? false,
    });

    return NextResponse.json({ note }, { status: 201 });
  });
}
