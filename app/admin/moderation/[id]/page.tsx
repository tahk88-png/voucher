'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, UserX, AlertCircle, Ban, CheckCircle, XCircle, Shield } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type Report = {
  id: string;
  category: string;
  status: string;
  description: string;
  evidenceUrls?: string[];
  createdAt: string;
  reportedBy: { id: string; email: string; name: string } | null;
  reportedUser: { id: string; email: string; name: string } | null;
  moderationActions?: Array<{
    id: string;
    actionType: string;
    reason: string;
    createdAt: string;
  }>;
};

const ACTION_TYPES = [
  { value: 'warning', label: 'Hoiatus', color: 'text-yellow-600' },
  { value: 'content_removal', label: 'Sisu eemaldamine', color: 'text-orange-600' },
  { value: 'suspension', label: 'Peatamine', color: 'text-red-600' },
  { value: 'ban', label: 'Blokeerimine', color: 'text-red-700' },
  { value: 'unban', label: 'Blokeeringu eemaldamine', color: 'text-green-600' },
  { value: 'feature_restriction', label: 'Funktsiooni piiramine', color: 'text-purple-600' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  under_review: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
};

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  // Action form
  const [actionType, setActionType] = useState('warning');
  const [actionReason, setActionReason] = useState('');
  const [actionExpiry, setActionExpiry] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Resolve form
  const [resolution, setResolution] = useState('');
  const [resolveStatus, setResolveStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [resolveLoading, setResolveLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/moderation/reports/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setReport(data); })
      .finally(() => setLoading(false));
  }, [id]);

  async function takeAction() {
    if (!report || !actionReason) return;
    setActionLoading(true);
    setActionError('');
    try {
      const body: any = {
        targetUserId: report.reportedUser?.id,
        reportId: report.id,
        actionType,
        reason: actionReason,
      };
      if (actionExpiry) body.expiresAt = new Date(actionExpiry).toISOString();

      const res = await fetch('/api/admin/moderation/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        setActionError(err.error ?? 'Tegevus ebaõnnestus');
        return;
      }
      // Refresh report
      const updated = await fetch(`/api/admin/moderation/reports/${id}`);
      if (updated.ok) setReport(await updated.json());
      setActionReason('');
      setActionExpiry('');
    } finally {
      setActionLoading(false);
    }
  }

  async function resolveReport() {
    if (!resolution) return;
    setResolveLoading(true);
    try {
      await fetch(`/api/admin/moderation/reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resolve', status: resolveStatus, resolution }),
      });
      router.push('/admin/moderation');
    } finally {
      setResolveLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <p className="text-[var(--text-secondary)]">Laadin...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg)] gap-4">
        <p className="text-[var(--text-secondary)]">Raportit ei leitud</p>
        <Link href="/admin/moderation"><WarmButton>← Tagasi</WarmButton></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/moderation">
            <WarmButton variant="ghost" size="sm">← Tagasi</WarmButton>
          </Link>
          <AlertTriangle className="h-6 w-6 text-orange-500" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Report detail</h1>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status] ?? 'bg-gray-100 text-gray-600'}`}>
            {report.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Report info */}
          <WarmCard padding="lg">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Raporti info</h2>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-[var(--text-secondary)]">Kategooria</dt>
                <dd className="font-medium text-[var(--text-primary)] capitalize mt-0.5">{report.category.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-[var(--text-secondary)]">Kirjeldus</dt>
                <dd className="text-[var(--text-primary)] mt-0.5 whitespace-pre-wrap">{report.description}</dd>
              </div>
              {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                <div>
                  <dt className="text-[var(--text-secondary)]">Tõendid</dt>
                  <dd className="mt-0.5 space-y-1">
                    {report.evidenceUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                        className="block text-[var(--primary)] hover:underline text-xs truncate">
                        {url}
                      </a>
                    ))}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-[var(--text-secondary)]">Kuupäev</dt>
                <dd className="text-[var(--text-primary)] mt-0.5">{new Date(report.createdAt).toLocaleString('et-EE')}</dd>
              </div>
            </dl>
          </WarmCard>

          {/* Users */}
          <div className="space-y-4">
            {report.reportedUser && (
              <WarmCard padding="md">
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">RAPORTEERITUD KASUTAJA</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-sm">
                    {report.reportedUser.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{report.reportedUser.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{report.reportedUser.email}</p>
                    <p className="text-xs text-[var(--text-secondary)] font-mono">{report.reportedUser.id}</p>
                  </div>
                </div>
              </WarmCard>
            )}
            {report.reportedBy && (
              <WarmCard padding="md">
                <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">RAPORTEERIJA</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                    {report.reportedBy.name?.[0] ?? '?'}
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{report.reportedBy.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{report.reportedBy.email}</p>
                  </div>
                </div>
              </WarmCard>
            )}
          </div>
        </div>

        {/* Previous actions */}
        {report.moderationActions && report.moderationActions.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Eelmised tegevused</h2>
            <div className="space-y-3">
              {report.moderationActions.map(action => (
                <div key={action.id} className="flex items-start gap-3 p-3 bg-[var(--surface)] rounded-lg">
                  <Shield className="h-4 w-4 text-[var(--text-secondary)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{action.actionType.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{action.reason}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{new Date(action.createdAt).toLocaleString('et-EE')}</p>
                  </div>
                </div>
              ))}
            </div>
          </WarmCard>
        )}

        {report.status !== 'resolved' && report.status !== 'dismissed' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Take action */}
            <WarmCard padding="lg">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">Võta tegevus</h2>
              <div className="space-y-4">
                <div>
                  <Label>Tegevuse tüüp</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {ACTION_TYPES.map(at => (
                      <button
                        key={at.value}
                        onClick={() => setActionType(at.value)}
                        className={`px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                          actionType === at.value
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                        }`}
                      >
                        {at.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="action-reason">Põhjus *</Label>
                  <textarea
                    id="action-reason"
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    placeholder="Miks see tegevus võetakse..."
                    rows={3}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] resize-none"
                  />
                </div>
                {['suspension', 'ban', 'feature_restriction'].includes(actionType) && (
                  <div>
                    <Label htmlFor="action-expiry">Aegub (vabatahtlik)</Label>
                    <Input
                      id="action-expiry"
                      type="datetime-local"
                      value={actionExpiry}
                      onChange={e => setActionExpiry(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                {actionError && (
                  <p className="text-sm text-red-600">{actionError}</p>
                )}
                <WarmButton
                  fullWidth
                  isLoading={actionLoading}
                  disabled={!actionReason}
                  onClick={takeAction}
                >
                  <UserX className="h-4 w-4 mr-2" /> Rakenda tegevus
                </WarmButton>
              </div>
            </WarmCard>

            {/* Resolve */}
            <WarmCard padding="lg">
              <h2 className="font-semibold text-[var(--text-primary)] mb-4">Sulge raport</h2>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setResolveStatus('resolved')}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors flex items-center justify-center gap-2 ${
                      resolveStatus === 'resolved'
                        ? 'bg-green-500 text-white border-green-500'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <CheckCircle className="h-4 w-4" /> Lahendatud
                  </button>
                  <button
                    onClick={() => setResolveStatus('dismissed')}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors flex items-center justify-center gap-2 ${
                      resolveStatus === 'dismissed'
                        ? 'bg-gray-500 text-white border-gray-500'
                        : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface)]'
                    }`}
                  >
                    <XCircle className="h-4 w-4" /> Tagasi lükatud
                  </button>
                </div>
                <div>
                  <Label htmlFor="resolution">Resolutsioon *</Label>
                  <textarea
                    id="resolution"
                    value={resolution}
                    onChange={e => setResolution(e.target.value)}
                    placeholder="Kuidas see raport lahendati..."
                    rows={4}
                    className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] resize-none"
                  />
                </div>
                <WarmButton
                  fullWidth
                  variant="outline"
                  isLoading={resolveLoading}
                  disabled={!resolution}
                  onClick={resolveReport}
                >
                  Sulge raport
                </WarmButton>
              </div>
            </WarmCard>
          </div>
        )}
      </div>
    </div>
  );
}
