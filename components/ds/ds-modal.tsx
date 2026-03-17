'use client';

import React, {
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';

/* ─── Types ─── */
export type DsModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface DsModalProps {
  open: boolean;
  onClose: () => void;
  size?: DsModalSize;
  title?: ReactNode;
  footer?: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showClose?: boolean;
  children: ReactNode;
  className?: string;
}

/* ─── Size maps ─── */
const sizeClasses: Record<DsModalSize, string> = {
  sm: 'max-w-[400px]',
  md: 'max-w-[600px]',
  lg: 'max-w-[800px]',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

/* ─── Component ─── */
export function DsModal({
  open,
  onClose,
  size = 'md',
  title,
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showClose = true,
  children,
  className = '',
}: DsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  /* Focus trap */
  const getFocusableElements = useCallback(() => {
    if (!dialogRef.current) return [];
    return Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && closeOnEscape) {
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [closeOnEscape, onClose, getFocusableElements],
  );

  /* Save/restore focus, lock body scroll */
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      requestAnimationFrame(() => {
        const focusable = getFocusableElements();
        if (focusable.length > 0) focusable[0].focus();
        else dialogRef.current?.focus();
      });
    } else {
      document.body.style.overflow = '';
      previousFocus.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, getFocusableElements]);

  /* Don't render when closed (for cleaner DOM) */
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div
      role="presentation"
      className={[
        'ds-modal fixed inset-0 z-[9999] flex items-center justify-center p-4',
        'transition-opacity duration-200',
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      ].join(' ')}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Dialog'}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className={[
          'relative w-full',
          sizeClasses[size],
          'bg-[var(--glass-bg)] backdrop-blur-xl',
          'border border-[var(--glass-border)]',
          'rounded-xl shadow-2xl',
          'flex flex-col overflow-hidden',
          'transition-all duration-200 ease-spring',
          open ? 'scale-100 translate-y-0' : 'scale-95 translate-y-2',
          className,
        ].join(' ')}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            {title && (
              <h2 className="text-lg font-semibold text-[var(--text)]">{title}</h2>
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="ml-auto p-1 rounded-md text-[var(--text-faint)] hover:text-[var(--text)] hover:bg-[var(--surface-dim)] transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--border)] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export default DsModal;
