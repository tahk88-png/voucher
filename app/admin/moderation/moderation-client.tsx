'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Eye, UserX, ChevronLeft, ChevronRight } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

type Report = {
  id: string;
  category: string;
  status: string;
  description: string;
  createdAt: string;
  reportedBy: { email: string; name: string } | null;
  reportedUser: { email: string; name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  under_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
};

const STATUSES = ['', 'open', 'under_review', 'resolved', 'dismissed'];
const CATEGORIES = ['', 'spam', 'fraud', 'offensive_content', 'trademark_violation', 'other'];
const LIMIT = 25;

export default function ModerationClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('open');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    try {
      const res = await fetch(`/api/admin/moderation/reports?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, category, page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  async function assignToMe(id: string) {
    await fetch(`/api/admin/moderation/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'assign' }),
    });
    fetchReports();
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Tagasi</WarmButton>
            </Link>
            <AlertTriangle className="h-6 w-6 text-orange-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Moderation Queue</h1>
            {total > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchReports}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        {/* Filters */}
        <WarmCard padding="sm">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 flex-wrap">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => { setStatus(s); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    status === s
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
                  }`}
                >
                  {s === '' ? 'Kõik' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)] text-[var(--text-primary)]"
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c === '' ? 'Kõik kategooriad' : c.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </WarmCard>

        {/* Table */}
        <WarmCard padding="none">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">
              Laadin...
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-secondary)]">
              <AlertTriangle className="h-8 w-8 opacity-30" />
              <p>Raporteid ei leitud</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                  <tr className="text-left text-[var(--text-secondary)]">
                    <th className="px-4 py-3 font-semibold">Kategooria</th>
                    <th className="px-4 py-3 font-semibold">Raporteeritud kasutaja</th>
                    <th className="px-4 py-3 font-semibold">Raporteerija</th>
                    <th className="px-4 py-3 font-semibold">Staatus</th>
                    <th className="px-4 py-3 font-semibold">Kuupäev</th>
                    <th className="px-4 py-3 font-semibold">Tegevused</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {reports.map(r => (
                    <tr key={r.id} className="hover:bg-[var(--surface)] transition-colors">
                      <td className="px-4 py-3">
                        <span className="capitalize font-medium text-[var(--text-primary)]">
                          {r.category.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {r.reportedUser ? (
                          <div>
                            <div className="font-medium text-[var(--text-primary)]">{r.reportedUser.name}</div>
                            <div className="text-xs">{r.reportedUser.email}</div>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                        {r.reportedBy?.email ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {r.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleDateString('et-EE')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/admin/moderation/${r.id}`}>
                            <WarmButton size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" /> Vaata
                            </WarmButton>
                          </Link>
                          {r.status === 'open' && (
                            <WarmButton size="sm" variant="secondary" onClick={() => assignToMe(r.id)}>
                              Võta üle
                            </WarmButton>
                          )}
                        </div>
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
              <span className="text-sm text-[var(--text-secondary)]">
                {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
              </span>
              <div className="flex gap-2">
                <WarmButton size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </WarmButton>
                <span className="px-3 py-1.5 text-sm text-[var(--text-secondary)]">{page} / {totalPages}</span>
                <WarmButton size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
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
