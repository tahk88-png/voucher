'use client';

import { useEffect } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default function MerchantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('merchantDashboard.error');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Merchant panel error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-[var(--surface)]">
        <h1 className="text-xl font-semibold text-[var(--text)]">{t('title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {t('description')}
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <WarmButton onClick={reset}>{t('tryAgain')}</WarmButton>
          <WarmButton variant="outline" asChild>
            <Link href="/merchant">{t('backToMerchants')}</Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
