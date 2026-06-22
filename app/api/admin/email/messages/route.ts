import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { prisma } from "@/lib/prisma";
import {
  parseCursorParams,
  buildCursorQuery,
  buildCursorResult,
} from "@/lib/cursor-pagination";
import { z } from "zod";

const querySchema = z.object({
  to: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.email.read");

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      to: searchParams.get("to") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { to, status, category } = parsed.data;
    const { cursor, limit } = parseCursorParams(searchParams);

    const where: Record<string, unknown> = {};
    if (to) where.to = to;
    if (status) where.status = status;
    if (category) where.category = category;

    const paginationArgs = buildCursorQuery({ cursor, limit });
    const messages = await prisma.emailMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginationArgs,
    });

    const result = buildCursorResult(messages, limit, cursor);

    return NextResponse.json({
      messages: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });
}
