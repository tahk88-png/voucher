'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'messages' | 'queue' | 'suppressions' | 'providers';

type EmailMessage = {
  id: string;
  to: string;
  subject: string;
  status: string;
  category: string;
  providerType: string;
  sentAt: string | null;
  createdAt: string;
};

type EmailJob = {
  id: string;
  to: string;
  subject: string;
  status: string;
  priority: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  createdAt: string;
};

type EmailSuppression = {
  id: string;
  email: string;
  reason: string;
  source: string;
  notes: string | null;
  createdAt: string;
};

type EmailProvider = {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  isPrimary: boolean;
  priority: number;
  healthStatus: string;
  lastCheckedAt: string | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TAB_LABELS: Record<Tab, string> = {
  messages: 'Messages',
  queue: 'Queue',
  suppressions: 'Suppressions',
  providers: 'Providers',
};

const MESSAGE_STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  bounced: 'bg-red-100 text-red-700',
  failed: 'bg-red-100 text-red-700',
  suppressed: 'bg-yellow-100 text-yellow-800',
  opened: 'bg-emerald-100 text-emerald-700',
  clicked: 'bg-teal-100 text-teal-700',
};

const JOB_STATUS_COLORS: Record<string, string> = {
  queued: 'bg-gray-100 text-gray-600',
  processing: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  dead: 'bg-red-200 text-red-800',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  normal: 'bg-gray-100 text-gray-600',
  low: 'bg-blue-50 text-blue-600',
};

const HEALTH_STATUS_ICON: Record<string, React.ReactNode> = {
  healthy: <CheckCircle className="h-5 w-5 text-green-500" />,
  degraded: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  down: <XCircle className="h-5 w-5 text-red-500" />,
};

const SUPPRESSION_REASONS = [
  { value: 'hard_bounce', label: 'Hard Bounce' },
  { value: 'soft_bounce', label: 'Soft Bounce' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'unsubscribe', label: 'Unsubscribe' },
  { value: 'manual', label: 'Manual' },
];

