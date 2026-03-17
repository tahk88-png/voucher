'use client';

import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

/* ─── Types ─── */
export type DsCardVariant = 'default' | 'glass' | 'gradient' | 'elevated';
export type DsCardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface DsCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: DsCardVariant;
  padding?: DsCardPadding;
  hover?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/* ─── Maps ─── */
const paddingClasses: Record<DsCardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

const variantClasses: Record<DsCardVariant, string> = {
  default: 'bg-[var(--surface)] border border-[var(--border)] shadow-sm',
  glass: 'bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--glass-border)] shadow-md',
  gradient: [
    'relative bg-[var(--surface)]',
    'before:absolute before:inset-0 before:rounded-[inherit] before:p-px',
    'before:bg-gradient-to-br before:from-[var(--primary)] before:via-[var(--info)] before:to-[var(--success)]',
    'before:-z-10 before:content-[""]',
    'shadow-md',
  ].join(' '),
  elevated: 'bg-[var(--surface)] border border-[var(--border)] shadow-lg',
};

/* ─── Component ─── */
export const DsCard = forwardRef<HTMLDivElement, DsCardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hover = false,
      header,
      footer,
      children,
      className = '',
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={[
          'ds-card rounded-lg overflow-hidden',
          variantClasses[variant],
          hover
            ? 'transition-all duration-fast ease-smooth hover:-translate-y-0.5 hover:shadow-lg active:translate-y-px active:shadow-sm cursor-pointer'
            : '',
          className,
        ].join(' ')}
        {...props}
      >
        {header && (
          <div className="px-5 py-3 border-b border-[var(--border)]">{header}</div>
        )}
        <div className={paddingClasses[padding]}>{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t border-[var(--border)]">{footer}</div>
        )}
      </div>
    );
  },
);

DsCard.displayName = 'DsCard';
export default DsCard;
