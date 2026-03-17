'use client';

import React, { useState, useRef, useEffect, useCallback, type ReactNode } from 'react';

/* ─── Types ─── */
export type DsTabsVariant = 'underline' | 'pills' | 'glass';

export interface DsTab {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface DsTabsProps {
  tabs: DsTab[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  variant?: DsTabsVariant;
  className?: string;
}

/* ─── Component ─── */
export function DsTabs({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = 'underline',
  className = '',
}: DsTabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || tabs[0]?.id || '');
  const activeId = value !== undefined ? value : internalValue;

  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const setTabRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (el) tabRefs.current.set(id, el);
      else tabRefs.current.delete(id);
    },
    [],
  );

  /* Animate indicator position */
  useEffect(() => {
    const tab = tabRefs.current.get(activeId);
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!tab || !container || !indicator) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const left = tabRect.left - containerRect.left + container.scrollLeft;

    if (variant === 'underline') {
      indicator.style.width = `${tabRect.width}px`;
      indicator.style.transform = `translateX(${left}px)`;
    } else {
      indicator.style.width = `${tabRect.width}px`;
      indicator.style.height = `${tabRect.height}px`;
      indicator.style.transform = `translateX(${left}px)`;
    }
  }, [activeId, variant, tabs]);

  const handleSelect = (id: string) => {
    if (value === undefined) setInternalValue(id);
    onChange?.(id);
  };

  /* Variant-specific container class */
  const containerClass =
    variant === 'underline'
      ? 'border-b border-[var(--border)]'
      : variant === 'pills'
        ? 'bg-[var(--surface-dim)] rounded-lg p-1'
        : 'bg-[var(--glass-bg)] backdrop-blur-lg border border-[var(--glass-border)] rounded-lg p-1';

  /* Variant-specific indicator class */
  const indicatorClass =
    variant === 'underline'
      ? 'absolute bottom-0 left-0 h-0.5 bg-[var(--primary)] rounded-full'
      : variant === 'pills'
        ? 'absolute top-1 left-0 bg-[var(--surface)] rounded-md shadow-sm'
        : 'absolute top-1 left-0 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] rounded-md shadow-sm';

  return (
    <div
      ref={containerRef}
      role="tablist"
      className={[
        'ds-tabs relative flex items-center overflow-x-auto scrollbar-none',
        containerClass,
        className,
      ].join(' ')}
    >
      {/* Sliding indicator */}
      <span
        ref={indicatorRef}
        className={[indicatorClass, 'transition-all duration-200 ease-spring'].join(' ')}
        aria-hidden
      />

      {/* Fade edges for overflow */}
      <span className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[var(--bg)] to-transparent opacity-0 [.ds-tabs:not(:first-child)>&]:opacity-100 z-10 hidden sm:block" />
      <span className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[var(--bg)] to-transparent opacity-0 z-10 hidden sm:block" />

      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={setTabRef(tab.id)}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-disabled={tab.disabled}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleSelect(tab.id)}
            className={[
              'relative z-[1] flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium whitespace-nowrap',
              'transition-colors duration-fast ease-smooth select-none',
              tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
              isActive ? 'text-[var(--text)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={[
                  'ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full',
                  isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                    : 'bg-[var(--surface-dim)] text-[var(--text-faint)]',
                ].join(' ')}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default DsTabs;
