"use client"

import { LineChart, BarChart, PieChart } from "@/components/ui/charts"
import { WarmCard } from "@/components/warm-card"
import { useTranslations } from "next-intl"

interface RedemptionTrend {
  date: string
  count: number
  revenue: number
}

interface VoucherPerformance {
  name: string
  redemptions: number
  revenue: number
}

interface CategoryData {
  name: string
  value: number
}

interface AnalyticsChartsProps {
  redemptionTrends: RedemptionTrend[]
  voucherPerformance: VoucherPerformance[]
  categoryBreakdown: CategoryData[]
  /** ISO currency of the revenue series (the merchant's default currency). */
  currency?: string
}

export function AnalyticsCharts({
  redemptionTrends,
  voucherPerformance,
  categoryBreakdown,
  currency = "EUR",
}: AnalyticsChartsProps) {
  const t = useTranslations("merchantDashboard.analytics.charts")
  const topVouchers = voucherPerformance.filter((v) => v.redemptions > 0).slice(0, 5)
  return (
    <div className="space-y-6">
      {/* Redemption Trends */}
      <WarmCard padding="lg">
        <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
          {t("redemptionTrends")}
        </h3>
        <LineChart
          data={redemptionTrends}
          lines={[
            { dataKey: "count", name: t("redemptions"), color: "#cc785c" },
            { dataKey: "revenue", name: t("revenue", { currency }), color: "#5e7e92" },
          ]}
          xAxisKey="date"
          height={350}
          showGrid
          showLegend
        />
      </WarmCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Performing Vouchers */}
        <WarmCard padding="lg">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
            {t("topPerforming")}
          </h3>
          {topVouchers.length > 0 ? (
            <BarChart
              data={topVouchers}
              bars={[
                { dataKey: "redemptions", name: t("redemptions"), color: "#FFC857" },
              ]}
              xAxisKey="name"
              height={300}
              showGrid
              showLegend={false}
              layout="horizontal"
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-center px-6 text-[var(--text-faint)]">
              {t("noRedeemed")}
            </div>
          )}
        </WarmCard>

        {/* Category Breakdown */}
        <WarmCard padding="lg">
          <h3 className="text-lg font-semibold text-[var(--text)] mb-4">
            {t("byCategory")}
          </h3>
          {categoryBreakdown.length > 0 ? (
            <PieChart
              data={categoryBreakdown}
              height={300}
              showLegend
              donut
              innerRadius={70}
            />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-[var(--text-faint)]">
              {t("noCategoryData")}
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  )
}
