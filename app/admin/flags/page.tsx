'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Flag, RefreshCw, Plus, Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: 'off' | 'on' | 'percentage' | 'allowlist';
  rules: any;
  overrideCount: number;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  on: 'bg-green-100 text-green-700',
  off: 'bg-gray-100 text-gray-500',
  percentage: 'bg-blue-100 text-blue-700',
  allowlist: 'bg-purple-100 text-purple-700',
};

const STATUS_OPTIONS = ['off', 'on', 'percentage', 'allowlist'];

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form state
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<string>('off');
  const [newPct, setNewPct] = useState('');

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/flags');
      if (res.ok) {
        const data = await res.json();
        setFlags(data.flags ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlags(); }, [fetchFlags]);

  async function toggleFlag(flag: FeatureFlag) {
    const newStatus = flag.status === 'off' ? 'on' : 'off';
    setActionLoading(flag.id);
    try {
      await fetch(`/api/admin/flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchFlags();
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteFlag(id: string) {
    if (!confirm('Kustuta see feature flag?')) return;
    setActionLoading(id);
    try {
      await fetch(`/api/admin/flags/${id}`, { method: 'DELETE' });
      fetchFlags();
    } finally {
      setActionLoading(null);
    }
  }

  async function createFlag() {
    if (!newKey || !newName) return;
    const body: any = { key: newKey, name: newName, status: newStatus };
    if (newDesc) body.description = newDesc;
    if (newStatus === 'percentage' && newPct) {
      body.rules = { percentage: parseInt(newPct) };
    }
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewKey(''); setNewName(''); setNewDesc(''); setNewStatus('off'); setNewPct('');
        fetchFlags();
      }
    } catch { /* ignore */ }
  }

  async function updateStatus(flag: FeatureFlag, status: string) {
    setActionLoading(flag.id);
    try {
      const body: any = { status };
      if (status === 'percentage' && flag.rules?.percentage) {
        body.rules = flag.rules;
      }
      await fetch(`/api/admin/flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      fetchFlags();
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Tagasi</WarmButton>
            </Link>
            <Flag className="h-6 w-6 text-purple-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Feature Flags</h1>
          </div>
          <div className="flex gap-2">
            <WarmButton variant="outline" size="sm" onClick={fetchFlags}>
              <RefreshCw className="h-4 w-4" />
            </WarmButton>
            <WarmButton size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus className="h-4 w-4 mr-1" /> Uus flag
            </WarmButton>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <WarmCard padding="lg">
            <h2 className="font-semibold text-[var(--text-primary)] mb-4">Uus Feature Flag</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ff-key">Võti (key)</Label>
                <Input
                  id="ff-key"
                  value={newKey}
                  onChange={e => setNewKey(e.target.value)}
                  placeholder="feature.my-feature"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="ff-name">Nimi</Label>
                <Input
                  id="ff-name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="My Feature"
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="ff-desc">Kirjeldus (vabatahtlik)</Label>
                <Input
                  id="ff-desc"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Mida see flag kontrollib..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Algstaatus</Label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-[var(--border)] text-sm bg-[var(--surface)]"
                >
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {newStatus === 'percentage' && (
                <div>
                  <Label htmlFor="ff-pct">Protsent (0–100)</Label>
                  <Input
                    id="ff-pct"
                    type="number"
                    min="0" max="100"
                    value={newPct}
                    onChange={e => setNewPct(e.target.value)}
                    placeholder="50"
                    className="mt-1"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-4">
              <WarmButton onClick={createFlag}>Loo flag</WarmButton>
              <WarmButton variant="outline" onClick={() => setShowCreate(false)}>Tühista</WarmButton>
            </div>
          </WarmCard>
        )}

        {/* Flags list */}
        {loading ? (
          <WarmCard>
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Laadin...</div>
          </WarmCard>
        ) : flags.length === 0 ? (
          <WarmCard>
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-[var(--text-secondary)]">
              <Flag className="h-8 w-8 opacity-30" />
              <p>Feature flags puuduvad</p>
            </div>
          </WarmCard>
        ) : (
          <div className="space-y-2">
            {flags.map(flag => (
              <WarmCard key={flag.id} padding="none">
                <div className="flex items-center gap-4 px-4 py-3">
                  {/* Toggle */}
                  <button
                    onClick={() => toggleFlag(flag)}
                    disabled={actionLoading === flag.id}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ${
                      flag.status !== 'off' ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      flag.status !== 'off' ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)]">{flag.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[flag.status]}`}>
                        {flag.status}
                      </span>
                      {flag.status === 'percentage' && flag.rules?.percentage != null && (
                        <span className="text-xs text-[var(--text-secondary)]">{flag.rules.percentage}%</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <code className="text-xs text-[var(--text-secondary)] font-mono">{flag.key}</code>
                      {flag.description && (
                        <span className="text-xs text-[var(--text-secondary)] truncate">{flag.description}</span>
                      )}
                      {flag.overrideCount > 0 && (
                        <span className="text-xs text-purple-600">{flag.overrideCount} override</span>
                      )}
                    </div>
                  </div>

                  {/* Status select */}
                  <select
                    value={flag.status}
                    onChange={e => updateStatus(flag, e.target.value)}
                    disabled={actionLoading === flag.id}
                    className="text-xs px-2 py-1 rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)]"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>

                  {/* Expand/delete */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setExpandedId(expandedId === flag.id ? null : flag.id)}
                      className="p-1.5 rounded hover:bg-[var(--border)] text-[var(--text-secondary)]"
                    >
                      {expandedId === flag.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => deleteFlag(flag.id)}
                      disabled={actionLoading === flag.id}
                      className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded: rules */}
                {expandedId === flag.id && (
                  <div className="px-4 pb-4 border-t border-[var(--border)] pt-3">
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Rules / Config</p>
                    <pre className="text-xs bg-[var(--surface)] p-3 rounded-lg overflow-x-auto text-[var(--text-primary)]">
                      {JSON.stringify(flag.rules ?? {}, null, 2)}
                    </pre>
                    <p className="text-xs text-[var(--text-secondary)] mt-2">
                      Loodud: {new Date(flag.createdAt).toLocaleDateString('et-EE')}
                      {' · '}
                      <Link href={`/api/admin/flags/${flag.id}/overrides`} target="_blank" className="text-[var(--primary)] hover:underline">
                        Vaata overrides →
                      </Link>
                    </p>
                  </div>
                )}
              </WarmCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
