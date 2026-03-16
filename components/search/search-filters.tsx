"use client";

import { WarmCard } from "@/components/warm-card";
import { WarmButton } from "@/components/warm-button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { campaignCategories } from "@/lib/campaign-categories";
import { SlidersHorizontal, X } from "lucide-react";

export interface SearchFilters {
  category: string;
  type: string;
  sort: string;
  minDiscount: number;
  maxPrice: number;
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  onClear: () => void;
  className?: string;
}

const DISCOUNT_TYPES = [
  { value: "", label: "All types" },
  { value: "percentage", label: "Percentage off" },
  { value: "fixed_amount", label: "Fixed amount" },
  { value: "credit_amount", label: "Store credit" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "popular", label: "Most popular" },
  { value: "expiring", label: "Expiring soon" },
];

const ALL_CATEGORIES = [
  { id: "", label: "All categories" },
  { id: "cafe", label: "Cafe & Coffee" },
  { id: "beauty", label: "Beauty & Spa" },
  { id: "fitness", label: "Fitness & Sport" },
  { id: "events", label: "Events" },
  { id: "workshops", label: "Workshops" },
  { id: "family", label: "Family & Kids" },
  { id: "travel", label: "Travel & Hotels" },
  { id: "outdoor", label: "Outdoor & Adventure" },
  { id: "other", label: "Other" },
];

export function SearchFiltersPanel({
  filters,
  onChange,
  onClear,
  className,
}: SearchFiltersProps) {
  const hasActiveFilters =
    filters.category !== "" ||
    filters.type !== "" ||
    filters.sort !== "newest" ||
    filters.minDiscount > 0 ||
    filters.maxPrice > 0;

  const update = (partial: Partial<SearchFilters>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <WarmCard padding="lg" className={className}>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
            <h3 className="text-sm font-semibold text-[var(--text)]">
              Filters
            </h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClear}
              className="text-xs text-[var(--primary)] hover:underline flex items-center gap-1"
            >
              <X className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Category
          </Label>
          <div className="space-y-1.5">
            {ALL_CATEGORIES.map((cat) => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="category"
                  checked={filters.category === cat.id}
                  onChange={() => update({ category: cat.id })}
                  className="h-3.5 w-3.5 rounded border-[var(--border)] text-[var(--primary)] accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Discount type */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Discount Type
          </Label>
          <div className="space-y-1.5">
            {DISCOUNT_TYPES.map((dt) => (
              <label
                key={dt.value}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="discountType"
                  checked={filters.type === dt.value}
                  onChange={() => update({ type: dt.value })}
                  className="h-3.5 w-3.5 rounded-full border-[var(--border)] text-[var(--primary)] accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--text)] group-hover:text-[var(--primary)] transition-colors">
                  {dt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Min discount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Min. Discount
            </Label>
            {filters.minDiscount > 0 && (
              <span className="text-xs font-semibold text-[var(--primary)]">
                {filters.minDiscount}%
              </span>
            )}
          </div>
          <Input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.minDiscount}
            onChange={(e) =>
              update({ minDiscount: parseInt(e.target.value) })
            }
            className="h-2 cursor-pointer accent-[var(--primary)]"
          />
          <div className="flex justify-between text-xs text-[var(--text-faint)]">
            <span>Any</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Max price */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
              Max Price
            </Label>
            {filters.maxPrice > 0 && (
              <span className="text-xs font-semibold text-[var(--primary)]">
                {(filters.maxPrice / 100).toFixed(0)} EUR
              </span>
            )}
          </div>
          <Input
            type="range"
            min={0}
            max={10000}
            step={500}
            value={filters.maxPrice}
            onChange={(e) =>
              update({ maxPrice: parseInt(e.target.value) })
            }
            className="h-2 cursor-pointer accent-[var(--primary)]"
          />
          <div className="flex justify-between text-xs text-[var(--text-faint)]">
            <span>Any</span>
            <span>50 EUR</span>
            <span>100 EUR</span>
          </div>
        </div>

        {/* Sort */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
            Sort By
          </Label>
          <select
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value })}
            className="w-full h-10 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </WarmCard>
  );
}
