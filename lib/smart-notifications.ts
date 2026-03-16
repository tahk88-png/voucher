import { prisma } from '@/lib/prisma'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SendTimeResult = {
  hour: number
  dayOfWeek: number
  timezone: string
  confidence: 'high' | 'medium' | 'low'
}

// ---------------------------------------------------------------------------
// Get best send time for a user
// ---------------------------------------------------------------------------

export async function getBestSendTime(userId: string): Promise<SendTimeResult> {
  const pattern = await prisma.userActivityPattern.findUnique({
    where: { userId },
  })

  if (!pattern) {
    return { hour: 10, dayOfWeek: new Date().getDay(), timezone: 'UTC', confidence: 'low' }
  }

  const preferredHours = pattern.preferredHours as number[]
  const preferredDays = pattern.preferredDays as number[]
  const timezone = pattern.timezone

  // Pick the most optimal hour (first in the sorted list)
  const bestHour = preferredHours.length > 0 ? preferredHours[0] : 10

  // Pick the best day, defaulting to today if it's in the preferred list
  const today = new Date().getDay()
  const adjustedToday = today === 0 ? 7 : today // Convert to 1=Mon format
  const bestDay = preferredDays.includes(adjustedToday)
    ? adjustedToday
    : preferredDays.length > 0
      ? preferredDays[0]
      : adjustedToday

  const confidence =
    preferredHours.length >= 3 && pattern.openRate > 0.3
      ? 'high'
      : preferredHours.length >= 1
        ? 'medium'
        : 'low'

  return { hour: bestHour, dayOfWeek: bestDay, timezone, confidence }
}

// ---------------------------------------------------------------------------
// Record notification interaction
// ---------------------------------------------------------------------------

export async function recordNotificationOpen(userId: string): Promise<void> {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay() // 1=Mon

  const pattern = await prisma.userActivityPattern.findUnique({
    where: { userId },
  })

  if (!pattern) {
    await prisma.userActivityPattern.create({
      data: {
        userId,
        preferredHours: [hour],
        preferredDays: [dayOfWeek],
        openRate: 1.0,
        lastCalculated: now,
      },
    })
    return
  }

  // Add current hour/day to tracked data and recalculate
  const hours = pattern.preferredHours as number[]
  const days = pattern.preferredDays as number[]

  // Keep a frequency count and pick top hours/days
  const hourFreq = new Map<number, number>()
  for (const h of hours) hourFreq.set(h, (hourFreq.get(h) ?? 0) + 1)
  hourFreq.set(hour, (hourFreq.get(hour) ?? 0) + 2) // Weight recent more

  const dayFreq = new Map<number, number>()
  for (const d of days) dayFreq.set(d, (dayFreq.get(d) ?? 0) + 1)
  dayFreq.set(dayOfWeek, (dayFreq.get(dayOfWeek) ?? 0) + 2)

  // Sort by frequency and keep top 5
  const topHours = [...hourFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([h]) => h)

  const topDays = [...dayFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d]) => d)

  // Update open rate with exponential moving average
  const newOpenRate = pattern.openRate * 0.9 + 0.1

  await prisma.userActivityPattern.update({
    where: { userId },
    data: {
      preferredHours: topHours,
      preferredDays: topDays,
      openRate: Math.min(1, newOpenRate),
      lastCalculated: now,
    },
  })
}

// ---------------------------------------------------------------------------
// Update activity pattern from recent notifications
// ---------------------------------------------------------------------------

export async function updateActivityPattern(userId: string): Promise<void> {
  // Get recent notifications opened by this user
  const recentNotifications = await prisma.notification.findMany({
    where: {
      userId,
      readAt: { not: null },
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
    },
    select: { readAt: true },
    orderBy: { readAt: 'desc' },
    take: 100,
  })

  if (recentNotifications.length === 0) return

  const hourFreq = new Map<number, number>()
  const dayFreq = new Map<number, number>()

  for (const n of recentNotifications) {
    if (!n.readAt) continue
    const readDate = new Date(n.readAt)
    const hour = readDate.getHours()
    const day = readDate.getDay() === 0 ? 7 : readDate.getDay()
    hourFreq.set(hour, (hourFreq.get(hour) ?? 0) + 1)
    dayFreq.set(day, (dayFreq.get(day) ?? 0) + 1)
  }

  const topHours = [...hourFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([h]) => h)

  const topDays = [...dayFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d]) => d)

  // Calculate open rate from total notifications
  const totalNotifications = await prisma.notification.count({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  })
  const openRate = totalNotifications > 0 ? recentNotifications.length / totalNotifications : 0

  await prisma.userActivityPattern.upsert({
    where: { userId },
    create: {
      userId,
      preferredHours: topHours,
      preferredDays: topDays,
      openRate,
      lastCalculated: new Date(),
    },
    update: {
      preferredHours: topHours,
      preferredDays: topDays,
      openRate,
      lastCalculated: new Date(),
    },
  })
}

// ---------------------------------------------------------------------------
// Schedule smart notification
// ---------------------------------------------------------------------------

export async function scheduleSmartNotification(
  notification: {
    userId: string
    merchantId?: string
    type: string
    title: string
    body: string
    url?: string
  },
  userId: string
): Promise<{ scheduledFor: Date; confidence: string }> {
  const sendTime = await getBestSendTime(userId)
  const now = new Date()

  // Calculate next occurrence of the optimal send time
  const scheduledFor = new Date(now)
  scheduledFor.setHours(sendTime.hour, 0, 0, 0)

  // If the time has already passed today, schedule for next matching day
  if (scheduledFor <= now) {
    scheduledFor.setDate(scheduledFor.getDate() + 1)
  }

  // Adjust to preferred day if needed
  const currentDay = scheduledFor.getDay() === 0 ? 7 : scheduledFor.getDay()
  if (sendTime.dayOfWeek !== currentDay) {
    let daysUntil = sendTime.dayOfWeek - currentDay
    if (daysUntil <= 0) daysUntil += 7
    scheduledFor.setDate(scheduledFor.getDate() + daysUntil)
  }

  // Create the notification (it will be delivered at scheduledFor)
  // For now, create immediately — a cron job would handle delayed delivery
  await prisma.notification.create({
    data: {
      userId: notification.userId,
      merchantId: notification.merchantId ?? null,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      url: notification.url ?? null,
    },
  })

  return { scheduledFor, confidence: sendTime.confidence }
}
