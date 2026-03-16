'use client'

import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export interface StatComparisonProps {
  current: number
  previous: number
  label: string
  format?: 'currency' | 'number' | 'percent'
  currencySymbol?: string
}

function formatValue(
  value: number,
  format: 'currency' | 'number' | 'percent',
  currencySymbol: string,
): string {
  switch (format) {
    case 'currency':
      return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    case 'percent':
      return `${value.toFixed(1)}%`
    case 'number':
    default:
      return value.toLocaleString()
  }
}

export function StatComparison({
  current,
  previous,
  label,
  format = 'number',
  currencySymbol = '$',
}: StatComparisonProps) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const change = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0
  const improved = current >= previous
  const color = improved ? '#16a34a' : '#dc2626'
  const barMax = Math.max(current, previous) || 1

  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      <p className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted, #6b7280)' }}>
        {label}
      </p>

      {/* Current */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--text-muted, #6b7280)' }}>
            Current
          </span>
          <span className="text-base font-bold" style={{ color: 'var(--text, #111)' }}>
            {formatValue(current, format, currencySymbol)}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--border, #e5e7eb)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: entered ? `${(current / barMax) * 100}%` : '0%',
              backgroundColor: 'var(--primary, #6366f1)',
            }}
          />
        </div>
      </div>

      {/* Previous */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: 'var(--text-muted, #6b7280)' }}>
            Previous
          </span>
          <span className="text-sm font-medium" style={{ color: 'var(--text-muted, #6b7280)' }}>
            {formatValue(previous, format, currencySymbol)}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--border, #e5e7eb)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: entered ? `${(previous / barMax) * 100}%` : '0%',
              backgroundColor: 'var(--border, #9ca3af)',
            }}
          />
        </div>
      </div>

      {/* Change */}
      <div className="flex items-center gap-1.5">
        {improved ? (
          <TrendingUp size={14} style={{ color }} />
        ) : (
          <TrendingDown size={14} style={{ color }} />
        )}
        <span className="text-sm font-semibold" style={{ color }}>
          {change > 0 ? '+' : ''}
          {change.toFixed(1)}%
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted, #6b7280)' }}>
          change
        </span>
      </div>
    </div>
  )
}
