"use client"

import * as React from "react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface BarChartProps {
  data: any[]
  bars: {
    dataKey: string
    name?: string
    color?: string
  }[]
  xAxisKey: string
  height?: number
  className?: string
  showGrid?: boolean
  showLegend?: boolean
  layout?: "horizontal" | "vertical"
}

export function BarChart({
  data,
  bars,
  xAxisKey,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
  layout = "horizontal",
}: BarChartProps) {
  const defaultColors = ["var(--primary)", "var(--success)", "var(--danger)", "var(--text-faint)"]

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} layout={layout}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          )}
          {layout === "horizontal" ? (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke="var(--text-faint)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <YAxis
                stroke="var(--text-faint)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                stroke="var(--text-faint)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                stroke="var(--text-faint)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "2px solid var(--border)",
              borderRadius: "12px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "var(--text)", fontWeight: 600 }}
            itemStyle={{ color: "var(--text-muted)" }}
            cursor={{ fill: "var(--surface-muted)" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="rect"
            />
          )}
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name || bar.dataKey}
              fill={bar.color || defaultColors[index % defaultColors.length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
