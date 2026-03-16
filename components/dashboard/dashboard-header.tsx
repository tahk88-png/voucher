'use client'

import React, { useState } from 'react'
import { Download, ChevronDown } from 'lucide-react'

export type DateRangeOption = '7d' | '30d' | '90d' | '1y' | 'custom'

export interface FilterOption {
  id: string
  label: string
  options: { value: string; label: string }[]
  value?: string
}

export interface DashboardHeaderProps {
  title: string
  subtitle?: string
  dateRange?: DateRangeOption
  onDateRangeChange?: (range: DateRangeOption) => void
  filters?: FilterOption[]
  onFilterChange?: (filterId: string, value: string) => void
  onExport?: (format: 'csv' | 'pdf') => void
}

const rangeLabels: Record<DateRangeOption, string> = {
  '7d': '7 days',
  '30d': '30 days',
  '90d': '90 days',
  '1y': '1 year',
  custom: 'Custom',
}

export function DashboardHeader({
  title,
  subtitle,
  dateRange = '30d',
  onDateRangeChange,
  filters = [],
  onFilterChange,
  onExport,
}: DashboardHeaderProps) {
  const [exportOpen, setExportOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Title row */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text, #111)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted, #6b7280)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Controls row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {/* Date range */}
        {onDateRangeChange && (
          <div
            className="flex rounded-lg overflow-hidden text-sm shrink-0"
            style={{ border: '1px solid var(--border, #e5e7eb)' }}
          >
            {(Object.keys(rangeLabels) as DateRangeOption[]).map((key) => (
              <button
                key={key}
                onClick={() => onDateRangeChange(key)}
                className="px-3 py-1.5 transition-colors duration-150 font-medium"
                style={{
                  backgroundColor:
                    dateRange === key ? 'var(--primary, #6366f1)' : 'var(--surface, #fff)',
                  color: dateRange === key ? '#fff' : 'var(--text-muted, #6b7280)',
                }}
              >
                {rangeLabels[key]}
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        {filters.map((filter) => (
          <div key={filter.id} className="relative">
            <select
              value={filter.value ?? ''}
              onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
              className="appearance-none rounded-lg text-sm pl-3 pr-8 py-1.5 font-medium cursor-pointer"
              style={{
                backgroundColor: 'var(--surface, #fff)',
                border: '1px solid var(--border, #e5e7eb)',
                color: 'var(--text, #111)',
              }}
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-muted, #6b7280)' }}
            />
          </div>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export */}
        {onExport && (
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: 'var(--surface, #fff)',
                border: '1px solid var(--border, #e5e7eb)',
                color: 'var(--text, #111)',
              }}
            >
              <Download size={14} />
              Export
              <ChevronDown size={14} />
            </button>
            {exportOpen && (
              <div
                className="absolute right-0 mt-1 rounded-lg shadow-lg py-1 z-20 min-w-[120px]"
                style={{
                  backgroundColor: 'var(--surface, #fff)',
                  border: '1px solid var(--border, #e5e7eb)',
                }}
              >
                {(['csv', 'pdf'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      onExport(fmt)
                      setExportOpen(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--text, #111)' }}
                  >
                    Export as {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
