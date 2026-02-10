/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';

export default function GiftCardQr({ qrText }: { qrText: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchQr() {
      try {
        const res = await fetch(`/api/qr?text=${encodeURIComponent(qrText)}`);
        if (!res.ok) {
          throw new Error('Failed to generate QR code');
        }
        const data = await res.json();
        if (isMounted) {
          setDataUrl(data.dataUrl);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to generate QR code');
        }
      }
    }
    fetchQr();
    return () => {
      isMounted = false;
    };
  }, [qrText]);

  if (error) {
    return <p className="text-sm text-[var(--danger)]">{error}</p>;
  }

  if (!dataUrl) {
    return <p className="text-sm text-[var(--text-muted)]">Generating QR...</p>;
  }

  return <img src={dataUrl} alt="QR code" className="h-40 w-40" />;
}
