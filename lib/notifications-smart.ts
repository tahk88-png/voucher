import { prisma } from '@/lib/prisma'
import { getBestSendTime, recordNotificationOpen } from '@/lib/smart-notifications'
import { pushNotifyUser } from '@/lib/push-notify'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SmartNotificationParams = {
  userId: string
  merchantId?: string
  type: string
  title: string
  body: string
  url?: string
  /** If true, the notification is created and push-sent immediately (no scheduling). */
  urgent?: boolean
}

// ---------------------------------------------------------------------------
// Send a single notification with smart scheduling
// ---------------------------------------------------------------------------

/**
 * Create a notification for a user. Non-urgent notifications are scheduled at
 * the user's optimal engagement time (learned from past opens). Urgent ones
 * are created and push-delivered immediately.
 */
export async function sendNotification(params: SmartNotificationParams) {
  const { userId, merchantId, type, title, body, url, urgent } = params

  if (urgent) {
    // Immediate: create + push right now
    const notification = await prisma.notification.create({
      data: {
        userId,
        merchantId: merchantId ?? null,
        type,
        title,
        body,
        url: url ?? null,
        deliveredAt: new Date(),
      },
    })

    // Best-effort push — don't let failures block the caller
    pushNotifyUser(userId, { title, body, url }).catch(() => {})

    return notification
  }

  // Non-urgent: compute optimal send time
  const sendTime = await getBestSendTime(userId)
  const scheduledAt = computeNextSendDate(sendTime.hour)

  const notification = await prisma.notification.create({
    data: {
      userId,
      merchantId: merchantId ?? null,
      type,
      title,
      body,
      url: url ?? null,
      scheduledAt,
    },
  })

  return notification
}

// ---------------------------------------------------------------------------
// Send bulk notifications with per-user smart scheduling
// ---------------------------------------------------------------------------

/**
 * Create notifications for many users at once. Each user gets their own
 * optimal delivery time. For large batches the function chunks DB writes.
 */
export async function sendBulkNotifications(
  userIds: string[],
  notification: {
    merchantId?: string
    type: string
    title: string
    body: string
    url?: string
    urgent?: boolean
  }
) {
  if (userIds.length === 0) return []

  const { merchantId, type, title, body, url, urgent } = notification
  const now = new Date()

  if (urgent) {
    // Immediate delivery for all users
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        merchantId: merchantId ?? null,
        type,
        title,
        body,
        url: url ?? null,
        deliveredAt: now,
      })),
      skipDuplicates: true,
    })

    // Best-effort push for each user
    for (const userId of userIds) {
      pushNotifyUser(userId, { title, body, url }).catch(() => {})
    }
    return
  }

  // Non-urgent: compute per-user send times in parallel
  const sendTimes = await Promise.all(
    userIds.map(async (userId) => {
      const st = await getBestSendTime(userId)
      return { userId, scheduledAt: computeNextSendDate(st.hour) }
    })
  )

  // Batch-create with individual scheduledAt values
  // Prisma createMany doesn't support different scheduledAt per row in one call,
  // so we chunk into batches of 100 to keep it practical.
  const CHUNK = 100
  for (let i = 0; i < sendTimes.length; i += CHUNK) {
    const chunk = sendTimes.slice(i, i + CHUNK)
    await prisma.notification.createMany({
      data: chunk.map(({ userId, scheduledAt }) => ({
        userId,
        merchantId: merchantId ?? null,
        type,
        title,
        body,
        url: url ?? null,
        scheduledAt,
      })),
      skipDuplicates: true,
    })
  }
}

// ---------------------------------------------------------------------------
// Mark notification as opened (read + ML learning)
// ---------------------------------------------------------------------------

/**
 * Marks a notification as read and records the open event so the ML model
 * can learn the user's preferred notification times.
 */
export async function markNotificationOpened(
  userId: string,
  notificationId: string
) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  })

  // Feed the open event into the activity-pattern learner
  await recordNotificationOpen(userId)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Given a preferred hour-of-day, compute the next future Date at that hour.
 * If the hour already passed today, schedule for tomorrow.
 * Caps at 24 h in the future so non-urgent notifications are never delayed
 * more than a day.
 */
function computeNextSendDate(hour: number): Date {
  const now = new Date()
  const target = new Date(now)
  target.setHours(hour, 0, 0, 0)

  if (target <= now) {
    target.setDate(target.getDate() + 1)
  }

  return target
}

// ---------------------------------------------------------------------------
// Integration status
// ---------------------------------------------------------------------------
//
// Flows integrated with smart notifications:
//   [x] Price alert cron                     (app/api/cron/price-alerts/route.ts)
//   [x] Credit expiry warning cron           (app/api/cron/credit-expiry-warnings/route.ts)
//   [x] Campaign ending notifications cron   (app/api/cron/campaign-ending-notifications/route.ts)
//   [x] Merchant announcement dispatch       (lib/notifications.ts)
//   [x] Notification open / ML learning      (app/api/notifications/open/route.ts)
//
// Flows NOT yet integrated (use raw prisma.notification.create):
//   [ ] Weekly campaign digest promoted notifs (app/api/cron/weekly-campaign-digest/route.ts)
//   [ ] Gamification badge/streak notifs       (if added in future)
//   [ ] Review response notifications          (if added in future)
//   [ ] QR checkout confirmation notifications (if added in future)
//   [ ] Subscription box notifications         (if added in future)
//
// To integrate a new flow, replace prisma.notification.create with:
//   import { sendNotification } from '@/lib/notifications-smart'
//   await sendNotification({ userId, type, title, body, url, urgent: false })
//
