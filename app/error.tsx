'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('site.error');
  const tCommon = useTranslations('common');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Route error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-[var(--surface)]">
        <h1 className="text-xl font-semibold text-[var(--text)]">{t('title')}</h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          {t('description')}
        </p>
        <div className="mt-4">
          <WarmButton onClick={reset}>{tCommon('tryAgain')}</WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
