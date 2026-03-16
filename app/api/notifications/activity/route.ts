import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { auth } from '@/lib/auth'
import { recordNotificationOpen, updateActivityPattern } from '@/lib/smart-notifications'

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await req.json()
    const { event } = body

    const validEvents = ['open', 'click', 'dismiss']
    if (!event || !validEvents.includes(event)) {
      return NextResponse.json(
        { error: `event must be one of: ${validEvents.join(', ')}` },
        { status: 400 }
      )
    }

    if (event === 'open' || event === 'click') {
      await recordNotificationOpen(session.user.id)
    }

    // Periodically recalculate full pattern (on every 10th interaction)
    const pattern = await import('@/lib/prisma').then((m) =>
      m.prisma.userActivityPattern.findUnique({
        where: { userId: session.user.id },
        select: { lastCalculated: true },
      })
    )

    if (pattern) {
      const hoursSinceCalc =
        (Date.now() - new Date(pattern.lastCalculated).getTime()) / (1000 * 60 * 60)
      if (hoursSinceCalc > 24) {
        await updateActivityPattern(session.user.id)
      }
    }

    return NextResponse.json({ success: true })
  })
}
