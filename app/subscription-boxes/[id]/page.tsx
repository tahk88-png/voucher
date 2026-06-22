'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { showSuccess, showError } from '@/lib/toast-helpers';

interface BoxItem {
  id: string;
  month: string;
  voucher: { id: string; type: string; value: number; currency: string } | null;
}

interface BoxDetail {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  currency: string;
  interval: string;
  maxItems: number;
  merchantName: string;
  merchantSlug: string;
  subscriberCount: number;
  items: BoxItem[];
}

function formatPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

function voucherLabel(v: NonNullable<BoxItem['voucher']>) {
  if (v.type === 'percentage') return `${v.value}% off voucher`;
  return `${formatPrice(v.value, v.currency)} voucher`;
}

function formatMonth(month: string) {
  // "2027-03" → "March 2027"
  const [y, m] = month.split('-').map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });
}

export default function SubscriptionBoxDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [box, setBox] = useState<BoxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/subscription-boxes/${id}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => data && setBox(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubscribe = async () => {
    if (!id) return;
    setSubscribing(true);
    try {
      const res = await fetch(`/api/subscription-boxes/${id}/subscribe`, {
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
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex justify-center py-16">
        <div className="animate-spin h-8 w-8 border-[3px] border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !box) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold text-[var(--text)] mb-2">Box not found</h1>
        <p className="text-[var(--text-muted)] mb-6">This subscription box is unavailable.</p>
        <Link href="/subscription-boxes" className="text-[var(--primary-hover)] font-semibold hover:underline">
          ← Browse all boxes
        </Link>
      </div>
    );
  }

  // Group items by delivery month.
  const byMonth = new Map<string, BoxItem[]>();
  for (const it of box.items) {
    byMonth.set(it.month, [...(byMonth.get(it.month) ?? []), it]);
  }
  const months = Array.from(byMonth.keys()).sort();

  return (
    <div className="min-h-screen bg-[var(--bg)] [background-image:var(--gradient-mesh-1),var(--gradient-mesh-3)]">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link href="/subscription-boxes" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          ← All subscription boxes
        </Link>

        <div className="mt-4 bg-[var(--surface)] rounded-[var(--r-xl)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-lg)]">
          <div className="bg-[var(--accent)] p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">{box.name}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">by {box.merchantName}</p>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-[var(--text)]">{formatPrice(box.priceCents, box.currency)}</span>
              <span className="text-[var(--text-muted)]">/{box.interval}</span>
            </div>
            {box.subscriberCount > 0 && (
              <p className="text-xs text-[var(--text-muted)] mt-1">{box.subscriberCount} subscriber{box.subscriberCount === 1 ? '' : 's'}</p>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {box.description && <p className="text-[var(--text-muted)] mb-6">{box.description}</p>}

            <h2 className="text-lg font-semibold text-[var(--text)] mb-3">What&apos;s inside</h2>
            {months.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                Up to {box.maxItems} curated voucher{box.maxItems === 1 ? '' : 's'} each {box.interval}. The next
                delivery is being curated.
              </p>
            ) : (
              <div className="space-y-5">
                {months.map((month) => (
                  <div key={month}>
                    <p className="text-sm font-medium text-[var(--text)] mb-2">{formatMonth(month)}</p>
                    <ul className="space-y-2">
                      {byMonth.get(month)!.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-center gap-3 p-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-dim)]"
                        >
                          <div className="w-8 h-8 rounded-[var(--r-xs)] gradient-brand flex items-center justify-center shrink-0">
                            <svg className="h-4 w-4 text-[var(--primary-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-[var(--text)]">
                            {it.voucher ? voucherLabel(it.voucher) : 'Curated voucher'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            <WarmButton
              onClick={handleSubscribe}
              isLoading={subscribing}
              fullWidth
              size="lg"
              className="mt-8"
            >
              {subscribing ? 'Subscribing…' : `Subscribe — ${formatPrice(box.priceCents, box.currency)}/${box.interval}`}
            </WarmButton>
          </div>
        </div>
      </div>
    </div>
  );
}
