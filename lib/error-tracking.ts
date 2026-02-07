/**
 * Error tracking integration
 * Supports Sentry (production) and console logging (development)
 */

let errorTracker: {
  captureException: (error: Error, context?: Record<string, any>) => void;
  captureMessage: (message: string, level?: 'info' | 'warning' | 'error') => void;
  setUser: (user: { id: string; email?: string }) => void;
} | null = null;

// Initialize error tracking
// Use lazy loading to avoid build-time module resolution errors
function getSentry() {
  try {
    // Use eval to avoid build-time module resolution when dependency is absent.
    const req = (0, eval)('require');
    return req('@sentry/nextjs');
  } catch {
    return null;
  }
}

if (typeof window === 'undefined') {
  // Server-side
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
    const Sentry = getSentry();
    if (Sentry) {
      errorTracker = {
        captureException: (error: Error, context?: Record<string, any>) => {
          Sentry.captureException(error, { extra: context });
        },
        captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
          Sentry.captureMessage(message, level);
        },
        setUser: (user: { id: string; email?: string }) => {
          Sentry.setUser(user);
        },
      };
    }
  }
} else {
  // Client-side
  if (process.env.NEXT_PUBLIC_SENTRY_DSN && process.env.NODE_ENV === 'production') {
    const Sentry = getSentry();
    if (Sentry) {
      errorTracker = {
        captureException: (error: Error, context?: Record<string, any>) => {
          Sentry.captureException(error, { extra: context });
        },
        captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
          Sentry.captureMessage(message, level);
        },
        setUser: (user: { id: string; email?: string }) => {
          Sentry.setUser(user);
        },
      };
    }
  }
}

// Fallback to console logging
if (!errorTracker) {
  errorTracker = {
    captureException: (error: Error, context?: Record<string, any>) => {
      console.error('[Error]', error.message, error.stack, context);
    },
    captureMessage: (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
      const logFn = level === 'error' ? console.error : level === 'warning' ? console.warn : console.log;
      logFn(`[${level.toUpperCase()}]`, message);
    },
    setUser: (user: { id: string; email?: string }) => {
      // No-op for console logging
    },
  };
}

export const captureException = (error: Error, context?: Record<string, any>) => {
  errorTracker?.captureException(error, context);
};

export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info') => {
  errorTracker?.captureMessage(message, level);
};

export const setUser = (user: { id: string; email?: string }) => {
  errorTracker?.setUser(user);
};
