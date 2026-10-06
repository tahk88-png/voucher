'use client';

import { useState, useEffect, useCallback } from 'react';
import { WarmCard } from '@/components/warm-card';
import { TrendChart } from '@/components/analytics/trend-chart';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Period = 'day' | 'week' | 'month' | 'quarter' | 'year';
type Metric = 'revenue' | 'redemptions' | 'purchases' | 'referrals' | 'customers';

interface ComparisonData {
  metric: Metric;
  period: Period;
  current: number;
  previous: number;
  changePercent: number;
  trend: 'up' | 'down' | 'flat';
  sparkline: Array<{ date: string; value: number }>;
}

interface PeriodComparisonProps {
  slug: string;
  defaultMetric?: Metric;
  defaultPeriod?: Period;
}

const PERIODS: Period[] = ['day', 'week', 'month', 'quarter', 'year'];

const METRICS: Metric[] = ['revenue', 'redemptions', 'purchases', 'referrals', 'customers'];

export function PeriodComparison({ slug, defaultMetric = 'revenue', defaultPeriod = 'month' }: PeriodComparisonProps) {
  const t = useTranslations('dsComponents.periodComparison');
  const [metric, setMetric] = useState<Metric>(defaultMetric);
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/merchant/${slug}/analytics/compare?metric=${metric}&period=${period}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [slug, metric, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatValue = (val: number) => {
    if (metric === 'revenue') return `${val.toFixed(2)}`;
    return val.toLocaleString();
  };

  return (
    <WarmCard padding="lg" className="bg-white">
      {/* Header with selectors */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-lg font-semibold text-[var(--text)]">{t('title')}</h3>
        <div className="flex gap-2">
          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-white text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
          >
            {METRICS.map((m) => (
              <option key={m} value={m}>{t(`metric.${m}`)}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-white text-[var(--text-muted)] hover:bg-[var(--surface-dim)]'
                }`}
              >
                {t(`period.${p}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">
          {t('loading')}
        </div>
      ) : data ? (
        <div className="space-y-4">
          {/* Main stat */}
          <div className="flex items-end gap-4">
            <div>
              <div className="text-3xl font-bold text-[var(--text)]">
                {formatValue(data.current)}
              </div>
              <div className="text-sm text-[var(--text-muted)]">
                {t('previous', { value: formatValue(data.previous) })}
              </div>
            </div>

            {/* Change badge */}
            <div
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
                data.trend === 'up'
                  ? 'bg-green-50 text-green-700'
                  : data.trend === 'down'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              {data.trend === 'up' ? (
                <TrendingUp className="h-4 w-4" />
              ) : data.trend === 'down' ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
              {data.changePercent > 0 ? '+' : ''}{data.changePercent}%
            </div>
          </div>

          {/* Sparkline */}
          {data.sparkline && data.sparkline.length > 0 && (
            <div className="mt-4">
              <TrendChart
                data={data.sparkline}
                height={100}
                color={data.trend === 'up' ? '#16a34a' : data.trend === 'down' ? '#dc2626' : '#6b7280'}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-[var(--text-muted)] text-center py-8">
          {t('noData')}
        </div>
      )}
    </WarmCard>
  );
}
