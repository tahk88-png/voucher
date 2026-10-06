/**
 * The human-readable voucher code shown to customers and how the merchant
 * scanner turns whatever it receives back into a voucher lookup.
 *
 * Customers see e.g. "AUD-CMUI0TG1" (codePrefix + first 8 chars of the id,
 * upper-cased) and a QR code that encodes the public page URL
 * (https://host/v/<id>). The scanner must accept both.
 */

export const DEFAULT_VOUCHER_CODE_PREFIX = 'V';
const ID_FRAGMENT_LENGTH = 8;

export function formatVoucherCode(voucher: { id: string; codePrefix?: string | null }): string {
  const prefix = voucher.codePrefix || DEFAULT_VOUCHER_CODE_PREFIX;
  return `${prefix}-${voucher.id.slice(0, ID_FRAGMENT_LENGTH).toUpperCase()}`;
}

export type ParsedScanCode =
  /** Full voucher id taken from a /v/<id> URL or path. */
  | { kind: 'voucher_id'; id: string }
  /** Displayed code: prefix + first 8 characters of the voucher id. */
  | { kind: 'voucher_code'; prefix: string; idFragment: string; raw: string }
  /** Anything else (ticket number, gift card code, raw id, legacy prefix). */
  | { kind: 'raw'; value: string };

const VOUCHER_PATH = /(?:^|\/)v\/([A-Za-z0-9_-]{8,64})\/?$/;
const DISPLAY_CODE = /^(.{1,10})-([A-Za-z0-9]{8})$/;

export function parseScanCode(input: string): ParsedScanCode {
  const value = String(input ?? '').trim().slice(0, 500);

  // Full or relative URL to the public voucher page (QR codes encode this).
  let pathname: string | null = null;
  if (/^https?:\/\//i.test(value)) {
    try {
      pathname = new URL(value).pathname;
    } catch {
      pathname = null;
    }
  } else if (value.startsWith('/')) {
    pathname = value.split(/[?#]/)[0];
  }
  if (pathname) {
    const m = pathname.match(VOUCHER_PATH);
    if (m) return { kind: 'voucher_id', id: m[1] };
  }

  // Displayed code, e.g. "AUD-CMUI0TG1" or "v-cmui0tg1" (typed by staff).
  const code = value.replace(/\s+/g, '');
  const m = code.match(DISPLAY_CODE);
  if (m) {
    return { kind: 'voucher_code', prefix: m[1].toUpperCase(), idFragment: m[2].toLowerCase(), raw: code };
  }

  return { kind: 'raw', value };
}
