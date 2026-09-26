"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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
import { WarmCard } from "@/components/warm-card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { Loader2, Search, SlidersHorizontal, Ticket, X } from "lucide-react";

/** An active campaign matching the query (see /api/search). */
interface CampaignResult {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string;
  endDate: string;
  categoryLabel: string;
  merchant: { id: string; name: string; slug: string; brandLogoUrl: string | null };
}

function CampaignResultCard({ campaign }: { campaign: CampaignResult }) {
  const priceLabel =
    campaign.price && campaign.price > 0 ? formatCurrency(campaign.price, campaign.currency) : "Free";
  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block rounded-[var(--r-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <WarmCard hover padding="none" className="h-full overflow-hidden">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)] truncate">{campaign.merchant.name}</span>
            <span className="shrink-0 rounded-full bg-[var(--surface-dim)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
              {campaign.categoryLabel}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2">{campaign.name}</h3>
          {campaign.description && (
            <p className="text-xs text-[var(--text-muted)] line-clamp-2">{campaign.description}</p>
          )}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-1">
            <span>
              Ends{" "}
              {new Date(campaign.endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </span>
            <span className="font-semibold text-[var(--text)]">{priceLabel}</span>
          </div>
        </div>
      </WarmCard>
    </Link>
  );
}

const DEFAULT_FILTERS: SearchFilters = {
  category: "",
  type: "",
  sort: "newest",
  minDiscount: 0,
  maxPrice: 0,
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" aria-label="Loading search" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
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
  const [campaigns, setCampaigns] = useState<CampaignResult[]>([]);
  const [searchError, setSearchError] = useState(false);
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
      setSearchError(false);
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
        setCampaigns(data.campaigns || []);
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
        setSearchError(true);
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
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setQuery(transcript);
      setPage(1);
      performSearch(transcript, filters, 1);
    },
    [filters, performSearch]
  );

  return (
    <div className="bg-[var(--bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text)]">
            Search offers
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Find campaigns and vouchers from merchants on GiftHub
          </p>
        </div>

        {/* Search bar with voice */}
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (debounceRef.current) clearTimeout(debounceRef.current);
            setPage(1);
            performSearch(query, filters, 1);
          }}
        >
          <div className="flex-1 relative">
            <label htmlFor="search-query" className="sr-only">
              Search campaigns, vouchers and merchants
            </label>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" aria-hidden="true" />
            <Input
              id="search-query"
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search campaigns, vouchers, merchants..."
              className="pl-9 pr-9"
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--primary)]" aria-hidden="true" />
            )}
          </div>
          <VoiceSearchButton onResult={handleVoiceResult} />
          {/* Mobile filter toggle */}
          <div className="lg:hidden">
            <WarmButton
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              aria-label="Toggle filters"
              aria-expanded={showMobileFilters}
            >
              {showMobileFilters ? (
                <X className="h-4 w-4" />
              ) : (
                <SlidersHorizontal className="h-4 w-4" />
              )}
            </WarmButton>
          </div>
        </form>

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
          <div className="flex-1 min-w-0 space-y-8">
            {searchError && (
              <p role="alert" className="text-sm text-[var(--danger)]">
                Search is unavailable right now. Please try again in a moment.
              </p>
            )}

            {campaigns.length > 0 && (
              <section aria-labelledby="search-campaigns-heading" className="space-y-3">
                <h2 id="search-campaigns-heading" className="text-lg font-semibold text-[var(--text)]">
                  Campaigns{" "}
                  <span className="text-sm font-normal text-[var(--text-muted)]">({campaigns.length})</span>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((campaign) => (
                    <CampaignResultCard key={campaign.id} campaign={campaign} />
                  ))}
                </div>
              </section>
            )}

            {/* Voucher results. When campaigns matched but no vouchers did,
                skip the voucher list so the page doesn't claim "No results". */}
            {(results.length > 0 || campaigns.length === 0 || page > 1) && (
              <section aria-label="Vouchers" className="space-y-3">
                {campaigns.length > 0 && (
                  <h2 className="text-lg font-semibold text-[var(--text)]">Vouchers</h2>
                )}
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
              </section>
            )}

            {!loading && !searchError && campaigns.length === 0 && results.length === 0 && (
              <WarmCard padding="lg" className="text-center">
                <p className="text-sm text-[var(--text-muted)]">
                  <Ticket className="inline h-4 w-4 mr-1 align-[-2px]" aria-hidden="true" />
                  Browse everything on sale in the{" "}
                  <Link href="/campaigns" className="font-medium text-[var(--primary)] hover:underline">
                    campaign marketplace
                  </Link>
                  .
                </p>
              </WarmCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
