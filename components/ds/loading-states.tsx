'use client';

import { type ReactNode } from 'react';

/* ═══════════════════════════════════════════
   SIZE + COLOR TYPES
   ═══════════════════════════════════════════ */

type Size = 'sm' | 'md' | 'lg';
type Color = 'primary' | 'secondary' | 'accent' | 'white';

const sizeMap = {
  sm: { spinner: 16, dot: 6, text: 'text-xs' },
  md: { spinner: 24, dot: 8, text: 'text-sm' },
  lg: { spinner: 36, dot: 10, text: 'text-base' },
} as const;

const colorValues: Record<Color, { stroke: string; bg: string; glow: string }> = {
  primary: {
    stroke: 'url(#ds-spinner-gradient-primary)',
    bg: 'bg-cyan-500',
    glow: 'rgba(6, 182, 212, 0.4)',
  },
  secondary: {
    stroke: 'url(#ds-spinner-gradient-secondary)',
    bg: 'bg-violet-500',
    glow: 'rgba(139, 92, 246, 0.4)',
  },
  accent: {
    stroke: 'url(#ds-spinner-gradient-accent)',
    bg: 'bg-amber-500',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  white: {
    stroke: 'url(#ds-spinner-gradient-white)',
    bg: 'bg-white',
    glow: 'rgba(255, 255, 255, 0.3)',
  },
};

/* ═══════════════════════════════════════════
   SPINNER — Rotating ring with gradient stroke
   ═══════════════════════════════════════════ */

interface SpinnerProps {
  size?: Size;
  color?: Color;
  className?: string;
  label?: string;
}

export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  label = 'Loading',
}: SpinnerProps) {
  const s = sizeMap[size].spinner;
  const strokeWidth = size === 'sm' ? 2.5 : size === 'lg' ? 3.5 : 3;
  const r = (s - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <div className={`inline-flex items-center justify-center ${className}`} role="status" aria-label={label}>
      <svg
        width={s}
        height={s}
        viewBox={`0 0 ${s} ${s}`}
        fill="none"
        className="ds-animate-spin"
      >
        <defs>
          <linearGradient id="ds-spinner-gradient-primary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <linearGradient id="ds-spinner-gradient-secondary" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
          <linearGradient id="ds-spinner-gradient-accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <linearGradient id="ds-spinner-gradient-white" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={s / 2}
          cy={s / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-[0.08]"
        />
        {/* Active arc */}
        <circle
          cx={s / 2}
          cy={s / 2}
          r={r}
          stroke={colorValues[color].stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.7}
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DOTS — 3 bouncing dots
   ═══════════════════════════════════════════ */

interface DotsProps {
  size?: Size;
  color?: Color;
  className?: string;
}

export function Dots({ size = 'md', color = 'primary', className = '' }: DotsProps) {
  const d = sizeMap[size].dot;
  const gap = size === 'sm' ? 'gap-1' : size === 'lg' ? 'gap-2' : 'gap-1.5';
  const bgClass = colorValues[color].bg;

  return (
    <div className={`inline-flex items-center ${gap} ${className}`} role="status" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`rounded-full ${bgClass} ds-animate-dots`}
          style={{
            width: d,
            height: d,
            animationDelay: `${i * 160}ms`,
          }}
        />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SKELETON — Shimmer effect (dark glass)
   ═══════════════════════════════════════════ */

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function Skeleton({
  width,
  height = '1rem',
  rounded = 'md',
  className = '',
}: SkeletonProps) {
  const radiusMap = {
    sm: 'rounded',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={`${radiusMap[rounded]} ds-animate-shimmer ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        backgroundImage:
          'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.06) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
      aria-hidden="true"
    />
  );
}

/* ═══════════════════════════════════════════
   PROGRESS BAR — Animated with glow
   ═══════════════════════════════════════════ */

interface ProgressBarProps {
  value: number; // 0-100
  size?: Size;
  color?: Color;
  animated?: boolean;
  indeterminate?: boolean;
  className?: string;
  label?: string;
}

export function ProgressBar({
  value,
  size = 'md',
  color = 'primary',
  animated = true,
  indeterminate = false,
  className = '',
  label,
}: ProgressBarProps) {
  const heightMap = { sm: 'h-1', md: 'h-2', lg: 'h-3' };
  const gradientMap: Record<Color, string> = {
    primary: 'from-cyan-500 to-violet-500',
    secondary: 'from-violet-500 to-pink-500',
    accent: 'from-amber-500 to-red-500',
    white: 'from-white/80 to-white/40',
  };

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={className} role="progressbar" aria-valuenow={clampedValue} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div
        className={`w-full ${heightMap[size]} rounded-full overflow-hidden`}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <div
          className={`${heightMap[size]} rounded-full bg-gradient-to-r ${gradientMap[color]} ${
            indeterminate ? 'ds-animate-progress' : ''
          }`}
          style={{
            width: indeterminate ? undefined : `${clampedValue}%`,
            transition: animated && !indeterminate ? 'width 500ms ease-out' : undefined,
            boxShadow: `0 0 12px ${colorValues[color].glow}`,
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PULSE CARD — Full card skeleton with glass
   ═══════════════════════════════════════════ */

interface PulseCardProps {
  lines?: number;
  hasAvatar?: boolean;
  hasImage?: boolean;
  className?: string;
}

export function PulseCard({
  lines = 3,
  hasAvatar = false,
  hasImage = false,
  className = '',
}: PulseCardProps) {
  return (
    <div
      className={`rounded-xl border border-white/[0.06] p-4 ${className}`}
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
        backdropFilter: 'blur(12px)',
      }}
      aria-hidden="true"
    >
      {hasImage && (
        <Skeleton
          width="100%"
          height={160}
          rounded="lg"
          className="mb-4"
        />
      )}
      {hasAvatar && (
        <div className="flex items-center gap-3 mb-4">
          <Skeleton width={40} height={40} rounded="full" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </div>
        </div>
      )}
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            width={i === lines - 1 ? '75%' : '100%'}
            height={14}
          />
        ))}
      </div>
    </div>
  );
}
