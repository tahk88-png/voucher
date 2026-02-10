"use client"

import * as React from "react"
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface AreaChartProps {
  data: any[]
  areas: {
    dataKey: string
    name?: string
    color?: string
  }[]
  xAxisKey: string
  height?: number
  className?: string
  showGrid?: boolean
  showLegend?: boolean
  stacked?: boolean
}

export function AreaChart({
  data,
  areas,
  xAxisKey,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
  stacked = false,
}: AreaChartProps) {
  const defaultColors = ["var(--primary)", "var(--success)", "var(--danger)", "var(--text-faint)"]

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <YAxis
            stroke="var(--text-faint)"
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "2px solid var(--border)",
              borderRadius: "12px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "var(--text)", fontWeight: 600 }}
            itemStyle={{ color: "var(--text-muted)" }}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
            />
          )}
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name || area.dataKey}
              stroke={area.color || defaultColors[index % defaultColors.length]}
              fill={area.color || defaultColors[index % defaultColors.length]}
              fillOpacity={0.6}
              strokeWidth={2}
              stackId={stacked ? "1" : undefined}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
