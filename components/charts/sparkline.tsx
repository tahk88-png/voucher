"use client"

import * as React from "react"

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  className?: string
}

export function Sparkline({
  data,
  color = "var(--primary)",
  width = 80,
  height = 24,
  className,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} className={className} />
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2
  const usableH = height - padding * 2
  const stepX = width / (data.length - 1)

  const coords = data.map((v, i) => ({
    x: i * stepX,
    y: padding + usableH - ((v - min) / range) * usableH,
  }))

  // Smooth cubic bezier path
  let path = `M ${coords[0].x},${coords[0].y}`
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1]
    const curr = coords[i]
    const cpx = (prev.x + curr.x) / 2
    path += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
