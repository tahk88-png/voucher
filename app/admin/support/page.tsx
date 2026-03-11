'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { HeadphonesIcon, RefreshCw, MessageSquare, ChevronLeft, ChevronRight, X, Send } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

type SupportCase = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  merchantId: string | null;
  user?: { email: string; name: string } | null;
  merchant?: { name: string; slug: string } | null;
  _count?: { notes: number };
};

type Note = {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  author?: { name: string; email: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500',
  normal: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUSES = ['', 'open', 'in_progress', 'resolved', 'closed'];
const LIMIT = 20;

export default function SupportPage() {
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('open');
  const [page, setPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<SupportCase | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteInternal, setNoteInternal] = useState(true);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/support/cases?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCases(data.cases ?? data.data ?? []);
        setTotal(data.total ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  async function openCase(c: SupportCase) {
    setSelectedCase(c);
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/admin/support/cases/${c.id}/notes`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes ?? data ?? []);
      }
    } finally {
      setNotesLoading(false);
    }
  }

  async function addNote() {
    if (!noteText.trim() || !selectedCase) return;
    await fetch(`/api/admin/support/cases/${selectedCase.id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: noteText, isInternal: noteInternal }),
    });
    setNoteText('');
    // Refresh notes
    const res = await fetch(`/api/admin/support/cases/${selectedCase.id}/notes`);
    if (res.ok) {
      const data = await res.json();
      setNotes(data.notes ?? data ?? []);
    }
  }

  async function updateCaseStatus(caseId: string, newStatus: string) {
    await fetch(`/api/admin/support/cases/${caseId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchCases();
    if (selectedCase?.id === caseId) {
      setSelectedCase(prev => prev ? { ...prev, status: newStatus } : null);
    }
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
            <HeadphonesIcon className="h-6 w-6 text-teal-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Support Cases</h1>
            {total > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{total}</span>
            )}
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchCases}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        <div className={`grid gap-6 ${selectedCase ? 'grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
          {/* Cases list */}
          <div className="space-y-4">
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
                  {s === '' ? 'Kõik' : s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <WarmCard padding="none">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">Laadin...</div>
              ) : cases.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-secondary)]">
                  <HeadphonesIcon className="h-8 w-8 opacity-30" />
                  <p>Support cases puuduvad</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {cases.map(c => (
                    <div
                      key={c.id}
                      onClick={() => openCase(c)}
                      className={`px-4 py-3 cursor-pointer hover:bg-[var(--surface)] transition-colors ${
                        selectedCase?.id === c.id ? 'bg-[var(--surface)] border-l-2 border-[var(--primary)]' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[var(--text-primary)] truncate">{c.subject}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                              {c.status.replace(/_/g, ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[c.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                              {c.priority}
                            </span>
                            {c._count?.notes ? (
                              <span className="flex items-center gap-0.5 text-xs text-[var(--text-secondary)]">
                                <MessageSquare className="h-3 w-3" /> {c._count.notes}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {c.user?.email ?? c.merchant?.name ?? '—'} · {new Date(c.createdAt).toLocaleDateString('et-EE')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
                  <span className="text-sm text-[var(--text-secondary)]">{page} / {totalPages}</span>
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
            </WarmCard>
          </div>

          {/* Case detail panel */}
          {selectedCase && (
            <WarmCard padding="none" className="sticky top-6 h-fit max-h-[calc(100vh-6rem)] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--text-primary)] truncate">{selectedCase.subject}</h2>
                <button onClick={() => setSelectedCase(null)} className="p-1 rounded hover:bg-[var(--border)] text-[var(--text-secondary)]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-4 py-3 border-b border-[var(--border)] space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedCase.status]}`}>
                    {selectedCase.status.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[selectedCase.priority]}`}>
                    {selectedCase.priority}
                  </span>
                </div>
                <div className="flex gap-2">
                  {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                    <button
                      key={s}
                      onClick={() => updateCaseStatus(selectedCase.id, s)}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${
                        selectedCase.status === s
                          ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  {selectedCase.user?.email ?? selectedCase.merchant?.name ?? '—'}
                </p>
              </div>

              {/* Notes */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px]">
                {notesLoading ? (
                  <p className="text-xs text-[var(--text-secondary)]">Laadin märkmeid...</p>
                ) : notes.length === 0 ? (
                  <p className="text-xs text-[var(--text-secondary)]">Märkmeid pole</p>
                ) : (
                  notes.map(note => (
                    <div key={note.id} className={`rounded-lg p-3 text-sm ${note.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-[var(--surface)]'}`}>
                      <p className="text-[var(--text-primary)]">{note.content}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        {note.author?.name ?? 'Admin'} · {new Date(note.createdAt).toLocaleString('et-EE')}
                        {note.isInternal && <span className="ml-2 text-yellow-700 font-medium">Intern</span>}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add note */}
              <div className="px-4 py-3 border-t border-[var(--border)]">
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Lisa märge..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={noteInternal}
                      onChange={e => setNoteInternal(e.target.checked)}
                      className="rounded"
                    />
                    Intern märge
                  </label>
                  <WarmButton size="sm" onClick={addNote} disabled={!noteText.trim()}>
                    <Send className="h-3 w-3 mr-1" /> Saada
                  </WarmButton>
                </div>
              </div>
            </WarmCard>
          )}
        </div>
      </div>
    </div>
  );
}
