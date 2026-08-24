'use client';

import { WarmButton } from '@/components/warm-button';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-[var(--danger)] text-xl">!</span>
        </div>
        <h2 className="text-xl font-semibold text-[var(--text)] mb-2">Couldn&apos;t load the hub</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          {error.message || 'An unexpected error occurred while loading merchants.'}
        </p>
        <WarmButton onClick={reset}>Try again</WarmButton>
      </div>
    </div>
  );
}
