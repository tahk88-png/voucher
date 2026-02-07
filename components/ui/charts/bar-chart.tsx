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
  const defaultColors = ["#FFC857", "#9DB5A5", "#E17B5C", "#8B7355"]

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBarChart data={data} layout={layout}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E7DCC7" />
          )}
          {layout === "horizontal" ? (
            <>
              <XAxis
                dataKey={xAxisKey}
                stroke="#8B7355"
                tick={{ fill: "#6B5744", fontSize: 12 }}
              />
              <YAxis
                stroke="#8B7355"
                tick={{ fill: "#6B5744", fontSize: 12 }}
              />
            </>
          ) : (
            <>
              <XAxis
                type="number"
                stroke="#8B7355"
                tick={{ fill: "#6B5744", fontSize: 12 }}
              />
              <YAxis
                dataKey={xAxisKey}
                type="category"
                stroke="#8B7355"
                tick={{ fill: "#6B5744", fontSize: 12 }}
              />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #E7DCC7",
              borderRadius: "12px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#2D2721", fontWeight: 600 }}
            itemStyle={{ color: "#6B5744" }}
            cursor={{ fill: "#FAF7F2" }}
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
