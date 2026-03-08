import { NextResponse } from "next/server"
import { requireSession } from "@/lib/b2b/auth"
import { prisma } from "@/lib/prisma"
import { withErrorHandler } from "@/lib/error-handler"

export async function GET() {
  return withErrorHandler(async () => {
    const session = await requireSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        adminRole: true,
        status: true,
        createdAt: true,
      },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const memberships = await prisma.orgMembership.findMany({
      where: { userId: user.id },
      include: { org: { select: { id: true, name: true, type: true, status: true } } },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        adminRole: user.adminRole,
        status: user.status,
        createdAt: user.createdAt,
      },
      orgs: memberships.map((m) => ({
        id: m.org.id,
        name: m.org.name,
        type: m.org.type,
        status: m.org.status,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    })
  })
}
