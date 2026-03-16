'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import {
  ShieldAlert,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface FlaggedItem {
  id: string;
  userId: string;
  userEmail: string;
  merchantName: string;
  riskScore: number;
  flags: string[];
  recommendation: string;
  fraudStatus: string;
  createdAt: string;
}

interface FraudStats {
  falsePositiveRate: number;
  totalFlagged: number;
  confirmed: number;
  falsePositives: number;
  pending: number;
}

const FLAG_LABELS: Record<string, string> = {
  high_velocity: 'High Velocity',
  geo_anomaly: 'Geo Anomaly',
  device_duplicate: 'Device Duplicate',
  unusual_time: 'Unusual Time',
  rapid_succession: 'Rapid Succession',
  multiple_users_same_device: 'Shared Device',
  new_account_high_value: 'New Account',
};

const LIMIT = 25;

export default function FraudDashboardPage() {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<FraudStats | null>(null);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState(30);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        minScore: String(minScore),
      });
      const res = await fetch(`/api/admin/fraud?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
        setStats(data.stats ?? null);
        setDistribution(data.distribution ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, [page, minScore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusUpdate(redemptionId: string, status: 'confirmed' | 'false_positive') {
    setActionLoading(redemptionId);
    try {
      const res = await fetch('/api/admin/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redemptionId, status }),
      });
      if (res.ok) {
        fetchData();
      }
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);
  const maxDistVal = Math.max(...Object.values(distribution), 1);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">
                ← Back
              </WarmButton>
            </Link>
            <ShieldAlert className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold text-[var(--text)]">Fraud Detection</h1>
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <WarmCard padding="lg" className="bg-white border-b-4 border-b-red-400">
              <div className="text-sm text-[var(--text-muted)]">Total Flagged</div>
              <div className="text-2xl font-bold text-[var(--text)] mt-1">{stats.totalFlagged}</div>
            </WarmCard>
            <WarmCard padding="lg" className="bg-white border-b-4 border-b-yellow-400">
              <div className="text-sm text-[var(--text-muted)]">Pending Review</div>
              <div className="text-2xl font-bold text-[var(--text)] mt-1">{stats.pending}</div>
            </WarmCard>
            <WarmCard padding="lg" className="bg-white border-b-4 border-b-green-400">
              <div className="text-sm text-[var(--text-muted)]">Confirmed Fraud</div>
              <div className="text-2xl font-bold text-[var(--text)] mt-1">{stats.confirmed}</div>
            </WarmCard>
            <WarmCard padding="lg" className="bg-white border-b-4 border-b-blue-400">
              <div className="text-sm text-[var(--text-muted)]">False Positive Rate</div>
              <div className="text-2xl font-bold text-[var(--text)] mt-1">{stats.falsePositiveRate}%</div>
            </WarmCard>
          </div>
        )}

        {/* Risk Score Distribution Chart */}
        <WarmCard padding="lg" className="bg-white">
          <h2 className="text-base font-semibold text-[var(--text)] mb-4">Risk Score Distribution</h2>
          <div className="flex items-end gap-3 h-32">
            {Object.entries(distribution).map(([range, count]) => {
              const heightPercent = (count / maxDistVal) * 100;
              const isHigh = range.startsWith('81') || range.startsWith('61');
              return (
                <div key={range} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-[var(--text)]">{count}</span>
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isHigh ? 'bg-red-400' : range.startsWith('41') ? 'bg-yellow-400' : 'bg-green-400'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">{range}</span>
                </div>
              );
            })}
          </div>
        </WarmCard>

        {/* Threshold control */}
        <WarmCard padding="md" className="bg-white">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[var(--text)]">Min Score Filter:</span>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => {
                setMinScore(Number(e.target.value));
                setPage(1);
              }}
              className="flex-1 accent-[var(--primary)]"
            />
            <span className="text-sm font-bold text-[var(--text)] w-10 text-center">{minScore}</span>
          </div>
        </WarmCard>

        {/* Flagged Items Table */}
        <WarmCard padding="none" className="bg-white">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-muted)]">Loading...</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-muted)]">
              <ShieldAlert className="h-8 w-8 opacity-30" />
              <p>No flagged items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold">Merchant</th>
                    <th className="px-4 py-3 font-semibold">Risk Score</th>
                    <th className="px-4 py-3 font-semibold">Flags</th>
                    <th className="px-4 py-3 font-semibold">Recommendation</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[var(--surface)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text)]">{item.userEmail}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{item.merchantName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.riskScore >= 75
                              ? 'bg-red-100 text-red-700'
                              : item.riskScore >= 40
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {item.riskScore}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.flags.map((flag) => (
                            <span
                              key={flag}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--surface-dim)] text-[var(--text-muted)]"
                            >
                              {FLAG_LABELS[flag] ?? flag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium ${
                            item.recommendation === 'block'
                              ? 'text-red-600'
                              : item.recommendation === 'review'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}
                        >
                          {item.recommendation}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.fraudStatus === 'confirmed'
                              ? 'bg-red-100 text-red-700'
                              : item.fraudStatus === 'false_positive'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.fraudStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)] text-xs whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {item.fraudStatus === 'pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'confirmed')}
                              disabled={actionLoading === item.id}
                              className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Confirm fraud"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(item.id, 'false_positive')}
                              disabled={actionLoading === item.id}
                              className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                              title="Mark as false positive"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
              <span className="text-sm text-[var(--text-muted)]">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
              </span>
              <div className="flex gap-2">
                <WarmButton size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </WarmButton>
                <span className="px-3 py-1.5 text-sm text-[var(--text-muted)]">
                  {page} / {totalPages}
                </span>
                <WarmButton size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </WarmButton>
              </div>
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
