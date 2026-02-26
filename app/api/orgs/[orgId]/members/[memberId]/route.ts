import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, requireOrgMembership } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"

const schema = z.object({
  role: z.enum(["owner", "admin", "finance", "marketing", "support", "partner_cashier", "auditor"]),
})

export async function PATCH(
  req: Request,
  { params }: { params: { orgId: string; memberId: string } }
) {
  return withErrorHandler(async () => {
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const membership = await requireOrgMembership(session.user.id, params.orgId, ["owner", "admin"])
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const member = await prisma.orgMembership.findFirst({
      where: { id: params.memberId, orgId: params.orgId },
    })
    if (!member) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const updated = await prisma.orgMembership.update({
      where: { id: member.id },
      data: { role: parsed.data.role },
    })

    return NextResponse.json({ member: updated })
  })
}
