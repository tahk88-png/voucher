'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  AlertTriangle,
  Clock,
  Cpu,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HealthData = {
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
    heapUsedPercent: number;
  };
  uptime: number;
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
  database: { status: string; latencyMs: number; error?: string };
  activeConnectionsEstimate: number;
  timestamp: string;
  disk?: { available: boolean; totalBytes?: number; freeBytes?: number; usedPercent?: number };
  activeSessionsCount: number;
  server: {
    nodeVersion: string;
    platform: string;
    arch: string;
    pid: number;
    uptime: number;
    memoryMB: { rss: number; heapTotal: number; heapUsed: number; external: number };
  };
};

type ApiUsageData = {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgResponseMs: number;
  requestsByHour: { hour: string; count: number; errors: number }[];
  topEndpoints: { endpoint: string; count: number; avgMs: number; errorPercent: number }[];
  slowestEndpoints: { endpoint: string; avgMs: number; count: number }[];
};

type ErrorEntry = {
  id: string;
  timestamp: string;
  level: string;
  action: string;
  endpoint: string | null;
  message: string;
  stackTrace: string | null;
  userId: string;
  statusCode: number | null;
};

type ErrorLogData = {
  entries: ErrorEntry[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function StatusDot({ status }: { status: string }) {
  const color =
    status === 'connected' || status === 'healthy'
      ? 'bg-green-500'
      : status === 'degraded'
        ? 'bg-yellow-500'
        : 'bg-red-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

// ---------------------------------------------------------------------------
// Simple SVG Charts
// ---------------------------------------------------------------------------

function BarChart({
  data,
  height = 120,
}: {
  data: { label: string; value: number; secondary?: number }[];
  height?: number;
}) {
  if (data.length === 0) return <p className="text-sm text-[var(--text-secondary)]">No data</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(4, Math.min(24, 600 / data.length));
  const gap = Math.max(1, barWidth / 4);
  const svgWidth = data.length * (barWidth + gap);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 20);
        const errH = d.secondary ? (d.secondary / max) * (height - 20) : 0;
        return (
          <g key={i}>
            <rect
              x={i * (barWidth + gap)}
              y={height - 20 - barH}
              width={barWidth}
              height={barH}
              rx={2}
              fill="var(--primary)"
              opacity={0.7}
            />
            {errH > 0 && (
              <rect
                x={i * (barWidth + gap)}
                y={height - 20 - errH}
                width={barWidth}
                height={errH}
                rx={2}
                fill="#ef4444"
                opacity={0.6}
              />
            )}
            {data.length <= 24 && (
              <text
                x={i * (barWidth + gap) + barWidth / 2}
                y={height - 4}
                textAnchor="middle"
                fontSize={8}
                fill="var(--text-secondary)"
              >
                {d.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function AreaChart({
  data,
  height = 100,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  if (data.length < 2) return <p className="text-sm text-[var(--text-secondary)]">Not enough data</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const svgWidth = 600;
  const step = svgWidth / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * step,
    y: height - 20 - (d.value / max) * (height - 30),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - 20} L0,${height - 20} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${height}`} className="w-full" style={{ maxHeight: height }}>
      <defs>
        <linearGradient id="errGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#errGrad)" />
      <path d={linePath} fill="none" stroke="#ef4444" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#ef4444" />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [apiUsage, setApiUsage] = useState<ApiUsageData | null>(null);
  const [errorLogs, setErrorLogs] = useState<ErrorLogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, aRes, eRes] = await Promise.allSettled([
        fetch('/api/admin/system-health'),
        fetch('/api/admin/api-usage?hours=24'),
        fetch('/api/admin/error-logs?level=error&limit=20'),
      ]);

      if (hRes.status === 'fulfilled' && hRes.value.ok) setHealth(await hRes.value.json());
      if (aRes.status === 'fulfilled' && aRes.value.ok) setApiUsage(await aRes.value.json());
      if (eRes.status === 'fulfilled' && eRes.value.ok) setErrorLogs(await eRes.value.json());
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  function toggleError(id: string) {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link href="/admin/control-panel">
              <WarmButton variant="ghost" size="sm">
                ← Back
              </WarmButton>
            </Link>
            <Server className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Health</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-secondary)]">
              Last refresh: {lastRefresh.toLocaleTimeString()} (auto-refresh 30s)
            </span>
            <WarmButton variant="outline" size="sm" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </WarmButton>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <WarmCard padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Memory Usage</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {health ? `${health.memory.heapUsedPercent}%` : '—'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {health ? `${formatBytes(health.memory.heapUsed)} / ${formatBytes(health.memory.heapTotal)}` : ''}
                </p>
              </div>
              <Cpu className="h-5 w-5 text-blue-500 opacity-70" />
            </div>
          </WarmCard>

          <WarmCard padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Uptime</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {health ? formatUptime(health.uptime) : '—'}
                </p>
              </div>
              <Clock className="h-5 w-5 text-green-500 opacity-70" />
            </div>
          </WarmCard>

          <WarmCard padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">DB Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {health && <StatusDot status={health.database.status} />}
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {health?.database.status === 'connected' ? 'OK' : health?.database.status ?? '—'}
                  </p>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  {health ? `${health.database.latencyMs}ms` : ''}
                </p>
              </div>
              <Database className="h-5 w-5 text-emerald-500 opacity-70" />
            </div>
          </WarmCard>

          <WarmCard padding="md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-[var(--text-secondary)] font-medium">Active Sessions</p>
                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {health?.activeSessionsCount ?? '—'}
                </p>
              </div>
              <Activity className="h-5 w-5 text-purple-500 opacity-70" />
            </div>
          </WarmCard>
        </div>

        {/* API Requests Over Time */}
        {apiUsage && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              API Requests (Last 24h)
            </h2>
            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-3">
              <span>Total: <strong className="text-[var(--text-primary)]">{apiUsage.totalRequests.toLocaleString()}</strong></span>
              <span>Errors: <strong className="text-red-500">{apiUsage.errorCount}</strong></span>
              <span>Avg Response: <strong className="text-[var(--text-primary)]">{apiUsage.avgResponseMs}ms</strong></span>
            </div>
            <BarChart
              data={apiUsage.requestsByHour.map((h) => ({
                label: h.hour.slice(11, 13),
                value: h.count,
                secondary: h.errors,
              }))}
              height={140}
            />
            <div className="flex gap-4 mt-2 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 rounded-sm bg-[var(--primary)] opacity-70 inline-block" /> Requests
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-2 rounded-sm bg-red-500 opacity-60 inline-block" /> Errors
              </span>
            </div>
          </WarmCard>
        )}

        {/* Error Rate Over Time */}
        {apiUsage && apiUsage.requestsByHour.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Error Rate Over Time
            </h2>
            <AreaChart
              data={apiUsage.requestsByHour.map((h) => ({
                label: h.hour.slice(11, 13),
                value: h.count > 0 ? Math.round((h.errors / h.count) * 100) : 0,
              }))}
              height={100}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Error percentage per hour</p>
          </WarmCard>
        )}

        {/* Top Endpoints Table */}
        {apiUsage && apiUsage.topEndpoints.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Top Endpoints
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)]">
                  <tr className="text-left text-[var(--text-secondary)]">
                    <th className="py-2 font-semibold">Endpoint</th>
                    <th className="py-2 font-semibold text-right">Calls</th>
                    <th className="py-2 font-semibold text-right">Avg (ms)</th>
                    <th className="py-2 font-semibold text-right">Error %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {apiUsage.topEndpoints.map((ep) => (
                    <tr key={ep.endpoint} className="hover:bg-[var(--surface)]">
                      <td className="py-2 text-[var(--text-primary)] font-mono text-xs truncate max-w-xs">
                        {ep.endpoint}
                      </td>
                      <td className="py-2 text-right text-[var(--text-secondary)]">
                        {ep.count.toLocaleString()}
                      </td>
                      <td className="py-2 text-right text-[var(--text-secondary)]">{ep.avgMs}</td>
                      <td className="py-2 text-right">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            ep.errorPercent > 10
                              ? 'bg-red-100 text-red-700'
                              : ep.errorPercent > 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {ep.errorPercent}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </WarmCard>
        )}

        {/* Recent Errors */}
        {errorLogs && errorLogs.entries.length > 0 && (
          <WarmCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                Recent Errors ({errorLogs.pagination.total})
              </h2>
            </div>
            <div className="space-y-2">
              {errorLogs.entries.map((err) => (
                <div
                  key={err.id}
                  className="border border-[var(--border)] rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleError(err.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--surface)] transition-colors"
                  >
                    {expandedErrors.has(err.id) ? (
                      <ChevronDown className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-[var(--text-secondary)] shrink-0" />
                    )}
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium shrink-0 ${
                        err.level === 'error'
                          ? 'bg-red-100 text-red-700'
                          : err.level === 'warning'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {err.level}
                    </span>
                    <span className="text-sm text-[var(--text-primary)] truncate flex-1">
                      {err.message}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] shrink-0">
                      {new Date(err.timestamp).toLocaleString()}
                    </span>
                  </button>
                  {expandedErrors.has(err.id) && (
                    <div className="px-4 py-3 bg-[var(--surface)] border-t border-[var(--border)] text-xs space-y-1">
                      <div>
                        <strong>Action:</strong> {err.action}
                      </div>
                      {err.endpoint && (
                        <div>
                          <strong>Endpoint:</strong> {err.endpoint}
                        </div>
                      )}
                      <div>
                        <strong>User:</strong> {err.userId}
                      </div>
                      {err.statusCode && (
                        <div>
                          <strong>Status:</strong> {err.statusCode}
                        </div>
                      )}
                      {err.stackTrace && (
                        <pre className="mt-2 p-3 bg-[var(--bg)] rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono text-red-500">
                          {err.stackTrace}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </WarmCard>
        )}

        {/* Server Info Panel */}
        {health && (
          <WarmCard padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Server Info</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[var(--text-secondary)]">Node Version</p>
                <p className="font-medium text-[var(--text-primary)]">{health.server.nodeVersion}</p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)]">Platform</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {health.server.platform} ({health.server.arch})
                </p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)]">PID</p>
                <p className="font-medium text-[var(--text-primary)]">{health.server.pid}</p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)]">DB Connections</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {health.activeConnectionsEstimate}
                </p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)]">RSS Memory</p>
                <p className="font-medium text-[var(--text-primary)]">{health.server.memoryMB.rss} MB</p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)]">Heap Total</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {health.server.memoryMB.heapTotal} MB
                </p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)]">Heap Used</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {health.server.memoryMB.heapUsed} MB
                </p>
              </div>
              <div>
                <p className="text-[var(--text-secondary)]">External</p>
                <p className="font-medium text-[var(--text-primary)]">
                  {health.server.memoryMB.external} MB
                </p>
              </div>
              {health.disk?.available && (
                <>
                  <div>
                    <p className="text-[var(--text-secondary)]">Disk Used</p>
                    <p className="font-medium text-[var(--text-primary)]">{health.disk.usedPercent}%</p>
                  </div>
                  <div>
                    <p className="text-[var(--text-secondary)]">Disk Free</p>
                    <p className="font-medium text-[var(--text-primary)]">
                      {health.disk.freeBytes ? formatBytes(health.disk.freeBytes) : '—'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </WarmCard>
        )}

        {/* Loading state */}
        {loading && !health && (
          <WarmCard>
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">
              Loading system health data...
            </div>
          </WarmCard>
        )}
      </div>
    </div>
  );
}
