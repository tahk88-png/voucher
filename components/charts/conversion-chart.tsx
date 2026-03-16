"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ConversionDatum {
  name: string
  value: number
  previousValue: number
}

interface ConversionChartProps {
  data: ConversionDatum[]
  height?: number
  className?: string
}

export function ConversionChart({
  data,
  height,
  className,
}: ConversionChartProps) {
  const [animated, setAnimated] = React.useState(false)

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(raf)
  }, [])

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

  const maxValue = Math.max(...data.flatMap((d) => [d.value, d.previousValue]))
  const barHeight = 24
  const rowHeight = 72

  return (
    <div
      className={cn("w-full space-y-1", className)}
      style={{ height }}
    >
      {data.map((item) => {
        const currentPct = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        const prevPct = maxValue > 0 ? (item.previousValue / maxValue) * 100 : 0
        const change =
          item.previousValue > 0
            ? ((item.value - item.previousValue) / item.previousValue) * 100
            : item.value > 0
              ? 100
              : 0
        const isPositive = change >= 0

        return (
          <div key={item.name} style={{ height: rowHeight }} className="flex flex-col justify-center">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text)]">{item.name}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold",
                  isPositive
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                )}
              >
                {isPositive ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            </div>

            {/* Current period bar */}
            <div className="relative mb-1 w-full overflow-hidden rounded-full bg-[var(--border)]" style={{ height: barHeight }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${currentPct}%` : "0%",
                  backgroundColor: isPositive ? "#10b981" : "#ef4444",
                }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium text-white">
                {item.value.toLocaleString()}
              </span>
            </div>

            {/* Previous period bar */}
            <div className="relative w-full overflow-hidden rounded-full bg-[var(--border)]" style={{ height: barHeight * 0.6 }}>
              <div
                className="absolute inset-y-0 left-0 rounded-full opacity-40 transition-all duration-700 ease-out"
                style={{
                  width: animated ? `${prevPct}%` : "0%",
                  backgroundColor: "var(--text-muted)",
                }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-[10px] text-[var(--text-muted)]">
                prev: {item.previousValue.toLocaleString()}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
