'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  RefreshCw,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TenantStats = {
  merchantId: string;
  merchantName: string;
  slug: string;
  revenue: number;
  previousRevenue: number;
  revenueGrowth: number;
  users: number;
  vouchers: number;
  redemptions: number;
  activityScore: number;
  lastActive: string | null;
  inactive: boolean;
};

type Summary = {
  totalMerchants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalRevenue: number;
  growthLeaders: TenantStats[];
  declining: TenantStats[];
};

type TenantData = {
  tenants: TenantStats[];
  summary: Summary;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cents(n: number): string {
  return `€${(n / 100).toLocaleString('et-EE', { minimumFractionDigits: 2 })}`;
}

function activityColor(score: number): string {
  if (score >= 60) return 'bg-green-100 text-green-700';
  if (score >= 30) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

function growthBadge(growth: number) {
  if (growth > 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-green-600 text-xs font-medium">
        <ArrowUp className="h-3 w-3" />
        {(growth * 100).toFixed(0)}%
      </span>
    );
  if (growth < 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-red-600 text-xs font-medium">
        <ArrowDown className="h-3 w-3" />
        {Math.abs(growth * 100).toFixed(0)}%
      </span>
    );
  return <span className="text-[var(--text-secondary)] text-xs">—</span>;
}

// ---------------------------------------------------------------------------
// Revenue Distribution Bar Chart (simple SVG)
// ---------------------------------------------------------------------------

function RevenueBarChart({ tenants }: { tenants: TenantStats[] }) {
  const sorted = [...tenants].sort((a, b) => b.revenue - a.revenue).slice(0, 15);
  if (sorted.length === 0) return <p className="text-sm text-[var(--text-secondary)]">No data</p>;
  const max = Math.max(...sorted.map((t) => t.revenue), 1);
  const barH = 24;
  const gap = 4;
  const svgHeight = sorted.length * (barH + gap);
  const labelWidth = 120;
  const chartWidth = 500;

  return (
    <svg viewBox={`0 0 ${labelWidth + chartWidth + 80} ${svgHeight}`} className="w-full" style={{ maxHeight: 500 }}>
      {sorted.map((t, i) => {
        const y = i * (barH + gap);
        const barW = (t.revenue / max) * chartWidth;
        return (
          <g key={t.merchantId}>
            <text
              x={labelWidth - 4}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--text-secondary)"
            >
              {t.merchantName.length > 18 ? t.merchantName.slice(0, 18) + '...' : t.merchantName}
            </text>
            <rect
              x={labelWidth}
              y={y}
              width={Math.max(2, barW)}
              height={barH}
              rx={4}
              fill={t.inactive ? '#f87171' : 'var(--primary)'}
              opacity={0.75}
            />
            <text
              x={labelWidth + Math.max(2, barW) + 6}
              y={y + barH / 2 + 4}
              fontSize={10}
              fill="var(--text-secondary)"
            >
              {cents(t.revenue)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type SortKey = 'merchantName' | 'revenue' | 'users' | 'vouchers' | 'redemptions' | 'activityScore' | 'revenueGrowth';

export default function TenantAnalyticsPage() {
  const [data, setData] = useState<TenantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/tenant-analytics?sortBy=${sortBy}&sortOrder=${sortOrder}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  }

  function SortHeader({ label, field }: { label: string; field: SortKey }) {
    return (
      <th
        className="py-2 font-semibold cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors"
        onClick={() => toggleSort(field)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {sortBy === field && (
            <ArrowUpDown className="h-3 w-3" />
          )}
        </span>
      </th>
    );
  }

  const summary = data?.summary;
  const tenants = data?.tenants ?? [];

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">
                ← Back
              </WarmButton>
            </Link>
            <Building2 className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tenant Analytics</h1>
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </WarmButton>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <WarmCard padding="md">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Total Merchants</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{summary.totalMerchants}</p>
            </WarmCard>
            <WarmCard padding="md">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Active</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{summary.activeTenants}</p>
            </WarmCard>
            <WarmCard padding="md">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Inactive (30d+)</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{summary.inactiveTenants}</p>
            </WarmCard>
            <WarmCard padding="md">
              <p className="text-xs text-[var(--text-secondary)] font-medium">Total Revenue (30d)</p>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{cents(summary.totalRevenue)}</p>
            </WarmCard>
          </div>
        )}

        {/* Revenue Distribution */}
        {tenants.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Revenue Distribution (Top 15)
            </h2>
            <RevenueBarChart tenants={tenants} />
          </WarmCard>
        )}

        {/* Growth Leaders vs Declining */}
        {summary && (summary.growthLeaders.length > 0 || summary.declining.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {summary.growthLeaders.length > 0 && (
              <WarmCard padding="lg">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Growth Leaders</h2>
                </div>
                <div className="space-y-2">
                  {summary.growthLeaders.map((t) => (
                    <div
                      key={t.merchantId}
                      className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">{t.merchantName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[var(--text-secondary)]">{cents(t.revenue)}</span>
                        {growthBadge(t.revenueGrowth)}
                      </div>
                    </div>
                  ))}
                </div>
              </WarmCard>
            )}
            {summary.declining.length > 0 && (
              <WarmCard padding="lg">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Declining Tenants</h2>
                </div>
                <div className="space-y-2">
                  {summary.declining.map((t) => (
                    <div
                      key={t.merchantId}
                      className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">{t.merchantName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-[var(--text-secondary)]">{cents(t.revenue)}</span>
                        {growthBadge(t.revenueGrowth)}
                      </div>
                    </div>
                  ))}
                </div>
              </WarmCard>
            )}
          </div>
        )}

        {/* Full Tenant Table */}
        <WarmCard padding="lg">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">All Merchants</h2>
          {loading && tenants.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">
              Loading...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] text-left text-[var(--text-secondary)]">
                  <tr>
                    <SortHeader label="Merchant" field="merchantName" />
                    <SortHeader label="Revenue (30d)" field="revenue" />
                    <SortHeader label="Growth" field="revenueGrowth" />
                    <SortHeader label="Users" field="users" />
                    <SortHeader label="Vouchers" field="vouchers" />
                    <SortHeader label="Redemptions" field="redemptions" />
                    <SortHeader label="Activity" field="activityScore" />
                    <th className="py-2 font-semibold">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {tenants.map((t) => (
                    <tr key={t.merchantId} className="hover:bg-[var(--surface)]">
                      <td className="py-2.5">
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{t.merchantName}</p>
                          <p className="text-xs text-[var(--text-secondary)]">/{t.slug}</p>
                        </div>
                      </td>
                      <td className="py-2.5 font-medium">{cents(t.revenue)}</td>
                      <td className="py-2.5">{growthBadge(t.revenueGrowth)}</td>
                      <td className="py-2.5 text-[var(--text-secondary)]">{t.users}</td>
                      <td className="py-2.5 text-[var(--text-secondary)]">{t.vouchers}</td>
                      <td className="py-2.5 text-[var(--text-secondary)]">{t.redemptions}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${activityColor(t.activityScore)}`}
                        >
                          {t.activityScore}
                        </span>
                      </td>
                      <td className="py-2.5 text-xs text-[var(--text-secondary)]">
                        {t.lastActive
                          ? new Date(t.lastActive).toLocaleDateString('et-EE')
                          : 'Never'}
                        {t.inactive && (
                          <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-medium">
                            INACTIVE
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tenants.length === 0 && !loading && (
                <p className="text-center text-[var(--text-secondary)] py-8">No merchants found</p>
              )}
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
