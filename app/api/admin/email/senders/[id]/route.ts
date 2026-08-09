import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/get-client-ip";
import { z } from "zod";

// ---------------------------------------------------------------------------
// PATCH — update sender profile
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  replyTo: z.string().email().nullable().optional(),
  domain: z.string().max(253).nullable().optional(),
  isDefault: z.boolean().optional(),
  merchantId: z.string().cuid().nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.config");

    const existing = await prisma.emailSenderProfile.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Sender profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) data.name = parsed.data.name;
    if (parsed.data.email !== undefined) data.email = parsed.data.email;
    if (parsed.data.replyTo !== undefined) data.replyTo = parsed.data.replyTo;
    if (parsed.data.domain !== undefined) data.domain = parsed.data.domain;
    if (parsed.data.isDefault !== undefined) data.isDefault = parsed.data.isDefault;
    if (parsed.data.merchantId !== undefined) data.merchantId = parsed.data.merchantId;

    const sender = await prisma.emailSenderProfile.update({
      where: { id },
      data,
    });

    const ipRaw = getClientIp(req);
    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: ipRaw === "unknown" ? undefined : ipRaw,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.sender.update",
      targetType: "email_sender_profile",
      targetId: id,
      metadata: {
        senderName: existing.name,
        changes: parsed.data,
        previousEmail: existing.email,
      },
    });

    return NextResponse.json({ sender });
  });
}
