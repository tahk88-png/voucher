import React from 'react';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  gradient?: boolean;
  className?: string;
}

export function Divider({
  orientation = 'horizontal',
  label,
  gradient = false,
  className = '',
}: DividerProps) {
  if (orientation === 'vertical') {
    return (
      <div
        className={`self-stretch w-px shrink-0 ${className}`}
        style={{
          background: gradient
            ? 'linear-gradient(to bottom, transparent, var(--ds-border-default), transparent)'
            : 'var(--ds-border-default)',
        }}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  if (label) {
    return (
      <div
        className={`flex items-center gap-3 w-full ${className}`}
        role="separator"
      >
        <div
          className="flex-1 h-px"
          style={{
            background: gradient
              ? 'linear-gradient(to right, transparent, var(--ds-border-default))'
              : 'var(--ds-border-default)',
          }}
        />
        <span
          className="text-xs font-medium shrink-0 select-none"
          style={{ color: 'var(--ds-text-tertiary)' }}
        >
          {label}
        </span>
        <div
          className="flex-1 h-px"
          style={{
            background: gradient
              ? 'linear-gradient(to left, transparent, var(--ds-border-default))'
              : 'var(--ds-border-default)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full h-px ${className}`}
      style={{
        background: gradient
          ? 'linear-gradient(to right, transparent, var(--ds-border-default), transparent)'
          : 'var(--ds-border-default)',
      }}
      role="separator"
      aria-orientation="horizontal"
    />
  );
}

export default Divider;
