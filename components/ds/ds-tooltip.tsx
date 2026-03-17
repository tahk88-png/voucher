'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';

/* ─── Types ─── */
export type DsTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface DsTooltipProps {
  content: ReactNode;
  position?: DsTooltipPosition;
  delay?: number;
  children: ReactNode;
  className?: string;
}

/* ─── Arrow positions ─── */
const arrowStyles: Record<DsTooltipPosition, CSSProperties> = {
  top: { bottom: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
  bottom: { top: -4, left: '50%', transform: 'translateX(-50%) rotate(45deg)' },
  left: { right: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
  right: { left: -4, top: '50%', transform: 'translateY(-50%) rotate(45deg)' },
};

/* ─── Enter origin per position ─── */
const originMap: Record<DsTooltipPosition, string> = {
  top: 'origin-bottom',
  bottom: 'origin-top',
  left: 'origin-right',
  right: 'origin-left',
};

/* ─── Component ─── */
export function DsTooltip({
  content,
  position = 'top',
  delay = 200,
  children,
  className = '',
}: DsTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger || !tooltip) return;

    const tRect = trigger.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();
    const gap = 8;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = tRect.top - ttRect.height - gap;
        left = tRect.left + tRect.width / 2 - ttRect.width / 2;
        break;
      case 'bottom':
        top = tRect.bottom + gap;
        left = tRect.left + tRect.width / 2 - ttRect.width / 2;
        break;
      case 'left':
        top = tRect.top + tRect.height / 2 - ttRect.height / 2;
        left = tRect.left - ttRect.width - gap;
        break;
      case 'right':
        top = tRect.top + tRect.height / 2 - ttRect.height / 2;
        left = tRect.right + gap;
        break;
    }

    /* Keep within viewport */
    left = Math.max(8, Math.min(left, window.innerWidth - ttRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - ttRect.height - 8));

    setCoords({ top: top + window.scrollY, left: left + window.scrollX });
  }, [position]);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(calculatePosition);
    }, delay);
  }, [delay, calculatePosition]);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  /* Recalculate on scroll/resize while visible */
  useEffect(() => {
    if (!visible) return;
    const recalc = () => calculatePosition();
    window.addEventListener('scroll', recalc, true);
    window.addEventListener('resize', recalc);
    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [visible, calculatePosition]);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>

      {mounted &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
            className={[
              'ds-tooltip fixed z-[99999] pointer-events-none',
              'px-3 py-1.5 rounded-md text-sm',
              'bg-[var(--surface-dim)]/95 backdrop-blur-md',
              'border border-[var(--glass-border)]',
              'text-[var(--text)] shadow-lg',
              'transition-all duration-150',
              originMap[position],
              visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90',
              className,
            ].join(' ')}
          >
            {content}
            {/* Arrow */}
            <span
              aria-hidden
              className="absolute w-2 h-2 bg-[var(--surface-dim)] border border-[var(--glass-border)]"
              style={arrowStyles[position]}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

export default DsTooltip;
