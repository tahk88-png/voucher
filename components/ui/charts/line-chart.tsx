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
  const defaultColors = ["#FFC857", "#9DB5A5", "#E17B5C", "#8B7355"]

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={data}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E7DCC7" />
          )}
          <XAxis
            dataKey={xAxisKey}
            stroke="#8B7355"
            tick={{ fill: "#6B5744", fontSize: 12 }}
          />
          <YAxis
            stroke="#8B7355"
            tick={{ fill: "#6B5744", fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #E7DCC7",
              borderRadius: "12px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#2D2721", fontWeight: 600 }}
            itemStyle={{ color: "#6B5744" }}
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
