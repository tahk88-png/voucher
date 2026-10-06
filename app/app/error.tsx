'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import { useTranslations } from 'next-intl';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('portal.error');
  const tCommon = useTranslations('common');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[App Error]', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <WarmCard padding="lg" className="w-full max-w-md bg-white">
        <h1 className="text-lg font-semibold text-[#2D2721]">{t('title')}</h1>
        <p className="text-sm text-[#6B5744] mt-2">
          {t('description')}
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <WarmButton onClick={reset}>{tCommon('tryAgain')}</WarmButton>
          <WarmButton variant="outline" asChild>
            <Link href="/app">{t('backToPortal')}</Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
