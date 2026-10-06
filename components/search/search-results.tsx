"use client";

import { useLocale, useTranslations } from "next-intl";
import { WarmCard } from "@/components/warm-card";
import { formatCurrency } from "@/lib/utils";
import { WarmButton } from "@/components/warm-button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, X, Ticket, Clock, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { isCampaignCategoryId } from "@/lib/campaign-categories";
import type { SearchFilters } from "./search-filters";

export interface SearchResult {
  id: string;
  type: string;
  value: number;
  currency: string;
  validFrom: string;
  validTo: string;
  codePrefix: string | null;
  isFlashSale: boolean;
  flashSaleEndsAt: string | null;
  merchant: {
    id: string;
    name: string;
    slug: string;
    brandLogoUrl: string | null;
    city: string | null;
  };
  campaign: {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    startDate: string;
    endDate: string;
    type: string;
  } | null;
  redemptionCount: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  query: string;
  filters: SearchFilters;
  onPageChange: (page: number) => void;
  onRemoveFilter: (key: keyof SearchFilters) => void;
}

function formatDiscount(
  tLabels: ReturnType<typeof useTranslations<"labels">>,
  type: string,
  value: number,
  currency: string
): string {
  switch (type) {
    case "percentage":
      return tLabels("valueOff", { value: `${(value / 100).toFixed(0)}%` });
    case "fixed_amount":
      return tLabels("valueOff", { value: formatCurrency(value, currency) });
    case "credit_amount":
      return tLabels("valueCredit", { value: formatCurrency(value, currency) });
    default:
      return `${value}`;
  }
}

const VOUCHER_TYPES = ["percentage", "fixed_amount", "credit_amount"] as const;
const SORT_VALUES = ["newest", "popular", "expiring"] as const;

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  const t = useTranslations("searchPage.results");
  return (
    <span className="inline-flex items-center gap-1 rounded-[var(--r-full)] px-2.5 py-1 text-xs font-medium bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
      {label}
      <button
        onClick={onRemove}
        className="hover:bg-[var(--primary)]/20 rounded-full p-0.5 transition-colors"
        aria-label={t("removeFilter", { label })}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function SearchResults({
  results,
  total,
  page,
  totalPages,
  loading,
  query,
  filters,
  onPageChange,
  onRemoveFilter,
}: SearchResultsProps) {
  const t = useTranslations("searchPage.results");
  const tFilters = useTranslations("searchPage.filters");
  const tLabels = useTranslations("labels");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : locale;
  // Build active filter chips
  const activeFilterChips: { key: keyof SearchFilters; label: string }[] = [];
  if (filters.category) {
    activeFilterChips.push({
      key: "category",
      label: t("chipCategory", {
        value: isCampaignCategoryId(filters.category)
          ? tLabels(`category.${filters.category}`)
          : filters.category,
      }),
    });
  }
  if (filters.type) {
    activeFilterChips.push({
      key: "type",
      label: t("chipType", {
        value: (VOUCHER_TYPES as readonly string[]).includes(filters.type)
          ? tFilters(`types.${filters.type as (typeof VOUCHER_TYPES)[number]}`)
          : filters.type.replace("_", " "),
      }),
    });
  }
  if (filters.minDiscount > 0) {
    activeFilterChips.push({
      key: "minDiscount",
      label: t("chipMinDiscount", { value: filters.minDiscount }),
    });
  }
  if (filters.maxPrice > 0) {
    activeFilterChips.push({
      key: "maxPrice",
      label: t("chipMaxPrice", { value: (filters.maxPrice / 100).toFixed(0) }),
    });
  }
  if (filters.sort !== "newest") {
    activeFilterChips.push({
      key: "sort",
      label: t("chipSort", {
        value: (SORT_VALUES as readonly string[]).includes(filters.sort)
          ? tFilters(`sort.${filters.sort as (typeof SORT_VALUES)[number]}`)
          : filters.sort,
      }),
    });
  }

  return (
    <div className="space-y-4">
      {/* Result count and filter chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("searching")}
              </span>
            ) : (
              t.rich(query ? "countForQuery" : "count", {
                total,
                query,
                num: (chunks) => (
                  <span className="font-semibold text-[var(--text)]">{chunks}</span>
                ),
                hl: (chunks) => (
                  <span className="font-medium text-[var(--text)]">{chunks}</span>
                ),
              })
            )}
          </p>
        </div>

        {/* Active filter chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                onRemove={() => onRemoveFilter(chip.key)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results grid */}
      {loading && results.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((result) => (
            <Link
              key={result.id}
              href={
                // /m/<slug>/campaigns/<id> does not exist; the voucher page does.
                `/v/${result.id}`
              }
              className="block"
            >
              <WarmCard hover padding="none" className="h-full overflow-hidden">
                {/* Voucher header */}
                <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-[var(--bg-2)] to-[#FFE5B4]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {result.merchant.brandLogoUrl ? (
                        <Image
                          src={result.merchant.brandLogoUrl}
                          alt={result.merchant.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-md object-contain bg-white/80 p-0.5"
                          unoptimized
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-md bg-white/50 flex items-center justify-center">
                          <Ticket className="h-4 w-4 text-[var(--text-faint)]" />
                        </div>
                      )}
                      <span className="text-xs font-medium text-[var(--text-muted)] truncate max-w-[120px]">
                        {result.merchant.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {result.isFlashSale && (
                        <Badge variant="warning" className="text-[10px]">
                          <Zap className="h-2.5 w-2.5 mr-0.5" />
                          {t("flash")}
                        </Badge>
                      )}
                      <Badge variant="success" className="text-[10px]">
                        {formatDiscount(
                          tLabels,
                          result.type,
                          result.value,
                          result.currency
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-1">
                    {result.campaign?.name || t("voucherFallback")}
                  </h3>
                  {result.campaign?.description && (
                    <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                      {result.campaign.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-[var(--text-faint)]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t("expires", {
                        date: new Date(result.validTo).toLocaleDateString(dateLocale, {
                          month: "short",
                          day: "numeric",
                        }),
                      })}
                    </span>
                    {result.campaign?.price !== null &&
                      result.campaign?.price !== undefined && (
                        <span className="font-semibold text-[var(--text)]">
                          {result.campaign.price === 0
                            ? tLabels("free")
                            : formatCurrency(result.campaign.price, result.currency)}
                        </span>
                      )}
                  </div>

                  {result.redemptionCount > 0 && (
                    <p className="text-[10px] text-[var(--text-faint)]">
                      {t("redeemed", { count: result.redemptionCount })}
                    </p>
                  )}
                </div>
              </WarmCard>
            </Link>
          ))}
        </div>
      ) : (
        !loading && (
          <WarmCard padding="lg">
            <div className="py-10 text-center">
              <Search className="h-12 w-12 mx-auto text-[var(--text-faint)] mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                {t("noResultsTitle")}
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                {query
                  ? t("noResultsQuery", { query })
                  : t("noResultsHint")}
              </p>
            </div>
          </WarmCard>
        )
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <WarmButton
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {tCommon("previous")}
          </WarmButton>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`h-8 w-8 rounded-[var(--r-sm)] text-sm font-medium transition-colors ${
                    page === pageNum
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--surface-dim)]"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <WarmButton
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {tCommon("next")}
          </WarmButton>
        </div>
      )}
    </div>
  );
}
