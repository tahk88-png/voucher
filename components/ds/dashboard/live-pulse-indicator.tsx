'use client';

import React, { useState } from 'react';

/* ═══════════════════════════════════════════════════════════════
   LIVE PULSE INDICATOR — Real-time connection status
   Pulsing dot with expanding rings + tooltip
   ═══════════════════════════════════════════════════════════════ */

export type ConnectionStatus = 'connected' | 'degraded' | 'disconnected';

export interface LivePulseIndicatorProps {
  status: ConnectionStatus;
  /** Compact = just the dot, no label */
  compact?: boolean;
  /** Label override (default: "Live" / "Degraded" / "Offline") */
  label?: string;
  /** Latency in ms (shown in tooltip) */
  latencyMs?: number;
  /** Last update ISO string (shown in tooltip) */
  lastUpdate?: string;
  /** Additional CSS classes */
  className?: string;
}

const statusConfig: Record<
  ConnectionStatus,
  { color: string; glow: string; label: string; pulse: boolean }
> = {
  connected: {
    color: 'var(--ds-success, #10b981)',
    glow: 'rgba(16, 185, 129, 0.4)',
    label: 'Live',
    pulse: true,
  },
  degraded: {
    color: 'var(--ds-warning, #f59e0b)',
    glow: 'rgba(245, 158, 11, 0.4)',
    label: 'Degraded',
    pulse: true,
  },
  disconnected: {
    color: 'var(--ds-error, #f43f5e)',
    glow: 'rgba(244, 63, 94, 0.3)',
    label: 'Offline',
    pulse: false,
  },
};

export function LivePulseIndicator({
  status,
  compact = false,
  label: labelOverride,
  latencyMs,
  lastUpdate,
  className = '',
}: LivePulseIndicatorProps) {
  const cfg = statusConfig[status];
  const displayLabel = labelOverride ?? cfg.label;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center gap-2 ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Dot with pulse rings */}
      <span className="relative flex h-3 w-3 items-center justify-center">
        {/* Expanding ring 1 */}
        {cfg.pulse && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: cfg.color,
              opacity: 0,
              animation: 'ds-pulse-ring 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        )}
        {/* Expanding ring 2 (delayed) */}
        {cfg.pulse && (
          <span
            className="absolute inset-0 rounded-full"
            style={{
              backgroundColor: cfg.color,
              opacity: 0,
              animation: 'ds-pulse-ring 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.6s',
            }}
          />
        )}
        {/* Core dot */}
        <span
          className="relative block h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: cfg.color,
            boxShadow: `0 0 6px ${cfg.glow}`,
          }}
        />
      </span>

      {/* Label */}
      {!compact && (
        <span
          className="text-xs font-medium"
          style={{ color: cfg.color }}
        >
          {displayLabel}
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (latencyMs != null || lastUpdate) && (
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 whitespace-nowrap
                     rounded-lg px-3 py-2 text-xs pointer-events-none"
          style={{
            background: 'var(--ds-bg-elevated, #1a1a28)',
            border: '1px solid var(--ds-border-default, rgba(255,255,255,0.08))',
            color: 'var(--ds-text-primary, rgba(255,255,255,0.92))',
            boxShadow: 'var(--ds-shadow-lg)',
            animation: 'ds-fade-in 150ms var(--ds-ease-out) forwards',
          }}
        >
          <div className="flex flex-col gap-1">
            <span className="font-medium" style={{ color: cfg.color }}>
              {displayLabel}
            </span>
            {latencyMs != null && (
              <span style={{ color: 'var(--ds-text-secondary)' }}>
                Latency: {latencyMs}ms
              </span>
            )}
            {lastUpdate && (
              <span style={{ color: 'var(--ds-text-tertiary)' }}>
                Last update: {new Date(lastUpdate).toLocaleTimeString()}
              </span>
            )}
          </div>
          {/* Arrow */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid var(--ds-border-default, rgba(255,255,255,0.08))',
            }}
          />
        </div>
      )}

      {/* Keyframes injected via style tag (only once) */}
      <style jsx global>{`
        @keyframes ds-pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
        @keyframes ds-fade-in {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default LivePulseIndicator;
