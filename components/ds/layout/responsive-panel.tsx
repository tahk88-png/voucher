'use client';

import React, { useEffect, useCallback, useRef, type ReactNode } from 'react';

export interface ResponsivePanelProps {
  open: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  title?: string;
}

const sizeMap = {
  sm: 'max-w-sm',   // 384px
  md: 'max-w-md',   // 448px
  lg: 'max-w-lg',   // 512px
} as const;

export function ResponsivePanel({
  open,
  onClose,
  position = 'right',
  size = 'md',
  children,
  title,
}: ResponsivePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  const translateFrom =
    position === 'left' ? '-translate-x-full' : 'translate-x-full';
  const posClass = position === 'left' ? 'left-0' : 'right-0';

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 z-50 transition-opacity backdrop-blur-sm',
          open
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none',
        ].join(' ')}
        style={{
          background: 'var(--ds-bg-overlay)',
          transitionDuration: 'var(--ds-duration-normal)',
        }}
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Side panel'}
        className={[
          'fixed top-0 z-50 h-full w-full flex flex-col',
          sizeMap[size],
          posClass,
          'transition-transform',
          open ? 'translate-x-0' : translateFrom,
          // Mobile: full-width; Desktop: constrained
          'sm:w-auto sm:min-w-[320px]',
        ].join(' ')}
        style={{
          background: 'var(--ds-bg-surface)',
          borderLeft:
            position === 'right'
              ? '1px solid var(--ds-border-default)'
              : 'none',
          borderRight:
            position === 'left'
              ? '1px solid var(--ds-border-default)'
              : 'none',
          boxShadow: 'var(--ds-shadow-xl)',
          transitionDuration: 'var(--ds-duration-normal)',
          transitionTimingFunction: 'var(--ds-ease-default)',
        }}
      >
        {/* Glass header */}
        {title && (
          <div
            className="flex items-center justify-between px-5 h-14 shrink-0 border-b backdrop-blur-xl"
            style={{
              background: 'var(--ds-bg-glass)',
              borderColor: 'var(--ds-border-default)',
            }}
          >
            <span
              className="text-base font-semibold truncate"
              style={{ color: 'var(--ds-text-primary)' }}
            >
              {title}
            </span>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors"
              style={{ color: 'var(--ds-text-secondary)' }}
              aria-label="Close panel"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  );
}

export default ResponsivePanel;
