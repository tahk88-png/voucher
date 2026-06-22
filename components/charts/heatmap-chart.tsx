"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface HeatmapChartProps {
  /** 2D array: data[row][col] */
  data: number[][]
  xLabels: string[]
  yLabels: string[]
  colorRange?: [string, string, string]
  height?: number
  className?: string
}

function interpolateColor(
  value: number,
  min: number,
  max: number,
  colors: [string, string, string]
): string {
  if (max === min) return colors[1]
  const ratio = (value - min) / (max - min)

  // Parse hex colors
  const parse = (hex: string) => {
    const h = hex.replace("#", "")
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16),
    ]
  }

  const c0 = parse(colors[0])
  const c1 = parse(colors[1])
  const c2 = parse(colors[2])

  let r: number, g: number, b: number
  if (ratio < 0.5) {
    const t = ratio * 2
    r = Math.round(c0[0] + (c1[0] - c0[0]) * t)
    g = Math.round(c0[1] + (c1[1] - c0[1]) * t)
    b = Math.round(c0[2] + (c1[2] - c0[2]) * t)
  } else {
    const t = (ratio - 0.5) * 2
    r = Math.round(c1[0] + (c2[0] - c1[0]) * t)
    g = Math.round(c1[1] + (c2[1] - c1[1]) * t)
    b = Math.round(c1[2] + (c2[2] - c1[2]) * t)
  }

  return `rgb(${r}, ${g}, ${b})`
}

export function HeatmapChart({
  data,
  xLabels,
  yLabels,
  colorRange = ["#4e8a5b", "#be8a2e", "#c84b36"],
  height,
  className,
}: HeatmapChartProps) {
  const [tooltip, setTooltip] = React.useState<{
    x: number
    y: number
    row: number
    col: number
    value: number
  } | null>(null)

  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)]",
          className
        )}
        style={{ height: height ?? 300 }}
      >
        <p className="text-sm text-[var(--text-muted)]">No data available</p>
      </div>
    )
  }

  const flat = data.flat()
  const min = Math.min(...flat)
  const max = Math.max(...flat)
  const rows = data.length
  const cols = data[0]?.length ?? 0

  const cellSize = 28
  const labelPadX = 48
  const labelPadY = 28
  const svgWidth = labelPadX + cols * cellSize
  const svgHeight = labelPadY + rows * cellSize

  return (
    <div className={cn("w-full overflow-x-auto", className)} style={{ height }}>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        width="100%"
        style={{ minWidth: svgWidth, maxHeight: height }}
        className="block"
      >
        {/* Column labels */}
        {xLabels.slice(0, cols).map((label, ci) => (
          <text
            key={`x-${ci}`}
            x={labelPadX + ci * cellSize + cellSize / 2}
            y={labelPadY - 8}
            textAnchor="middle"
            className="fill-[var(--text-muted)]"
            fontSize={10}
          >
            {label}
          </text>
        ))}

        {/* Row labels */}
        {yLabels.slice(0, rows).map((label, ri) => (
          <text
            key={`y-${ri}`}
            x={labelPadX - 8}
            y={labelPadY + ri * cellSize + cellSize / 2 + 4}
            textAnchor="end"
            className="fill-[var(--text-muted)]"
            fontSize={10}
          >
            {label}
          </text>
        ))}

        {/* Cells */}
        {data.map((row, ri) =>
          row.map((value, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={labelPadX + ci * cellSize}
              y={labelPadY + ri * cellSize}
              width={cellSize - 2}
              height={cellSize - 2}
              rx={4}
              fill={interpolateColor(value, min, max, colorRange)}
              className="cursor-pointer transition-opacity duration-150 hover:opacity-80"
              onMouseEnter={(e) => {
                const rect = (e.target as SVGRectElement).getBoundingClientRect()
                setTooltip({ x: rect.left + rect.width / 2, y: rect.top, row: ri, col: ci, value })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <animate
                attributeName="opacity"
                from="0"
                to="1"
                dur="0.6s"
                begin={`${(ri * cols + ci) * 0.01}s`}
                fill="freeze"
              />
            </rect>
          ))
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-[var(--r-lg)] border-2 border-[var(--border)] bg-[var(--surface)] px-3 py-2 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: "translate(-50%, -100%)",
          }}
        >
          <p className="text-xs font-semibold text-[var(--text)]">
            {yLabels[tooltip.row]} / {xLabels[tooltip.col]}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Value: <span className="font-medium text-[var(--text)]">{tooltip.value.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  )
}
