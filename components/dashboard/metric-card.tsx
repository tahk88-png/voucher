'use client'

import React, { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { MetricSkeleton } from './loading-skeleton'

export interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
  sparklineData?: number[]
  loading?: boolean
  compact?: boolean
}

function AnimatedValue({ value }: { value: number | string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState<string>('0')

  useEffect(() => {
    if (typeof value === 'string') {
      setDisplay(value)
      return
    }

    const target = value
    const duration = 800
    let start: number | null = null
    let raf: number

    const animate = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * target)

      setDisplay(current.toLocaleString())

      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        setDisplay(target.toLocaleString())
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <span ref={ref}>{display}</span>
}

function Sparkline({ data, width = 60, height = 20 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((v - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} className="inline-block ml-2">
      <polyline
        points={points}
        fill="none"
        stroke="var(--primary, #6366f1)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const trendConfig = {
  up: { icon: TrendingUp, color: '#16a34a' },
  down: { icon: TrendingDown, color: '#dc2626' },
  neutral: { icon: Minus, color: 'var(--text-muted, #6b7280)' },
}

export function MetricCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  sparklineData,
  loading = false,
  compact = false,
}: MetricCardProps) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  if (loading) return <MetricSkeleton compact={compact} />

  const TrendIcon = trendConfig[trend].icon
  const trendColor = trendConfig[trend].color

  return (
    <div
      className="rounded-xl cursor-default"
      style={{
        backgroundColor: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        padding: compact ? '1rem' : '1.25rem',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(8px)',
        transition:
          'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-sm font-medium"
          style={{ color: 'var(--text-muted, #6b7280)' }}
        >
          {title}
        </span>
        {icon && (
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--primary, #6366f1) 12%, transparent)',
              color: 'var(--primary, #6366f1)',
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-1">
        <span
          className={compact ? 'text-xl font-bold' : 'text-2xl font-bold'}
          style={{ color: 'var(--text, #111)', lineHeight: 1.2 }}
        >
          <AnimatedValue value={value} />
        </span>
        {sparklineData && <Sparkline data={sparklineData} />}
      </div>

      {/* Change */}
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-1.5">
          <TrendIcon size={14} style={{ color: trendColor }} />
          <span className="text-sm font-medium" style={{ color: trendColor }}>
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted, #6b7280)' }}>
            vs prev period
          </span>
        </div>
      )}
    </div>
  )
}
