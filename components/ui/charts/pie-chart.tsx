"use client"

import * as React from "react"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { cn } from "@/lib/utils"

interface PieChartProps {
  data: {
    name: string
    value: number
    color?: string
  }[]
  height?: number
  className?: string
  showLegend?: boolean
  donut?: boolean
  innerRadius?: number
}

export function PieChart({
  data,
  height = 300,
  className,
  showLegend = true,
  donut = false,
  innerRadius = 60,
}: PieChartProps) {
  const defaultColors = [
    "#FFC857",
    "#9DB5A5",
    "#E17B5C",
    "#8B7355",
    "#FAF7F2",
    "#E7DCC7",
  ]

  const dataWithColors = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }))

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RechartsPieChart>
          <Pie
            data={dataWithColors}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            innerRadius={donut ? innerRadius : 0}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithColors.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
              verticalAlign="bottom"
              height={36}
              iconType="circle"
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
