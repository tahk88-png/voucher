/**
 * Per-action admin rate limits.
 *
 * Wraps the existing `rateLimitDistributed` helper with pre-configured
 * windows for admin operations.
 */

import { rateLimitDistributed } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// Rate limit profiles
// ---------------------------------------------------------------------------

const PROFILES = {
  /** Standard read endpoints (list, search, get). */
  read: { maxAttempts: 100, windowMs: 60_000 },
  /** Standard write endpoints (create, update). */
  write: { maxAttempts: 30, windowMs: 60_000 },
  /** Refund issuance. */
  refund: { maxAttempts: 10, windowMs: 5 * 60_000 },
  /** Ban / suspend actions. */
  ban: { maxAttempts: 5, windowMs: 5 * 60_000 },
  /** Audit export / analytics export. */
  export: { maxAttempts: 5, windowMs: 60_000 },
} as const;

export type AdminRateLimitProfile = keyof typeof PROFILES;

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Apply a named rate-limit profile for the given admin user.
 *
 * @returns `{ allowed, remaining, resetAt }` — same shape as `rateLimitDistributed`.
 */
export async function adminRateLimit(
  userId: string,
  profile: AdminRateLimitProfile,
) {
  const { maxAttempts, windowMs } = PROFILES[profile];
  const key = `admin:rl:${profile}:${userId}`;

  return rateLimitDistributed(key, maxAttempts, windowMs);
}
