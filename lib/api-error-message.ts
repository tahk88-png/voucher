/**
 * Turn an API error body into a sentence a merchant can act on.
 * withErrorHandler returns { error: 'Validation failed', details: [{ path, message }] }
 * for Zod errors; show the first field message instead of "Validation failed".
 */
export function apiErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;
  const b = body as { error?: unknown; message?: unknown; details?: unknown };
  if (Array.isArray(b.details) && b.details.length > 0) {
    const first = b.details[0] as { message?: unknown; path?: unknown };
    if (typeof first?.message === 'string' && first.message) {
      const path = typeof first.path === 'string' && first.path ? `${first.path}: ` : '';
      return `${path}${first.message}`;
    }
  }
  if (typeof b.error === 'string' && b.error) return b.error;
  if (typeof b.message === 'string' && b.message) return b.message;
  return fallback;
}
