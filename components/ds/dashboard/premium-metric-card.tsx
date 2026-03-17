'use client';

import React, { useEffect, useRef, useState, useCallback, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   PREMIUM METRIC CARD — Ultra-premium KPI card
   Glassmorphism + animated count-up + sparkline + glow
   ═══════════════════════════════════════════════════════════════ */

export interface PremiumMetricCardProps {
  /** Card title */
  title: string;
  /** Numeric value to display */
  value: number;
  /** Format function (e.g. currency, percentage) */
  formatValue?: (v: number) => string;
  /** Trend percentage change */
  trend?: number;
  /** Sparkline data (normalized 0-1) */
  sparkline?: number[];
  /** Icon element (lucide-react icon) */
  icon?: ReactNode;
  /** Comparison label, e.g. "vs last period" */
  comparisonText?: string;
  /** Size variant */
  size?: 'compact' | 'full';
  /** Loading state */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

/* ── Helpers ── */

function useCountUp(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number>(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const from = prevTarget.current;
    prevTarget.current = target;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCurrent(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return current;
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const w = 80, h = 24, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (h - pad * 2) - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  });

  const areaPath = `M${pts[0]} ${pts.map((p) => `L${p}`).join(' ')} L${pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)},${h} L${pad},${h} Z`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spark-fill)" />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}

export function PremiumMetricCard({
  title,
  value,
  formatValue,
  trend = 0,
  sparkline,
  icon,
  comparisonText = 'vs last period',
  size = 'full',
  loading = false,
  className = '',
  onClick,
}: PremiumMetricCardProps) {
  const animatedValue = useCountUp(value);
  const isCompact = size === 'compact';

  const trendDir = trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral';
  const trendColor =
    trendDir === 'up'
      ? 'var(--ds-success, #10b981)'
      : trendDir === 'down'
        ? 'var(--ds-error, #f43f5e)'
        : 'var(--ds-text-tertiary)';
  const glowColor =
    trendDir === 'up'
      ? 'rgba(16, 185, 129, 0.06)'
      : trendDir === 'down'
        ? 'rgba(244, 63, 94, 0.06)'
        : 'transparent';

  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus;
  const displayValue = formatValue ? formatValue(animatedValue) : Math.round(animatedValue).toLocaleString();

  /* ── Entrance animation ── */
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

  if (loading) return <MetricSkeleton compact={isCompact} className={className} />;

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        padding: isCompact ? '16px' : '24px',
        background: 'var(--ds-bg-glass, rgba(255,255,255,0.03))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--ds-border-default, rgba(255,255,255,0.08))',
        boxShadow: 'var(--ds-shadow-md)',
        transition: `all var(--ds-duration-normal, 250ms) var(--ds-ease-default)`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--ds-border-hover, rgba(255,255,255,0.16))';
        el.style.transform = 'translateY(-2px)';
        el.style.boxShadow = 'var(--ds-shadow-lg)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.borderColor = 'var(--ds-border-default, rgba(255,255,255,0.08))';
        el.style.transform = 'translateY(0)';
        el.style.boxShadow = 'var(--ds-shadow-md)';
      }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: `radial-gradient(ellipse at 50% 100%, ${glowColor}, transparent 70%)` }}
      />
      {/* Gradient border top line */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'var(--ds-gradient-primary)' }}
      />

      {/* Header */}
      <div className="relative flex items-start justify-between">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--ds-text-tertiary, rgba(255,255,255,0.4))' }}
        >
          {title}
        </span>
        {icon && (
          <span
            className="flex items-center justify-center rounded-lg"
            style={{
              width: isCompact ? 28 : 36,
              height: isCompact ? 28 : 36,
              background: 'var(--ds-bg-glass)',
              color: 'var(--ds-primary, #06b6d4)',
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.15)',
            }}
          >
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div
        className={`relative ${isCompact ? 'mt-2' : 'mt-4'}`}
        style={{
          fontSize: isCompact ? 'var(--ds-text-2xl, 1.5rem)' : 'var(--ds-text-4xl, 2.25rem)',
          fontWeight: 'var(--ds-font-bold, 700)',
          color: 'var(--ds-text-primary, rgba(255,255,255,0.92))',
          letterSpacing: 'var(--ds-tracking-tight)',
          lineHeight: 1.1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {displayValue}
      </div>

      {/* Trend + Sparkline row */}
      <div className={`relative flex items-center gap-3 ${isCompact ? 'mt-2' : 'mt-3'}`}>
        {/* Trend */}
        <span className="inline-flex items-center gap-1" style={{ color: trendColor }}>
          <TrendIcon size={isCompact ? 12 : 14} />
          <span className="text-xs font-semibold tabular-nums">
            {trend > 0 ? '+' : ''}
            {trend.toFixed(1)}%
          </span>
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--ds-text-tertiary)' }}
        >
          {comparisonText}
        </span>

        {/* Sparkline pushed right */}
        {sparkline && sparkline.length > 1 && !isCompact && (
          <div className="ml-auto">
            <MiniSparkline data={sparkline} color={trendColor} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Shimmer Skeleton ── */
function MetricSkeleton({ compact, className }: { compact: boolean; className: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        padding: compact ? '16px' : '24px',
        background: 'var(--ds-bg-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--ds-border-default)',
      }}
    >
      <div className="space-y-3">
        <div
          className="h-3 w-24 rounded"
          style={{ background: 'var(--ds-border-default)', animation: 'ds-shimmer 1.8s ease infinite' }}
        />
        <div
          className="h-8 w-32 rounded"
          style={{ background: 'var(--ds-border-default)', animation: 'ds-shimmer 1.8s ease infinite 0.1s' }}
        />
        <div
          className="h-3 w-20 rounded"
          style={{ background: 'var(--ds-border-default)', animation: 'ds-shimmer 1.8s ease infinite 0.2s' }}
        />
      </div>
      <style jsx>{`
        @keyframes ds-shimmer {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default PremiumMetricCard;
