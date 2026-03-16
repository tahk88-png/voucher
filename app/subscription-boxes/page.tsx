'use client';

import { useEffect, useState } from 'react';

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
      alert('Subscribed successfully!');
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to subscribe');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#2D2721] mb-3">Subscription Boxes</h1>
          <p className="text-[#6b5e52] text-lg max-w-2xl mx-auto">
            Receive curated vouchers delivered to you on a recurring basis from top merchants.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-[#FFC857] border-t-transparent rounded-full" />
          </div>
        ) : boxes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#6b5e52] text-lg">No subscription boxes available yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {boxes.map((box) => (
              <div key={box.id} className="bg-white rounded-2xl border border-[#e8e0d8] overflow-hidden hover:shadow-lg transition">
                <div className="bg-gradient-to-br from-[#FFC857]/20 to-[#FFB627]/10 p-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFC857] to-[#FFB627] flex items-center justify-center mb-4">
                    <svg className="h-6 w-6 text-[#2D2721]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[#2D2721] mb-1">{box.name}</h3>
                  <p className="text-sm text-[#6b5e52]">by {box.merchantName}</p>
                </div>
                <div className="p-6">
                  {box.description && <p className="text-sm text-[#6b5e52] mb-4">{box.description}</p>}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-[#b8860b]">{formatPrice(box.priceCents, box.currency)}</span>
                      <span className="text-sm text-[#6b5e52]">/{box.interval}</span>
                    </div>
                    <button
                      onClick={() => handleSubscribe(box.id)}
                      className="bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721] font-semibold py-2 px-5 rounded-xl shadow-md hover:opacity-90 transition"
                    >
                      Subscribe
                    </button>
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
