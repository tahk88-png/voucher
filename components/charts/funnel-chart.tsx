"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FunnelDatum {
  name: string
  value: number
  color?: string
}

interface FunnelChartProps {
  data: FunnelDatum[]
  height?: number
  showPercentage?: boolean
  className?: string
}

const FALLBACK_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#a78bfa",
  "#c4b5fd",
  "#ddd6fe",
  "#ede9fe",
]

export function FunnelChart({
  data,
  height = 400,
  showPercentage = true,
  className,
}: FunnelChartProps) {
  const [visibleCount, setVisibleCount] = React.useState(0)

  React.useEffect(() => {
    if (!data?.length) return
    setVisibleCount(0)
    let i = 0
    const timer = setInterval(() => {
      i++
      setVisibleCount(i)
      if (i >= data.length) clearInterval(timer)
    }, 150)
    return () => clearInterval(timer)
  }, [data])

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

  const maxValue = data[0]?.value ?? 1
  const stageHeight = height / data.length
  const svgWidth = 600
  const padding = 40
  const usableWidth = svgWidth - padding * 2

  return (
    <div className={cn("w-full", className)}>
      <svg viewBox={`0 0 ${svgWidth} ${height}`} width="100%" height={height} className="block">
        {data.map((stage, index) => {
          if (index >= visibleCount) return null

          const widthRatio = stage.value / maxValue
          const nextWidthRatio =
            index < data.length - 1 ? data[index + 1].value / maxValue : widthRatio * 0.7

          const topWidth = usableWidth * widthRatio
          const bottomWidth = usableWidth * nextWidthRatio
          const centerX = svgWidth / 2
          const y = index * stageHeight
          const color = stage.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]

          // Trapezoid points
          const topLeft = centerX - topWidth / 2
          const topRight = centerX + topWidth / 2
          const bottomLeft = centerX - bottomWidth / 2
          const bottomRight = centerX + bottomWidth / 2

          const conversionPct =
            index > 0 && data[index - 1].value > 0
              ? ((stage.value / data[index - 1].value) * 100).toFixed(1)
              : "100"

          return (
            <g key={stage.name}>
              <polygon
                points={`${topLeft},${y + 2} ${topRight},${y + 2} ${bottomRight},${y + stageHeight - 2} ${bottomLeft},${y + stageHeight - 2}`}
                fill={color}
                className="transition-opacity duration-300"
                style={{
                  opacity: 1,
                  animation: `fadeIn 0.3s ease-out`,
                }}
              />
              {/* Stage name */}
              <text
                x={centerX}
                y={y + stageHeight / 2 - 6}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white text-sm font-semibold"
                fontSize={13}
              >
                {stage.name}
              </text>
              {/* Value + conversion */}
              <text
                x={centerX}
                y={y + stageHeight / 2 + 12}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-white/80 text-xs"
                fontSize={11}
              >
                {stage.value.toLocaleString()}
                {showPercentage && index > 0 ? ` (${conversionPct}%)` : ""}
              </text>
            </g>
          )
        })}
      </svg>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
