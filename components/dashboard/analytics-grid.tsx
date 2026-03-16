'use client'

import React from 'react'

export interface AnalyticsGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
}

const gapMap = { sm: '0.75rem', md: '1.25rem', lg: '1.75rem' }

const colClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

export function AnalyticsGrid({ children, columns = 4, gap = 'md' }: AnalyticsGridProps) {
  return (
    <div
      className={`grid ${colClasses[columns]}`}
      style={{ gap: gapMap[gap] }}
    >
      {children}
    </div>
  )
}
