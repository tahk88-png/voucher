'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';

interface WishlistButtonProps {
  voucherId?: string;
  campaignId?: string;
  merchantId?: string;
}

export function WishlistButton({ voucherId, campaignId, merchantId }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/wishlist');
        if (!res.ok) return;
        const data = await res.json();
        const found = data.items.some(
          (item: { voucherId?: string; campaignId?: string; merchantId?: string }) =>
            (voucherId && item.voucherId === voucherId) ||
            (campaignId && item.campaignId === campaignId) ||
            (merchantId && item.merchantId === merchantId)
        );
        setWishlisted(found);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [voucherId, campaignId, merchantId]);

  async function toggle() {
    if (loading) return;
    setLoading(true);
    setAnimating(true);

    try {
      if (wishlisted) {
        await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucherId, campaignId, merchantId }),
        });
        setWishlisted(false);
      } else {
        await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucherId, campaignId, merchantId }),
        });
        setWishlisted(true);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setTimeout(() => setAnimating(false), 300);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading && !animating}
      className="relative p-2 rounded-full transition-all hover:scale-110"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        size={20}
        className={`transition-all duration-300 ${animating ? 'scale-125' : 'scale-100'}`}
        style={{
          color: wishlisted ? 'var(--destructive)' : 'var(--text-secondary)',
          fill: wishlisted ? 'var(--destructive)' : 'transparent',
        }}
        strokeWidth={2}
      />
    </button>
  );
}
