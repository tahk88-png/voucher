/**
 * Step-up re-authentication token system.
 *
 * Tokens are single-use, stored in Redis with a 5-minute TTL.
 * Used to gate destructive / high-privilege admin actions.
 */

import { cacheSet, cacheGet, cacheDelete } from '@/lib/redis';

const STEP_UP_TTL_SECONDS = 300; // 5 minutes
const STEP_UP_KEY_PREFIX = 'admin:stepup';

function buildKey(userId: string, token: string): string {
  return `${STEP_UP_KEY_PREFIX}:${userId}:${token}`;
}

/**
 * Generate a single-use step-up token for the given admin user.
 * Stored in Redis with a 5-minute TTL.
 *
 * @returns The generated token string.
 */
export async function generateStepUpToken(userId: string): Promise<string> {
  const token = crypto.randomUUID();
  const key = buildKey(userId, token);

  await cacheSet(key, '1', STEP_UP_TTL_SECONDS);

  return token;
}

/**
 * Verify and consume a step-up token.
 * Returns true if the token was valid (and deletes it so it cannot be reused).
 * Returns false if the token does not exist or has expired.
 */
export async function verifyStepUpToken(userId: string, token: string): Promise<boolean> {
  const key = buildKey(userId, token);

  const value = await cacheGet(key);
  if (!value) {
    return false;
  }

  // Consume the token (single-use)
  await cacheDelete(key);

  return true;
}

export { STEP_UP_TTL_SECONDS };
