'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Heart, Share2, ShoppingCart, ExternalLink, Gift,
  Loader2, Tag, MapPin, Sparkles,
} from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';

interface Product {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  mediaUrl: string | null;
  mediaUrls: string[];
  tags: string[];
  affiliateUrl: string | null;
  isFeatured: boolean;
  stock: number | null;
  viewCount: number;
  purchaseCount: number;
  engagementScore: number;
  merchant: { id: string; name: string; slug: string; brandLogoUrl: string | null };
  category: { id: string; name: string; slug: string; icon: string | null; color: string | null };
  occasions: { id: string; name: string; slug: string }[];
  personas: { id: string; name: string; slug: string }[];
}

interface Upsell {
  productId: string;
  title: string;
  priceCents: number;
  reason: string;
  score: number;
}

export default function GiftProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!productId) return;

    const load = async () => {
      try {
        const res = await fetch(`/api/gifts/${productId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setProduct(data);

        // Track view
        fetch('/api/gifts/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, interactionType: 'VIEW' }),
        }).catch(() => {});

        // Load upsells
        fetch('/api/gifts/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId, limit: 3 }),
        })
          .then((r) => r.ok ? r.json() : { suggestions: [] })
          .then((d) => setUpsells(d.suggestions || []))
          .catch(() => {});
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [productId]);

  const handleSave = () => {
    setSaved(!saved);
    fetch('/api/gifts/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, interactionType: saved ? 'VIEW' : 'SAVE' }),
    }).catch(() => {});
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product?.title, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
    }
    fetch('/api/gifts/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, interactionType: 'SHARE' }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center gap-4">
        <Gift className="h-12 w-12 text-[var(--text-muted)]" />
        <p className="text-lg font-medium text-[var(--text)]">Gift not found</p>
        <WarmButton variant="outline" onClick={() => router.push('/gifts')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Gift Hub
        </WarmButton>
      </div>
    );
  }

  const price = (product.priceCents / 100).toFixed(2);
  const currencySymbol = product.currency === 'EUR' ? '€' : product.currency === 'USD' ? '$' : product.currency;

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* Back nav */}
        <Link href="/gifts" className="inline-flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Gift Hub
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image gallery */}
          <div>
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--surface-dim)]">
              {product.mediaUrl ? (
                <Image fill src={product.mediaUrl} alt={product.title} className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-16 w-16 text-[var(--text-muted)] opacity-30" />
                </div>
              )}
            </div>
            {product.mediaUrls.length > 1 && (
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {product.mediaUrls.map((url, i) => (
                  <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[var(--border)]">
                    <Image fill src={url} alt={`${product.title} ${i + 1}`} className="object-cover" sizes="64px" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {product.isFeatured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--primary)] text-[var(--primary-foreground)] mb-2">
                <Sparkles className="h-3 w-3" /> Featured
              </span>
            )}

            <h1 className="text-2xl font-bold text-[var(--text)]">{product.title}</h1>

            <div className="flex items-center gap-2 mt-2 text-sm text-[var(--text-muted)]">
              <MapPin className="h-3.5 w-3.5" />
              <Link href={`/p/${product.merchant.slug}`} className="hover:text-[var(--primary)]">
                {product.merchant.name}
              </Link>
            </div>

            <p className="text-3xl font-bold text-[var(--primary)] mt-4">
              {currencySymbol}{price}
            </p>

            <p className="text-sm text-[var(--text-muted)] mt-4 leading-relaxed">{product.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href={`/gifts?category=${product.category.slug}`}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--surface-dim)] text-[var(--text)] hover:bg-[var(--accent)] transition-colors"
              >
                {product.category.icon} {product.category.name}
              </Link>
              {product.occasions.map((o) => (
                <Link
                  key={o.id}
                  href={`/gifts?occasion=${o.slug}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/30 text-[var(--text-muted)] hover:bg-[var(--accent)] transition-colors"
                >
                  {o.name}
                </Link>
              ))}
              {product.personas.map((p) => (
                <span key={p.id} className="px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {p.name}
                </span>
              ))}
              {product.tags.map((tag) => (
                <span key={tag} className="px-2 py-1 rounded-full text-[10px] bg-gray-100 text-gray-500">
                  <Tag className="h-2.5 w-2.5 inline mr-0.5" />{tag}
                </span>
              ))}
            </div>

            {/* Stock */}
            {product.stock !== null && product.stock <= 10 && (
              <p className="text-sm text-red-600 font-medium mt-3">
                Only {product.stock} left in stock
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-6">
              {product.affiliateUrl ? (
                <WarmButton
                  fullWidth
                  onClick={() => {
                    fetch('/api/gifts/track', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId, interactionType: 'CLICK_AFFILIATE' }),
                    }).catch(() => {});
                    window.open(product.affiliateUrl!, '_blank');
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" /> Buy Now
                </WarmButton>
              ) : (
                <WarmButton
                  fullWidth
                  onClick={() => {
                    fetch('/api/gifts/track', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId, interactionType: 'ADD_TO_CART' }),
                    }).catch(() => {});
                  }}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </WarmButton>
              )}

              <WarmButton variant="outline" size="icon" onClick={handleSave}>
                <Heart className={saved ? 'h-5 w-5 fill-red-500 text-red-500' : 'h-5 w-5'} />
              </WarmButton>

              <WarmButton variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </WarmButton>
            </div>
          </div>
        </div>

        {/* Upsells */}
        {upsells.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-[var(--text)] mb-4">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {upsells.map((u) => (
                <Link key={u.productId} href={`/gifts/${u.productId}`}>
                  <WarmCard hover padding="md" className="h-full">
                    <p className="font-medium text-sm text-[var(--text)]">{u.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{u.reason}</p>
                    <p className="text-sm font-bold text-[var(--primary)] mt-2">€{(u.priceCents / 100).toFixed(2)}</p>
                  </WarmCard>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
