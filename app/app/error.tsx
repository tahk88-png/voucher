'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[App Error]', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-8">
      <WarmCard padding="lg" className="w-full max-w-md bg-white">
        <h1 className="text-lg font-semibold text-[#2D2721]">Something went wrong</h1>
        <p className="text-sm text-[#6B5744] mt-2">
          The portal failed to load. Please refresh the page or try again later.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <WarmButton onClick={reset}>Try again</WarmButton>
          <WarmButton variant="outline" asChild>
            <Link href="/app">Back to portal</Link>
          </WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
