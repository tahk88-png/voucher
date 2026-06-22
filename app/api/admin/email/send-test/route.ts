import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/error-handler";
import { requireAdminPermission } from "@/lib/admin/guards";
import { recordAdminAudit } from "@/lib/admin/audit";
import { sendEmailDirect } from "@/lib/email/service";
import { z } from "zod";

const sendTestSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string().optional(),
  templateSlug: z.string().optional(),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.email.send");

    const body = await req.json();
    const parsed = sendTestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { to, subject, html, templateSlug } = parsed.data;

    const result = await sendEmailDirect({
      to,
      subject,
      html,
      templateSlug,
      category: "system",
      metadata: { sentBy: admin.userId, isTestEmail: true },
    });

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "email.send_test",
      targetType: "email",
      metadata: { to, subject, templateSlug, success: result.success },
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
    });
  });
}
