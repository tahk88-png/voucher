import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import {
  parseCursorParams,
  buildCursorQuery,
  buildCursorResult,
} from "@/lib/cursor-pagination";
import { z } from "zod";

// ---------------------------------------------------------------------------
// GET — list suppressions with filters + cursor pagination
// ---------------------------------------------------------------------------

const querySchema = z.object({
  email: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.email.suppressions");

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      email: searchParams.get("email") ?? undefined,
      reason: searchParams.get("reason") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, reason } = parsed.data;
    const { cursor, limit } = parseCursorParams(searchParams);

    const where: Record<string, unknown> = {};
    if (email) where.email = { contains: email, mode: "insensitive" };
    if (reason) where.reason = reason;

    const paginationArgs = buildCursorQuery({ cursor, limit });
    const suppressions = await prisma.emailSuppression.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...paginationArgs,
    });

    const result = buildCursorResult(suppressions, limit, cursor);

    return NextResponse.json({
      suppressions: result.data,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  });
}

// ---------------------------------------------------------------------------
// POST — add manual suppression
// ---------------------------------------------------------------------------

const createSchema = z.object({
  email: z.string().email(),
  reason: z.enum(["hard_bounce", "soft_bounce", "complaint", "unsubscribe", "manual"]),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.suppressions");

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, reason, notes } = parsed.data;
    const normalized = email.toLowerCase().trim();

    const suppression = await prisma.emailSuppression.upsert({
      where: {
        email_reason: {
          email: normalized,
          reason,
        },
      },
      create: {
        email: normalized,
        reason,
        source: "manual",
        notes,
        createdBy: admin.userId,
      },
      update: {
        source: "manual",
        notes,
      },
    });

    // Invalidate suppression cache
    try {
      const { cacheDelete } = await import("@/lib/redis");
      await cacheDelete(`email:suppressed:${normalized}`);
    } catch {}

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.suppression.add",
      targetType: "email_suppression",
      targetId: suppression.id,
      metadata: { email: normalized, reason, notes },
    });

    return NextResponse.json({ suppression }, { status: 201 });
  });
}
