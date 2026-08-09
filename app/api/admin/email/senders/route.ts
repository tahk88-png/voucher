import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/get-client-ip";
import { z } from "zod";

// ---------------------------------------------------------------------------
// GET — list all sender profiles
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.email.config");

    const senders = await prisma.emailSenderProfile.findMany({
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      include: {
        merchant: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ senders });
  });
}

// ---------------------------------------------------------------------------
// POST — create sender profile
// ---------------------------------------------------------------------------

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  replyTo: z.string().email().optional(),
  domain: z.string().max(253).optional(),
  merchantId: z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.config");

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, replyTo, domain, merchantId } = parsed.data;

    const sender = await prisma.emailSenderProfile.create({
      data: {
        name,
        email,
        replyTo,
        domain,
        merchantId,
      },
    });

    const ipRaw = getClientIp(req);
    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: ipRaw === "unknown" ? undefined : ipRaw,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.sender.create",
      targetType: "email_sender_profile",
      targetId: sender.id,
      metadata: { name, email, domain, merchantId },
    });

    return NextResponse.json({ sender }, { status: 201 });
  });
}
