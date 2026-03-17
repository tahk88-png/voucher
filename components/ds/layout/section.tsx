import React, { type ReactNode } from 'react';

export interface SectionProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  divider?: boolean;
  className?: string;
}

const paddingMap = {
  sm: 'px-3 py-3 sm:px-4 sm:py-4',
  md: 'px-4 py-5 sm:px-6 sm:py-6',
  lg: 'px-6 py-8 sm:px-8 sm:py-10',
} as const;

export function Section({
  title,
  subtitle,
  action,
  children,
  padding = 'md',
  divider = false,
  className = '',
}: SectionProps) {
  const hasHeader = title || subtitle || action;

  return (
    <section className={`${className}`}>
      {divider && (
        <div
          className="h-px w-full"
          style={{ background: 'var(--ds-border-default)' }}
        />
      )}
      <div className={paddingMap[padding]}>
        {hasHeader && (
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="min-w-0">
              {title && (
                <h2
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: 'var(--ds-text-primary)' }}
                >
                  {title}
                </h2>
              )}
              {subtitle && (
                <p
                  className="mt-1 text-sm"
                  style={{ color: 'var(--ds-text-secondary)' }}
                >
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="shrink-0">{action}</div>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export default Section;
