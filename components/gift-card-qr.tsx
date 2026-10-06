/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function GiftCardQr({ qrText }: { qrText: string }) {
  const t = useTranslations('giftsPages.qr');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

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
      } catch {
        if (isMounted) {
          setError(true);
        }
      }
    }
    fetchQr();
    return () => {
      isMounted = false;
    };
  }, [qrText]);

  if (error) {
    return <p className="text-sm text-[var(--danger)]">{t('error')}</p>;
  }

  if (!dataUrl) {
    return <p className="text-sm text-[var(--text-muted)]">{t('generating')}</p>;
  }

  return <img src={dataUrl} alt={t('alt')} className="h-40 w-40" />;
}
