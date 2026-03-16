import crypto from 'crypto';

const TOTP_PERIOD = 30;
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'sha1';

/**
 * Generate a random base32-encoded secret for TOTP.
 */
export function generateTotpSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Generate a TOTP code for the given secret at the given time.
 */
export function generateTotpCode(secret: string, time?: number): string {
  const now = time ?? Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / TOTP_PERIOD);
  return hotp(base32Decode(secret), counter);
}

/**
 * Verify a TOTP code with a window of +/- 1 period to account for clock drift.
 */
export function verifyTotpCode(secret: string, code: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / TOTP_PERIOD);

  // Check current period and +/- 1 for clock drift
  for (let i = -1; i <= 1; i++) {
    const expected = hotp(base32Decode(secret), counter + i);
    if (timingSafeEqual(code, expected)) {
      return true;
    }
  }
  return false;
}

/**
 * Generate an otpauth:// URI for QR code generation.
 */
export function generateTotpUri(
  secret: string,
  email: string,
  issuer: string = 'GiftHub'
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate backup codes - 8 random codes, each 8 characters.
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 8; i++) {
    const bytes = crypto.randomBytes(4);
    const code = bytes.toString('hex').toUpperCase(); // 8 hex chars
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash a backup code for storage.
 */
export function hashBackupCode(code: string): string {
  return crypto
    .createHash('sha256')
    .update(code.replace(/-/g, '').toUpperCase())
    .digest('hex');
}

/**
 * Check if a code matches any hashed backup code.
 * Returns the index if found, -1 otherwise.
 */
export function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): number {
  const hash = hashBackupCode(code);
  for (let i = 0; i < hashedCodes.length; i++) {
    if (timingSafeEqual(hash, hashedCodes[i])) {
      return i;
    }
  }
  return -1;
}

// ── Internal helpers ──

function hotp(key: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }

  const hmac = crypto.createHmac(TOTP_ALGORITHM, key);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, TOTP_DIGITS);
  return otp.toString().padStart(TOTP_DIGITS, '0');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let result = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_CHARS[(value >>> (bits - 5)) & 0x1f];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_CHARS[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_CHARS.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}
