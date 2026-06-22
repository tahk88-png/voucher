'use client';

/**
 * Web Vitals reporter — mount once in the root layout.
 *
 * Delegates to `reportWebVitals` which wires up the browser's
 * PerformanceObserver callbacks for CLS / INP / LCP / FCP / TTFB and
 * forwards each sample to Sentry (if loaded) or to /api/metrics/vitals
 * via `navigator.sendBeacon`.
 *
 * The reporter is idempotent internally, so re-renders from layout
 * navigation are free. We keep this as a separate client component
 * so the root layout can stay a server component.
 */

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/web-vitals';

export function WebVitalsReporter() {
  useEffect(() => {
    reportWebVitals();
  }, []);
  return null;
}
