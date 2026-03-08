'use client';

import { GiftCard } from './gift-card';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface FeedItem {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  mediaUrl: string | null;
  merchantName: string;
  merchantSlug: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  affiliateUrl: string | null;
  isFeatured: boolean;
  score?: number;
  feedModule?: string;
}

interface GiftFeedSectionProps {
  title: string;
  subtitle?: string;
  items: FeedItem[];
  viewAllHref?: string;
  onTrack?: (productId: string, type: string) => void;
}

export function GiftFeedSection({ title, subtitle, items, viewAllHref, onTrack }: GiftFeedSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text)]">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-sm text-[var(--primary)] font-medium flex items-center gap-0.5 hover:underline"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {items.map((item) => (
          <GiftCard key={item.id} {...item} onTrack={onTrack} />
        ))}
      </div>
    </section>
  );
}
