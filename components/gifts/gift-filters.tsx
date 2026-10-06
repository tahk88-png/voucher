'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface FilterOption {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface GiftFiltersProps {
  categories: FilterOption[];
  occasions: FilterOption[];
  personas: FilterOption[];
  selectedCategory?: string;
  selectedOccasion?: string;
  selectedPersona?: string;
  budgetMin?: number;
  budgetMax?: number;
  onFilterChange: (filters: {
    category?: string;
    occasion?: string;
    persona?: string;
    budgetMin?: number;
    budgetMax?: number;
  }) => void;
}

// `id` is a stable React key; only the "Under €25" label has words to translate.
const BUDGET_RANGES: { id: string; label?: string; min: number; max: number | undefined }[] = [
  { id: 'under25', min: 0, max: 2500 },
  { id: '25-50', label: '€25–€50', min: 2500, max: 5000 },
  { id: '50-100', label: '€50–€100', min: 5000, max: 10000 },
  { id: '100-200', label: '€100–€200', min: 10000, max: 20000 },
  { id: '200+', label: '€200+', min: 20000, max: undefined },
];

export function GiftFilters({
  categories,
  occasions,
  personas,
  selectedCategory,
  selectedOccasion,
  selectedPersona,
  budgetMin,
  budgetMax,
  onFilterChange,
}: GiftFiltersProps) {
  const t = useTranslations('giftsPages.filters');
  const [showFilters, setShowFilters] = useState(false);
  const [cat, setCat] = useState(selectedCategory || '');
  const [occ, setOcc] = useState(selectedOccasion || '');
  const [per, setPer] = useState(selectedPersona || '');
  const [bMin, setBMin] = useState(budgetMin);
  const [bMax, setBMax] = useState(budgetMax);

  // Report only real changes. The initial values come from the parent's own
  // filters, so emitting on mount handed back an equal-but-new object, and the
  // parent re-ran its feed query: every /gifts visit hit the API twice.
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    onFilterChange({
      category: cat || undefined,
      occasion: occ || undefined,
      persona: per || undefined,
      budgetMin: bMin,
      budgetMax: bMax,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, occ, per, bMin, bMax]);

  const hasFilters = cat || occ || per || bMin !== undefined || bMax !== undefined;

  const clearAll = () => {
    setCat('');
    setOcc('');
    setPer('');
    setBMin(undefined);
    setBMax(undefined);
  };

  return (
    <div className="space-y-3">
      {/* Horizontal filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <WarmButton
          variant={showFilters ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4 mr-1" />
          {t('toggle')}
        </WarmButton>

        {/* Category chips */}
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setCat(cat === c.slug ? '' : c.slug)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border',
              cat === c.slug
                ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--primary)]'
            )}
          >
            {c.icon && <span className="mr-1">{c.icon}</span>}
            {c.name}
          </button>
        ))}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-full text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 shrink-0 flex items-center gap-1"
          >
            <X className="h-3 w-3" /> {t('clear')}
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
          {/* Occasions */}
          <div>
            <label className="text-sm font-semibold text-[var(--text)] mb-2 block">{t('occasion')}</label>
            <div className="flex flex-wrap gap-1.5">
              {occasions.map((o) => (
                <button
                  key={o.slug}
                  onClick={() => setOcc(occ === o.slug ? '' : o.slug)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                    occ === o.slug
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                      : 'bg-[var(--surface-dim)] text-[var(--text-muted)] border-transparent hover:border-[var(--primary)]'
                  )}
                >
                  {o.icon && <span className="mr-1">{o.icon}</span>}
                  {o.name}
                </button>
              ))}
            </div>
          </div>

          {/* Personas */}
          <div>
            <label className="text-sm font-semibold text-[var(--text)] mb-2 block">{t('persona')}</label>
            <div className="flex flex-wrap gap-1.5">
              {personas.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => setPer(per === p.slug ? '' : p.slug)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                    per === p.slug
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                      : 'bg-[var(--surface-dim)] text-[var(--text-muted)] border-transparent hover:border-[var(--primary)]'
                  )}
                >
                  {p.icon && <span className="mr-1">{p.icon}</span>}
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="text-sm font-semibold text-[var(--text)] mb-2 block">{t('budget')}</label>
            <div className="flex flex-wrap gap-1.5">
              {BUDGET_RANGES.map((range) => {
                const isActive = bMin === range.min && bMax === range.max;
                return (
                  <button
                    key={range.id}
                    onClick={() => {
                      if (isActive) {
                        setBMin(undefined);
                        setBMax(undefined);
                      } else {
                        setBMin(range.min);
                        setBMax(range.max);
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]'
                        : 'bg-[var(--surface-dim)] text-[var(--text-muted)] border-transparent hover:border-[var(--primary)]'
                    )}
                  >
                    {range.label ?? t('budgetUnder', { amount: '€25' })}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
