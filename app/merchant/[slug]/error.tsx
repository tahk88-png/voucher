'use client';

import { useEffect } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';
import Link from 'next/link';

export default function MerchantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Merchant panel error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-white">
        <h1 className="text-xl font-semibold text-[#2D2721]">Something went wrong</h1>
        <p className="text-sm text-[#6B5744] mt-2">
          An error occurred in the merchant panel.
        </p>
        <div className="mt-4 flex gap-2 justify-center">
          <WarmButton onClick={reset}>Try again</WarmButton>
          <WarmButton variant="outline" asChild>
            <Link href="/merchant">Back to merchants</Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
