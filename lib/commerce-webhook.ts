import crypto from 'crypto';

type SignatureParts = {
  t: string;
  v1: string;
};

export function parseSignatureHeader(header: string | null): SignatureParts | null {
  if (!header) return null;
  const parts = header.split(',').map((part) => part.trim().split('='));
  const map = new Map(parts.map(([key, value]) => [key, value]));
  const t = map.get('t');
  const v1 = map.get('v1');
  if (!t || !v1) return null;
  return { t, v1 };
}

export function signPayload(rawBody: string, secret: string, timestamp: string): string {
  const payload = `${timestamp}.${rawBody}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

const SIGNATURE_TOLERANCE_MS = 5 * 60 * 1000; // 5 minutes

export function verifySignature(rawBody: string, signatureHeader: string | null, secret: string): boolean {
  const parts = parseSignatureHeader(signatureHeader);
  if (!parts) return false;

  // Reject requests older than the tolerance window to prevent replay attacks.
  // The timestamp is Unix seconds; compare against the current wall clock.
  const timestampMs = parseInt(parts.t, 10) * 1000;
  if (isNaN(timestampMs) || Math.abs(Date.now() - timestampMs) > SIGNATURE_TOLERANCE_MS) {
    return false;
  }

  const expected = signPayload(rawBody, secret, parts.t);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}
