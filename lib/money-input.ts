/**
 * Client-safe helpers for turning what a merchant types into what we store.
 *
 * - Money is stored in minor units (cents). Merchants type major units
 *   ("4,50" or "4.50" → 450).
 * - Percentages are stored in basis points. Merchants type percent
 *   ("12,5" or "12.5" → 1250).
 *
 * Parsing is string based (no float multiplication) so "4.35" is exactly 435.
 */

import { CURRENCY_SYMBOLS, SUPPORTED_CURRENCIES } from './currency-constants';

export type ParseResult =
  | { ok: true; value: number | null }
  | { ok: false; error: string };

/** Currencies without a minor unit in practice (matches formatPrice). */
const ZERO_DECIMAL_CURRENCIES = ['JPY', 'HUF'];

export function currencyDecimals(currency?: string | null): number {
  return currency && ZERO_DECIMAL_CURRENCIES.includes(currency.toUpperCase()) ? 0 : 2;
}

/**
 * Parse a user-typed non-negative decimal into an integer scaled by
 * 10^decimals. Accepts "," or "." as the decimal separator, spaces as
 * thousands separators, and "1.234,50" / "1,234.50" (the last separator
 * is the decimal one). Returns null for empty input.
 */
function parseScaledDecimal(raw: string, decimals: number, label: string): ParseResult {
  // Strip whitespace (incl. NBSP / narrow NBSP used as thousands separators),
  // currency symbols/codes and a trailing percent sign.
  let s = String(raw ?? '')
    .replace(/[\s  ]/g, '')
    .replace(/%$/, '');
  for (const sym of Object.values(CURRENCY_SYMBOLS)) {
    if (sym.length === 1 && s.includes(sym)) s = s.split(sym).join('');
  }
  s = s.replace(/^(EUR|USD|GBP)/i, '').replace(/(EUR|USD|GBP)$/i, '');

  if (s === '') return { ok: true, value: null };
  if (s.startsWith('-')) return { ok: false, error: `${label} can't be negative.` };
  if (s.startsWith('+')) s = s.slice(1);

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  let intPart = s;
  let fracPart = '';
  if (lastComma !== -1 || lastDot !== -1) {
    const sepIndex = Math.max(lastComma, lastDot);
    const sep = s[sepIndex];
    const other = sep === ',' ? '.' : ',';
    intPart = s.slice(0, sepIndex);
    fracPart = s.slice(sepIndex + 1);
    if (intPart.includes(sep)) {
      // Same separator used more than once: only valid as a thousands
      // separator with no decimals, e.g. "1.000.000".
      const groups = s.split(sep);
      if (groups.slice(1).every((g) => g.length === 3) && /^\d{1,3}$/.test(groups[0])) {
        intPart = groups.join('');
        fracPart = '';
      } else {
        return { ok: false, error: `${label} isn't a valid number.` };
      }
    } else if (intPart.includes(other)) {
      // "1.234,50" or "1,234.50": the other separator groups thousands.
      const groups = intPart.split(other);
      if (!/^\d{1,3}$/.test(groups[0]) || !groups.slice(1).every((g) => /^\d{3}$/.test(g))) {
        return { ok: false, error: `${label} isn't a valid number.` };
      }
      intPart = groups.join('');
    }
  }

  if (intPart === '') intPart = '0';
  if (!/^\d+$/.test(intPart) || !/^\d*$/.test(fracPart)) {
    return { ok: false, error: `${label} isn't a valid number.` };
  }
  if (fracPart.length > decimals) {
    return {
      ok: false,
      error:
        decimals === 0
          ? `${label} must be a whole number.`
          : `${label} can have at most ${decimals} decimal places.`,
    };
  }

  const scaled = Number(intPart) * 10 ** decimals + Number((fracPart || '0').padEnd(decimals, '0') || '0');
  if (!Number.isSafeInteger(scaled)) {
    return { ok: false, error: `${label} is too large.` };
  }
  return { ok: true, value: Math.round(scaled) };
}

/**
 * "4,50" / "4.50" / "€4.50" → 450 (cents). Empty → null.
 * Zero-decimal currencies (JPY, HUF) are returned as whole units.
 */
export function parseMoneyToMinor(
  raw: string,
  currency: string = 'EUR',
  label = 'Amount',
): ParseResult {
  return parseScaledDecimal(raw, currencyDecimals(currency), label);
}

/** "12,5" / "12.5" / "12.5%" → 1250 (basis points). Empty → null. Max 100%. */
export function parsePercentToBasisPoints(raw: string, label = 'Percentage'): ParseResult {
  const res = parseScaledDecimal(raw, 2, label);
  if (res.ok && res.value !== null && res.value > 10000) {
    return { ok: false, error: `${label} can't be more than 100%.` };
  }
  return res;
}

/** 450 → "4.50" (for pre-filling an input). */
export function minorToInputString(minor: number | null | undefined, currency: string = 'EUR'): string {
  if (minor === null || minor === undefined || !Number.isFinite(minor)) return '';
  const d = currencyDecimals(currency);
  return d === 0 ? String(minor) : (minor / 10 ** d).toFixed(d);
}

/** 1250 → "12.5", 500 → "5" (for pre-filling an input). */
export function basisPointsToInputString(bp: number | null | undefined): string {
  if (bp === null || bp === undefined || !Number.isFinite(bp)) return '';
  return String(Number((bp / 100).toFixed(2)));
}

/** Format basis points as a percentage label: 1250 → "12.5%". */
export function formatBasisPoints(bp: number): string {
  return `${basisPointsToInputString(bp)}%`;
}

export function isSupportedCurrency(code: string | null | undefined): boolean {
  return !!code && (SUPPORTED_CURRENCIES as readonly string[]).includes(code.toUpperCase());
}

/** Normalise a currency to an upper-case supported ISO code, falling back to EUR. */
export function normalizeCurrency(code: string | null | undefined, fallback = 'EUR'): string {
  return isSupportedCurrency(code) ? (code as string).toUpperCase() : fallback;
}

/**
 * Format a Date for an <input type="datetime-local"> in the viewer's local
 * time zone (toISOString() would give UTC and shift the wall-clock time).
 */
export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Format a Date for an <input type="date"> in local time. */
export function toDateInputValue(date: Date): string {
  return toDatetimeLocalValue(date).slice(0, 10);
}

/** "2026-09-30" → local start of that day. */
export function startOfLocalDay(dateInput: string): Date {
  const [y, m, d] = dateInput.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
}

/** "2026-09-30" → local 23:59:59.999 of that day (valid through the whole day). */
export function endOfLocalDay(dateInput: string): Date {
  const [y, m, d] = dateInput.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 23, 59, 59, 999);
}
