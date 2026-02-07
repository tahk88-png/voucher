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
  const defaultColors = ["#FFC857", "#9DB5A5", "#E17B5C", "#8B7355"]

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data}>
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
