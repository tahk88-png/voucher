'use client';

import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Maximize2, MoreHorizontal, Info, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   PREMIUM CHART CARD — Premium chart container with glass styling
   ═══════════════════════════════════════════════════════════════ */

export interface ChartPeriod {
  label: string;
  value: string;
}

export interface PremiumChartCardProps {
  /** Card title */
  title: string;
  /** Subtitle text */
  subtitle?: string;
  /** Info tooltip text */
  infoText?: string;
  /** Period selector options */
  periods?: ChartPeriod[];
  /** Currently selected period */
  activePeriod?: string;
  /** Period change handler */
  onPeriodChange?: (period: string) => void;
  /** Fullscreen toggle handler */
  onFullscreen?: () => void;
  /** More menu handler */
  onMore?: () => void;
  /** Chart content */
  children?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Empty state */
  empty?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
  /** Allow resize */
  resizable?: boolean;
}

export function PremiumChartCard({
  title,
  subtitle,
  infoText,
  periods,
  activePeriod,
  onPeriodChange,
  onFullscreen,
  onMore,
  children,
  loading = false,
  empty = false,
  emptyMessage = 'No data available for this period',
  className = '',
  resizable = false,
}: PremiumChartCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ── Entrance animation ── */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.05 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    } else {
      setIsFullscreen((v) => !v);
    }
  };

  const wrapperClass = isFullscreen
    ? 'fixed inset-0 z-[100] flex flex-col'
    : `relative ${resizable ? 'resize overflow-auto' : ''}`;

  return (
    <div
      ref={cardRef}
      className={`${wrapperClass} rounded-2xl overflow-hidden ${className}`}
      style={{
        background: 'var(--ds-bg-glass, rgba(255,255,255,0.03))',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--ds-border-default, rgba(255,255,255,0.08))',
        boxShadow: 'var(--ds-shadow-md)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity var(--ds-duration-slow, 400ms) var(--ds-ease-out),
                     transform var(--ds-duration-slow, 400ms) var(--ds-ease-out)`,
      }}
    >
      {/* Gradient top border */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'var(--ds-gradient-primary)' }}
      />

      {/* Header */}
      <div
        className="flex items-center justify-between gap-4 px-6 pt-5 pb-4"
        style={{ borderBottom: '1px solid var(--ds-border-default)' }}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--ds-text-primary)' }}
            >
              {title}
            </h3>
            {infoText && (
              <button
                className="relative shrink-0"
                onClick={() => setShowInfo((v) => !v)}
                aria-label="Info"
              >
                <Info
                  size={14}
                  style={{ color: 'var(--ds-text-tertiary)' }}
                  className="hover:opacity-80"
                />
                {showInfo && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50
                               w-56 rounded-lg px-3 py-2 text-xs"
                    style={{
                      background: 'var(--ds-bg-elevated)',
                      border: '1px solid var(--ds-border-default)',
                      color: 'var(--ds-text-secondary)',
                      boxShadow: 'var(--ds-shadow-lg)',
                    }}
                  >
                    {infoText}
                  </div>
                )}
              </button>
            )}
          </div>
          {subtitle && (
            <span
              className="text-xs mt-0.5"
              style={{ color: 'var(--ds-text-tertiary)' }}
            >
              {subtitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Period pills */}
          {periods && periods.length > 0 && (
            <div
              className="flex rounded-lg p-0.5"
              style={{ background: 'var(--ds-bg-surface, #12121a)' }}
            >
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => onPeriodChange?.(p.value)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200"
                  style={{
                    background: activePeriod === p.value ? 'var(--ds-bg-elevated)' : 'transparent',
                    color:
                      activePeriod === p.value
                        ? 'var(--ds-text-primary)'
                        : 'var(--ds-text-tertiary)',
                    boxShadow: activePeriod === p.value ? 'var(--ds-shadow-sm)' : 'none',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-md transition-colors duration-150"
            style={{ color: 'var(--ds-text-tertiary)' }}
            onMouseEnter={(e) => { (e.currentTarget.style.color as string) && (e.currentTarget.style.color = 'var(--ds-text-secondary)'); }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-tertiary)'; }}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <X size={16} /> : <Maximize2 size={16} />}
          </button>
          {onMore && (
            <button
              onClick={onMore}
              className="p-1.5 rounded-md transition-colors duration-150"
              style={{ color: 'var(--ds-text-tertiary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-text-secondary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-tertiary)'; }}
              aria-label="More options"
            >
              <MoreHorizontal size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={`px-6 py-4 ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
        {loading ? (
          <ChartSkeleton />
        ) : empty ? (
          <EmptyState message={emptyMessage} />
        ) : (
          children
        )}
      </div>

      {/* Resize handle indicator */}
      {resizable && !isFullscreen && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          style={{
            background: `linear-gradient(135deg, transparent 50%, var(--ds-border-default) 50%)`,
            borderRadius: '0 0 var(--ds-radius-lg) 0',
          }}
        />
      )}
    </div>
  );
}

/* ── Chart skeleton ── */
function ChartSkeleton() {
  return (
    <div className="flex items-end gap-2 h-48">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex-1 rounded-t-sm" style={{
          background: 'var(--ds-border-default)',
          height: `${20 + Math.random() * 60}%`,
          animation: `ds-bar-grow 1s var(--ds-ease-out) ${i * 0.08}s both`,
        }} />
      ))}
      <style jsx>{`
        @keyframes ds-bar-grow {
          from { transform: scaleY(0); transform-origin: bottom; opacity: 0.2; }
          to   { transform: scaleY(1); transform-origin: bottom; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      {/* Simple chart illustration */}
      <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
        <rect x="4" y="24" width="8" height="20" rx="2" fill="var(--ds-border-default)" opacity="0.5" />
        <rect x="16" y="16" width="8" height="28" rx="2" fill="var(--ds-border-default)" opacity="0.5" />
        <rect x="28" y="20" width="8" height="24" rx="2" fill="var(--ds-border-default)" opacity="0.5" />
        <rect x="40" y="8" width="8" height="36" rx="2" fill="var(--ds-border-default)" opacity="0.5" />
        <rect x="52" y="28" width="8" height="16" rx="2" fill="var(--ds-border-default)" opacity="0.5" />
        <line x1="0" y1="46" x2="64" y2="46" stroke="var(--ds-border-default)" strokeWidth="1" />
      </svg>
      <span className="text-sm" style={{ color: 'var(--ds-text-tertiary)' }}>
        {message}
      </span>
    </div>
  );
}

export default PremiumChartCard;
