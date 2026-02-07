import { prisma } from "@/lib/prisma"
import { subDays, format, eachDayOfInterval } from "date-fns"

export async function getRedemptionTrends(merchantId: string, days: number = 30) {
  const endDate = new Date()
  const startDate = subDays(endDate, days - 1)

  const redemptions = await prisma.redemption.findMany({
    where: {
      merchantId,
      confirmedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      confirmedAt: true,
      discountApplied: true,
    },
  })

  // Create a map of dates to counts and revenue
  const dateMap = new Map<string, { count: number; revenue: number }>()

  // Initialize all dates with 0
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate })
  dateRange.forEach((date) => {
    const dateKey = format(date, "MM/dd")
    dateMap.set(dateKey, { count: 0, revenue: 0 })
  })

  // Fill in actual data
  redemptions.forEach((redemption) => {
    if (redemption.confirmedAt) {
      const dateKey = format(redemption.confirmedAt, "MM/dd")
      const existing = dateMap.get(dateKey) || { count: 0, revenue: 0 }
      dateMap.set(dateKey, {
        count: existing.count + 1,
        revenue: existing.revenue + (redemption.discountApplied || 0) / 100,
      })
    }
  })

  // Convert to array format
  return Array.from(dateMap.entries()).map(([date, data]) => ({
    date,
    count: data.count,
    revenue: parseFloat(data.revenue.toFixed(2)),
  }))
}
