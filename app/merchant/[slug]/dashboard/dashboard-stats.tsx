import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { startOfDay, startOfWeek } from "date-fns"
import { StatsCard } from "@/components/ui/stats-card"
import { Ticket, Tag, Calendar, TrendingUp } from "lucide-react"

async function DashboardStatsContent({ merchantId }: { merchantId: string }) {
  const now = new Date()
  const dayStart = startOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })

  const [
    activeVouchers,
    activeCampaigns,
    activeEvents,
    redemptionsToday,
    redemptionsThisWeek,
  ] = await Promise.all([
    prisma.voucher.count({ where: { merchantId, status: "published" } }),
    prisma.campaign.count({ where: { merchantId, status: "active" } }),
    prisma.event.count({ where: { merchantId, status: "published" } }),
    prisma.redemption.count({
      where: { merchantId, createdAt: { gte: dayStart } },
    }),
    prisma.redemption.count({
      where: { merchantId, createdAt: { gte: weekStart } },
    }),
  ])

  const trendValue =
    redemptionsThisWeek > 0 ? ((redemptionsToday / redemptionsThisWeek) * 100).toFixed(1) : "0"

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Active Vouchers"
        value={activeVouchers}
        description="Published vouchers"
        icon={Ticket}
      />
      <StatsCard
        title="Active Campaigns"
        value={activeCampaigns}
        description="Running campaigns"
        icon={Tag}
      />
      <StatsCard
        title="Active Events"
        value={activeEvents}
        description="Published events"
        icon={Calendar}
      />
      <StatsCard
        title="Today's Redemptions"
        value={redemptionsToday}
        description={`This week: ${redemptionsThisWeek}`}
        icon={TrendingUp}
        trend={{
          value: parseFloat(trendValue),
          label: "of weekly",
          isPositive: redemptionsToday > 0,
        }}
      />
    </div>
  )
}

function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-32 animate-pulse rounded-[16px] bg-[#F8F6F1]"
        />
      ))}
    </div>
  )
}

export function DashboardStats({ merchantId }: { merchantId: string }) {
  return (
    <Suspense fallback={<DashboardStatsSkeleton />}>
      <DashboardStatsContent merchantId={merchantId} />
    </Suspense>
  )
}
