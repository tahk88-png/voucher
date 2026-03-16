import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { requireAdminPermission } from '@/lib/admin/guards'
import { recordAdminAudit } from '@/lib/admin/audit'
import { prisma } from '@/lib/prisma'
import { getTestResults, updateTestStatus } from '@/lib/ab-testing'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.read')
    const { id } = await params

    const results = await getTestResults(id)
    if (!results) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    return NextResponse.json({ results })
  })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.flags.manage')
    const { id } = await params
    const body = await req.json()
    const { status, winnerId } = body

    const existing = await prisma.aBTest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    const validStatuses = ['draft', 'running', 'paused', 'completed']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const test = await updateTestStatus(id, status, winnerId)

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get('x-forwarded-for') ?? undefined,
      actorUserAgent: req.headers.get('user-agent') ?? undefined,
      action: 'ab_test.update_status',
      targetType: 'ab_test',
      targetId: id,
      metadata: { status, winnerId, previousStatus: existing.status },
    })

    return NextResponse.json({ test })
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    const admin = await requireAdminPermission('admin.flags.manage')
    const { id } = await params

    const existing = await prisma.aBTest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 })
    }

    await prisma.aBTest.delete({ where: { id } })

    await recordAdminAudit({
      actorUserId: admin.userId,
      actorIp: req.headers.get('x-forwarded-for') ?? undefined,
      actorUserAgent: req.headers.get('user-agent') ?? undefined,
      action: 'ab_test.delete',
      targetType: 'ab_test',
      targetId: id,
      metadata: { name: existing.name },
    })

    return NextResponse.json({ success: true })
  })
}
