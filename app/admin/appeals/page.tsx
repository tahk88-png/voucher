'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Scale, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { showError } from '@/lib/toast-helpers';

type Appeal = {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  moderationAction: {
    id: string;
    actionType: string;
    reason: string;
    targetUserId: string | null;
  } | null;
  appealUser: { id: string; email: string; name: string } | null;
  reviewer: { id: string; email: string; name: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUSES = ['', 'pending', 'approved', 'rejected'];
const LIMIT = 20;

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('pending');
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [activeAppealId, setActiveAppealId] = useState<string | null>(null);

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/moderation/appeals?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAppeals(data.appeals ?? data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchAppeals(); }, [fetchAppeals]);

  async function reviewAppeal(id: string, decision: 'approved' | 'rejected') {
    if (!resolutionNote) {
      showError('Add a reason for the decision before submitting.');
      return;
    }
    setActionLoading(id);
    try {
      await fetch(`/api/admin/moderation/appeals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: decision, reviewNotes: resolutionNote }),
      });
      setActiveAppealId(null);
      setResolutionNote('');
      fetchAppeals();
    } finally {
      setActionLoading(null);
    }
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Tagasi</WarmButton>
            </Link>
            <Scale className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Moderation Appeals</h1>
            {total > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{total}</span>
            )}
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchAppeals}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        {/* Status filter */}
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === s
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border)]'
              }`}
            >
              {s === '' ? 'Kõik' : s}
            </button>
          ))}
        </div>

        {/* Appeals list */}
        {loading ? (
          <WarmCard>
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Laadin...</div>
          </WarmCard>
        ) : appeals.length === 0 ? (
          <WarmCard>
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-secondary)]">
              <Scale className="h-8 w-8 opacity-30" />
              <p>Kaebusi ei leitud</p>
            </div>
          </WarmCard>
        ) : (
          <div className="space-y-3">
            {appeals.map(appeal => (
              <WarmCard key={appeal.id} padding="md">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appeal.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {appeal.status}
                      </span>
                      {appeal.moderationAction && (
                        <span className="text-xs text-[var(--text-secondary)] capitalize">
                          Kaebus: {appeal.moderationAction.actionType.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[var(--text-primary)]">{appeal.reason}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {appeal.appealUser && (
                        <span className="text-xs text-[var(--text-secondary)]">
                          {appeal.appealUser.name} ({appeal.appealUser.email})
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-secondary)]">
                        {new Date(appeal.createdAt).toLocaleDateString('et-EE')}
                      </span>
                    </div>
                    {appeal.moderationAction?.reason && (
                      <div className="mt-2 p-2 bg-[var(--surface)] rounded text-xs text-[var(--text-secondary)]">
                        <span className="font-medium">Algne põhjus:</span> {appeal.moderationAction.reason}
                      </div>
                    )}
                  </div>

                  {appeal.status === 'pending' && (
                    <div className="flex-shrink-0">
                      {activeAppealId === appeal.id ? (
                        <div className="space-y-2 min-w-[220px]">
                          <textarea
                            value={resolutionNote}
                            onChange={e => setResolutionNote(e.target.value)}
                            placeholder="Otsuse põhjendus..."
                            rows={3}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-white text-[var(--text-primary)] resize-none"
                          />
                          <div className="flex gap-2">
                            <WarmButton
                              size="sm"
                              variant="secondary"
                              isLoading={actionLoading === appeal.id}
                              onClick={() => reviewAppeal(appeal.id, 'approved')}
                              className="flex-1"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Kiida heaks
                            </WarmButton>
                            <WarmButton
                              size="sm"
                              variant="outline"
                              isLoading={actionLoading === appeal.id}
                              onClick={() => reviewAppeal(appeal.id, 'rejected')}
                              className="flex-1"
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Lükka tagasi
                            </WarmButton>
                          </div>
                          <button
                            onClick={() => setActiveAppealId(null)}
                            className="text-xs text-[var(--text-secondary)] hover:underline"
                          >
                            Tühista
                          </button>
                        </div>
                      ) : (
                        <WarmButton size="sm" variant="outline" onClick={() => setActiveAppealId(appeal.id)}>
                          Vaata üle
                        </WarmButton>
                      )}
                    </div>
                  )}
                </div>
              </WarmCard>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">
              {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} / {total}
            </span>
            <div className="flex gap-2">
              <WarmButton size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </WarmButton>
              <WarmButton size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </WarmButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
