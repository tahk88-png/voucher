'use client';

import React, { type ReactNode } from 'react';

/* ─── Types ─── */
export type DsBadgeVariant = 'solid' | 'soft' | 'outline' | 'glass';
export type DsBadgeColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
export type DsBadgeSize = 'sm' | 'md' | 'lg';

export interface DsBadgeProps {
  variant?: DsBadgeVariant;
  color?: DsBadgeColor;
  size?: DsBadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  children: ReactNode;
  className?: string;
}

/* ─── Color config ─── */
const colorTokens: Record<DsBadgeColor, { solid: string; soft: string; outline: string; glass: string; dot: string }> = {
  primary: {
    solid: 'bg-[var(--primary)] text-[var(--primary-foreground)]',
    soft: 'bg-[var(--primary)]/15 text-[var(--primary)]',
    outline: 'border-[var(--primary)] text-[var(--primary)]',
    glass: 'bg-[var(--primary)]/10 backdrop-blur-md border-[var(--primary)]/20 text-[var(--primary)]',
    dot: 'bg-[var(--primary)]',
  },
  secondary: {
    solid: 'bg-[var(--accent)] text-[var(--accent-foreground)]',
    soft: 'bg-[var(--accent)]/15 text-[var(--text)]',
    outline: 'border-[var(--border)] text-[var(--text-muted)]',
    glass: 'bg-[var(--surface-muted)]/60 backdrop-blur-md border-[var(--border)] text-[var(--text-muted)]',
    dot: 'bg-[var(--text-faint)]',
  },
  success: {
    solid: 'bg-[var(--success)] text-white',
    soft: 'bg-green-500/15 text-[var(--success)]',
    outline: 'border-[var(--success)] text-[var(--success)]',
    glass: 'bg-green-500/10 backdrop-blur-md border-green-500/20 text-[var(--success)]',
    dot: 'bg-[var(--success)]',
  },
  warning: {
    solid: 'bg-[var(--warning)] text-[var(--primary-foreground)]',
    soft: 'bg-amber-500/15 text-[var(--warning)]',
    outline: 'border-[var(--warning)] text-[var(--warning)]',
    glass: 'bg-amber-500/10 backdrop-blur-md border-amber-500/20 text-[var(--warning)]',
    dot: 'bg-[var(--warning)]',
  },
  error: {
    solid: 'bg-[var(--danger)] text-white',
    soft: 'bg-red-500/15 text-[var(--danger)]',
    outline: 'border-[var(--danger)] text-[var(--danger)]',
    glass: 'bg-red-500/10 backdrop-blur-md border-red-500/20 text-[var(--danger)]',
    dot: 'bg-[var(--danger)]',
  },
  neutral: {
    solid: 'bg-[var(--surface-dim)] text-[var(--text)]',
    soft: 'bg-[var(--surface-dim)]/60 text-[var(--text-muted)]',
    outline: 'border-[var(--border)] text-[var(--text-muted)]',
    glass: 'bg-[var(--glass-bg)] backdrop-blur-md border-[var(--glass-border)] text-[var(--text-muted)]',
    dot: 'bg-[var(--text-faint)]',
  },
};

const sizeClasses: Record<DsBadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0 h-5 gap-1',
  md: 'text-xs px-2 py-0.5 h-6 gap-1.5',
  lg: 'text-sm px-2.5 py-1 h-7 gap-1.5',
};

/* ─── Component ─── */
export function DsBadge({
  variant = 'soft',
  color = 'primary',
  size = 'md',
  dot = false,
  icon,
  removable = false,
  onRemove,
  children,
  className = '',
}: DsBadgeProps) {
  const tokens = colorTokens[color];

  return (
    <span
      className={[
        'ds-badge inline-flex items-center font-medium rounded-full whitespace-nowrap select-none',
        sizeClasses[size],
        tokens[variant],
        variant === 'outline' || variant === 'glass' ? 'border' : '',
        className,
      ].join(' ')}
    >
      {/* Dot indicator */}
      {dot && (
        <span className="relative flex h-2 w-2">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${tokens.dot}`}
          />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${tokens.dot}`} />
        </span>
      )}

      {/* Icon */}
      {!dot && icon && <span className="flex-shrink-0">{icon}</span>}

      {children}

      {/* Remove button */}
      {removable && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Remove"
        >
          <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
            <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </span>
  );
}

export default DsBadge;
