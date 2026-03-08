'use client';

/**
 * Client-side Web Vitals reporter.
 *
 * Reports CLS, INP, LCP, FCP, TTFB to Sentry as custom measurements.
 * Falls back to beacon POST to /api/metrics/vitals if Sentry is unavailable.
 *
 * Usage (in a client layout or root component):
 *   import { reportWebVitals } from '@/lib/web-vitals';
 *   useEffect(() => { reportWebVitals(); }, []);
 */

type MetricEntry = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
};

let initialized = false;

export function reportWebVitals(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  // Dynamically import web-vitals to avoid SSR issues
  import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
    const handler = (metric: MetricEntry) => sendMetric(metric);
    onCLS(handler);
    onINP(handler);
    onLCP(handler);
    onFCP(handler);
    onTTFB(handler);
  }).catch(() => {
    // web-vitals not available — skip silently
  });
}

function sendMetric(metric: MetricEntry): void {
  // Try Sentry first
  try {
    const Sentry = (globalThis as any).__SENTRY__;
    if (Sentry?.captureMessage) {
      Sentry.captureMessage(`web-vital: ${metric.name}`, {
        level: 'info',
        tags: { 'web-vital': metric.name, rating: metric.rating },
        extra: { value: metric.value },
      });
      return;
    }
  } catch {
    // Sentry not available
  }

  // Fallback: beacon to metrics endpoint
  const payload = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    url: window.location.pathname,
    timestamp: Date.now(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/metrics/vitals', payload);
  } else {
    fetch('/api/metrics/vitals', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
}
