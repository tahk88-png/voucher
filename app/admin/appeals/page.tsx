'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Scale, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, ArrowUpCircle } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { apiErrorMessage } from '@/lib/api-error-message';

// Mirrors the AppealStatus enum in prisma/schema.prisma.
type AppealStatus = 'submitted' | 'under_review' | 'approved' | 'denied' | 'escalated';
type Decision = 'approved' | 'denied' | 'escalated';

type Appeal = {
  id: string;
  status: AppealStatus;
  reason: string;
  reviewNote: string | null;
  createdAt: string;
  moderationAction: {
    id: string;
    actionType: string;
    reason: string;
    targetUserId: string | null;
  } | null;
  appealUser: { id: string; email: string; name: string | null } | null;
  reviewer: { id: string; email: string; name: string | null } | null;
};

const STATUS_LABELS: Record<AppealStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  escalated: 'Escalated',
  approved: 'Approved',
  denied: 'Denied',
};

const STATUS_COLORS: Record<AppealStatus, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  escalated: 'bg-orange-100 text-orange-800',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
};

const FILTERS: Array<{ value: AppealStatus | ''; label: string }> = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under review' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'approved', label: 'Approved' },
  { value: 'denied', label: 'Denied' },
  { value: '', label: 'All' },
];

const REVIEWABLE: AppealStatus[] = ['submitted', 'under_review', 'escalated'];
const LIMIT = 20;

