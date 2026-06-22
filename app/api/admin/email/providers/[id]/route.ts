import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ---------------------------------------------------------------------------
// PATCH — update provider config
// ---------------------------------------------------------------------------

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  isPrimary: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  configJson: z.record(z.unknown()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.config");

    const existing = await prisma.emailProviderConfig.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Provider config not found" },
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
    if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;
    if (parsed.data.isPrimary !== undefined) data.isPrimary = parsed.data.isPrimary;
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority;
    if (parsed.data.configJson !== undefined) data.configJson = parsed.data.configJson;

    const provider = await prisma.emailProviderConfig.update({
      where: { id },
      data,
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.provider.update",
      targetType: "email_provider_config",
      targetId: id,
      metadata: {
        providerName: existing.name,
        changes: parsed.data,
        previousActive: existing.isActive,
        previousPrimary: existing.isPrimary,
      },
    });

    return NextResponse.json({ provider });
  });
}
