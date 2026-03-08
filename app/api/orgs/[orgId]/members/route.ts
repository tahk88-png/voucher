import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { recordAuditEvent } from "@/lib/b2b/audit"
import { withErrorHandler } from "@/lib/error-handler"

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "finance", "marketing", "support", "partner_cashier", "auditor"]),
})

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

    const members = await prisma.orgMembership.findMany({
      where: { orgId },
      include: { user: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        user: m.user,
        createdAt: m.createdAt,
      })),
    })
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
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const existing = await prisma.orgMembership.findUnique({
      where: { orgId_userId: { orgId, userId: user.id } },
    })

    if (existing) {
      return NextResponse.json({ error: "User already a member" }, { status: 409 })
    }

    const created = await prisma.orgMembership.create({
      data: {
        orgId,
        userId: user.id,
        role: parsed.data.role,
      },
    })

    await recordAuditEvent({
      orgId,
      actorUserId: session.user.id,
      entityType: "org",
      entityId: orgId,
      eventType: "update",
      after: { action: "member_invited", userId: user.id, email: user.email, role: parsed.data.role },
    })

    return NextResponse.json({ member: created })
  })
}
