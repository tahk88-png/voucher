"use client"

import * as React from "react"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { cn } from "@/lib/utils"

interface LineChartProps {
  data: any[]
  lines: {
    dataKey: string
    name?: string
    color?: string
  }[]
  xAxisKey: string
  height?: number
  className?: string
  showGrid?: boolean
  showLegend?: boolean
}

export function LineChart({
  data,
  lines,
  xAxisKey,
  height = 300,
  className,
  showGrid = true,
  showLegend = true,
}: LineChartProps) {
  const defaultColors = ["var(--primary)", "var(--success)", "var(--danger)", "var(--text-faint)"]

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
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
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name || line.dataKey}
              stroke={line.color || defaultColors[index % defaultColors.length]}
              strokeWidth={2}
              dot={{ fill: line.color || defaultColors[index % defaultColors.length], r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}
