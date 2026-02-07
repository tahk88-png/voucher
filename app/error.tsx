'use client';

import { useEffect } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Route error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-white">
        <h1 className="text-xl font-semibold text-[#2D2721]">Something went wrong</h1>
        <p className="text-sm text-[#6B5744] mt-2">
          An error occurred while loading this page.
        </p>
        <div className="mt-4">
          <WarmButton onClick={reset}>Try again</WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
