import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  ignoreErrors: [
    // Browser noise
    'ResizeObserver loop',
    'Non-Error exception captured',
    'Non-Error promise rejection',
    'ChunkLoadError',
    /^Loading chunk \d+ failed/,
  ],
  beforeSend(event) {
    // Strip PII from request URLs
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/([?&](email|token|code)=)[^&]+/g, '$1[REDACTED]');
    }
    return event;
  },
});
