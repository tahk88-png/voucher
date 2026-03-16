'use client'

import React from 'react'

const shimmerClass =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent'

function SkeletonBlock({
  className = '',
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded ${shimmerClass} ${className}`}
      style={{
        backgroundColor: 'var(--border, #e5e7eb)',
        ...style,
      }}
    />
  )
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{
        backgroundColor: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-3 w-48" />
        </div>
        <SkeletonBlock className="h-8 w-40" />
      </div>
      <SkeletonBlock style={{ height }} />
    </div>
  )
}

export function MetricSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <SkeletonBlock className="h-4 w-24" />
        <SkeletonBlock className="h-8 w-8 rounded-lg" />
      </div>
      <SkeletonBlock className={compact ? 'h-7 w-20 mb-1' : 'h-9 w-28 mb-2'} />
      <SkeletonBlock className="h-4 w-16" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
      }}
    >
      {/* Header */}
      <div
        className="flex gap-4 p-4"
        style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex gap-4 p-4"
          style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <SkeletonBlock key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function FeedSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}
