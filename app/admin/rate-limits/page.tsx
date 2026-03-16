'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';
import { Input } from '@/components/ui/input';
import {
  Shield,
  RefreshCw,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react';

interface Offender {
  ip: string;
  hits: number;
  blocked: number;
  lastSeen: string;
  userId?: string;
}

interface EndpointStat {
  endpoint: string;
  total: number;
  blocked: number;
  utilization: number;
}

export default function RateLimitsDashboardPage() {
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalBlocked, setTotalBlocked] = useState(0);
  const [offenders, setOffenders] = useState<Offender[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointStat[]>([]);
  const [blocklist, setBlocklist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [newIp, setNewIp] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/rate-limits?hours=${hours}`);
      if (res.ok) {
        const data = await res.json();
        setTotalEvents(data.totalEvents ?? 0);
        setTotalBlocked(data.totalBlocked ?? 0);
        setOffenders(data.topOffenders ?? []);
        setEndpoints(data.endpointUtilization ?? []);
        setBlocklist(data.blocklist ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleBlocklistAction(action: 'add' | 'remove', ip: string) {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ip }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlocklist(data.blocklist ?? []);
        setNewIp('');
      }
    } finally {
      setActionLoading(false);
    }
  }

  const maxEndpointTotal = Math.max(...endpoints.map((e) => e.total), 1);

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
            <Shield className="h-6 w-6 text-blue-500" />
            <h1 className="text-2xl font-bold text-[var(--text)]">Rate Limiting</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
              {[1, 6, 24, 72, 168].map((h) => (
                <button
                  key={h}
                  onClick={() => setHours(h)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    hours === h
                      ? 'bg-[var(--primary)] text-white'
                      : 'bg-white text-[var(--text-muted)] hover:bg-[var(--surface-dim)]'
                  }`}
                >
                  {h < 24 ? `${h}h` : `${h / 24}d`}
                </button>
              ))}
            </div>
            <WarmButton variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4" />
            </WarmButton>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <WarmCard padding="lg" className="bg-white border-b-4 border-b-blue-400">
            <div className="text-sm text-[var(--text-muted)]">Total Events</div>
            <div className="text-2xl font-bold text-[var(--text)] mt-1">{totalEvents.toLocaleString()}</div>
          </WarmCard>
          <WarmCard padding="lg" className="bg-white border-b-4 border-b-red-400">
            <div className="text-sm text-[var(--text-muted)]">Blocked Requests</div>
            <div className="text-2xl font-bold text-[var(--text)] mt-1">{totalBlocked.toLocaleString()}</div>
          </WarmCard>
          <WarmCard padding="lg" className="bg-white border-b-4 border-b-green-400">
            <div className="text-sm text-[var(--text-muted)]">Blocked IPs</div>
            <div className="text-2xl font-bold text-[var(--text)] mt-1">{blocklist.length}</div>
          </WarmCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Offenders */}
          <WarmCard padding="none" className="bg-white">
            <div className="px-4 py-3 border-b border-[var(--border)]">
              <h2 className="text-base font-semibold text-[var(--text)]">Top Offenders</h2>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">Loading...</div>
            ) : offenders.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">No offenders found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface)]">
                    <tr className="text-left text-[var(--text-muted)]">
                      <th className="px-4 py-2 font-semibold">IP</th>
                      <th className="px-4 py-2 font-semibold text-right">Hits</th>
                      <th className="px-4 py-2 font-semibold text-right">Blocked</th>
                      <th className="px-4 py-2 font-semibold">Last Seen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {offenders.slice(0, 10).map((o) => (
                      <tr key={o.ip} className="hover:bg-[var(--surface)] transition-colors">
                        <td className="px-4 py-2 font-mono text-xs text-[var(--text)]">{o.ip}</td>
                        <td className="px-4 py-2 text-right text-[var(--text)]">{o.hits}</td>
                        <td className="px-4 py-2 text-right">
                          <span className={o.blocked > 0 ? 'text-red-600 font-medium' : 'text-[var(--text-muted)]'}>
                            {o.blocked}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[var(--text-muted)] text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {o.lastSeen ? new Date(o.lastSeen).toLocaleString() : '-'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </WarmCard>

          {/* Endpoint Utilization */}
          <WarmCard padding="lg" className="bg-white">
            <h2 className="text-base font-semibold text-[var(--text)] mb-4">Endpoint Utilization</h2>
            {endpoints.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-[var(--text-muted)]">No data</div>
            ) : (
              <div className="space-y-3">
                {endpoints.slice(0, 10).map((ep) => (
                  <div key={ep.endpoint}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[var(--text)] font-medium truncate max-w-[200px]">{ep.endpoint}</span>
                      <span className="text-[var(--text-muted)]">{ep.total} req ({ep.blocked} blocked)</span>
                    </div>
                    <div className="w-full bg-[var(--surface-dim)] rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(ep.total / maxEndpointTotal) * 100}%`,
                          backgroundColor: ep.utilization > 50 ? '#ef4444' : ep.utilization > 20 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WarmCard>
        </div>

        {/* IP Blocklist Management */}
        <WarmCard padding="lg" className="bg-white">
          <h2 className="text-base font-semibold text-[var(--text)] mb-4">IP Blocklist</h2>

          {/* Add IP */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="Enter IP address to block..."
              className="max-w-xs"
            />
            <WarmButton
              size="sm"
              variant="primary"
              disabled={!newIp.trim() || actionLoading}
              onClick={() => handleBlocklistAction('add', newIp.trim())}
            >
              <Plus className="h-4 w-4 mr-1" />
              Block
            </WarmButton>
          </div>

          {/* Blocklist */}
          {blocklist.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No IPs blocked.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blocklist.map((ip) => (
                <div
                  key={ip}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm"
                >
                  <span className="font-mono text-red-700">{ip}</span>
                  <button
                    onClick={() => handleBlocklistAction('remove', ip)}
                    disabled={actionLoading}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </WarmCard>
      </div>
    </div>
  );
}
