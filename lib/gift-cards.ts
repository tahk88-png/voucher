import crypto from 'crypto';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function normalizeGiftCardCode(code: string) {
  return code.trim().toUpperCase();
}

export function generateGiftCardCode(prefix?: string, length = 10) {
  const normalizedPrefix = prefix
    ? prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    : '';
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    const idx = bytes[i] % CODE_ALPHABET.length;
    code += CODE_ALPHABET[idx];
  }
  return normalizedPrefix ? `${normalizedPrefix}-${code}` : code;
}
