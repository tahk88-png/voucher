import { Suspense } from "react"
import { prisma } from "@/lib/prisma"
import { startOfDay, startOfWeek } from "date-fns"
import { StatsCard } from "@/components/ui/stats-card"
import { Ticket, Tag, Calendar, TrendingUp } from "lucide-react"
import { getTranslations } from "next-intl/server"

async function DashboardStatsContent({
  merchantId,
  merchantSlug,
}: {
  merchantId: string
  merchantSlug: string
}) {
  const t = await getTranslations("merchantDashboard.stats")
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
        title={t("activeVouchers")}
        value={activeVouchers}
        description={t("publishedVouchers")}
        icon={Ticket}
        href={`/merchant/${merchantSlug}/vouchers`}
        actionLabel={t("openVouchers")}
      />
      <StatsCard
        title={t("activeCampaigns")}
        value={activeCampaigns}
        description={t("runningCampaigns")}
        icon={Tag}
        href={`/merchant/${merchantSlug}/campaigns`}
        actionLabel={t("openCampaigns")}
      />
      <StatsCard
        title={t("activeEvents")}
        value={activeEvents}
        description={t("publishedEvents")}
        icon={Calendar}
        href={`/merchant/${merchantSlug}/events`}
        actionLabel={t("openEvents")}
      />
      <StatsCard
        title={t("todaysRedemptions")}
        value={redemptionsToday}
        description={t("thisWeek", { count: redemptionsThisWeek })}
        icon={TrendingUp}
        href={`/merchant/${merchantSlug}/redemptions`}
        actionLabel={t("reviewRedemptions")}
        // No trend arrow for zero: a red "down" arrow on an empty day reads as a drop.
        trend={
          redemptionsToday > 0
            ? { value: parseFloat(trendValue), label: t("ofWeekly"), isPositive: true }
            : undefined
        }
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

export function DashboardStats({ merchantId, merchantSlug }: { merchantId: string; merchantSlug: string }) {
  return (
    <Suspense fallback={<DashboardStatsSkeleton />}>
      <DashboardStatsContent merchantId={merchantId} merchantSlug={merchantSlug} />
    </Suspense>
  )
}
