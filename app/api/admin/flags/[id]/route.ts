import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { recordAdminAudit } from "@/lib/admin/audit"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.flags.read")

    const { id } = await params

    const flag = await prisma.featureFlag.findUnique({
      where: { id },
      include: { overrides: true },
    })

    if (!flag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 })
    }

    return NextResponse.json({ flag })
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.flags.manage")

    const { id } = await params
    const body = await req.json()
    const flagSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      status: z.enum(["off", "percentage", "allowlist", "on"]).optional(),
      rules: z.record(z.unknown()).optional(),
    })
    const parsed = flagSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { name, description, status, rules } = parsed.data

    const existing = await prisma.featureFlag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 })
    }

    // Step-up permission check: setting status to "on" (100% rollout)
    if (status === "on") {
      await requireAdminPermission("admin.flags.rollout_100")
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (description !== undefined) data.description = description
    if (status !== undefined) data.status = status
    if (rules !== undefined) data.rules = rules

    const flag = await prisma.featureFlag.update({
      where: { id },
      data,
    })

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "flag.update",
      targetType: "feature_flag",
      targetId: id,
      metadata: {
        key: flag.key,
        changes: body,
        previousStatus: existing.status,
        newStatus: flag.status,
      },
    })

    return NextResponse.json({ flag })
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.flags.manage")

    const { id } = await params

    const existing = await prisma.featureFlag.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 })
    }

    // Soft-delete: set status to "off"
    await prisma.featureFlag.update({
      where: { id },
      data: { status: "off" },
    })

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "flag.delete",
      targetType: "feature_flag",
      targetId: id,
      metadata: { key: existing.key, previousStatus: existing.status },
    })

    return NextResponse.json({ success: true })
  })
}
