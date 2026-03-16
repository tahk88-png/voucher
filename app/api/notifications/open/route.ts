import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { markNotificationOpened } from '@/lib/notifications-smart'
import { withErrorHandler } from '@/lib/error-handler'
import { z } from 'zod'

const openSchema = z.object({
  notificationId: z.string().min(1),
})

/**
 * POST /api/notifications/open
 *
 * Marks a notification as read AND records the open event for the smart
 * notification ML model, so future notifications are delivered at the
 * user's most engaged times.
 */
export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = openSchema.parse(body)

    await markNotificationOpened(session.user.id, data.notificationId)

    return NextResponse.json({ ok: true })
  })
}
