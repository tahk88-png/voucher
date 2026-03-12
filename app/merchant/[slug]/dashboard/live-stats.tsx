'use client';

import { useMerchantSSE } from '@/hooks/use-merchant-sse';
import { Activity } from 'lucide-react';

interface LiveStatsProps {
  slug: string;
  /** Initial server-rendered value shown before SSE connects */
  initialToday?: number;
  initialPending?: number;
}

export function LiveStats({ slug, initialToday = 0, initialPending = 0 }: LiveStatsProps) {
  const { stats, connected } = useMerchantSSE(slug);

  const today = stats?.today ?? initialToday;
  const pending = stats?.pending ?? initialPending;

  return (
    <div className="flex items-center gap-4 text-sm">
      {/* Live indicator */}
      <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
          }`}
        />
        {connected ? 'Live' : 'Connecting…'}
      </span>

      {/* Today's redemptions */}
      <div className="flex items-center gap-1.5">
        <Activity className="h-4 w-4 text-[var(--primary)]" />
        <span className="font-semibold text-[var(--text-primary)]">{today}</span>
        <span className="text-[var(--text-secondary)]">täna lunastatud</span>
      </div>

      {/* Pending */}
      {pending > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
            {pending}
          </span>
          <span className="text-[var(--text-secondary)]">ootel</span>
        </div>
      )}
    </div>
  );
}
