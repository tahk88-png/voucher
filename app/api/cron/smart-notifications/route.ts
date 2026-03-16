import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { pushNotifyUser } from '@/lib/push-notify'
import { withErrorHandler } from '@/lib/error-handler'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/cron/smart-notifications
 *
 * Cron endpoint (run every 5-15 minutes) that finds notifications whose
 * scheduledAt time has arrived but haven't been delivered yet, sends them
 * via web-push, and marks them as delivered.
 *
 * Only notifications with scheduledAt <= now AND deliveredAt IS NULL are
 * picked up. This makes the job idempotent and safe to re-run.
 */
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find due notifications: scheduledAt has passed, not yet delivered
    const dueNotifications = await prisma.notification.findMany({
      where: {
        scheduledAt: { lte: now },
        deliveredAt: null,
      },
      take: 500, // Process in manageable batches
      orderBy: { scheduledAt: 'asc' },
    })

    if (dueNotifications.length === 0) {
      return NextResponse.json({ delivered: 0 })
    }

    let delivered = 0
    let failed = 0

    for (const notification of dueNotifications) {
      try {
        // Send push notification
        await pushNotifyUser(notification.userId, {
          title: notification.title,
          body: notification.body,
          url: notification.url ?? undefined,
        })

        // Mark as delivered
        await prisma.notification.update({
          where: { id: notification.id },
          data: { deliveredAt: now },
        })

        delivered++
      } catch (err) {
        // Mark as delivered anyway to avoid infinite retries.
        // The notification is still visible in-app even if push failed.
        await prisma.notification.update({
          where: { id: notification.id },
          data: { deliveredAt: now },
        }).catch(() => {})

        failed++
        logger.error('Smart notification push failed', {
          notificationId: notification.id,
          userId: notification.userId,
          err: err instanceof Error ? err.message : String(err),
        })
      }
    }

    logger.info(`Smart notifications cron: delivered=${delivered}, failed=${failed}`)

    return NextResponse.json({ delivered, failed, total: dueNotifications.length })
  })
}
