'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Activity, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, RotateCcw, Database, Server } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

type HealthService = {
  name: string;
  status: 'ok' | 'degraded' | 'down' | string;
  latencyMs?: number;
  message?: string;
};

type Job = {
  id: string;
  name: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
};

type Migration = {
  id: string;
  migration_name: string;
  finished_at: string | null;
  applied_steps_count: number;
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  ok: <CheckCircle className="h-5 w-5 text-green-500" />,
  degraded: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  down: <XCircle className="h-5 w-5 text-red-500" />,
};

const JOB_STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-gray-100 text-gray-600',
};

export default function OpsClient() {
  const [health, setHealth] = useState<{ services?: HealthService[]; overall?: string } | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [metrics, setMetrics] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryLoading, setRetryLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'health' | 'jobs' | 'migrations' | 'metrics'>('health');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [healthRes, jobsRes, migrationsRes, metricsRes] = await Promise.allSettled([
        fetch('/api/admin/ops/health'),
        fetch('/api/admin/ops/jobs'),
        fetch('/api/admin/ops/migrations'),
        fetch('/api/admin/ops/metrics'),
      ]);

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        setHealth(await healthRes.value.json());
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value.ok) {
        const data = await jobsRes.value.json();
        setJobs(data.jobs ?? data.data ?? []);
      }
      if (migrationsRes.status === 'fulfilled' && migrationsRes.value.ok) {
        const data = await migrationsRes.value.json();
        setMigrations(data.migrations ?? data.data ?? []);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        setMetrics(await metricsRes.value.json());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function retryJob(id: string) {
    setRetryLoading(id);
    try {
      await fetch(`/api/admin/ops/jobs/${id}/retry`, { method: 'POST' });
      fetchAll();
    } finally {
      setRetryLoading(null);
    }
  }

  const TABS = [
    { key: 'health' as const, label: 'Health' },
    { key: 'jobs' as const, label: 'Jobs' },
    { key: 'migrations' as const, label: 'Migrations' },
    { key: 'metrics' as const, label: 'Metrics' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">← Tagasi</WarmButton>
            </Link>
            <Activity className="h-6 w-6 text-green-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Operations</h1>
            {health?.overall && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                health.overall === 'ok' ? 'bg-green-100 text-green-700' :
                health.overall === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-700'
              }`}>
                {health.overall}
              </span>
            )}
          </div>
          <WarmButton variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" />
          </WarmButton>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[var(--border)]">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <WarmCard>
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Laadin...</div>
          </WarmCard>
        ) : (
          <>
            {/* Health */}
            {tab === 'health' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {(health?.services ?? []).length === 0 ? (
                  <WarmCard className="col-span-full">
                    <p className="text-[var(--text-secondary)] text-center py-8">Health data puudub</p>
                  </WarmCard>
                ) : (
                  (health?.services ?? []).map((svc, i) => (
                    <WarmCard key={i} padding="md">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)] capitalize">{svc.name}</p>
                          <p className={`text-sm mt-0.5 capitalize ${
                            svc.status === 'ok' ? 'text-green-600' :
                            svc.status === 'degraded' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {svc.status}
                          </p>
                          {svc.latencyMs != null && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{svc.latencyMs}ms</p>
                          )}
                          {svc.message && (
                            <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{svc.message}</p>
                          )}
                        </div>
                        {STATUS_ICON[svc.status] ?? <Clock className="h-5 w-5 text-gray-400" />}
                      </div>
                    </WarmCard>
                  ))
                )}
              </div>
            )}

            {/* Jobs */}
            {tab === 'jobs' && (
              <WarmCard padding="none">
                {jobs.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Töid ei leitud</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                        <tr className="text-left text-[var(--text-secondary)]">
                          <th className="px-4 py-3 font-semibold">Töö nimi</th>
                          <th className="px-4 py-3 font-semibold">Staatus</th>
                          <th className="px-4 py-3 font-semibold">Alustatud</th>
                          <th className="px-4 py-3 font-semibold">Kestus</th>
                          <th className="px-4 py-3 font-semibold">Viga</th>
                          <th className="px-4 py-3 font-semibold">Tegevused</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {jobs.map(job => (
                          <tr key={job.id} className="hover:bg-[var(--surface)] transition-colors">
                            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{job.name}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-600'}`}>
                                {job.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                              {new Date(job.startedAt).toLocaleString('et-EE')}
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                              {job.durationMs != null ? `${job.durationMs}ms` : '—'}
                            </td>
                            <td className="px-4 py-3 text-red-600 text-xs max-w-[200px] truncate">
                              {job.error ?? '—'}
                            </td>
                            <td className="px-4 py-3">
                              {job.status === 'failed' && (
                                <WarmButton
                                  size="sm"
                                  variant="outline"
                                  isLoading={retryLoading === job.id}
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
            )}

            {/* Migrations */}
            {tab === 'migrations' && (
              <WarmCard padding="none">
                {migrations.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Migratsioone ei leitud</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
                        <tr className="text-left text-[var(--text-secondary)]">
                          <th className="px-4 py-3 font-semibold">Migratsioon</th>
                          <th className="px-4 py-3 font-semibold">Staatus</th>
                          <th className="px-4 py-3 font-semibold">Sammud</th>
                          <th className="px-4 py-3 font-semibold">Rakendatud</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {migrations.map((m, i) => (
                          <tr key={m.id ?? i} className="hover:bg-[var(--surface)] transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-[var(--text-primary)]">{m.migration_name}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m.finished_at ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>
                                {m.finished_at ? 'applied' : 'pending'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-secondary)]">{m.applied_steps_count}</td>
                            <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                              {m.finished_at ? new Date(m.finished_at).toLocaleDateString('et-EE') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </WarmCard>
            )}

            {/* Metrics */}
            {tab === 'metrics' && (
              <WarmCard padding="lg">
                {!metrics ? (
                  <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">Metriikat ei leitud</div>
                ) : (
                  <div className="space-y-6">
                    {/* Live gauges — DB-backed, rendered friendly. Raw
                        values are still in the JSON dump below for power users. */}
                    {Array.isArray(metrics.gauges) && metrics.gauges.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-[var(--text-secondary)]">Live gauges</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {metrics.gauges.map((g: { name: string; help: string; values: Array<{ labels: Record<string, string>; value: number }> }) => (
                            <div key={g.name} className="border border-[var(--border)] rounded-lg p-4 bg-[var(--surface)]">
                              <p className="font-mono text-xs text-[var(--text-secondary)]">{g.name}</p>
                              <p className="text-xs text-[var(--text-secondary)] mb-2">{g.help}</p>
                              {g.values.length === 0 ? (
                                <p className="text-sm text-[var(--text-secondary)]">—</p>
                              ) : (
                                <ul className="space-y-1">
                                  {g.values.map((v, i) => {
                                    const labelStr = Object.entries(v.labels)
                                      .map(([k, val]) => `${k}=${val}`)
                                      .join(' ');
                                    return (
                                      <li key={i} className="flex justify-between text-sm">
                                        <span className="text-[var(--text-secondary)] font-mono text-xs">{labelStr || '(no labels)'}</span>
                                        <span className="font-semibold text-[var(--text-primary)]">{v.value.toLocaleString()}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-[var(--text-secondary)]">Raw metrics</p>
                      <pre className="text-xs bg-[var(--surface)] p-4 rounded-lg overflow-x-auto text-[var(--text-primary)] max-h-[500px]">
                        {JSON.stringify(metrics, null, 2)}
                      </pre>
                    </div>

                    <Link href="/api/admin/ops/metrics/prometheus" target="_blank">
                      <WarmButton variant="outline" size="sm">Prometheus format →</WarmButton>
                    </Link>
                  </div>
                )}
              </WarmCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
