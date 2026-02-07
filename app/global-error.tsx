'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Global error:', error);
    }
  }, [error]);

  // Note: Global error cannot use next-intl hooks, so we use fallback text
  // This is a critical error boundary that must work even if i18n fails
  const errorStyles = `
    .ge-root { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 1rem; font-family: system-ui, sans-serif; }
    .ge-h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; }
    .ge-p { font-size: 0.875rem; color: #666; margin-bottom: 1rem; }
    .ge-btn { padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; border: 1px solid #ccc; background: #fff; cursor: pointer; }
  `;
  return (
    <html lang="en">
      <head>
        <style>{errorStyles}</style>
      </head>
      <body>
        <div className="ge-root">
          <h1 className="ge-h1">Something went wrong</h1>
          <p className="ge-p">A critical error occurred. Please refresh the page.</p>
          <button type="button" onClick={reset} className="ge-btn">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
