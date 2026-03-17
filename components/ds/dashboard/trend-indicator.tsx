'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   TREND INDICATOR — Standalone trend display
   Arrow icon + percentage + optional sparkline
   ═══════════════════════════════════════════════════════════════ */

export interface TrendIndicatorProps {
  /** Percentage change (positive = up, negative = down, 0 = neutral) */
  value: number;
  /** Optional sparkline data points (normalized 0-1) */
  sparkline?: number[];
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show the sparkline */
  showSparkline?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Label text after the percentage */
  label?: string;
  /** Invert colors (red for up, green for down — e.g. for costs) */
  invertColors?: boolean;
}

const sizeConfig = {
  sm: { iconSize: 12, textClass: 'text-xs', sparkW: 40, sparkH: 12, gap: 'gap-0.5' },
  md: { iconSize: 14, textClass: 'text-sm', sparkW: 60, sparkH: 16, gap: 'gap-1' },
  lg: { iconSize: 18, textClass: 'text-base', sparkW: 80, sparkH: 24, gap: 'gap-1.5' },
};

export function TrendIndicator({
  value,
  sparkline,
  size = 'md',
  showSparkline = false,
  className = '',
  label,
  invertColors = false,
}: TrendIndicatorProps) {
  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'neutral';
  const cfg = sizeConfig[size];

  const isPositive = invertColors ? direction === 'down' : direction === 'up';
  const isNegative = invertColors ? direction === 'up' : direction === 'down';

  const colorClass = isPositive
    ? 'text-[var(--ds-success,#10b981)]'
    : isNegative
      ? 'text-[var(--ds-error,#f43f5e)]'
      : 'text-[var(--ds-text-tertiary,rgba(255,255,255,0.4))]';

  const strokeColor = isPositive
    ? 'var(--ds-success, #10b981)'
    : isNegative
      ? 'var(--ds-error, #f43f5e)'
      : 'var(--ds-text-tertiary, rgba(255,255,255,0.4))';

  const ArrowIcon =
    direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  /* ── Animated number ── */
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 600;
    const from = displayed;
    const to = Math.abs(value);

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span
      className={`inline-flex items-center ${cfg.gap} ${colorClass} ${className}`}
      style={{
        transition: 'color var(--ds-duration-normal, 250ms) var(--ds-ease-default)',
      }}
    >
      <ArrowIcon
        size={cfg.iconSize}
        className="shrink-0"
        style={{
          transition: 'transform var(--ds-duration-normal, 250ms) var(--ds-ease-spring)',
        }}
      />
      <span className={`${cfg.textClass} font-semibold tabular-nums`}>
        {direction === 'up' ? '+' : direction === 'down' ? '-' : ''}
        {displayed.toFixed(1)}%
      </span>
      {label && (
        <span
          className={`${cfg.textClass} opacity-60`}
          style={{ color: 'var(--ds-text-secondary)' }}
        >
          {label}
        </span>
      )}
      {showSparkline && sparkline && sparkline.length > 1 && (
        <MiniSparkline
          data={sparkline}
          width={cfg.sparkW}
          height={cfg.sparkH}
          color={strokeColor}
        />
      )}
    </span>
  );
}

/* ── Mini Sparkline SVG ── */
function MiniSparkline({
  data,
  width,
  height,
  color,
}: {
  data: number[];
  width: number;
  height: number;
  color: string;
}) {
  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * w;
      const y = padding + h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      style={{ overflow: 'visible' }}
    >
      <polyline
        points={points}
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

export default TrendIndicator;
