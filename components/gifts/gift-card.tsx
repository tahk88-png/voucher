'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ExternalLink, ShoppingCart } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface GiftCardProps {
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
  onTrack?: (productId: string, type: string) => void;
}

export function GiftCard({
  id,
  title,
  description,
  priceCents,
  currency,
  mediaUrl,
  merchantName,
  categoryName,
  tags,
  affiliateUrl,
  isFeatured,
  feedModule,
  onTrack,
}: GiftCardProps) {
  const [saved, setSaved] = useState(false);

  const price = (priceCents / 100).toFixed(2);
  const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency;

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSaved(!saved);
    onTrack?.(id, saved ? 'VIEW' : 'SAVE');
  };

  const handleAffiliateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTrack?.(id, 'CLICK_AFFILIATE');
  };

  return (
    <Link href={`/gifts/${id}`} onClick={() => onTrack?.(id, 'VIEW')}>
      <WarmCard hover padding="none" className="overflow-hidden group cursor-pointer h-full">
        {/* Image */}
        <div className="relative aspect-square bg-[var(--surface-dim)] overflow-hidden">
          {mediaUrl ? (
            <Image
              fill
              src={mediaUrl}
              alt={title}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
              <ShoppingCart className="h-12 w-12 opacity-30" />
            </div>
          )}

          {/* Featured badge */}
          {isFeatured && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)]">
              Featured
            </span>
          )}

          {/* Feed module badge */}
          {feedModule && (
            <span className="absolute top-2 right-10 px-2 py-0.5 rounded-full text-xs bg-[var(--surface)]/80 text-[var(--text-muted)] backdrop-blur-sm">
              {feedModule}
            </span>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            aria-label={saved ? 'Unsave' : 'Save'}
            aria-pressed={saved}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                saved ? 'fill-red-500 text-red-500' : 'text-[var(--text-muted)]'
              )}
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--text-muted)] truncate">{merchantName}</p>
              <h3 className="font-semibold text-sm text-[var(--text)] line-clamp-2 mt-0.5">{title}</h3>
            </div>
            <span className="text-sm font-bold text-[var(--primary)] whitespace-nowrap">
              {currencySymbol}{price}
            </span>
          </div>

          <p className="text-xs text-[var(--text-muted)] line-clamp-2 mt-1">{description}</p>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--surface-dim)] text-[var(--text-muted)]">
              {categoryName}
            </span>
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--accent)]/30 text-[var(--text-muted)]">
                {tag}
              </span>
            ))}
          </div>

          {affiliateUrl && (
            <a
              href={affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAffiliateClick}
              className="flex items-center gap-1 mt-2 text-xs text-[var(--primary)] hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> Buy now
            </a>
          )}
        </div>
      </WarmCard>
    </Link>
  );
}
