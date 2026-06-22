'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Gift, Plus, Loader2, Pencil, Trash2, Eye, EyeOff,
  ArrowLeft, Package, TrendingUp,
} from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { showConfirm } from '@/lib/confirm-helpers';

interface GiftProduct {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  mediaUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;
  purchaseCount: number;
  engagementScore: number;
  conversionRate: number;
  category: { id: string; name: string; slug: string };
  occasions: { id: string; name: string; slug: string }[];
  personas: { id: string; name: string; slug: string }[];
  createdAt: string;
}

export default function MerchantGiftsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<GiftProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/merchant/${slug}/gifts`)
      .then((r) => r.ok ? r.json() : { products: [] })
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const res = await fetch(`/api/merchant/${slug}/gifts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p)));
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm('Are you sure? This will deactivate the product.', async () => {
      const res = await fetch(`/api/merchant/${slug}/gifts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)));
      }
    }, { variant: 'destructive' });
    return;
  };

  const activeCount = products.filter((p) => p.isActive).length;
  const totalViews = products.reduce((s, p) => s + p.viewCount, 0);
  const totalPurchases = products.reduce((s, p) => s + p.purchaseCount, 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-4">
      <div className="container mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text)]">Gift Products</h1>
            <p className="text-sm text-[var(--text-muted)]">Manage your products in the Gift Hub</p>
          </div>
          <WarmButton asChild variant="outline" size="sm">
            <Link href={`/merchant/${slug}/dashboard`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
            </Link>
          </WarmButton>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-4 mb-6">
          {[
            { label: 'Total', value: products.length, icon: Package },
            { label: 'Active', value: activeCount, icon: Eye },
            { label: 'Views', value: totalViews, icon: TrendingUp },
            { label: 'Purchases', value: totalPurchases, icon: Gift },
          ].map((s) => (
            <WarmCard key={s.label} padding="md" className="bg-[var(--surface)]">
              <div className="flex items-center gap-2">
                <s.icon className="h-4 w-4 text-[var(--text-faint)]" />
                <span className="text-xs font-medium text-[var(--text-faint)]">{s.label}</span>
              </div>
              <p className="text-xl font-bold text-[var(--text)] mt-1">{s.value}</p>
            </WarmCard>
          ))}
        </div>

        {/* Product list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#cc785c]" />
          </div>
        ) : products.length === 0 ? (
          <WarmCard padding="xl" className="bg-[var(--surface)] text-center">
            <Gift className="h-12 w-12 mx-auto text-[var(--text-faint)] mb-3" />
            <h2 className="text-lg font-semibold text-[var(--text)]">No gift products yet</h2>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Add your first product to appear in the Gift Hub feed.
            </p>
            <p className="text-xs text-[var(--text-faint)]">
              Use the API at <code className="bg-gray-100 px-1.5 py-0.5 rounded">POST /api/merchant/{slug}/gifts</code> to create products.
            </p>
          </WarmCard>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <WarmCard key={p.id} padding="md" className="bg-[var(--surface)]">
                <div className="flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-[#FAF7F2] shrink-0">
                    {p.mediaUrl ? (
                      <Image fill src={p.mediaUrl} alt={p.title} className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-[var(--text-faint)] opacity-30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--text)] truncate">{p.title}</h3>
                      {!p.isActive && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#f5ddd7] text-[#a23a28] font-medium">
                          Inactive
                        </span>
                      )}
                      {p.isFeatured && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#f3e7cc] text-[#8a6420] font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-faint)] mt-1">
                      <span>€{(p.priceCents / 100).toFixed(2)}</span>
                      <span>{p.category.name}</span>
                      <span>{p.viewCount} views</span>
                      <span>{p.purchaseCount} purchases</span>
                      <span>{(p.conversionRate * 100).toFixed(1)}% CVR</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <WarmButton
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(p.id, p.isActive)}
                      title={p.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {p.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </WarmButton>
                    <WarmButton
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(p.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-[#c84b36]" />
                    </WarmButton>
                  </div>
                </div>
              </WarmCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
