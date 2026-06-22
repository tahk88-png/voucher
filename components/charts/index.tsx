"use client"

/**
 * Chart barrel — lazy-loads recharts-backed charts via next/dynamic().
 *
 * Every chart that imports from `recharts` is re-exported here through
 * `next/dynamic()` so the ~180KB recharts bundle is fetched as a
 * separate chunk when the chart first renders, instead of shipping
 * with every analytics page's initial JS. Consumers keep the same
 * named-import contract (`import { AnimatedAreaChart } from '@/components/charts'`)
 * — the switch is transparent.
 *
 * `ssr: false` is intentional: these charts read CSS variables via
 * `getComputedStyle(document.documentElement)` at mount, so they must
 * only render on the client anyway. Turning off SSR also shaves
 * recharts out of the server bundle.
 *
 * Sparkline and GeoMap are pure SVG (no recharts), so they stay as
 * direct re-exports — splitting them into separate chunks would be
 * pure overhead.
 */
import dynamic from "next/dynamic"
import { ChartSkeleton } from "./chart-skeleton"

export const AnimatedLineChart = dynamic(
  () => import("./animated-line-chart").then((m) => ({ default: m.AnimatedLineChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const AnimatedBarChart = dynamic(
  () => import("./animated-bar-chart").then((m) => ({ default: m.AnimatedBarChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const AnimatedAreaChart = dynamic(
  () => import("./animated-area-chart").then((m) => ({ default: m.AnimatedAreaChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const PieDonutChart = dynamic(
  () => import("./pie-donut-chart").then((m) => ({ default: m.PieDonutChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const HeatmapChart = dynamic(
  () => import("./heatmap-chart").then((m) => ({ default: m.HeatmapChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const FunnelChart = dynamic(
  () => import("./funnel-chart").then((m) => ({ default: m.FunnelChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const ConversionChart = dynamic(
  () => import("./conversion-chart").then((m) => ({ default: m.ConversionChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

export const LiveActivityChart = dynamic(
  () => import("./live-activity-chart").then((m) => ({ default: m.LiveActivityChart })),
  { ssr: false, loading: () => <ChartSkeleton /> }
)

// Pure-SVG components — no recharts, no bundle benefit from splitting.
export { Sparkline } from "./sparkline"
export { GeoMap } from "./geo-map"
