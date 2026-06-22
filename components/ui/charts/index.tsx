"use client"

/**
 * Merchant-facing chart barrel — lazy-loads recharts via next/dynamic().
 *
 * These four charts (LineChart / BarChart / AreaChart / PieChart) each
 * import from `recharts` at module level. Going through this barrel
 * splits recharts into a separate chunk that only downloads when the
 * chart actually renders on the client, instead of shipping with every
 * merchant dashboard/analytics/events/campaigns page's initial JS.
 *
 * `ssr: false` is safe — these components hold internal React state and
 * bail out on empty data; rendering them on the server would produce
 * mismatched HTML during hydration anyway.
 *
 * Consumers MUST import from this barrel (`@/components/ui/charts`), not
 * from the deep paths (`@/components/ui/charts/line-chart`) — deep-path
 * imports bypass this wrapper and pull recharts into the page's initial
 * chunk.
 */
import dynamic from "next/dynamic"
import { ChartSkeleton } from "@/components/charts/chart-skeleton"

export const LineChart = dynamic(
  () => import("./line-chart").then((m) => ({ default: m.LineChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const BarChart = dynamic(
  () => import("./bar-chart").then((m) => ({ default: m.BarChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const AreaChart = dynamic(
  () => import("./area-chart").then((m) => ({ default: m.AreaChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const PieChart = dynamic(
  () => import("./pie-chart").then((m) => ({ default: m.PieChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)
