"use client"

import * as React from "react"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Sector,
  type TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"

interface PieDonutDatum {
  name: string
  value: number
  color?: string
}

interface PieDonutChartProps {
  data: PieDonutDatum[]
  height?: number
  donut?: boolean
  showLabels?: boolean
  showLegend?: boolean
  className?: string
}

const FALLBACK_COLORS = [
  "var(--primary)",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
]

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  const total = (entry.payload as { __total?: number }).__total ?? 0
  const pct = total > 0 ? ((entry.value ?? 0) / total * 100).toFixed(1) : "0"

  return (
    <div className="rounded-[var(--r-lg)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold text-[var(--text)]">{entry.name}</p>
      <p className="text-xs text-[var(--text-muted)]">
        {entry.value?.toLocaleString()} ({pct}%)
      </p>
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function renderActiveShape(props: any) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
  } = props

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius - 2}
      outerRadius={outerRadius + 8}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  )
}

export function PieDonutChart({
  data,
  height = 300,
  donut = false,
  showLabels = false,
  showLegend = true,
  className,
}: PieDonutChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | undefined>(undefined)

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

  const total = data.reduce((sum, d) => sum + d.value, 0)
  const enriched = data.map((d) => ({ ...d, __total: total }))
  const activeValue = activeIndex !== undefined ? data[activeIndex] : null

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={enriched}
            cx="50%"
            cy="50%"
            innerRadius={donut ? "55%" : 0}
            outerRadius="80%"
            dataKey="value"
            nameKey="name"
            animationDuration={1200}
            animationBegin={100}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(undefined)}
            label={
              showLabels
                ? ({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                : undefined
            }
            labelLine={showLabels}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs text-[var(--text-muted)]">{value}</span>
              )}
            />
          )}
          {/* Donut center label */}
          {donut && (
            <text
              x="50%"
              y="48%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[var(--text)] text-xl font-bold"
            >
              {activeValue ? activeValue.value.toLocaleString() : total.toLocaleString()}
            </text>
          )}
          {donut && (
            <text
              x="50%"
              y="56%"
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[var(--text-muted)] text-xs"
            >
              {activeValue ? activeValue.name : "Total"}
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
