"use client"

import { LineChart } from "@/components/ui/charts/line-chart"
import { BarChart } from "@/components/ui/charts/bar-chart"
import { PieChart } from "@/components/ui/charts/pie-chart"
import { WarmCard } from "@/components/warm-card"

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
}

export function AnalyticsCharts({
  redemptionTrends,
  voucherPerformance,
  categoryBreakdown,
}: AnalyticsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Redemption Trends */}
      <WarmCard padding="lg">
        <h3 className="text-lg font-semibold text-[#2D2721] mb-4">
          Redemption Trends (Last 30 Days)
        </h3>
        <LineChart
          data={redemptionTrends}
          lines={[
            { dataKey: "count", name: "Redemptions", color: "#FFC857" },
            { dataKey: "revenue", name: "Revenue ($)", color: "#9DB5A5" },
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
          <h3 className="text-lg font-semibold text-[#2D2721] mb-4">
            Top Performing Vouchers
          </h3>
          <BarChart
            data={voucherPerformance.slice(0, 5)}
            bars={[
              { dataKey: "redemptions", name: "Redemptions", color: "#FFC857" },
            ]}
            xAxisKey="name"
            height={300}
            showGrid
            showLegend={false}
            layout="horizontal"
          />
        </WarmCard>

        {/* Category Breakdown */}
        <WarmCard padding="lg">
          <h3 className="text-lg font-semibold text-[#2D2721] mb-4">
            Redemptions by Category
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
            <div className="h-[300px] flex items-center justify-center text-[#8B7355]">
              No category data available
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  )
}
