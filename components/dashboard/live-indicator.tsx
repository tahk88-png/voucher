'use client';

import React, { useState } from 'react';

interface LiveIndicatorProps {
  connected: boolean;
  reconnecting?: boolean;
  label?: string;
  /** Extra details shown in tooltip (e.g. "Last event: 2s ago") */
  details?: string;
}

/**
 * Small connection-status dot for dashboard headers.
 * Green = connected, Yellow = reconnecting, Red = disconnected.
 * Pulsing animation when connected. Hover shows tooltip with details.
 */
export function LiveIndicator({
  connected,
  reconnecting = false,
  label,
  details,
}: LiveIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const status = connected ? 'connected' : reconnecting ? 'reconnecting' : 'disconnected';

  const dotColor =
    status === 'connected'
      ? '#22c55e'
      : status === 'reconnecting'
        ? '#eab308'
        : '#ef4444';

  const statusLabel =
    label ??
    (status === 'connected'
      ? 'Live'
      : status === 'reconnecting'
        ? 'Reconnecting'
        : 'Disconnected');

  return (
    <div
      className="relative inline-flex items-center gap-1.5 cursor-default"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Dot */}
      <span className="relative flex h-2.5 w-2.5">
        {status === 'connected' && (
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{
              backgroundColor: dotColor,
              animation: 'live-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
        )}
        <span
          className="relative inline-flex rounded-full h-2.5 w-2.5"
          style={{ backgroundColor: dotColor }}
        />
      </span>

      {/* Label */}
      <span
        className="text-xs font-medium"
        style={{
          color:
            status === 'connected'
              ? '#22c55e'
              : 'var(--text-muted, #6b7280)',
        }}
      >
        {statusLabel}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg shadow-lg text-xs whitespace-nowrap z-50"
          style={{
            backgroundColor: 'var(--surface, #fff)',
            border: '1px solid var(--border, #e5e7eb)',
            color: 'var(--text, #111)',
          }}
        >
          <div className="font-semibold capitalize">{status}</div>
          {details && (
            <div style={{ color: 'var(--text-muted, #6b7280)' }}>{details}</div>
          )}
          {/* Arrow */}
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid var(--border, #e5e7eb)',
            }}
          />
        </div>
      )}

      {/* Keyframe animation — injected once */}
      <style jsx>{`
        @keyframes live-ping {
          0% {
            transform: scale(1);
            opacity: 0.75;
          }
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
