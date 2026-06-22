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
  status: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.email.read");

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const { cursor, limit } = parseCursorParams(searchParams);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const paginationArgs = buildCursorQuery({ cursor, limit });
    const jobs = await prisma.emailJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginationArgs,
    });

    const result = buildCursorResult(jobs, limit, cursor);

    return NextResponse.json({
      jobs: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });
}
