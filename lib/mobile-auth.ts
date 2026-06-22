import { SignJWT, jwtVerify } from 'jose';

/**
 * Bearer-token auth for the mobile apps (Expo iOS/Android).
 *
 * The web uses NextAuth cookie sessions, which don't fit a native app, so
 * the mobile surface (/api/auth/mobile/login + /api/mobile/*) issues and
 * verifies its own short-ish-lived JWT signed with AUTH_SECRET. The token is
 * marked `typ: 'mobile'` so it can't be confused with any other JWT, and it
 * carries only the user id (sub) — handlers re-load the user from the DB.
 */

const TOKEN_TYPE = 'mobile';
const EXPIRY = '30d';

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be set (>=32 chars) to sign mobile tokens');
  }
  return new TextEncoder().encode(secret);
}

export async function signMobileToken(userId: string): Promise<string> {
  return new SignJWT({ typ: TOKEN_TYPE })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secretKey());
}

/**
 * Verify the `Authorization: Bearer <token>` header. Returns the user id on
 * success, or null on any failure (missing/expired/invalid/wrong-type). Use
 * at the top of every /api/mobile/* handler.
 */
export async function verifyMobileToken(req: Request): Promise<string | null> {
  const header = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.typ !== TOKEN_TYPE || typeof payload.sub !== 'string') return null;
    return payload.sub;
  } catch {
    return null;
  }
}
