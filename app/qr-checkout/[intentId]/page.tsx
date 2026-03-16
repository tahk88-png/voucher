'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

interface IntentData {
  intentId: string;
  status: string;
  merchant?: { name: string; slug: string };
  voucher?: { id: string; type: string; value: number; currency: string } | null;
  checkoutUrl?: string;
}

export default function QRCheckoutPage() {
  const { intentId } = useParams<{ intentId: string }>();
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get('status');

  const [intent, setIntent] = useState<IntentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(urlStatus === 'success');

  useEffect(() => {
    fetch(`/api/qr-checkout/${intentId}`)
      .then((r) => r.json())
      .then((data) => setIntent(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [intentId]);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`/api/qr-checkout/${intentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      if (res.ok) setConfirmed(true);
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5]">
        <div className="animate-spin h-8 w-8 border-4 border-[#FFC857] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#2D2721] mb-2">Checkout Complete</h1>
          <p className="text-[#6b5e52]">Your purchase has been confirmed. Check your email for details.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8f5] p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#FFC857] to-[#FFB627] p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#2D2721]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6h-2.18c.11-.31.18-.65.18-1a3 3 0 0 0-3-3c-1.05 0-1.95.56-2.5 1.38L12 4l-.5-.62A2.988 2.988 0 0 0 9 2 3 3 0 0 0 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#2D2721]">QR Checkout</h1>
          {intent?.merchant && (
            <p className="text-[#2D2721]/70 mt-1">{intent.merchant.name}</p>
          )}
        </div>

        {/* Details */}
        <div className="p-6">
          {intent?.voucher && (
            <div className="bg-[#faf8f5] rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#6b5e52]">Voucher</span>
                <span className="font-semibold text-[#2D2721]">
                  {intent.voucher.type === 'percentage'
                    ? `${intent.voucher.value / 100}%`
                    : `${(intent.voucher.value / 100).toFixed(2)} ${intent.voucher.currency}`}
                </span>
              </div>
            </div>
          )}

          {intent?.checkoutUrl ? (
            <a
              href={intent.checkoutUrl}
              className="block w-full text-center bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721] font-semibold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition"
            >
              Pay Now
            </a>
          ) : (
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-gradient-to-r from-[#FFC857] to-[#FFB627] text-[#2D2721] font-semibold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50"
            >
              {confirming ? 'Confirming...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
