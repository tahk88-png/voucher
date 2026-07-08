/**
 * Best-effort trusted client IP for rate-limit / abuse keying.
 *
 * Prefers `x-real-ip` (set by the platform edge / reverse proxy and stripped
 * from client input on Vercel and most proxies) over the leftmost
 * `x-forwarded-for` token, which is fully client-spoofable — an attacker can
 * rotate the leftmost XFF value per request to evade a per-IP limit.
 *
 * Falls back to the first `x-forwarded-for` hop, then `'unknown'`.
 *
 * NOTE: the result is only as trustworthy as the proxy in front of the app.
 * On a raw origin with no trusted proxy this is still best-effort — pair
 * IP-keyed limits with a non-spoofable key (email / userId) for anything
 * security-critical (see verify-otp, which keys on both IP and email).
 */
export function getClientIp(req: { headers: Headers }): string {
  const h = req.headers;
  const realIp = h.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  const first = h.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (first) return first;
  return 'unknown';
}
