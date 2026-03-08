import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { requireAdminPermission } from "@/lib/admin/guards"
import { recordAdminAudit } from "@/lib/admin/audit"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission("admin.flags.read")

    const flags = await prisma.featureFlag.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { overrides: true },
        },
      },
    })

    return NextResponse.json({
      flags: flags.map((f: any) => ({
        ...f,
        overrideCount: f._count.overrides,
        _count: undefined,
      })),
    })
  })
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission("admin.flags.manage")

    const body = await req.json()
    const { key, name, description, status, rules } = body

    if (!key || !name) {
      return NextResponse.json(
        { error: "key and name are required" },
        { status: 400 }
      )
    }

    // Validate key format (lowercase alphanumeric + dots/underscores/hyphens)
    if (!/^[a-z0-9._-]+$/.test(key)) {
      return NextResponse.json(
        {
          error:
            "key must be lowercase alphanumeric with dots, underscores, or hyphens",
        },
        { status: 400 }
      )
    }

    const validStatuses = ["off", "percentage", "allowlist", "on"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      )
    }

    // Check for duplicate key
    const existing = await prisma.featureFlag.findUnique({ where: { key } })
    if (existing) {
      return NextResponse.json(
        { error: "A flag with this key already exists" },
        { status: 409 }
      )
    }

    const flag = await prisma.featureFlag.create({
      data: {
        key,
        name,
        description: description ?? null,
        status: status ?? "off",
        rules: rules ?? {},
      },
    })

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get("x-forwarded-for") ?? undefined,
      actorUserAgent: req.headers.get("user-agent") ?? undefined,
      action: "flag.create",
      targetType: "feature_flag",
      targetId: flag.id,
      metadata: { key, name, status: flag.status },
    })

    return NextResponse.json({ flag }, { status: 201 })
  })
}
