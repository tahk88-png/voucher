'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   DATA VISUALIZATION CARD — Mini viz + value for grid layouts
   Supports donut, bar, and sparkline visualizations
   ═══════════════════════════════════════════════════════════════ */

export interface DataVisualizationCardProps {
  /** Card title */
  title: string;
  /** Primary value text */
  value: string;
  /** Visualization type */
  vizType: 'donut' | 'bar' | 'sparkline';
  /** Data for the visualization */
  data: number[];
  /** Optional labels for data points */
  labels?: string[];
  /** Color category */
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  /** Subtitle / secondary text */
  subtitle?: string;
  /** Additional CSS classes */
  className?: string;
}

const colorTokens: Record<string, { main: string; bg: string; glow: string }> = {
  primary: {
    main: 'var(--ds-primary, #cc785c)',
    bg: 'rgba(204, 120, 92, 0.08)',
    glow: 'rgba(204, 120, 92, 0.15)',
  },
  secondary: {
    main: 'var(--ds-secondary, #5e7e92)',
    bg: 'rgba(94, 126, 146, 0.08)',
    glow: 'rgba(94, 126, 146, 0.15)',
  },
  accent: {
    main: 'var(--ds-accent, #be8a2e)',
    bg: 'rgba(190, 138, 46, 0.08)',
    glow: 'rgba(190, 138, 46, 0.15)',
  },
  success: {
    main: 'var(--ds-success, #4e8a5b)',
    bg: 'rgba(78, 138, 91, 0.08)',
    glow: 'rgba(78, 138, 91, 0.15)',
  },
  warning: {
    main: 'var(--ds-warning, #be8a2e)',
    bg: 'rgba(190, 138, 46, 0.08)',
    glow: 'rgba(190, 138, 46, 0.15)',
  },
  error: {
    main: 'var(--ds-error, #c84b36)',
    bg: 'rgba(200, 75, 54, 0.08)',
    glow: 'rgba(200, 75, 54, 0.15)',
  },
};

export function DataVisualizationCard({
  title,
  value,
  vizType,
  data,
  labels,
  color = 'primary',
  subtitle,
  className = '',
}: DataVisualizationCardProps) {
  const clr = colorTokens[color];
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{
        padding: '16px',
        background: 'var(--ds-bg-glass, rgba(255,255,255,0.03))',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--ds-border-default, rgba(255,255,255,0.08))',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)',
        transition: `all var(--ds-duration-slow, 400ms) var(--ds-ease-out)`,
      }}
    >
      {/* Subtle glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: `radial-gradient(circle at 80% 20%, ${clr.glow}, transparent 60%)` }}
      />

      <div className="relative flex items-center gap-4">
        {/* Visualization */}
        <div className="shrink-0">
          {vizType === 'donut' && <MiniDonut data={data} color={clr.main} size={48} />}
          {vizType === 'bar' && <MiniBars data={data} color={clr.main} />}
          {vizType === 'sparkline' && <MiniSparkline data={data} color={clr.main} />}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <span
            className="block text-xs font-medium truncate"
            style={{ color: 'var(--ds-text-tertiary)' }}
          >
            {title}
          </span>
          <span
            className="block text-lg font-bold tabular-nums mt-0.5"
            style={{
              color: 'var(--ds-text-primary)',
              letterSpacing: 'var(--ds-tracking-tight)',
            }}
          >
            {value}
          </span>
          {subtitle && (
            <span
              className="block text-xs mt-0.5"
              style={{ color: 'var(--ds-text-tertiary)' }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mini Donut ── */
function MiniDonut({ data, color, size }: { data: number[]; color: string; size: number }) {
  const total = data.reduce((a, b) => a + b, 0) || 1;
  const primary = data[0] ?? 0;
  const pct = primary / total;
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke="var(--ds-border-default, rgba(255,255,255,0.08))"
        strokeWidth="4"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{
          filter: `drop-shadow(0 0 3px ${color})`,
          transition: 'stroke-dashoffset 0.8s var(--ds-ease-out)',
        }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fill="var(--ds-text-primary)"
        fontSize="10" fontWeight="600"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

/* ── Mini Bars ── */
function MiniBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data) || 1;
  const barW = 6;
  const gap = 3;
  const h = 32;
  const w = data.length * (barW + gap) - gap;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {data.map((v, i) => {
        const barH = (v / max) * (h - 2);
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={h - barH}
            width={barW}
            height={barH}
            rx="1.5"
            fill={color}
            opacity={0.5 + (v / max) * 0.5}
            style={{
              filter: `drop-shadow(0 0 2px ${color})`,
              animation: `ds-bar-up 0.6s var(--ds-ease-out) ${i * 0.05}s both`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes ds-bar-up {
          from { transform: scaleY(0); transform-origin: bottom; }
          to   { transform: scaleY(1); transform-origin: bottom; }
        }
      `}</style>
    </svg>
  );
}

/* ── Mini Sparkline ── */
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 60, h = 24, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
      />
    </svg>
  );
}

export default DataVisualizationCard;
