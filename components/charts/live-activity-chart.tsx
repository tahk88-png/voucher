"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface LiveActivityChartProps {
  data: number[]
  maxPoints?: number
  height?: number
  color?: string
  className?: string
}

function buildPath(
  points: number[],
  width: number,
  height: number,
  padding: number
): { linePath: string; areaPath: string } {
  if (points.length < 2) return { linePath: "", areaPath: "" }

  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const usableH = height - padding * 2
  const stepX = width / (points.length - 1)

  const coords = points.map((v, i) => ({
    x: i * stepX,
    y: padding + usableH - ((v - min) / range) * usableH,
  }))

  // Smooth cubic bezier
  let linePath = `M ${coords[0].x},${coords[0].y}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]
    const curr = coords[i]
    const cpx = (prev.x + curr.x) / 2
    linePath += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
  }

  const last = coords[coords.length - 1]
  const areaPath = `${linePath} L ${last.x},${height} L ${coords[0].x},${height} Z`

  return { linePath, areaPath }
}

export function LiveActivityChart({
  data,
  maxPoints = 60,
  height = 200,
  color = "var(--primary)",
  className,
}: LiveActivityChartProps) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [dims, setDims] = React.useState({ width: 400, height })

  React.useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDims({ width: entry.contentRect.width, height })
      }
    })
    observer.observe(svg.parentElement!)
    return () => observer.disconnect()
  }, [height])

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]",
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-[var(--text-muted)]">Waiting for data...</p>
      </div>
    )
  }

  const visiblePoints = data.slice(-maxPoints)
  const { linePath, areaPath } = buildPath(visiblePoints, dims.width, height, 16)

  // Latest point position
  const min = Math.min(...visiblePoints)
  const max = Math.max(...visiblePoints)
  const range = max - min || 1
  const lastValue = visiblePoints[visiblePoints.length - 1]
  const lastX = dims.width
  const lastY = 16 + (height - 32) - ((lastValue - min) / range) * (height - 32)

  const gradientId = "live-gradient"

  return (
    <div className={cn("w-full", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${dims.width} ${height}`}
        width="100%"
        height={height}
        className="block overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
            className="transition-all duration-300 ease-out"
          />
        )}

        {/* Line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300 ease-out"
          />
        )}

        {/* Pulsing dot at latest point */}
        <circle cx={lastX} cy={lastY} r={4} fill={color}>
          <animate attributeName="r" values="4;7;4" dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite" />
        </circle>
        <circle cx={lastX} cy={lastY} r={3} fill={color} />
      </svg>
    </div>
  )
}
