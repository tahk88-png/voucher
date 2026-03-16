'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { ChartSkeleton } from './loading-skeleton'

export type DateRangeOption = '7d' | '30d' | '90d' | '1y' | 'custom'

export interface ChartCardProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  children: React.ReactNode
  dateRange?: DateRangeOption
  onDateRangeChange?: (range: DateRangeOption) => void
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  fullscreenToggle?: boolean
}

const rangeLabels: Record<DateRangeOption, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  '1y': '1 year',
  custom: 'Custom',
}

export function ChartCard({
  title,
  subtitle,
  icon,
  children,
  dateRange = '30d',
  onDateRangeChange,
  loading = false,
  error = null,
  onRetry,
  fullscreenToggle = true,
}: ChartCardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [entered, setEntered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev)
  }, [])

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isFullscreen])

  if (loading) return <ChartSkeleton />

  const card = (
    <div
      ref={cardRef}
      className={`rounded-xl transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-4 z-50 overflow-auto'
          : ''
      }`}
      style={{
        backgroundColor: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 pb-0"
      >
        <div className="flex items-center gap-2.5">
          {icon && (
            <span
              className="flex items-center justify-center w-9 h-9 rounded-lg"
              style={{ backgroundColor: 'var(--primary, #6366f1)', color: '#fff' }}
            >
              {icon}
            </span>
          )}
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text, #111)' }}>
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm" style={{ color: 'var(--text-muted, #6b7280)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date range selector */}
          {onDateRangeChange && (
            <div
              className="flex rounded-lg overflow-hidden text-xs"
              style={{ border: '1px solid var(--border, #e5e7eb)' }}
            >
              {(Object.keys(rangeLabels) as DateRangeOption[]).map((key) => (
                <button
                  key={key}
                  onClick={() => onDateRangeChange(key)}
                  className="px-2.5 py-1.5 transition-colors duration-150"
                  style={{
                    backgroundColor:
                      dateRange === key
                        ? 'var(--primary, #6366f1)'
                        : 'transparent',
                    color:
                      dateRange === key
                        ? '#fff'
                        : 'var(--text-muted, #6b7280)',
                  }}
                >
                  {rangeLabels[key]}
                </button>
              ))}
            </div>
          )}

          {fullscreenToggle && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg transition-colors duration-150 hover:opacity-80"
              style={{ color: 'var(--text-muted, #6b7280)' }}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm" style={{ color: 'var(--text-muted, #6b7280)' }}>
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: 'var(--primary, #6366f1)' }}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => setIsFullscreen(false)}
        />
        {card}
      </>
    )
  }

  return card
}
