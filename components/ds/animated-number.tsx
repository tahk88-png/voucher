'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: 'number' | 'currency' | 'percent';
  locale?: string;
  currency?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedNumber({
  value,
  duration = 800,
  format = 'number',
  locale,
  currency = 'EUR',
  prefix = '',
  suffix = '',
  decimals,
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;

    if (from === to) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReduced) {
      setDisplayValue(to);
      return;
    }

    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const current = from + (to - from) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const resolvedLocale = locale || (typeof navigator !== 'undefined' ? navigator.language : 'en');
  const resolvedDecimals = decimals ?? (format === 'currency' ? 2 : format === 'percent' ? 1 : 0);

  let formatted: string;

  switch (format) {
    case 'currency':
      formatted = new Intl.NumberFormat(resolvedLocale, {
        style: 'currency',
        currency,
        minimumFractionDigits: resolvedDecimals,
        maximumFractionDigits: resolvedDecimals,
      }).format(displayValue);
      break;
    case 'percent':
      formatted = new Intl.NumberFormat(resolvedLocale, {
        style: 'percent',
        minimumFractionDigits: resolvedDecimals,
        maximumFractionDigits: resolvedDecimals,
      }).format(displayValue / 100);
      break;
    default:
      formatted = new Intl.NumberFormat(resolvedLocale, {
        minimumFractionDigits: resolvedDecimals,
        maximumFractionDigits: resolvedDecimals,
      }).format(displayValue);
  }

  return (
    <span className={className} aria-live="polite">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
