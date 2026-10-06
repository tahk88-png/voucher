'use client';

import { useMerchantSSE } from '@/hooks/use-merchant-sse';
import { Activity } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LiveStatsProps {
  slug: string;
  /** Initial server-rendered value shown before SSE connects */
  initialToday?: number;
  initialPending?: number;
}

export function LiveStats({ slug, initialToday = 0, initialPending = 0 }: LiveStatsProps) {
  const { stats, connected } = useMerchantSSE(slug);
  const t = useTranslations('merchantDashboard.liveStats');

  const today = stats?.today ?? initialToday;
  const pending = stats?.pending ?? initialPending;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      {/* Live indicator */}
      <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
        <span
          className={`inline-block w-2 h-2 rounded-full ${
            connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
          }`}
        />
        {connected ? t('live') : t('connecting')}
      </span>

      {/* Today's redemptions */}
      <div className="flex items-center gap-1.5">
        <Activity className="h-4 w-4 text-[var(--primary)]" />
        {t.rich('redeemedToday', {
          count: today,
          value: (chunks) => <span className="font-semibold text-[var(--text)]">{chunks}</span>,
          label: (chunks) => <span className="text-[var(--text-muted)]">{chunks}</span>,
        })}
      </div>

      {/* Pending */}
      {pending > 0 && (
        <div className="flex items-center gap-1.5">
          {t.rich('pending', {
            count: pending,
            value: (chunks) => (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                {chunks}
              </span>
            ),
            label: (chunks) => <span className="text-[var(--text-muted)]">{chunks}</span>,
          })}
        </div>
      )}
    </div>
  );
}
