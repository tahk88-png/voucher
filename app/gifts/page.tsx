'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Gift, Loader2 } from 'lucide-react';
import { GiftCard } from '@/components/gifts/gift-card';
import { GiftFilters } from '@/components/gifts/gift-filters';
import { GiftFeedSection } from '@/components/gifts/gift-feed-section';
import { AIGiftWizard } from '@/components/gifts/ai-gift-wizard';
import { useTranslations } from 'next-intl';

interface FeedItem {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  mediaUrl: string | null;
  mediaUrls: string[];
  merchantName: string;
  merchantSlug: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  affiliateUrl: string | null;
  isFeatured: boolean;
  score: number;
  feedModule?: string;
}

interface Module {
  id: string;
  title: string;
  type: string;
  items: FeedItem[];
}

interface FilterOption {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export default function GiftsPage() {
  const t = useTranslations('giftsPages.hub');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [feedError, setFeedError] = useState(false);
  // True once an unfiltered load came back with nothing: there is no gift
  // catalogue yet, so filters and the AI finder would lead nowhere.
  const [catalogEmpty, setCatalogEmpty] = useState(false);
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [occasions, setOccasions] = useState<FilterOption[]>([]);
  const [personas, setPersonas] = useState<FilterOption[]>([]);
  const [filters, setFilters] = useState<{
    category?: string;
    occasion?: string;
    persona?: string;
    budgetMin?: number;
    budgetMax?: number;
  }>({});

  // Load filter options from the public taxonomy endpoint (one request; the
  // /api/admin/gifts/* endpoints are admin-only and must not be called here).
  useEffect(() => {
    let cancelled = false;
    fetch('/api/gifts/taxonomy')
      .then((r) => (r.ok ? r.json() : { categories: [], occasions: [], personas: [] }))
      .catch(() => ({ categories: [], occasions: [], personas: [] }))
      .then((data) => {
        if (cancelled) return;
        setCategories(data.categories || []);
        setOccasions(data.occasions || []);
        setPersonas(data.personas || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load feed
  const loadFeed = useCallback(async (isAppend = false) => {
    if (isAppend) setLoadingMore(true);
    else setLoading(true);
    setFeedError(false);
    const unfiltered = Object.values(filters).every((value) => value == null || value === '');

    const params = new URLSearchParams();
    if (filters.category) params.set('category', filters.category);
    if (filters.occasion) params.set('occasion', filters.occasion);
    if (filters.persona) params.set('persona', filters.persona);
    if (filters.budgetMin != null) params.set('budgetMin', String(filters.budgetMin));
    if (filters.budgetMax != null) params.set('budgetMax', String(filters.budgetMax));
    if (isAppend && cursor) params.set('cursor', cursor);
    params.set('limit', '20');

    try {
      const res = await fetch(`/api/gifts/feed?${params}`);
      if (!res.ok) throw new Error('Feed load failed');
      const data = await res.json();

      if (isAppend) {
        setItems((prev) => [...prev, ...(data.items || [])]);
      } else {
        setItems(data.items || []);
        setModules(data.modules || []);
        if (unfiltered) {
          const moduleItems = (data.modules || []).reduce(
            (sum: number, mod: Module) => sum + (mod.items?.length || 0),
            0,
          );
          setCatalogEmpty((data.items || []).length === 0 && moduleItems === 0);
        }
      }
      setCursor(data.nextCursor);
    } catch (err) {
      console.error('Gift feed failed to load', err);
      setFeedError(true);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, cursor]);

  // Reload on filter change
  useEffect(() => {
    setCursor(null);
    loadFeed(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Track interaction
  const handleTrack = async (productId: string, type: string) => {
    try {
      await fetch('/api/gifts/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, interactionType: type }),
      });
    } catch {
      // non-critical
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark,var(--primary))] flex items-center justify-center">
            <Gift className="h-5 w-5 text-[var(--primary-foreground)]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">{t('title')}</h1>
            <p className="text-sm text-[var(--text-muted)]">{t('subtitle')}</p>
          </div>
        </div>

        {/* AI Wizard and filters only when there is a catalogue to search. */}
        {!catalogEmpty && (
          <div className="mb-6">
            <AIGiftWizard />
          </div>
        )}

        {/* Filters */}
        {!catalogEmpty && (
        <div className="mb-6">
          <GiftFilters
            categories={categories}
            occasions={occasions}
            personas={personas}
            selectedCategory={filters.category}
            selectedOccasion={filters.occasion}
            selectedPersona={filters.persona}
            budgetMin={filters.budgetMin}
            budgetMax={filters.budgetMax}
            onFilterChange={setFilters}
          />
        </div>
        )}

        {/* Feed modules */}
        {modules.map((mod) => (
          <GiftFeedSection
            key={mod.id}
            title={mod.title}
            items={mod.items}
            onTrack={handleTrack}
          />
        ))}

        {/* Main feed */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : feedError ? (
          <div role="alert" className="text-center py-20">
            <p className="text-lg font-medium text-[var(--text)]">{t('loadError')}</p>
            <button
              type="button"
              onClick={() => loadFeed(false)}
              className="mt-3 text-sm font-medium text-[var(--primary)] underline underline-offset-2"
            >
              {t('retry')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Gift className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-3" aria-hidden="true" />
            {catalogEmpty ? (
              <>
                <p className="text-lg font-medium text-[var(--text)]">{t('emptyCatalog.title')}</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {t('emptyCatalog.body')}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-[var(--text)]">{t('noMatches')}</p>
                <button
                  type="button"
                  onClick={() => setFilters({})}
                  className="mt-2 text-sm font-medium text-[var(--primary)] underline underline-offset-2"
                >
                  {t('clearFilters')}
                </button>
              </>
            )}
            <div className="mt-5">
              <Link
                href="/campaigns"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-semibold hover:bg-[var(--primary-hover)]"
              >
                {t('browseCampaigns')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">{t('allGifts')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((item) => (
                <GiftCard key={item.id} {...item} onTrack={handleTrack} />
              ))}
            </div>

            {/* Load more */}
            {cursor && (
              <div className="flex justify-center mt-8">
                <button
                  type="button"
                  onClick={() => loadFeed(true)}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:border-[var(--primary)] transition-all disabled:opacity-50"
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('loadMore')
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
