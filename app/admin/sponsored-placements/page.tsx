'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Plus, Pause, Play, Trash2, BarChart3,
  DollarSign, Eye, MousePointer, Calendar, ArrowLeft,
} from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { showConfirm } from '@/lib/confirm-helpers';

type Placement = {
  id: string;
  sponsorName: string;
  merchantId: string | null;
  merchant: { id: string; name: string; slug: string } | null;
  targetCategories: string[];
  targetOccasions: string[];
  budgetCents: number;
  spentCents: number;
  clickCount: number;
  impressionCount: number;
  clickLimit: number | null;
  impressionsLimit: number | null;
  priority: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  ctr: number;
  spendRate: number;
  isLive: boolean;
  createdAt: string;
};

type PlacementStats = {
  id: string;
  sponsorName: string;
  status: string;
  budgetCents: number;
  spentCents: number;
  remainingBudgetCents: number;
  spendRate: number;
  dailySpendRateCents: number;
  projectedTotalSpendCents: number;
  projectedOverBudget: boolean;
  impressionCount: number;
  clickCount: number;
  ctr: number;
  totalDays: number;
  elapsedDays: number;
  daysRemaining: number;
};

const STATUS_BADGE: Record<string, string> = {
  live: 'bg-green-100 text-green-700',
  paused: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-gray-100 text-gray-600',
  pending: 'bg-blue-100 text-blue-700',
};

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'EUR' });
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatus(p: Placement): string {
  if (!p.isActive) return 'paused';
  const now = new Date();
  if (new Date(p.endAt) < now) return 'expired';
  if (new Date(p.startAt) > now) return 'pending';
  return 'live';
}