export default function AppealsPage() {
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [status, setStatus] = useState<AppealStatus | ''>('submitted');
  // Cursor pagination: stack of cursors for the pages we've visited.
  const [cursors, setCursors] = useState<Array<string | null>>([null]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [activeAppealId, setActiveAppealId] = useState<string | null>(null);

  const currentCursor = cursors[cursors.length - 1];

  const fetchAppeals = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams({ limit: String(LIMIT) });
      if (status) params.set('status', status);
      if (currentCursor) params.set('cursor', currentCursor);
      const res = await fetch(`/api/admin/moderation/appeals?${params}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAppeals([]);
        setNextCursor(null);
        setLoadError(apiErrorMessage(data, `Couldn't load appeals (error ${res.status}).`));
        return;
      }
      setAppeals(data.appeals ?? []);
      setNextCursor(data.hasMore ? data.nextCursor ?? null : null);
    } catch {
      setLoadError("Couldn't load appeals. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [status, currentCursor]);

  useEffect(() => {
    fetchAppeals();
  }, [fetchAppeals]);

  async function reviewAppeal(id: string, decision: Decision) {
    if (!resolutionNote.trim()) {
      showError('Add a reason for the decision before submitting.');
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/moderation/appeals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: decision, reviewNote: resolutionNote.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(apiErrorMessage(data, `Couldn't save the decision (error ${res.status}).`));
        return;
      }
      showSuccess(
        decision === 'approved'
          ? 'Appeal approved. The moderation action has been reversed.'
          : decision === 'denied'
            ? 'Appeal denied.'
            : 'Appeal escalated.',
      );
      setActiveAppealId(null);
      setResolutionNote('');
      fetchAppeals();
    } catch {
      showError("Couldn't save the decision. Check your connection and try again.");
    } finally {
      setActionLoading(null);
    }
  }

  const changeFilter = (s: AppealStatus | '') => {
    setStatus(s);
    setCursors([null]);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Back</WarmButton>
            </Link>
            <Scale className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-[var(--text)]">Moderation appeals</h1>
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchAppeals} aria-label="Refresh appeals">
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        <div className="flex gap-1 flex-wrap" role="tablist" aria-label="Filter by status">
          {FILTERS.map((f) => (
            <button
              key={f.value || 'all'}
              role="tab"
              aria-selected={status === f.value}
              onClick={() => changeFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === f.value
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--border)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <WarmCard>
            <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">Loading...</div>
          </WarmCard>
        ) : loadError ? (
          <WarmCard>
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--danger)]">
              <p>{loadError}</p>
              <WarmButton size="sm" variant="outline" onClick={fetchAppeals}>Try again</WarmButton>
            </div>
          </WarmCard>
        ) : appeals.length === 0 ? (
          <WarmCard>
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-muted)]">
              <Scale className="h-8 w-8 opacity-30" />
              <p>No appeals {status ? `with status “${STATUS_LABELS[status]}”` : 'yet'}.</p>
            </div>
          </WarmCard>
        ) : (
          <div className="space-y-3">
            {appeals.map((appeal) => (
              <WarmCard key={appeal.id} padding="md">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appeal.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[appeal.status] ?? appeal.status}
                      </span>
                      {appeal.moderationAction && (
                        <span className="text-xs text-[var(--text-muted)]">
                          Appealing: {appeal.moderationAction.actionType.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[var(--text)] break-words">{appeal.reason}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {appeal.appealUser && (
                        <span className="text-xs text-[var(--text-muted)] break-all">
                          {appeal.appealUser.name || 'Unnamed user'} ({appeal.appealUser.email})
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(appeal.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    {appeal.moderationAction?.reason && (
                      <div className="mt-2 p-2 bg-[var(--surface)] rounded text-xs text-[var(--text-muted)]">
                        <span className="font-medium">Original reason:</span> {appeal.moderationAction.reason}
                      </div>
                    )}
                    {appeal.reviewNote && (
                      <div className="mt-2 p-2 bg-[var(--surface)] rounded text-xs text-[var(--text-muted)]">
                        <span className="font-medium">
                          Decision note{appeal.reviewer ? ` (${appeal.reviewer.name || appeal.reviewer.email})` : ''}:
                        </span>{' '}
                        {appeal.reviewNote}
                      </div>
                    )}
                  </div>

                  {REVIEWABLE.includes(appeal.status) && (
                    <div className="flex-shrink-0">
                      {activeAppealId === appeal.id ? (
                        <div className="space-y-2 sm:min-w-[240px]">
                          <label className="sr-only" htmlFor={`note-${appeal.id}`}>Reason for the decision</label>
                          <textarea
                            id={`note-${appeal.id}`}
                            value={resolutionNote}
                            onChange={(e) => setResolutionNote(e.target.value)}
                            placeholder="Reason for the decision..."
                            rows={3}
                            className="w-full px-2 py-1.5 text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] resize-none"
                          />
                          <div className="flex flex-wrap gap-2">
                            <WarmButton
                              size="sm"
                              variant="secondary"
                              isLoading={actionLoading === appeal.id}
                              onClick={() => reviewAppeal(appeal.id, 'approved')}
                              className="flex-1"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </WarmButton>
                            <WarmButton
                              size="sm"
                              variant="outline"
                              isLoading={actionLoading === appeal.id}
                              onClick={() => reviewAppeal(appeal.id, 'denied')}
                              className="flex-1"
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Deny
                            </WarmButton>
                            {appeal.status !== 'escalated' && (
                              <WarmButton
                                size="sm"
                                variant="ghost"
                                isLoading={actionLoading === appeal.id}
                                onClick={() => reviewAppeal(appeal.id, 'escalated')}
                                className="flex-1"
                              >
                                <ArrowUpCircle className="h-3 w-3 mr-1" /> Escalate
                              </WarmButton>
                            )}
                          </div>
                          <button
                            onClick={() => setActiveAppealId(null)}
                            className="text-xs text-[var(--text-muted)] hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <WarmButton size="sm" variant="outline" onClick={() => setActiveAppealId(appeal.id)}>
                          Review
                        </WarmButton>
                      )}
                    </div>
                  )}
                </div>
              </WarmCard>
            ))}
          </div>
        )}

        {(cursors.length > 1 || nextCursor) && (
          <div className="flex items-center justify-end gap-2">
            <WarmButton
              size="sm"
              variant="outline"
              disabled={cursors.length <= 1}
              onClick={() => setCursors((c) => c.slice(0, -1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </WarmButton>
            <span className="text-sm text-[var(--text-muted)]">Page {cursors.length}</span>
            <WarmButton
              size="sm"
              variant="outline"
              disabled={!nextCursor}
              onClick={() => nextCursor && setCursors((c) => [...c, nextCursor])}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </WarmButton>
          </div>
        )}
      </div>
    </div>
  );
}
