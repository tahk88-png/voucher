export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate env first — fail fast if required vars are missing/malformed.
    // Skipped in test so Vitest runs can stub env per-test.
    if (process.env.NODE_ENV !== 'test') {
      const { validateEnv } = await import('./lib/env');
      validateEnv();
    }
    await import('./sentry.server.config');
  }
}
