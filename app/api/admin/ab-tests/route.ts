import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { requireAdminPermission } from '@/lib/admin/guards'
import { recordAdminAudit } from '@/lib/admin/audit'
import { prisma } from '@/lib/prisma'
import { createTest } from '@/lib/ab-testing'
import { getClientIp } from '@/lib/get-client-ip'

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.read')

    const tests = await prisma.aBTest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { assignments: true } },
      },
    })

    return NextResponse.json({
      tests: tests.map((t: any) => ({
        ...t,
        assignmentCount: t._count.assignments,
        _count: undefined,
      })),
    })
  })
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.flags.manage')

    const body = await req.json()
    const { name, description, targetType, targetId, variants } = body

    if (!name || !targetType || !variants || !Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json(
        { error: 'name, targetType, and at least 2 variants are required' },
        { status: 400 }
      )
    }

    // Validate variant structure
    for (const v of variants) {
      if (!v.id || !v.name || typeof v.weight !== 'number' || v.weight <= 0) {
        return NextResponse.json(
          { error: 'Each variant needs id, name, and positive weight' },
          { status: 400 }
        )
      }
    }

    const test = await createTest({ name, description, targetType, targetId, variants })

    const ipRaw = getClientIp(req)
    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: ipRaw === 'unknown' ? undefined : ipRaw,
      actorUserAgent: req.headers.get('user-agent') ?? undefined,
      action: 'ab_test.create',
      targetType: 'ab_test',
      targetId: test.id,
      metadata: { name, targetType, variantCount: variants.length },
    })

    return NextResponse.json({ test }, { status: 201 })
  })
}
