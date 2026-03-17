'use client';

import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useReducedMotion } from '@/hooks/use-animation';

/* ═══════════════════════════════════════════
   PageTransition — Page-level fade-in wrapper
   ═══════════════════════════════════════════ */

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <div
      className={`${reduced ? '' : 'ds-animate-fade-in-up'} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════
   StaggeredChildren — Staggered fade-in for children
   ═══════════════════════════════════════════ */

interface StaggeredChildrenProps {
  children: ReactNode;
  delay?: number;
  animation?: string;
  className?: string;
}

export function StaggeredChildren({
  children,
  delay = 50,
  animation = 'ds-animate-fade-in-up',
  className = '',
}: StaggeredChildrenProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        return cloneElement(child as React.ReactElement<Record<string, unknown>>, {
          className: `${animation} ${(child.props as Record<string, unknown>).className || ''}`.trim(),
          style: {
            ...((child.props as Record<string, unknown>).style as React.CSSProperties | undefined),
            animationDelay: `${i * delay}ms`,
          },
        });
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════
   ScrollReveal — Scroll-triggered reveal
   ═══════════════════════════════════════════ */

interface ScrollRevealProps {
  children: ReactNode;
  animation?: string;
  threshold?: number;
  rootMargin?: string;
  className?: string;
}

export function ScrollReveal({
  children,
  animation = 'ds-animate-fade-in-up',
  threshold = 0.1,
  rootMargin = '0px 0px -40px 0px',
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, reduced]);

  return (
    <div
      ref={ref}
      className={`${visible ? animation : 'opacity-0'} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
