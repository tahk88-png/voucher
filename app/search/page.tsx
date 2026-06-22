"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { VoiceSearchButton } from "@/components/voice-search-button";
import {
  SearchFiltersPanel,
  type SearchFilters,
} from "@/components/search/search-filters";
import {
  SearchResults,
  type SearchResult,
} from "@/components/search/search-results";
import { WarmButton } from "@/components/warm-button";
import { SlidersHorizontal, X } from "lucide-react";

const DEFAULT_FILTERS: SearchFilters = {
  category: "",
  type: "",
  sort: "newest",
  minDiscount: 0,
  maxPrice: 0,
};

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<SearchFilters>({
    category: searchParams.get("category") || "",
    type: searchParams.get("type") || "",
    sort: searchParams.get("sort") || "newest",
    minDiscount: parseInt(searchParams.get("minDiscount") || "0"),
    maxPrice: parseInt(searchParams.get("maxPrice") || "0"),
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(
    async (q: string, f: SearchFilters, p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (f.category) params.set("category", f.category);
        if (f.type) params.set("type", f.type);
        if (f.sort && f.sort !== "newest") params.set("sort", f.sort);
        if (f.minDiscount > 0)
          params.set("minDiscount", f.minDiscount.toString());
        if (f.maxPrice > 0) params.set("maxPrice", f.maxPrice.toString());
        params.set("page", p.toString());

        const res = await fetch(`/api/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();

        setResults(data.results || []);
        setTotal(data.meta?.total || 0);
        setTotalPages(data.meta?.totalPages || 0);

        // Update URL without navigation
        const urlParams = new URLSearchParams();
        if (q) urlParams.set("q", q);
        if (f.category) urlParams.set("category", f.category);
        if (f.type) urlParams.set("type", f.type);
        if (f.sort && f.sort !== "newest") urlParams.set("sort", f.sort);
        if (f.minDiscount > 0)
          urlParams.set("minDiscount", f.minDiscount.toString());
        if (f.maxPrice > 0)
          urlParams.set("maxPrice", f.maxPrice.toString());
        if (p > 1) urlParams.set("page", p.toString());

        const qs = urlParams.toString();
        window.history.replaceState(
          null,
          "",
          qs ? `/search?${qs}` : "/search"
        );
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial search on mount
  useEffect(() => {
    performSearch(query, filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced search on query change
  const handleQueryChange = useCallback(
    (q: string) => {
      setQuery(q);
      setPage(1);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        performSearch(q, filters, 1);
      }, 400);
    },
    [filters, performSearch]
  );

  const handleFiltersChange = useCallback(
    (newFilters: SearchFilters) => {
      setFilters(newFilters);
      setPage(1);
      performSearch(query, newFilters, 1);
    },
    [query, performSearch]
  );

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
    performSearch(query, DEFAULT_FILTERS, 1);
  }, [query, performSearch]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      performSearch(query, filters, newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [query, filters, performSearch]
  );

  const handleRemoveFilter = useCallback(
    (key: keyof SearchFilters) => {
      const newFilters = { ...filters };
      if (key === "sort") {
        newFilters.sort = "newest";
      } else if (key === "minDiscount" || key === "maxPrice") {
        newFilters[key] = 0;
      } else {
        newFilters[key] = "";
      }
      setFilters(newFilters);
      setPage(1);
      performSearch(query, newFilters, 1);
    },
    [filters, query, performSearch]
  );

  const handleVoiceResult = useCallback(
    (transcript: string) => {
      setQuery(transcript);
      setPage(1);
      performSearch(transcript, filters, 1);
    },
    [filters, performSearch]
  );

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Search Vouchers
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Find the best deals, discounts, and offers
          </p>
        </div>

        {/* Search bar with voice */}
        <div className="flex gap-2">
          <div className="flex-1">
            <SearchInput
              placeholder="Search vouchers, merchants, campaigns..."
              onSearch={handleQueryChange}
              isLoading={loading}
              defaultValue={query}
            />
          </div>
          <VoiceSearchButton onResult={handleVoiceResult} />
          {/* Mobile filter toggle */}
          <div className="lg:hidden">
            <WarmButton
              variant="outline"
              size="icon"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              aria-label="Toggle filters"
            >
              {showMobileFilters ? (
                <X className="h-4 w-4" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" />
              )}
            </WarmButton>
          </div>
        </div>

        {/* Main layout */}
        <div className="flex gap-6">
          {/* Sidebar filters — desktop */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-6">
              <SearchFiltersPanel
                filters={filters}
                onChange={handleFiltersChange}
                onClear={handleClearFilters}
              />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/30"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full overflow-y-auto bg-[var(--bg)] shadow-xl">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--text)]">
                      Filters
                    </h2>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      aria-label="Close filters"
                      className="h-8 w-8 flex items-center justify-center rounded-[var(--r-sm)] hover:bg-[var(--surface-dim)]"
                    >
                      <X className="h-5 w-5 text-[var(--text-muted)]" />
                    </button>
                  </div>
                  <SearchFiltersPanel
                    filters={filters}
                    onChange={(f) => {
                      handleFiltersChange(f);
                      setShowMobileFilters(false);
                    }}
                    onClear={() => {
                      handleClearFilters();
                      setShowMobileFilters(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            <SearchResults
              results={results}
              total={total}
              page={page}
              totalPages={totalPages}
              loading={loading}
              query={query}
              filters={filters}
              onPageChange={handlePageChange}
              onRemoveFilter={handleRemoveFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
