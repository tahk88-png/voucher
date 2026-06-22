'use client'

import React, { useState, useMemo } from 'react'
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { TableSkeleton } from './loading-skeleton'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  data: T[]
  sortable?: boolean
  pagination?: boolean
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
}

type SortDir = 'asc' | 'desc' | null

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  sortable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)
  const [page, setPage] = useState(0)

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      const as = String(av)
      const bs = String(bv)
      return sortDir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
    })
  }, [data, sortKey, sortDir])

  const totalPages = pagination ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1
  const paged = pagination ? sorted.slice(page * pageSize, (page + 1) * pageSize) : sorted

  const handleSort = (key: string) => {
    if (!sortable) return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'))
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  if (loading) return <TableSkeleton rows={pageSize} columns={columns.length} />

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--surface, #fff)',
        border: '1px solid var(--border, #e5e7eb)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
              {columns.map((col) => {
                const isColumnSortable = sortable && col.sortable !== false
                const isActive = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    className={`text-left px-4 py-3 font-semibold ${
                      isColumnSortable ? 'cursor-pointer select-none' : ''
                    }`}
                    style={{
                      color: 'var(--text-muted, #6b7280)',
                      width: col.width,
                    }}
                    onClick={() => isColumnSortable && handleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isColumnSortable && (
                        <span className="inline-flex">
                          {isActive && sortDir === 'asc' ? (
                            <ArrowUp size={14} />
                          ) : isActive && sortDir === 'desc' ? (
                            <ArrowDown size={14} />
                          ) : (
                            <ChevronsUpDown size={14} style={{ opacity: 0.4 }} />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="text-center py-12"
                  style={{ color: 'var(--text-muted, #6b7280)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors duration-100"
                  style={{
                    borderBottom: '1px solid var(--border, #e5e7eb)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--border, #e5e7eb) 30%, transparent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3"
                      style={{ color: 'var(--text, #111)' }}
                    >
                      {col.render ? col.render(row) : (row[col.key] as React.ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid var(--border, #e5e7eb)' }}
        >
          <span className="text-xs" style={{ color: 'var(--text-muted, #6b7280)' }}>
            Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              aria-label="Previous page"
              className="p-1.5 rounded-lg transition-opacity disabled:opacity-30"
              style={{ color: 'var(--text, #111)' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs px-2" style={{ color: 'var(--text-muted, #6b7280)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              aria-label="Next page"
              className="p-1.5 rounded-lg transition-opacity disabled:opacity-30"
              style={{ color: 'var(--text, #111)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
