'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { BarChart3, RefreshCw, TrendingUp, Users, DollarSign, Activity, Download } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

type KPIs = {
  dau?: number;
  mau?: number;
  revenue?: number;
  churnRate?: number;
  newUsers?: number;
  activeVouchers?: number;
  redemptionsToday?: number;
  revenueGrowth?: number;
  [key: string]: any;
};

type RevenuePoint = {
  date: string;
  revenue: number;
  fees?: number;
  transactions?: number;
};

type CohortRow = {
  cohort: string;
  size: number;
  retention: number[];
};

function cents(n: number) {
  return `€${(n / 100).toLocaleString('et-EE', { minimumFractionDigits: 2 })}`;
}

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'kpis' | 'revenue' | 'cohorts'>('kpis');
  const [period, setPeriod] = useState('30d');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [kpisRes, revRes, cohortRes] = await Promise.allSettled([
        fetch(`/api/admin/analytics/kpis?period=${period}`),
        fetch(`/api/admin/analytics/revenue?period=${period}`),
        fetch(`/api/admin/analytics/cohorts?period=${period}`),
      ]);

      if (kpisRes.status === 'fulfilled' && kpisRes.value.ok) setKpis(await kpisRes.value.json());
      if (revRes.status === 'fulfilled' && revRes.value.ok) {
        const data = await revRes.value.json();
        setRevenue(data.data ?? data.revenue ?? data ?? []);
      }
      if (cohortRes.status === 'fulfilled' && cohortRes.value.ok) {
        const data = await cohortRes.value.json();
        setCohorts(data.cohorts ?? data.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function exportCsv() {
    const res = await fetch('/api/admin/analytics/export');
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const maxRevenue = revenue.length > 0 ? Math.max(...revenue.map(r => r.revenue)) : 1;

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Tagasi</WarmButton>
            </Link>
            <BarChart3 className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Platform Analytics</h1>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                {p}
              </button>
            ))}
            <WarmButton variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </WarmButton>
            <WarmButton variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </WarmButton>
          </div>
        </div>

        {/* KPI Summary Cards */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'DAU', value: kpis.dau?.toLocaleString() ?? '—', icon: Users, color: 'text-blue-500' },
              { label: 'MAU', value: kpis.mau?.toLocaleString() ?? '—', icon: Activity, color: 'text-green-500' },
              { label: 'Revenue', value: kpis.revenue != null ? cents(kpis.revenue) : '—', icon: DollarSign, color: 'text-emerald-500' },
              { label: 'Churn', value: kpis.churnRate != null ? pct(kpis.churnRate) : '—', icon: TrendingUp, color: 'text-red-500' },
              { label: 'Uued kasutajad', value: kpis.newUsers?.toLocaleString() ?? '—', icon: Users, color: 'text-purple-500' },
              { label: 'Aktiivsed voucherid', value: kpis.activeVouchers?.toLocaleString() ?? '—', icon: BarChart3, color: 'text-orange-500' },
              { label: 'Lunastused täna', value: kpis.redemptionsToday?.toLocaleString() ?? '—', icon: Activity, color: 'text-teal-500' },
              { label: 'Tulu kasv', value: kpis.revenueGrowth != null ? pct(kpis.revenueGrowth) : '—', icon: TrendingUp, color: 'text-indigo-500' },
            ].map(card => (
              <WarmCard key={card.label} padding="md">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{card.value}</p>
                  </div>
                  <card.icon className={`h-5 w-5 ${card.color} opacity-70`} />
                </div>
              </WarmCard>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {[
            { key: 'kpis' as const, label: 'KPIs detail' },
            { key: 'revenue' as const, label: 'Revenue' },
            { key: 'cohorts' as const, label: 'Cohorts' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <WarmCard>
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Laadin...</div>
          </WarmCard>
        ) : (
          <>
            {/* KPIs detail */}
            {tab === 'kpis' && (
              <WarmCard padding="lg">
                {!kpis ? (
                  <p className="text-[var(--text-secondary)]">KPI andmed puuduvad</p>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(kpis).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-[var(--border)] pb-2">
                        <span className="text-sm text-[var(--text-secondary)] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                          {typeof val === 'number'
                            ? key.toLowerCase().includes('revenue') || key.toLowerCase().includes('amount')
                              ? cents(val)
                              : key.toLowerCase().includes('rate') || key.toLowerCase().includes('pct')
                              ? pct(val)
                              : val.toLocaleString()
                            : String(val ?? '—')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </WarmCard>
            )}

            {/* Revenue chart (bar-style) */}
            {tab === 'revenue' && (
              <WarmCard padding="lg">
                {revenue.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-center py-8">Revenue andmed puuduvad</p>
                ) : (
                  <>
                    <div className="flex items-end gap-1 h-40 mb-4">
                      {revenue.slice(-60).map((point, i) => (
                        <div key={i} className="flex-1 flex flex-col justify-end group relative">
                          <div
                            className="bg-[var(--primary)] opacity-80 rounded-t hover:opacity-100 transition-opacity min-h-[2px]"
                            style={{ height: `${Math.max(2, (point.revenue / maxRevenue) * 100)}%` }}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-[var(--text-primary)] text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                            {new Date(point.date).toLocaleDateString('et-EE')}<br />{cents(point.revenue)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-[var(--border)]">
                          <tr className="text-left text-[var(--text-secondary)]">
                            <th className="py-2 font-semibold">Kuupäev</th>
                            <th className="py-2 font-semibold">Revenue</th>
                            <th className="py-2 font-semibold">Tasud</th>
                            <th className="py-2 font-semibold">Tehingud</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {[...revenue].reverse().slice(0, 30).map((point, i) => (
                            <tr key={i} className="hover:bg-[var(--surface)]">
                              <td className="py-2 text-[var(--text-secondary)] text-xs">{new Date(point.date).toLocaleDateString('et-EE')}</td>
                              <td className="py-2 font-medium">{cents(point.revenue)}</td>
                              <td className="py-2 text-[var(--text-secondary)]">{point.fees != null ? cents(point.fees) : '—'}</td>
                              <td className="py-2 text-[var(--text-secondary)]">{point.transactions?.toLocaleString() ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </WarmCard>
            )}

            {/* Cohorts */}
            {tab === 'cohorts' && (
              <WarmCard padding="lg">
                {cohorts.length === 0 ? (
                  <p className="text-[var(--text-secondary)] text-center py-8">Kohortide andmed puuduvad</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[var(--border)]">
                        <tr className="text-left text-[var(--text-secondary)]">
                          <th className="py-2 pr-4 font-semibold">Kohort</th>
                          <th className="py-2 pr-4 font-semibold">Suurus</th>
                          {cohorts[0]?.retention?.map((_, i) => (
                            <th key={i} className="py-2 pr-3 font-semibold text-center">M{i}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {cohorts.map((row, i) => (
                          <tr key={i} className="hover:bg-[var(--surface)]">
                            <td className="py-2 pr-4 text-[var(--text-primary)] font-medium">{row.cohort}</td>
                            <td className="py-2 pr-4 text-[var(--text-secondary)]">{row.size.toLocaleString()}</td>
                            {row.retention.map((r, j) => (
                              <td key={j} className="py-2 pr-3 text-center">
                                <span
                                  className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                                  style={{
                                    backgroundColor: `rgba(var(--primary-rgb, 139,90,43), ${r})`,
                                    color: r > 0.4 ? 'white' : 'var(--text-primary)',
                                  }}
                                >
                                  {(r * 100).toFixed(0)}%
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </WarmCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
