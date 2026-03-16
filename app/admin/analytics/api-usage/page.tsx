'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Activity, RefreshCw, Gauge, AlertCircle, Clock, BarChart3 } from 'lucide-react';
import { WarmCard } from '@/components/warm-card';
import { WarmButton } from '@/components/warm-button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ApiUsageData = {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgResponseMs: number;
  requestsByHour: { hour: string; count: number; errors: number }[];
  topEndpoints: { endpoint: string; count: number; avgMs: number; errorPercent: number }[];
  slowestEndpoints: { endpoint: string; avgMs: number; count: number }[];
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function TrendIndicator({ current, label }: { current: number; label: string }) {
  return (
    <div>
      <p className="text-xs text-[var(--text-secondary)] font-medium">{label}</p>
      <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
        {typeof current === 'number' ? current.toLocaleString() : '—'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SVG Charts
// ---------------------------------------------------------------------------

function HourlyBarChart({
  data,
  height = 160,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  if (data.length === 0) return <p className="text-sm text-[var(--text-secondary)]">No data</p>;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(8, Math.min(28, 700 / data.length));
  const gap = Math.max(2, barWidth / 3);
  const svgWidth = data.length * (barWidth + gap);

  return (
    <svg viewBox={`0 0 ${svgWidth} ${height}`} className="w-full" style={{ maxHeight: height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 24);
        return (
          <g key={i}>
            <rect
              x={i * (barWidth + gap)}
              y={height - 24 - barH}
              width={barWidth}
              height={barH}
              rx={3}
              fill="var(--primary)"
              opacity={0.75}
            >
              <title>
                {d.label}: {d.value}
              </title>
            </rect>
            {data.length <= 24 && (
              <text
                x={i * (barWidth + gap) + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                fontSize={9}
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

function ErrorTrendChart({
  data,
  height = 120,
}: {
  data: { label: string; errorRate: number }[];
  height?: number;
}) {
  if (data.length < 2) return <p className="text-sm text-[var(--text-secondary)]">Not enough data</p>;
  const max = Math.max(...data.map((d) => d.errorRate), 1);
  const svgWidth = 600;
  const step = svgWidth / (data.length - 1);

  const points = data.map((d, i) => ({
    x: i * step,
    y: height - 20 - (d.errorRate / max) * (height - 30),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - 20} L0,${height - 20} Z`;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${height}`} className="w-full" style={{ maxHeight: height }}>
      <defs>
        <linearGradient id="errorGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#errorGrad)" />
      <path d={linePath} fill="none" stroke="#ef4444" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#ef4444">
          <title>
            {data[i].label}: {data[i].errorRate.toFixed(1)}%
          </title>
        </circle>
      ))}
    </svg>
  );
}

function ResponseTimeDistribution({
  endpoints,
  height = 140,
}: {
  endpoints: { endpoint: string; avgMs: number; count: number }[];
  height?: number;
}) {
  if (endpoints.length === 0) return <p className="text-sm text-[var(--text-secondary)]">No data</p>;
  const max = Math.max(...endpoints.map((e) => e.avgMs), 1);
  const barH = 22;
  const gap = 4;
  const svgHeight = endpoints.length * (barH + gap);
  const labelWidth = 200;
  const chartWidth = 350;

  return (
    <svg viewBox={`0 0 ${labelWidth + chartWidth + 80} ${svgHeight}`} className="w-full" style={{ maxHeight: 400 }}>
      {endpoints.map((ep, i) => {
        const y = i * (barH + gap);
        const barW = (ep.avgMs / max) * chartWidth;
        const color = ep.avgMs > 500 ? '#ef4444' : ep.avgMs > 200 ? '#f59e0b' : '#22c55e';
        return (
          <g key={ep.endpoint}>
            <text
              x={labelWidth - 4}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--text-secondary)"
            >
              {ep.endpoint.length > 30 ? '...' + ep.endpoint.slice(-27) : ep.endpoint}
            </text>
            <rect x={labelWidth} y={y} width={Math.max(2, barW)} height={barH} rx={3} fill={color} opacity={0.7} />
            <text
              x={labelWidth + Math.max(2, barW) + 4}
              y={y + barH / 2 + 4}
              fontSize={10}
              fill="var(--text-secondary)"
            >
              {ep.avgMs}ms
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ApiUsagePage() {
  const [data, setData] = useState<ApiUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/api-usage?hours=${hours}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
            <Activity className="h-6 w-6 text-indigo-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">API Usage</h1>
          </div>
          <div className="flex gap-2">
            {[6, 12, 24, 48, 168].map((h) => (
              <button
                key={h}
                onClick={() => setHours(h)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  hours === h
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]'
                }`}
              >
                {h}h
              </button>
            ))}
            <WarmButton variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </WarmButton>
          </div>
        </div>

        {/* Metric Cards */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <WarmCard padding="md">
              <div className="flex items-start justify-between">
                <TrendIndicator current={data.totalRequests} label="Total API Calls" />
                <BarChart3 className="h-5 w-5 text-blue-500 opacity-70" />
              </div>
            </WarmCard>
            <WarmCard padding="md">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">Error Rate</p>
                  <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">
                    {(data.errorRate * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">{data.errorCount} errors</p>
                </div>
                <AlertCircle className="h-5 w-5 text-red-500 opacity-70" />
              </div>
            </WarmCard>
            <WarmCard padding="md">
              <div className="flex items-start justify-between">
                <TrendIndicator current={data.avgResponseMs} label="Avg Response (ms)" />
                <Clock className="h-5 w-5 text-green-500 opacity-70" />
              </div>
            </WarmCard>
            <WarmCard padding="md">
              <div className="flex items-start justify-between">
                <TrendIndicator current={data.topEndpoints.length} label="Active Endpoints" />
                <Gauge className="h-5 w-5 text-purple-500 opacity-70" />
              </div>
            </WarmCard>
          </div>
        )}

        {/* Requests Per Hour */}
        {data && data.requestsByHour.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Requests Per Hour
            </h2>
            <HourlyBarChart
              data={data.requestsByHour.map((h) => ({
                label: h.hour.slice(11, 13),
                value: h.count,
              }))}
              height={160}
            />
          </WarmCard>
        )}

        {/* Error Rate Trend */}
        {data && data.requestsByHour.length > 1 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Error Rate Trend
            </h2>
            <ErrorTrendChart
              data={data.requestsByHour.map((h) => ({
                label: h.hour.slice(11, 13),
                errorRate: h.count > 0 ? (h.errors / h.count) * 100 : 0,
              }))}
              height={120}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-2">Error % per hour</p>
          </WarmCard>
        )}

        {/* Top Endpoints */}
        {data && data.topEndpoints.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Top Endpoints (by calls)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)]">
                  <tr className="text-left text-[var(--text-secondary)]">
                    <th className="py-2 font-semibold">#</th>
                    <th className="py-2 font-semibold">Endpoint</th>
                    <th className="py-2 font-semibold text-right">Calls</th>
                    <th className="py-2 font-semibold text-right">Avg (ms)</th>
                    <th className="py-2 font-semibold text-right">Error %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.topEndpoints.map((ep, idx) => (
                    <tr key={ep.endpoint} className="hover:bg-[var(--surface)]">
                      <td className="py-2 text-[var(--text-secondary)]">{idx + 1}</td>
                      <td className="py-2 text-[var(--text-primary)] font-mono text-xs truncate max-w-sm">
                        {ep.endpoint}
                      </td>
                      <td className="py-2 text-right text-[var(--text-secondary)]">
                        {ep.count.toLocaleString()}
                      </td>
                      <td className="py-2 text-right">
                        <span
                          className={`${
                            ep.avgMs > 500 ? 'text-red-500' : ep.avgMs > 200 ? 'text-yellow-600' : 'text-green-600'
                          }`}
                        >
                          {ep.avgMs}
                        </span>
                      </td>
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

        {/* Slowest Endpoints */}
        {data && data.slowestEndpoints.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Slowest Endpoints
            </h2>
            <ResponseTimeDistribution endpoints={data.slowestEndpoints} />
          </WarmCard>
        )}

        {/* Response Time Distribution Table */}
        {data && data.slowestEndpoints.length > 0 && (
          <WarmCard padding="lg">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Response Time Detail
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)]">
                  <tr className="text-left text-[var(--text-secondary)]">
                    <th className="py-2 font-semibold">Endpoint</th>
                    <th className="py-2 font-semibold text-right">Avg (ms)</th>
                    <th className="py-2 font-semibold text-right">Calls</th>
                    <th className="py-2 font-semibold">Performance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {data.slowestEndpoints.map((ep) => {
                    const pct = Math.min(100, (ep.avgMs / Math.max(...data.slowestEndpoints.map((e) => e.avgMs), 1)) * 100);
                    const color = ep.avgMs > 500 ? '#ef4444' : ep.avgMs > 200 ? '#f59e0b' : '#22c55e';
                    return (
                      <tr key={ep.endpoint} className="hover:bg-[var(--surface)]">
                        <td className="py-2 text-[var(--text-primary)] font-mono text-xs truncate max-w-sm">
                          {ep.endpoint}
                        </td>
                        <td className="py-2 text-right font-medium" style={{ color }}>
                          {ep.avgMs}
                        </td>
                        <td className="py-2 text-right text-[var(--text-secondary)]">{ep.count}</td>
                        <td className="py-2 w-32">
                          <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </WarmCard>
        )}

        {/* Loading state */}
        {loading && !data && (
          <WarmCard>
            <div className="flex items-center justify-center h-32 text-[var(--text-secondary)]">
              Loading API usage data...
            </div>
          </WarmCard>
        )}
      </div>
    </div>
  );
}
