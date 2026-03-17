'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/* ═══════════════════════════════════════════
   useReducedMotion — Respects prefers-reduced-motion
   ═══════════════════════════════════════════ */

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);

    function onChange(e: MediaQueryListEvent) {
      setReduced(e.matches);
    }

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/* ═══════════════════════════════════════════
   useCountUp — Animated number counting
   ═══════════════════════════════════════════ */

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function useCountUp(
  target: number,
  duration: number = 800
): number {
  const [current, setCurrent] = useState(0);
  const prevTarget = useRef(0);
  const rafRef = useRef<number>(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      setCurrent(target);
      prevTarget.current = target;
      return;
    }

    const from = prevTarget.current;
    const to = target;
    prevTarget.current = target;

    if (from === to) return;

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      setCurrent(from + (to - from) * easedProgress);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, reduced]);

  return current;
}

/* ═══════════════════════════════════════════
   useInView — IntersectionObserver hook
   ═══════════════════════════════════════════ */

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: UseInViewOptions = {}
): { ref: React.RefCallback<T>; inView: boolean } {
  const { threshold = 0, rootMargin = '0px', triggerOnce = false } = options;
  const [inView, setInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<T | null>(null);
  const triggeredRef = useRef(false);

  const ref = useCallback(
    (node: T | null) => {
      // Cleanup previous observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) {
        elementRef.current = null;
        return;
      }

      elementRef.current = node;

      if (triggerOnce && triggeredRef.current) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const isIntersecting = entry.isIntersecting;
          setInView(isIntersecting);

          if (isIntersecting && triggerOnce) {
            triggeredRef.current = true;
            observerRef.current?.disconnect();
          }
        },
        { threshold, rootMargin }
      );

      observerRef.current.observe(node);
    },
    [threshold, rootMargin, triggerOnce]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, inView };
}

/* ═══════════════════════════════════════════
   useStaggered — Returns delay values
   ═══════════════════════════════════════════ */

export function useStaggered(
  count: number,
  delay: number = 50
): number[] {
  return useMemo(
    () => Array.from({ length: count }, (_, i) => i * delay),
    [count, delay]
  );
}
