import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Strip PII
    if (event.request?.url) {
      event.request.url = event.request.url.replace(/([?&](email|token|code|password)=)[^&]+/g, '$1[REDACTED]');
    }
    if (event.request?.data && typeof event.request.data === 'object') {
      const data = event.request.data as Record<string, unknown>;
      for (const key of ['password', 'token', 'magicToken', 'otp']) {
        if (key in data) data[key] = '[REDACTED]';
      }
    }
    return event;
  },
});
