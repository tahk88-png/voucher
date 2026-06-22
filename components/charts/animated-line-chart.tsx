"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  type TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"

interface AnimatedLineChartProps {
  data: Record<string, unknown>[]
  dataKeys: string[]
  colors?: string[]
  height?: number
  showGrid?: boolean
  showTooltip?: boolean
  animate?: boolean
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

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null

  return (
    <div
      className="rounded-[var(--r-lg)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg"
    >
      <p className="mb-1 text-sm font-semibold text-[var(--text)]">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-xs text-[var(--text-muted)]"
        >
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

export function AnimatedLineChart({
  data,
  dataKeys,
  colors = DEFAULT_COLORS,
  height = 300,
  showGrid = true,
  showTooltip = true,
  animate = true,
  xAxisKey = "name",
  className,
}: AnimatedLineChartProps) {
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
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          )}
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
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          <Legend
            wrapperStyle={{ paddingTop: "12px" }}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-[var(--text-muted)]">{value}</span>
            )}
          />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[index % colors.length], r: 4, strokeWidth: 2, stroke: "var(--surface)" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              animationDuration={animate ? 1500 : 0}
              animationEasing="ease-in-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
