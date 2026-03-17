'use client';

import React, { useEffect, useRef, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   KPI RING — Circular progress indicator with gradient stroke
   ═══════════════════════════════════════════════════════════════ */

export interface KpiRingProps {
  /** Value 0-100 */
  value: number;
  /** Center label */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Custom format for center text */
  formatValue?: (v: number) => string;
  /** Stroke width override */
  strokeWidth?: number;
  /** Additional CSS classes */
  className?: string;
}

const sizeMap = {
  sm: { px: 48, stroke: 4, fontSize: 11, labelSize: 8 },
  md: { px: 80, stroke: 5, fontSize: 18, labelSize: 10 },
  lg: { px: 120, stroke: 6, fontSize: 28, labelSize: 12 },
};

const colorMap = {
  primary: {
    start: 'var(--ds-primary, #06b6d4)',
    end: 'var(--ds-secondary, #8b5cf6)',
    glow: 'rgba(6, 182, 212, 0.4)',
  },
  success: {
    start: 'var(--ds-success, #10b981)',
    end: '#34d399',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  warning: {
    start: 'var(--ds-warning, #f59e0b)',
    end: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  error: {
    start: 'var(--ds-error, #f43f5e)',
    end: '#fb7185',
    glow: 'rgba(244, 63, 94, 0.4)',
  },
};

export function KpiRing({
  value,
  label,
  size = 'md',
  color = 'primary',
  formatValue,
  strokeWidth,
  className = '',
}: KpiRingProps) {
  const cfg = sizeMap[size];
  const clr = colorMap[color];
  const sw = strokeWidth ?? cfg.stroke;
  const radius = (cfg.px - sw * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const gradId = `kpi-grad-${color}-${size}`;
  const filterId = `kpi-glow-${color}-${size}`;

  /* ── Animate from 0 to value ── */
  const [animatedValue, setAnimatedValue] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 800;
    const from = 0;
    const to = Math.min(Math.max(value, 0), 100);

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setAnimatedValue(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  const offset = circumference - (animatedValue / 100) * circumference;
  const displayText = formatValue
    ? formatValue(Math.round(animatedValue))
    : `${Math.round(animatedValue)}%`;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: cfg.px, height: cfg.px }}
    >
      <svg
        width={cfg.px}
        height={cfg.px}
        viewBox={`0 0 ${cfg.px} ${cfg.px}`}
        className="transform -rotate-90"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={clr.start} />
            <stop offset="100%" stopColor={clr.end} />
          </linearGradient>
          <filter id={filterId}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Background track */}
        <circle
          cx={cfg.px / 2}
          cy={cfg.px / 2}
          r={radius}
          fill="none"
          stroke="var(--ds-border-default, rgba(255,255,255,0.08))"
          strokeWidth={sw}
        />
        {/* Foreground arc */}
        <circle
          cx={cfg.px / 2}
          cy={cfg.px / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#${filterId})`}
          style={{
            transition: 'stroke-dashoffset 0.1s linear',
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums"
          style={{
            fontSize: cfg.fontSize,
            color: 'var(--ds-text-primary, rgba(255,255,255,0.92))',
            letterSpacing: 'var(--ds-tracking-tight, -0.025em)',
          }}
        >
          {displayText}
        </span>
        {label && (
          <span
            className="mt-0.5"
            style={{
              fontSize: cfg.labelSize,
              color: 'var(--ds-text-tertiary, rgba(255,255,255,0.4))',
              letterSpacing: 'var(--ds-tracking-wide, 0.025em)',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default KpiRing;
