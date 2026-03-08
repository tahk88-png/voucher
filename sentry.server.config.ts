import * as Sentry from '@sentry/node';

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const hasValidDsn = !!dsn && !dsn.includes('change_me');

if (hasValidDsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = event.request.url.replace(
          /([?&](email|token|code|password)=)[^&]+/g,
          '$1[REDACTED]'
        );
      }
      return event;
    },
  });
}
