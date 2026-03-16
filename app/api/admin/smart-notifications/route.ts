import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { requireAdminPermission } from '@/lib/admin/guards'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.read')

    // Get all activity patterns
    const patterns = await prisma.userActivityPattern.findMany({
      select: {
        preferredHours: true,
        preferredDays: true,
        openRate: true,
        timezone: true,
      },
    })

    // Distribution of preferred hours
    const hourDistribution: Record<number, number> = {}
    for (let h = 0; h < 24; h++) hourDistribution[h] = 0

    // Distribution of preferred days
    const dayDistribution: Record<number, number> = {}
    for (let d = 1; d <= 7; d++) dayDistribution[d] = 0

    let totalOpenRate = 0

    for (const p of patterns) {
      const hours = p.preferredHours as number[]
      const days = p.preferredDays as number[]
      for (const h of hours) {
        if (h >= 0 && h < 24) hourDistribution[h]++
      }
      for (const d of days) {
        if (d >= 1 && d <= 7) dayDistribution[d]++
      }
      totalOpenRate += p.openRate
    }

    const avgOpenRate = patterns.length > 0 ? totalOpenRate / patterns.length : 0

    // Timezone distribution
    const timezoneDistribution: Record<string, number> = {}
    for (const p of patterns) {
      timezoneDistribution[p.timezone] = (timezoneDistribution[p.timezone] ?? 0) + 1
    }

    return NextResponse.json({
      totalUsers: patterns.length,
      avgOpenRate: Math.round(avgOpenRate * 1000) / 1000,
      hourDistribution,
      dayDistribution,
      timezoneDistribution,
    })
  })
}
