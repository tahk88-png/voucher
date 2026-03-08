import { NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { hashToken } from "@/lib/b2b/crypto"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

const createSchema = z.object({
  label: z.string().min(2).max(80).optional(),
})

function generateKey() {
  return crypto.randomBytes(24).toString("hex")
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId)
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const keys = await prisma.partnerApiKey.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, label: true, createdAt: true, lastUsedAt: true },
    })

    return NextResponse.json({ keys })
  })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  return withErrorHandler(async () => {
    const { orgId } = await params
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, orgId, ["owner", "admin"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const rawKey = generateKey()
    const keyHash = hashToken(rawKey)

    const created = await prisma.partnerApiKey.create({
      data: {
        orgId,
        label: parsed.data.label,
        keyHash,
      },
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "org",
      entityId: orgId,
      eventType: "update",
      after: { partnerKeyId: created.id, label: created.label },
    })

    return NextResponse.json({
      key: rawKey,
      id: created.id,
      label: created.label,
      createdAt: created.createdAt,
    })
  })
}
