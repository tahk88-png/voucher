import { NextResponse } from "next/server"
import { requireSession } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"

export async function GET() {
  return withErrorHandler(async () => {
    const session = await requireSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const memberships = await prisma.orgMembership.findMany({
      where: { userId: session.user.id },
      include: { org: true },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      orgs: memberships.map((m) => ({
        id: m.org.id,
        name: m.org.name,
        type: m.org.type,
        status: m.org.status,
        role: m.role,
      })),
    })
  })
}