export default function SponsoredPlacementsPage() {
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statsCache, setStatsCache] = useState<Record<string, PlacementStats>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form state
  const [newSponsor, setNewSponsor] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newStartAt, setNewStartAt] = useState('');
  const [newEndAt, setNewEndAt] = useState('');
  const [newCategories, setNewCategories] = useState('');
  const [newOccasions, setNewOccasions] = useState('');
  const [newPriority, setNewPriority] = useState('0');

  // Edit form state
  const [editSponsor, setEditSponsor] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editStartAt, setEditStartAt] = useState('');
  const [editEndAt, setEditEndAt] = useState('');
  const [editCategories, setEditCategories] = useState('');
  const [editOccasions, setEditOccasions] = useState('');
  const [editPriority, setEditPriority] = useState('0');

  const fetchPlacements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/sponsored-placements');
      if (res.ok) {
        const data = await res.json();
        setPlacements(data.placements ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPlacements(); }, [fetchPlacements]);

  async function fetchStats(id: string) {
    const res = await fetch(`/api/admin/sponsored-placements/${id}/stats`);
    if (res.ok) {
      const data = await res.json();
      setStatsCache((prev) => ({ ...prev, [id]: data.stats }));
    }
  }

  async function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!statsCache[id]) await fetchStats(id);
    }
  }

  async function toggleActive(p: Placement) {
    setActionLoading(p.id);
    try {
      await fetch(`/api/admin/sponsored-placements/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      await fetchPlacements();
    } finally {
      setActionLoading(null);
    }
  }

  async function deletePlacement(id: string) {
    showConfirm('Deactivate this sponsored placement?', async () => {
      setActionLoading(id);
      try {
        await fetch(`/api/admin/sponsored-placements/${id}`, { method: 'DELETE' });
        await fetchPlacements();
      } finally {
        setActionLoading(null);
      }
    }, { variant: 'destructive' });
    return;
  }

  function startEditing(p: Placement) {
    setEditingId(p.id);
    setEditSponsor(p.sponsorName);
    setEditBudget(String(p.budgetCents / 100));
    setEditStartAt(new Date(p.startAt).toISOString().slice(0, 10));
    setEditEndAt(new Date(p.endAt).toISOString().slice(0, 10));
    setEditCategories(p.targetCategories.join(', '));
    setEditOccasions(p.targetOccasions.join(', '));
    setEditPriority(String(p.priority));
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setActionLoading(editingId);
    try {
      await fetch(`/api/admin/sponsored-placements/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorName: editSponsor.trim(),
          budgetCents: Math.round(parseFloat(editBudget) * 100),
          startAt: new Date(editStartAt).toISOString(),
          endAt: new Date(editEndAt).toISOString(),
          targetCategories: editCategories.split(',').map(s => s.trim()).filter(Boolean),
          targetOccasions: editOccasions.split(',').map(s => s.trim()).filter(Boolean),
          priority: parseInt(editPriority, 10) || 0,
        }),
      });
      setEditingId(null);
      await fetchPlacements();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newSponsor.trim() || !newBudget || !newStartAt || !newEndAt) return;
    setActionLoading('create');
    try {
      const res = await fetch('/api/admin/sponsored-placements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsorName: newSponsor.trim(),
          budgetCents: Math.round(parseFloat(newBudget) * 100),
          startAt: new Date(newStartAt).toISOString(),
          endAt: new Date(newEndAt).toISOString(),
          targetCategories: newCategories.split(',').map(s => s.trim()).filter(Boolean),
          targetOccasions: newOccasions.split(',').map(s => s.trim()).filter(Boolean),
          priority: parseInt(newPriority, 10) || 0,
        }),
      });
      if (res.ok) {
        setNewSponsor('');
        setNewBudget('');
        setNewStartAt('');
        setNewEndAt('');
        setNewCategories('');
        setNewOccasions('');
        setNewPriority('0');
        setShowCreate(false);
        await fetchPlacements();
      }
    } finally {
      setActionLoading(null);
    }
  }

  // Summary stats
  const activePlacements = placements.filter(p => getStatus(p) === 'live');
  const totalBudget = placements.reduce((s, p) => s + p.budgetCents, 0);
  const totalSpent = placements.reduce((s, p) => s + p.spentCents, 0);
  const totalImpressions = placements.reduce((s, p) => s + p.impressionCount, 0);
  const totalClicks = placements.reduce((s, p) => s + p.clickCount, 0);
  const avgCtr = totalImpressions > 0
    ? Math.round((totalClicks / totalImpressions) * 10000) / 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-[var(--text-muted)] hover:text-[var(--text)]">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Megaphone className="h-6 w-6 text-[var(--primary)]" />
          <h1 className="text-2xl font-bold text-[var(--text)]">Sponsored Placements</h1>
        </div>
        <WarmButton size="sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus className="h-4 w-4" />
          {showCreate ? 'Cancel' : 'New Placement'}
        </WarmButton>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Active', value: activePlacements.length, icon: Play, color: 'text-green-600' },
          { label: 'Total Budget', value: formatCents(totalBudget), icon: DollarSign, color: 'text-blue-600' },
          { label: 'Total Spent', value: formatCents(totalSpent), icon: DollarSign, color: 'text-amber-600' },
          { label: 'Impressions', value: totalImpressions.toLocaleString(), icon: Eye, color: 'text-purple-600' },
          { label: 'Avg CTR', value: `${avgCtr}%`, icon: MousePointer, color: 'text-rose-600' },
        ].map((s) => (
          <WarmCard key={s.label} padding="sm">
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-[var(--text-muted)]">{s.label}</span>
            </div>
            <p className="text-lg font-bold text-[var(--text)] mt-1">{s.value}</p>
          </WarmCard>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <WarmCard>
          <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Create Sponsored Placement</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Sponsor Name *</Label>
              <Input value={newSponsor} onChange={(e) => setNewSponsor(e.target.value)} placeholder="e.g. Coca-Cola" required />
            </div>
            <div className="space-y-1">
              <Label>Budget (EUR) *</Label>
              <Input type="number" step="0.01" min="0.01" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="500.00" required />
            </div>
            <div className="space-y-1">
              <Label>Start Date *</Label>
              <Input type="date" value={newStartAt} onChange={(e) => setNewStartAt(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>End Date *</Label>
              <Input type="date" value={newEndAt} onChange={(e) => setNewEndAt(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Target Categories</Label>
              <Input value={newCategories} onChange={(e) => setNewCategories(e.target.value)} placeholder="Food, Experiences, Fashion (comma-separated)" />
            </div>
            <div className="space-y-1">
              <Label>Target Occasions</Label>
              <Input value={newOccasions} onChange={(e) => setNewOccasions(e.target.value)} placeholder="Birthday, Christmas (comma-separated)" />
            </div>
            <div className="space-y-1">
              <Label>Priority</Label>
              <Input type="number" value={newPriority} onChange={(e) => setNewPriority(e.target.value)} placeholder="0" />
            </div>
            <div className="flex items-end">
              <WarmButton type="submit" isLoading={actionLoading === 'create'} fullWidth>
                Create Placement
              </WarmButton>
            </div>
          </form>
        </WarmCard>
      )}

      {/* Placements Table */}
      {loading ? (
        <WarmCard>
          <p className="text-center text-[var(--text-muted)] py-8">Loading placements...</p>
        </WarmCard>
      ) : placements.length === 0 ? (
        <WarmCard>
          <p className="text-center text-[var(--text-muted)] py-8">No sponsored placements yet.</p>
        </WarmCard>
      ) : (
        <WarmCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">Sponsor</th>
                  <th className="px-4 py-3 font-medium">Budget / Spent</th>
                  <th className="px-4 py-3 font-medium">Impressions</th>
                  <th className="px-4 py-3 font-medium">Clicks</th>
                  <th className="px-4 py-3 font-medium">CTR</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date Range</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {placements.map((p) => {
                  const status = getStatus(p);
                  const isExpanded = expandedId === p.id;
                  const isEditing = editingId === p.id;

                  return (
                    <tr key={p.id} className="border-b border-[var(--border)] last:border-0">
                      <td colSpan={8} className="p-0">
                        {/* Main row */}
                        <div className="grid grid-cols-8 items-center">
                          <div className="px-4 py-3">
                            <button
                              onClick={() => toggleExpand(p.id)}
                              className="font-medium text-[var(--text)] hover:text-[var(--primary)] text-left"
                            >
                              {p.sponsorName}
                            </button>
                            {p.merchant && (
                              <p className="text-xs text-[var(--text-muted)]">{p.merchant.name}</p>
                            )}
                          </div>
                          <div className="px-4 py-3 text-[var(--text)]">
                            <span className="font-medium">{formatCents(p.budgetCents)}</span>
                            <span className="text-[var(--text-muted)]"> / {formatCents(p.spentCents)}</span>
                          </div>
                          <div className="px-4 py-3 text-[var(--text)]">{p.impressionCount.toLocaleString()}</div>
                          <div className="px-4 py-3 text-[var(--text)]">{p.clickCount.toLocaleString()}</div>
                          <div className="px-4 py-3 text-[var(--text)]">{p.ctr}%</div>
                          <div className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status] || 'bg-gray-100 text-gray-600'}`}>
                              {status}
                            </span>
                          </div>
                          <div className="px-4 py-3 text-xs text-[var(--text-muted)]">
                            {formatDate(p.startAt)} - {formatDate(p.endAt)}
                          </div>
                          <div className="px-4 py-3 flex gap-1">
                            <button
                              onClick={() => toggleActive(p)}
                              disabled={actionLoading === p.id}
                              className="p-1.5 rounded hover:bg-[var(--surface-dim)] text-[var(--text-muted)] hover:text-[var(--text)]"
                              title={p.isActive ? 'Pause' : 'Resume'}
                            >
                              {p.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => startEditing(p)}
                              className="p-1.5 rounded hover:bg-[var(--surface-dim)] text-[var(--text-muted)] hover:text-[var(--text)]"
                              title="Edit"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deletePlacement(p.id)}
                              disabled={actionLoading === p.id}
                              className="p-1.5 rounded hover:bg-red-50 text-[var(--text-muted)] hover:text-red-600"
                              title="Deactivate"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Edit form */}
                        {isEditing && (
                          <div className="px-4 pb-4 border-t border-[var(--border)] bg-[var(--surface-dim)]/30">
                            <form onSubmit={handleEdit} className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                              <div className="space-y-1">
                                <Label>Sponsor Name</Label>
                                <Input value={editSponsor} onChange={(e) => setEditSponsor(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label>Budget (EUR)</Label>
                                <Input type="number" step="0.01" value={editBudget} onChange={(e) => setEditBudget(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label>Priority</Label>
                                <Input type="number" value={editPriority} onChange={(e) => setEditPriority(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label>Start Date</Label>
                                <Input type="date" value={editStartAt} onChange={(e) => setEditStartAt(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label>End Date</Label>
                                <Input type="date" value={editEndAt} onChange={(e) => setEditEndAt(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label>Categories (comma-sep)</Label>
                                <Input value={editCategories} onChange={(e) => setEditCategories(e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label>Occasions (comma-sep)</Label>
                                <Input value={editOccasions} onChange={(e) => setEditOccasions(e.target.value)} />
                              </div>
                              <div className="flex items-end gap-2 col-span-2">
                                <WarmButton type="submit" size="sm" isLoading={actionLoading === editingId}>
                                  Save Changes
                                </WarmButton>
                                <WarmButton type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                  Cancel
                                </WarmButton>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Expanded stats */}
                        {isExpanded && statsCache[p.id] && (
                          <div className="px-4 pb-4 border-t border-[var(--border)] bg-[var(--surface-dim)]/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">Daily Spend Rate</p>
                                <p className="font-semibold text-[var(--text)]">{formatCents(statsCache[p.id].dailySpendRateCents)}/day</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">Remaining Budget</p>
                                <p className="font-semibold text-[var(--text)]">{formatCents(statsCache[p.id].remainingBudgetCents)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">Days Remaining</p>
                                <p className="font-semibold text-[var(--text)]">{statsCache[p.id].daysRemaining}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">Projected Total Spend</p>
                                <p className={`font-semibold ${statsCache[p.id].projectedOverBudget ? 'text-red-600' : 'text-[var(--text)]'}`}>
                                  {formatCents(statsCache[p.id].projectedTotalSpendCents)}
                                  {statsCache[p.id].projectedOverBudget && ' (over budget)'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">Spend Rate</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-[var(--primary)] rounded-full transition-all"
                                      style={{ width: `${Math.min(100, statsCache[p.id].spendRate)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-[var(--text)]">{statsCache[p.id].spendRate}%</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">Elapsed / Total Days</p>
                                <p className="font-semibold text-[var(--text)]">{statsCache[p.id].elapsedDays} / {statsCache[p.id].totalDays}</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">CTR</p>
                                <p className="font-semibold text-[var(--text)]">{statsCache[p.id].ctr}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-[var(--text-muted)]">Status</p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[statsCache[p.id].status] || 'bg-gray-100 text-gray-600'}`}>
                                  {statsCache[p.id].status}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </WarmCard>
      )}
    </div>
  );
}
