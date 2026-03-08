'use client';

import { useEffect } from 'react';
import { WarmButton } from '@/components/warm-button';
import { WarmCard } from '@/components/warm-card';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Admin panel error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <WarmCard padding="lg" className="max-w-md w-full text-center bg-white">
        <h1 className="text-xl font-semibold text-[#2D2721]">Admin Panel Error</h1>
        <p className="text-sm text-[#6B5744] mt-2">
          An error occurred while loading the admin panel.
        </p>
        <div className="mt-4">
          <WarmButton onClick={reset}>Try again</WarmButton>
        </div>
      </WarmCard>
    </div>
  );
}
