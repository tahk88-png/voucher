"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/ui/empty-state"
import { Spinner } from "@/components/ui/spinner"

interface SearchResult {
  id: string
  title: string
  description?: string
  category?: string
  href?: string
}

interface SearchResultsProps {
  results: SearchResult[]
  isLoading?: boolean
  query?: string
  onResultClick?: (result: SearchResult) => void
  emptyMessage?: string
  className?: string
}

export function SearchResults({
  results,
  isLoading,
  query,
  onResultClick,
  emptyMessage = "No results found",
  className,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (results.length === 0 && query) {
    return (
      <EmptyState
        icon={Search}
        title={emptyMessage}
        description={`No results found for "${query}". Try different keywords.`}
        className={className}
      />
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {results.map((result) => (
        <button
          key={result.id}
          onClick={() => onResultClick?.(result)}
          className="w-full text-left p-4 rounded-xl border-2 border-[#E7DCC7] bg-white hover:bg-[#FAF7F2] hover:border-[#FFC857] transition-all group"
        >
          {result.category && (
            <div className="text-xs font-medium text-[#8B7355] mb-1">
              {result.category}
            </div>
          )}
          <div className="text-sm font-bold text-[#2D2721] mb-1 group-hover:text-[#FFC857] transition-colors">
            {highlightMatch(result.title, query)}
          </div>
          {result.description && (
            <div className="text-sm text-[#6B5744] line-clamp-2">
              {highlightMatch(result.description, query)}
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

function highlightMatch(text: string, query?: string): React.ReactNode {
  if (!query) return text

  const parts = text.split(new RegExp(`(${query})`, "gi"))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-[#FFC857]/30 text-[#2D2721] font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}
