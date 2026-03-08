import * as Sentry from '@sentry/browser';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const hasValidDsn = !!dsn && !dsn.includes('change_me');

if (hasValidDsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    environment: process.env.NODE_ENV,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error exception captured',
      'Non-Error promise rejection',
      'ChunkLoadError',
      /^Loading chunk \d+ failed/,
    ],
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/([?&](email|token|code)=)[^&]+/g, '$1[REDACTED]');
      }
      return event;
    },
  });
}
