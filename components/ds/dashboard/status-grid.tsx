'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════════
   STATUS GRID — System status overview
   Grid of color-coded status cards with animated transitions
   ═══════════════════════════════════════════════════════════════ */

export type StatusLevel = 'operational' | 'degraded' | 'outage';

export interface StatusItem {
  id: string;
  icon: ReactNode;
  label: string;
  status: StatusLevel;
  /** Optional metric value (e.g. "99.9%", "12ms") */
  value?: string;
}

export interface StatusGridProps {
  items: StatusItem[];
  /** Grid columns: 2 or 3 */
  columns?: 2 | 3;
  /** Additional CSS classes */
  className?: string;
}

const statusColors: Record<StatusLevel, { dot: string; glow: string; text: string; bg: string }> = {
  operational: {
    dot: 'var(--ds-success, #10b981)',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'var(--ds-success, #10b981)',
    bg: 'rgba(16, 185, 129, 0.06)',
  },
  degraded: {
    dot: 'var(--ds-warning, #f59e0b)',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'var(--ds-warning, #f59e0b)',
    bg: 'rgba(245, 158, 11, 0.06)',
  },
  outage: {
    dot: 'var(--ds-error, #f43f5e)',
    glow: 'rgba(244, 63, 94, 0.4)',
    text: 'var(--ds-error, #f43f5e)',
    bg: 'rgba(244, 63, 94, 0.06)',
  },
};

const statusLabel: Record<StatusLevel, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  outage: 'Outage',
};

export function StatusGrid({ items, columns = 2, className = '' }: StatusGridProps) {
  return (
    <div
      className={`grid gap-3 ${className}`}
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {items.map((item, i) => (
        <StatusCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}

function StatusCard({ item, index }: { item: StatusItem; index: number }) {
  const clr = statusColors[item.status];
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-xl px-3.5 py-3"
      style={{
        background: clr.bg,
        border: '1px solid var(--ds-border-default, rgba(255,255,255,0.08))',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: `all var(--ds-duration-normal, 250ms) var(--ds-ease-out) ${index * 60}ms`,
      }}
    >
      <div className="flex items-center gap-2.5">
        {/* Icon */}
        <span style={{ color: clr.text }} className="shrink-0 opacity-80">
          {item.icon}
        </span>

        {/* Label + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium truncate"
              style={{ color: 'var(--ds-text-primary)' }}
            >
              {item.label}
            </span>
            {/* Status dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              {item.status !== 'outage' && (
                <span
                  className="absolute inset-0 rounded-full"
                  style={{
                    backgroundColor: clr.dot,
                    animation: 'ds-status-pulse 2s ease-in-out infinite',
                  }}
                />
              )}
              <span
                className="relative block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: clr.dot,
                  boxShadow: `0 0 4px ${clr.glow}`,
                }}
              />
            </span>
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <span
              className="text-[10px]"
              style={{ color: clr.text, opacity: 0.8 }}
            >
              {statusLabel[item.status]}
            </span>
            {item.value && (
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: 'var(--ds-text-primary)' }}
              >
                {item.value}
              </span>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ds-status-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0; transform: scale(2); }
        }
      `}</style>
    </div>
  );
}

export default StatusGrid;
