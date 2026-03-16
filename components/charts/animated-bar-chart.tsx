"use client"

import * as React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"

interface AnimatedBarChartProps {
  data: Record<string, unknown>[]
  dataKeys: string[]
  colors?: string[]
  height?: number
  stacked?: boolean
  horizontal?: boolean
  xAxisKey?: string
  className?: string
}

const DEFAULT_COLORS = [
  "var(--primary)",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
]

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

export function AnimatedBarChart({
  data,
  dataKeys,
  colors = DEFAULT_COLORS,
  height = 300,
  stacked = false,
  horizontal = false,
  xAxisKey = "name",
  className,
}: AnimatedBarChartProps) {
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
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          {horizontal ? (
            <>
              <XAxis
                type="number"
                stroke="var(--text-faint)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
              />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                stroke="var(--text-faint)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                width={80}
              />
            </>
          ) : (
            <>
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
            </>
          )}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)", opacity: 0.3 }} />
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-[var(--text-muted)]">{value}</span>
            )}
          />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={key}
              fill={colors[index % colors.length]}
              stackId={stacked ? "stack" : undefined}
              radius={stacked && index < dataKeys.length - 1 ? undefined : [4, 4, 0, 0]}
              animationDuration={1200}
              animationEasing="ease-in-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
