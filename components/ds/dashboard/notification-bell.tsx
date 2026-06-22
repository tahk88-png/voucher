'use client';

import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Bell, Check, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATION BELL — Premium notification indicator + dropdown
   Animated shake, glass dropdown, read/unread states
   ═══════════════════════════════════════════════════════════════ */

export interface NotificationItem {
  id: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  time: string; // relative or ISO
  read: boolean;
}

export interface NotificationBellProps {
  /** Notification items */
  notifications: NotificationItem[];
  /** Unread count override (default: computed from items) */
  unreadCount?: number;
  /** Mark single notification as read */
  onMarkRead?: (id: string) => void;
  /** Mark all as read */
  onMarkAllRead?: () => void;
  /** Click a notification */
  onNotificationClick?: (id: string) => void;
  /** Animate shake when this changes to true */
  hasNew?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function NotificationBell({
  notifications,
  unreadCount: unreadOverride,
  onMarkRead,
  onMarkAllRead,
  onNotificationClick,
  hasNew = false,
  className = '',
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unread = unreadOverride ?? notifications.filter((n) => !n.read).length;

  /* ── Shake on new notification ── */
  useEffect(() => {
    if (hasNew) {
      setShaking(true);
      const timer = setTimeout(() => setShaking(false), 600);
      return () => clearTimeout(timer);
    }
  }, [hasNew]);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl transition-colors duration-200"
        style={{
          color: 'var(--ds-text-secondary)',
          background: open ? 'var(--ds-bg-glass)' : 'transparent',
          animation: shaking ? 'ds-bell-shake 0.6s ease-in-out' : 'none',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ds-text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ds-text-secondary)'; }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        aria-expanded={open}
      >
        <Bell size={20} />
        {/* Badge */}
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              background: 'var(--ds-error, #f43f5e)',
              color: 'white',
              boxShadow: '0 0 8px rgba(244, 63, 94, 0.4)',
              animation: unread > 0 ? 'ds-badge-pop 0.3s var(--ds-ease-spring) forwards' : 'none',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      <div
        className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl overflow-hidden"
        style={{
          background: 'var(--ds-bg-elevated, #1a1a28)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--ds-border-default)',
          boxShadow: 'var(--ds-shadow-xl)',
          opacity: open ? 1 : 0,
          transform: open ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.96)',
          pointerEvents: open ? 'auto' : 'none',
          transition: `all var(--ds-duration-normal, 250ms) var(--ds-ease-out)`,
          transformOrigin: 'top right',
        }}
      >
        {/* Gradient top line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'var(--ds-gradient-primary)' }}
        />

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--ds-border-default)' }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--ds-text-primary)' }}
          >
            Notifications
          </span>
          {unread > 0 && onMarkAllRead && (
            <button
              onClick={() => { onMarkAllRead(); }}
              className="flex items-center gap-1 text-xs font-medium transition-colors duration-150"
              style={{ color: 'var(--ds-primary)' }}
            >
              <Check size={12} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: 320 }}
        >
          {notifications.length === 0 ? (
            <div
              className="flex flex-col items-center py-8 gap-2"
            >
              <Bell size={24} style={{ color: 'var(--ds-text-tertiary)', opacity: 0.5 }} />
              <span
                className="text-sm"
                style={{ color: 'var(--ds-text-tertiary)' }}
              >
                No notifications
              </span>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-150"
                style={{
                  background: n.read ? 'transparent' : 'rgba(6, 182, 212, 0.04)',
                  borderBottom: '1px solid var(--ds-border-default)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ds-bg-glass)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(6, 182, 212, 0.04)'; }}
                onClick={() => {
                  onNotificationClick?.(n.id);
                  if (!n.read) onMarkRead?.(n.id);
                }}
              >
                {/* Icon */}
                {n.icon && (
                  <span
                    className="mt-0.5 shrink-0 flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{
                      background: 'var(--ds-bg-glass)',
                      color: 'var(--ds-primary)',
                    }}
                  >
                    {n.icon}
                  </span>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-sm font-medium truncate"
                      style={{
                        color: n.read ? 'var(--ds-text-secondary)' : 'var(--ds-text-primary)',
                      }}
                    >
                      {n.title}
                    </span>
                    {!n.read && (
                      <span
                        className="mt-1.5 block h-2 w-2 shrink-0 rounded-full"
                        style={{
                          background: 'var(--ds-primary)',
                          boxShadow: '0 0 6px rgba(6, 182, 212, 0.4)',
                        }}
                      />
                    )}
                  </div>
                  {n.description && (
                    <p
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: 'var(--ds-text-tertiary)' }}
                    >
                      {n.description}
                    </p>
                  )}
                  <span
                    className="block text-[10px] mt-1"
                    style={{ color: 'var(--ds-text-tertiary)', opacity: 0.7 }}
                  >
                    {n.time}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes ds-bell-shake {
          0%, 100% { transform: rotate(0); }
          15% { transform: rotate(12deg); }
          30% { transform: rotate(-10deg); }
          45% { transform: rotate(8deg); }
          60% { transform: rotate(-6deg); }
          75% { transform: rotate(3deg); }
        }
        @keyframes ds-badge-pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default NotificationBell;
