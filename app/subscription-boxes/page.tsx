'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { WarmButton } from '@/components/warm-button';
import { showSuccess, showError } from '@/lib/toast-helpers';

interface PublicBox {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  merchantName: string;
  merchantSlug: string;
}

export default function PublicSubscriptionBoxesPage() {
  const [boxes, setBoxes] = useState<PublicBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subscription-boxes')
      .then((r) => r.json())
      .then((data) => setBoxes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatPrice = (cents: number, currency: string) => {
    try {
      return new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100);
    } catch {
      return `${(cents / 100).toFixed(2)} ${currency}`;
    }
  };

  const handleSubscribe = async (boxId: string) => {
    const res = await fetch(`/api/subscription-boxes/${boxId}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.status === 401) {
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (res.ok) {
      showSuccess('You are now subscribed. Check your email for details.', 'Subscribed');
    } else {
      const data = await res.json().catch(() => ({}));
      showError(data.error || 'Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] [background-image:var(--gradient-mesh-1),var(--gradient-mesh-3)]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text)] mb-3">Subscription Boxes</h1>
          <p className="text-[var(--text-muted)] text-lg max-w-2xl mx-auto">
            Receive curated vouchers delivered to you on a recurring basis from top merchants.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-[3px] border-[var(--primary)] border-t-transparent rounded-full" />
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--text-muted)] text-lg">No subscription boxes available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {boxes.map((box) => (
              <div
                key={box.id}
                className="group bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 transition-all duration-300 ease-spring"
              >
                <div className="bg-[var(--accent)] p-6">
                  <div className="w-12 h-12 rounded-[var(--r-sm)] gradient-brand flex items-center justify-center mb-4 shadow-[var(--shadow-sm)]">
                    <Package className="h-6 w-6 text-[var(--primary-foreground)]" />
                  </div>
                  <Link href={`/subscription-boxes/${box.id}`} className="block">
                    <h3 className="text-xl font-bold text-[var(--text)] mb-1 group-hover:text-[var(--primary-hover)] transition-colors">
                      {box.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-[var(--text-muted)]">by {box.merchantName}</p>
                </div>
                <div className="p-6">
                  {box.description && <p className="text-sm text-[var(--text-muted)] mb-4 line-clamp-2">{box.description}</p>}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-2xl font-bold text-[var(--text)]">{formatPrice(box.priceCents, box.currency)}</span>
                      <span className="text-sm text-[var(--text-muted)]">/{box.interval}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/subscription-boxes/${box.id}`}
                        className="text-sm font-medium text-[var(--primary-hover)] hover:underline"
                      >
                        Details
                      </Link>
                      <WarmButton size="sm" onClick={() => handleSubscribe(box.id)}>
                        Subscribe
                      </WarmButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