const JOB_STATUS_OPTIONS = ['queued', 'processing', 'completed', 'failed', 'dead'];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailDashboardClient() {
  const [tab, setTab] = useState<Tab>('messages');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Messages state
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [messageSearch, setMessageSearch] = useState('');

  // Queue state
  const [jobs, setJobs] = useState<EmailJob[]>([]);
  const [jobStatusFilter, setJobStatusFilter] = useState('');

  // Suppressions state
  const [suppressions, setSuppressions] = useState<EmailSuppression[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSuppressionEmail, setNewSuppressionEmail] = useState('');
  const [newSuppressionReason, setNewSuppressionReason] = useState('manual');

  // Providers state
  const [providers, setProviders] = useState<EmailProvider[]>([]);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchMessages = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('to', search);
      const res = await fetch(`/api/admin/email/messages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin/email/jobs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuppressions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email/suppressions?limit=50');
      if (res.ok) {
        const data = await res.json();
        setSuppressions(data.suppressions ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/email/providers');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentTab = useCallback(() => {
    switch (tab) {
      case 'messages':
        return fetchMessages(messageSearch || undefined);
      case 'queue':
        return fetchJobs(jobStatusFilter || undefined);
      case 'suppressions':
        return fetchSuppressions();
      case 'providers':
        return fetchProviders();
    }
  }, [tab, messageSearch, jobStatusFilter, fetchMessages, fetchJobs, fetchSuppressions, fetchProviders]);

  useEffect(() => {
    fetchCurrentTab();
  }, [fetchCurrentTab]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function retryJob(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/email/jobs/${id}/retry`, { method: 'POST' });
      fetchJobs(jobStatusFilter || undefined);
    } finally {
      setActionLoading(null);
    }
  }

  async function removeSuppression(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/email/suppressions/${id}`, { method: 'DELETE' });
      fetchSuppressions();
    } finally {
      setActionLoading(null);
    }
  }

  async function addSuppression() {
    if (!newSuppressionEmail.trim()) return;
    setActionLoading('add-suppression');
    try {
      const res = await fetch('/api/admin/email/suppressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newSuppressionEmail.trim().toLowerCase(),
          reason: newSuppressionReason,
        }),
      });
      if (res.ok) {
        setNewSuppressionEmail('');
        setNewSuppressionReason('manual');
        setShowAddForm(false);
        fetchSuppressions();
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function testProvider(id: string) {
    setActionLoading(id);
    try {
      await fetch(`/api/admin/email/providers/${id}/test`, { method: 'POST' });
      fetchProviders();
    } finally {
      setActionLoading(null);
    }
  }

  function handleMessageSearch() {
    fetchMessages(messageSearch || undefined);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Back</WarmButton>
            </Link>
            <Mail className="h-6 w-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Email System</h1>
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchCurrentTab}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {/* ================================================================= */}
        {/* Messages Tab                                                      */}
        {/* ================================================================= */}
        {tab === 'messages' && (
          <>
            {/* Search bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  placeholder="Filter by recipient email..."
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleMessageSearch()}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                />
              </div>
              <WarmButton variant="outline" size="sm" onClick={handleMessageSearch}>
                Search
              </WarmButton>
            </div>

            <WarmCard padding="none">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">Loading...</div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-secondary)]">
                  <Mail className="h-8 w-8 opacity-30" />
                  <p>No messages found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                      <tr className="text-left text-[var(--text-secondary)]">
                        <th className="px-4 py-3 font-semibold">To</th>
                        <th className="px-4 py-3 font-semibold">Subject</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Provider</th>
                        <th className="px-4 py-3 font-semibold">Sent At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {messages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-[var(--surface)] transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate">
                            {msg.to}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[250px] truncate">
                            {msg.subject}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                MESSAGE_STATUS_COLORS[msg.status] ?? 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {msg.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs capitalize">
                            {msg.category}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {msg.providerType}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {msg.sentAt
                              ? new Date(msg.sentAt).toLocaleString('et-EE')
                              : msg.createdAt
                                ? new Date(msg.createdAt).toLocaleString('et-EE')
                                : '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </WarmCard>
          </>
        )}

        {/* ================================================================= */}
        {/* Queue Tab                                                         */}
        {/* ================================================================= */}
        {tab === 'queue' && (
          <>
            {/* Status filter */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setJobStatusFilter('')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  jobStatusFilter === ''
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                All
              </button>
              {JOB_STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setJobStatusFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors capitalize ${
                    jobStatusFilter === s
                      ? 'border-[var(--primary)] bg-[var(--primary)] text-white'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <WarmCard padding="none">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">Loading...</div>
              ) : jobs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-secondary)]">
                  <CheckCircle className="h-8 w-8 opacity-30" />
                  <p>No jobs found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                      <tr className="text-left text-[var(--text-secondary)]">
                        <th className="px-4 py-3 font-semibold">To</th>
                        <th className="px-4 py-3 font-semibold">Subject</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Priority</th>
                        <th className="px-4 py-3 font-semibold">Attempts</th>
                        <th className="px-4 py-3 font-semibold">Created</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {jobs.map((job) => (
                        <tr key={job.id} className="hover:bg-[var(--surface)] transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate">
                            {job.to}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] max-w-[200px] truncate">
                            {job.subject}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                JOB_STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                PRIORITY_COLORS[job.priority] ?? 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {job.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs text-center">
                            {job.attempts}/{job.maxAttempts}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {new Date(job.createdAt).toLocaleString('et-EE')}
                          </td>
                          <td className="px-4 py-3">
                            {(job.status === 'dead' || job.status === 'failed') && (
                              <WarmButton
                                size="sm"
                                variant="outline"
                                isLoading={actionLoading === job.id}
                                onClick={() => retryJob(job.id)}
                              >
                                <RotateCcw className="h-3 w-3 mr-1" /> Retry
                              </WarmButton>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </WarmCard>

            {/* Error details for dead/failed jobs */}
            {jobs.some((j) => j.lastError && (j.status === 'dead' || j.status === 'failed')) && (
              <WarmCard padding="lg">
                <p className="text-sm font-semibold text-[var(--text-secondary)] mb-3">Recent Errors</p>
                <div className="space-y-2">
                  {jobs
                    .filter((j) => j.lastError && (j.status === 'dead' || j.status === 'failed'))
                    .slice(0, 5)
                    .map((j) => (
                      <div key={j.id} className="flex items-start gap-2 text-xs">
                        <XCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-[var(--text-primary)]">{j.to}</span>
                          <span className="text-[var(--text-secondary)]"> &mdash; </span>
                          <span className="text-red-600">{j.lastError}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </WarmCard>
            )}
          </>
        )}

        {/* ================================================================= */}
        {/* Suppressions Tab                                                  */}
        {/* ================================================================= */}
        {tab === 'suppressions' && (
          <>
            {/* Add suppression form */}
            <div className="flex items-center gap-2">
              {showAddForm ? (
                <div className="flex gap-2 flex-wrap items-end flex-1">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={newSuppressionEmail}
                      onChange={(e) => setNewSuppressionEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addSuppression()}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    />
                  </div>
                  <div className="min-w-[160px]">
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Reason</label>
                    <select
                      value={newSuppressionReason}
                      onChange={(e) => setNewSuppressionReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                    >
                      {SUPPRESSION_REASONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <WarmButton
                    size="sm"
                    variant="primary"
                    isLoading={actionLoading === 'add-suppression'}
                    onClick={addSuppression}
                  >
                    Add
                  </WarmButton>
                  <WarmButton size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </WarmButton>
                </div>
              ) : (
                <WarmButton size="sm" variant="outline" onClick={() => setShowAddForm(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Add Suppression
                </WarmButton>
              )}
            </div>

            <WarmCard padding="none">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-[var(--text-secondary)]">Loading...</div>
              ) : suppressions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-2 text-[var(--text-secondary)]">
                  <ShieldCheck className="h-8 w-8 opacity-30" />
                  <p>No suppressions found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                      <tr className="text-left text-[var(--text-secondary)]">
                        <th className="px-4 py-3 font-semibold">Email</th>
                        <th className="px-4 py-3 font-semibold">Reason</th>
                        <th className="px-4 py-3 font-semibold">Source</th>
                        <th className="px-4 py-3 font-semibold">Created</th>
                        <th className="px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {suppressions.map((sup) => (
                        <tr key={sup.id} className="hover:bg-[var(--surface)] transition-colors">
                          <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{sup.email}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                              {sup.reason.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs capitalize">
                            {sup.source}
                          </td>
                          <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                            {new Date(sup.createdAt).toLocaleString('et-EE')}
                          </td>
                          <td className="px-4 py-3">
                            <WarmButton
                              size="sm"
                              variant="ghost"
                              isLoading={actionLoading === sup.id}
                              onClick={() => removeSuppression(sup.id)}
                            >
                              <Trash2 className="h-3 w-3 mr-1 text-red-500" /> Remove
                            </WarmButton>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </WarmCard>
          </>
        )}

        {/* ================================================================= */}
        {/* Providers Tab                                                     */}
        {/* ================================================================= */}
        {tab === 'providers' && (
          <>
            {loading ? (
              <WarmCard>
                <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Loading...</div>
              </WarmCard>
            ) : providers.length === 0 ? (
              <WarmCard>
                <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-secondary)]">
                  <Server className="h-8 w-8 opacity-30" />
                  <p>No providers configured</p>
                </div>
              </WarmCard>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((prov) => (
                  <WarmCard key={prov.id} padding="lg">
                    <div className="space-y-3">
                      {/* Provider header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[var(--text-primary)]">{prov.name}</p>
                            {prov.isPrimary && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                                Primary
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5 capitalize">
                            {prov.provider} provider
                          </p>
                        </div>
                        {HEALTH_STATUS_ICON[prov.healthStatus] ?? <Clock className="h-5 w-5 text-gray-400" />}
                      </div>

                      {/* Status badges */}
                      <div className="flex gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            prov.healthStatus === 'healthy'
                              ? 'bg-green-100 text-green-700'
                              : prov.healthStatus === 'degraded'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {prov.healthStatus}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            prov.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {prov.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Priority + last check */}
                      <div className="text-xs text-[var(--text-secondary)] space-y-1">
                        <p>Priority: {prov.priority}</p>
                        {prov.lastCheckedAt && (
                          <p>Last checked: {new Date(prov.lastCheckedAt).toLocaleString('et-EE')}</p>
                        )}
                      </div>

                      {/* Test button */}
                      <WarmButton
                        size="sm"
                        variant="outline"
                        className="w-full"
                        isLoading={actionLoading === prov.id}
                        onClick={() => testProvider(prov.id)}
                      >
                        <Zap className="h-3 w-3 mr-1" /> Test Connection
                      </WarmButton>
                    </div>
                  </WarmCard>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
