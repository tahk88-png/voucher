'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

/* ─── Types ─── */
export type DsNotificationType = 'info' | 'success' | 'warning' | 'error';
export type DsNotificationPosition = 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';

export interface DsNotificationOptions {
  type?: DsNotificationType;
  title?: string;
  message: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface NotificationItem extends Required<Pick<DsNotificationOptions, 'type' | 'message' | 'duration'>> {
  id: string;
  title?: string;
  action?: DsNotificationOptions['action'];
  createdAt: number;
}

interface NotificationContextValue {
  notify: (options: DsNotificationOptions) => string;
  dismiss: (id: string) => void;
}

/* ─── Context ─── */
const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within <NotificationProvider>');
  return ctx;
}

/* ─── Icons ─── */
const typeIcons: Record<DsNotificationType, ReactNode> = {
  info: (
    <svg className="w-5 h-5 text-[var(--info)]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5 text-[var(--success)]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-[var(--warning)]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-[var(--danger)]" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
};

/* ─── Single toast ─── */
function Toast({
  item,
  index,
  position,
  onDismiss,
}: {
  item: NotificationItem;
  index: number;
  position: DsNotificationPosition;
  onDismiss: (id: string) => void;
}) {
  const [progress, setProgress] = useState(100);
  const [exiting, setExiting] = useState(false);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (item.duration <= 0) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / item.duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        setExiting(true);
        setTimeout(() => onDismiss(item.id), 200);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [item.duration, item.id, onDismiss]);

  const isTop = position.startsWith('top');
  const offset = index * 68;

  const slideDirection = isTop ? '-translate-y-4' : 'translate-y-4';
  const posStyle = isTop
    ? { top: 16 + offset }
    : { bottom: 16 + offset };

  const alignClass = position.includes('center')
    ? 'left-1/2 -translate-x-1/2'
    : 'right-4';

  return (
    <div
      role="status"
      style={posStyle}
      className={[
        'ds-toast fixed z-[99999] w-[360px] max-w-[calc(100vw-2rem)]',
        alignClass,
        'bg-[var(--glass-bg)] backdrop-blur-xl',
        'border border-[var(--glass-border)]',
        'rounded-lg shadow-xl overflow-hidden',
        'transition-all duration-200 ease-spring',
        exiting
          ? `opacity-0 ${slideDirection}`
          : 'opacity-100 translate-y-0',
      ].join(' ')}
    >
      <div className="flex gap-3 p-4">
        <span className="flex-shrink-0 mt-0.5">{typeIcons[item.type]}</span>
        <div className="flex-1 min-w-0">
          {item.title && (
            <p className="text-sm font-semibold text-[var(--text)] mb-0.5">{item.title}</p>
          )}
          <p className="text-sm text-[var(--text-muted)]">{item.message}</p>
          {item.action && (
            <button
              type="button"
              onClick={item.action.onClick}
              className="mt-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              {item.action.label}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            setExiting(true);
            setTimeout(() => onDismiss(item.id), 200);
          }}
          className="flex-shrink-0 p-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--surface-dim)] transition-colors"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {item.duration > 0 && (
        <div className="h-0.5 bg-[var(--border)]">
          <div
            className="h-full bg-[var(--primary)] transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Provider ─── */
export interface NotificationProviderProps {
  position?: DsNotificationPosition;
  children: ReactNode;
}

export function NotificationProvider({
  position = 'top-right',
  children,
}: NotificationProviderProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const counterRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback(
    (options: DsNotificationOptions) => {
      const id = `ds-notif-${++counterRef.current}`;
      const item: NotificationItem = {
        id,
        type: options.type || 'info',
        title: options.title,
        message: options.message,
        duration: options.duration ?? 5000,
        action: options.action,
        createdAt: Date.now(),
      };
      setItems((prev) => [...prev.slice(-4), item]); // max 5
      return id;
    },
    [],
  );

  return (
    <NotificationContext.Provider value={{ notify, dismiss }}>
      {children}
      {mounted &&
        createPortal(
          <>
            {items.map((item, index) => (
              <Toast
                key={item.id}
                item={item}
                index={index}
                position={position}
                onDismiss={dismiss}
              />
            ))}
          </>,
          document.body,
        )}
    </NotificationContext.Provider>
  );
}

export default NotificationProvider;
