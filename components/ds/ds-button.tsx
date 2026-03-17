'use client';

import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

/* ─── Types ─── */
export type DsButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type DsButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface DsButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: DsButtonVariant;
  size?: DsButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
}

/* ─── Style maps ─── */
const sizeClasses: Record<DsButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1 rounded-sm',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-sm',
  md: 'h-10 px-4 text-sm gap-2 rounded-md',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-md',
  xl: 'h-14 px-8 text-lg gap-3 rounded-lg',
};

const variantClasses: Record<DsButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-[var(--gradient-brand-from)] to-[var(--gradient-brand-to)]',
    'text-[var(--primary-foreground)] font-semibold',
    'shadow-primary',
    'hover:shadow-glow hover:-translate-y-0.5',
    'active:translate-y-px active:shadow-sm',
    'relative overflow-hidden',
  ].join(' '),
  secondary: [
    'bg-[var(--glass-bg)] backdrop-blur-lg',
    'border border-[var(--glass-border)]',
    'text-[var(--text)] font-medium',
    'shadow-sm',
    'hover:bg-[var(--surface-muted)] hover:-translate-y-0.5 hover:shadow-md',
    'active:translate-y-px active:shadow-sm',
  ].join(' '),
  outline: [
    'bg-transparent border border-[var(--border)]',
    'text-[var(--text)] font-medium',
    'hover:border-[var(--primary)] hover:text-[var(--primary)] hover:-translate-y-0.5',
    'active:translate-y-px',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'text-[var(--text-muted)] font-medium',
    'hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
    'active:bg-[var(--surface-dim)]',
  ].join(' '),
  danger: [
    'bg-[var(--danger)] text-white font-semibold',
    'shadow-[var(--shadow-danger)]',
    'hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg',
    'active:translate-y-px active:shadow-sm',
  ].join(' '),
};

/* ─── Spinner ─── */
function Spinner({ size }: { size: DsButtonSize }) {
  const dim = size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <svg className={`${dim} animate-spin`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ─── Component ─── */
export const DsButton = forwardRef<HTMLButtonElement, DsButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      iconLeft,
      iconRight,
      disabled,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'ds-button',
          'inline-flex items-center justify-center select-none',
          'transition-all duration-fast ease-smooth',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
          sizeClasses[size],
          variantClasses[variant],
          fullWidth ? 'w-full' : '',
          isDisabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer',
          className,
        ].join(' ')}
        {...props}
      >
        {/* Shimmer overlay for primary */}
        {variant === 'primary' && !isDisabled && (
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          />
        )}

        {loading ? <Spinner size={size} /> : iconLeft}
        {children && <span>{children}</span>}
        {!loading && iconRight}
      </button>
    );
  },
);

DsButton.displayName = 'DsButton';
export default DsButton;
