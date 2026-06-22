"use client"

import * as React from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"

interface AnimatedAreaChartProps {
  data: Record<string, unknown>[]
  dataKeys: string[]
  colors?: string[]
  height?: number
  gradient?: boolean
  stacked?: boolean
  xAxisKey?: string
  className?: string
}

const DEFAULT_COLORS = [
  "var(--primary)",
  "#5e7e92",
  "#be8a2e",
  "#4e8a5b",
  "#b5613f",
  "#7e9cae",
]

/* Recharts needs non-CSS-variable colours for gradient stops in <linearGradient>.
   This helper resolves CSS variables at runtime so the SVG defs work correctly. */
function useResolvedColors(cssColors: string[]): string[] {
  const [resolved, setResolved] = React.useState<string[]>(cssColors)

  React.useEffect(() => {
    const root = document.documentElement
    const style = getComputedStyle(root)
    setResolved(
      cssColors.map((c) => {
        const match = c.match(/^var\(--(.+)\)$/)
        if (match) {
          const val = style.getPropertyValue(`--${match[1]}`).trim()
          return val || c
        }
        return c
      })
    )
  }, [cssColors])

  return resolved
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-[var(--r-lg)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-[var(--text)]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-xs text-[var(--text-muted)]">
          <span
            className="mr-2 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: <span className="font-medium text-[var(--text)]">{entry.value?.toLocaleString()}</span>
        </p>
      ))}
    </div>
  )
}

export function AnimatedAreaChart({
  data,
  dataKeys,
  colors = DEFAULT_COLORS,
  height = 300,
  gradient = true,
  stacked = false,
  xAxisKey = "name",
  className,
}: AnimatedAreaChartProps) {
  const resolvedColors = useResolvedColors(colors)

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-[var(--text-muted)]">No data available</p>
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={resolvedColors[index % resolvedColors.length]} stopOpacity={0.4} />
                <stop offset="100%" stopColor={resolvedColors[index % resolvedColors.length]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey={xAxisKey}
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <YAxis
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-[var(--text-muted)]">{value}</span>
            )}
          />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              fill={gradient ? `url(#gradient-${key})` : colors[index % colors.length]}
              fillOpacity={gradient ? 1 : 0.15}
              stackId={stacked ? "stack" : undefined}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
