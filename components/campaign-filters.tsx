"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"
import { ArrowUpDown } from "lucide-react"

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "expiring", label: "Expiring Soon" },
]

interface CampaignFiltersProps {
  merchants: Array<{ slug: string; name: string }>
}

export default function CampaignFilters({ merchants }: CampaignFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentSort = searchParams.get("sort") || "newest"
  const currentMerchant = searchParams.get("merchant") || ""
  const currentMinPrice = searchParams.get("minPrice") || ""
  const currentMaxPrice = searchParams.get("maxPrice") || ""

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.push(`?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sort */}
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 text-[#8B7355]" />
        <select
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          aria-label="Sort by"
          className="text-sm bg-white border border-[rgba(139,115,85,0.15)] rounded-[var(--r-sm)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Merchant filter */}
      {merchants.length > 1 && (
        <select
          value={currentMerchant}
          onChange={(e) => updateParams({ merchant: e.target.value })}
          aria-label="Merchant"
          className="text-sm bg-white border border-[rgba(139,115,85,0.15)] rounded-[var(--r-sm)] px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        >
          <option value="">All merchants</option>
          {merchants.map((m) => (
            <option key={m.slug} value={m.slug}>{m.name}</option>
          ))}
        </select>
      )}

      {/* Price range */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          placeholder="Min €"
          value={currentMinPrice}
          onChange={(e) => updateParams({ minPrice: e.target.value })}
          aria-label="Min price"
          className="w-20 text-sm bg-white border border-[rgba(139,115,85,0.15)] rounded-[var(--r-sm)] px-2 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <span className="text-[#8B7355] text-xs">&ndash;</span>
        <input
          type="number"
          min="0"
          placeholder="Max €"
          value={currentMaxPrice}
          onChange={(e) => updateParams({ maxPrice: e.target.value })}
          aria-label="Max price"
          className="w-20 text-sm bg-white border border-[rgba(139,115,85,0.15)] rounded-[var(--r-sm)] px-2 py-2 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
      </div>
    </div>
  )
}
