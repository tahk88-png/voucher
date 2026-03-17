'use client';

import React, { useState, type ReactNode } from 'react';

/* ─── Types ─── */
export type DsAlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface DsAlertProps {
  variant?: DsAlertVariant;
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/* ─── Icons ─── */
const variantIcons: Record<DsAlertVariant, ReactNode> = {
  info: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
};

/* ─── Color maps ─── */
const variantStyles: Record<DsAlertVariant, { bg: string; border: string; text: string; glow: string }> = {
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-[var(--info)]',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]',
  },
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    text: 'text-[var(--success)]',
    glow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-[var(--warning)]',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.1)]',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-[var(--danger)]',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.1)]',
  },
};

/* ─── Component ─── */
export function DsAlert({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  action,
  icon,
  className = '',
}: DsAlertProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const style = variantStyles[variant];

  return (
    <div
      role="alert"
      className={[
        'ds-alert flex gap-3 p-4 rounded-lg border',
        style.bg,
        style.border,
        style.glow,
        'transition-all duration-200',
        dismissed ? 'opacity-0 scale-95' : 'animate-enter-fade',
        className,
      ].join(' ')}
    >
      {/* Icon */}
      <span className={`flex-shrink-0 mt-0.5 ${style.text}`}>
        {icon || variantIcons[variant]}
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`text-sm font-semibold ${style.text} mb-0.5`}>{title}</p>
        )}
        <div className="text-sm text-[var(--text-muted)]">{children}</div>
        {action && <div className="mt-2">{action}</div>}
      </div>

      {/* Dismiss */}
      {dismissible && (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          className="flex-shrink-0 p-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--surface-dim)] transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default DsAlert;
