import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { prisma } from "@/lib/prisma";
import { createEmailProvider } from "@/lib/email/providers/factory";

// ---------------------------------------------------------------------------
// POST — test provider connection
// ---------------------------------------------------------------------------

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.config");

    const config = await prisma.emailProviderConfig.findUnique({
      where: { id },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Provider config not found" },
        { status: 404 }
      );
    }

    const provider = createEmailProvider(config.provider);
    const health = await provider.testConnection();

    // Update health status on the config record
    await prisma.emailProviderConfig.update({
      where: { id },
      data: {
        healthStatus: health.ok ? "healthy" : "down",
        lastCheckedAt: new Date(),
      },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.provider.test",
      targetType: "email_provider_config",
      targetId: id,
      metadata: {
        providerName: config.name,
        providerType: config.provider,
        ok: health.ok,
        latencyMs: health.latencyMs,
        error: health.error,
      },
    });

    return NextResponse.json({
      ok: health.ok,
      latencyMs: health.latencyMs,
      error: health.error,
      healthStatus: health.ok ? "healthy" : "down",
    });
  });
}
