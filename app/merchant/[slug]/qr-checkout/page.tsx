'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface VoucherOption {
  id: string;
  type: string;
  value: number;
  currency: string;
  status: string;
}

export default function MerchantQRCheckoutPage() {
  const { slug } = useParams<{ slug: string }>();
  const [vouchers, setVouchers] = useState<VoucherOption[]>([]);
  const [selectedVoucher, setSelectedVoucher] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch(`/api/merchant/${slug}/vouchers`)
      .then((r) => r.json())
      .then((data) => setVouchers(Array.isArray(data) ? data : data.vouchers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const generateQR = async () => {
    setGenerating(true);
    try {
      const baseUrl = window.location.origin;
      const checkoutUrl = selectedVoucher
        ? `${baseUrl}/qr-checkout/new?merchant=${slug}&voucher=${selectedVoucher}`
        : `${baseUrl}/qr-checkout/new?merchant=${slug}`;

      const res = await fetch(`/api/qr?text=${encodeURIComponent(checkoutUrl)}`);
      const data = await res.json();
      setQrDataUrl(data.dataUrl);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#cc785c] to-[#b5613f] flex items-center justify-center shadow-lg">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">QR Instant Checkout</h1>
            <p className="text-[#6b5e52]">Generate QR codes for instant customer checkout</p>
          </div>
        </div>

        <div className="bg-[var(--surface)] rounded-2xl border border-[#e8e0d8] p-6 mb-6">
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Link to voucher (optional)
          </label>
          <select
            value={selectedVoucher}
            onChange={(e) => setSelectedVoucher(e.target.value)}
            className="w-full border border-[#e8e0d8] rounded-xl px-4 py-3 text-[var(--text)] bg-[#faf8f5] focus:outline-none focus:ring-2 focus:ring-[#cc785c] mb-4"
          >
            <option value="">General checkout (no specific voucher)</option>
            {vouchers.map((v) => (
              <option key={v.id} value={v.id}>
                {v.type} - {v.value / 100} {v.currency} ({v.status})
              </option>
            ))}
          </select>

          <button
            onClick={generateQR}
            disabled={generating || loading}
            className="w-full bg-gradient-to-r from-[#cc785c] to-[#b5613f] text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:opacity-90 transition disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>

        {qrDataUrl && (
          <div className="bg-[var(--surface)] rounded-2xl border border-[#e8e0d8] p-8 text-center print:border-none print:shadow-none">
            <Image src={qrDataUrl} alt="Checkout QR Code" width={240} height={240} unoptimized className="mx-auto mb-4" />
            <p className="text-sm text-[#6b5e52] mb-4">Scan to checkout</p>
            <button
              onClick={() => window.print()}
              className="text-sm text-[#cc785c] hover:underline font-medium"
            >
              Print QR Code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
