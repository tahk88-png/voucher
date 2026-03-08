'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

interface GiftCardData {
  id: string;
  amount: number;
  currency: string;
  price: number | null;
  designJson: {
    headline?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
  } | null;
  message: string | null;
  imageUrl: string | null;
  logoUrl: string | null;
  validTo: string | null;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export default function GiftCardPurchasePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [giftCard, setGiftCard] = useState<GiftCardData | null>(null);
  const [merchantName, setMerchantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');

  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        // Fetch gift card details directly
        const res = await fetch(`/api/gift-cards/${id}/details`);
        if (!res.ok) {
          setError('Gift card not found or not available for purchase');
          return;
        }
        const data = await res.json();
        setGiftCard(data.giftCard);
        setMerchantName(data.merchantName);
        if (data.giftCard.message) {
          setMessage(data.giftCard.message);
        }
      } catch {
        setError('Failed to load gift card');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handlePurchase() {
    setPurchasing(true);
    setError('');

    try {
      const res = await fetch(`/api/gift-cards/${id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: recipientEmail || undefined,
          recipientName: recipientName || undefined,
          senderName: senderName || undefined,
          message: message || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Purchase failed');
        setPurchasing(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setPurchasing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
        <div className="animate-pulse text-[#8B7355]">Loading...</div>
      </div>
    );
  }

  if (!giftCard) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
        <WarmCard padding="lg" className="max-w-md w-full text-center">
          <p className="text-[#6B5744]">{error || 'Gift card not available'}</p>
        </WarmCard>
      </div>
    );
  }

  const design = giftCard.designJson;
  const headline = design?.headline || 'Gift Card';
  const displayPrice = giftCard.price ?? giftCard.amount;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FFFBF5] via-[#FFF9ED] to-[#FFE5B4]">
      <WarmCard padding="lg" className="max-w-lg w-full bg-white">
        <h1 className="text-xl font-semibold text-[#2D2721] mb-4">Purchase Gift Card</h1>

        {/* Gift card preview */}
        <div
          className="rounded-2xl border border-[rgba(139,115,85,0.15)] overflow-hidden mb-6"
          style={{
            backgroundColor: design?.backgroundColor || '#fff8e6',
            color: design?.textColor || '#1f2937',
          }}
        >
          {giftCard.imageUrl && (
            <div className="relative h-36 w-full overflow-hidden bg-[#FAF7F2]">
              <Image
                src={giftCard.imageUrl}
                alt="Gift card"
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{headline}</h3>
              {giftCard.logoUrl && (
                <Image
                  src={giftCard.logoUrl}
                  alt="Brand"
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                  unoptimized
                />
              )}
            </div>
            <p className="text-2xl font-semibold" style={{ color: design?.accentColor || '#f4b400' }}>
              {formatCurrency(giftCard.amount, giftCard.currency)}
            </p>
            <p className="text-xs text-[#6B5744]">from {merchantName}</p>
          </div>
        </div>

        {/* Purchase form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#2D2721] mb-1">Recipient email (optional)</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="Send gift card to this email"
              className="w-full rounded-lg border border-[rgba(139,115,85,0.2)] bg-white px-3 py-2 text-sm text-[#2D2721] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#f4b400]/40"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#2D2721] mb-1">Recipient name</label>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="To"
                className="w-full rounded-lg border border-[rgba(139,115,85,0.2)] bg-white px-3 py-2 text-sm text-[#2D2721] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#f4b400]/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2D2721] mb-1">Your name</label>
              <input
                type="text"
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                placeholder="From"
                className="w-full rounded-lg border border-[rgba(139,115,85,0.2)] bg-white px-3 py-2 text-sm text-[#2D2721] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#f4b400]/40"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2D2721] mb-1">Personal message (optional)</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a personal message..."
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-[rgba(139,115,85,0.2)] bg-white px-3 py-2 text-sm text-[#2D2721] placeholder:text-[#8B7355]/50 focus:outline-none focus:ring-2 focus:ring-[#f4b400]/40 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-sm text-[#6B5744]">Total:</span>
              <span className="ml-2 text-lg font-semibold text-[#2D2721]">
                {formatCurrency(displayPrice, giftCard.currency)}
              </span>
            </div>
            <WarmButton
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? 'Processing...' : 'Buy Gift Card'}
            </WarmButton>
          </div>
        </div>
      </WarmCard>
    </div>
  );
}
