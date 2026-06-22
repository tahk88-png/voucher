/**
 * Unit tests for lib/currency.ts.
 *
 * Covers:
 * - convertPrice: identity, direct rate, inverse rate, EUR pivot, no-rate fallback.
 * - formatPrice: 2-decimal currencies, zero-decimal currencies (JPY/HUF),
 *   Intl.NumberFormat failure fallback.
 * - getUserCurrency: country priority, EU default, locale map, unknown locale → EUR.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { currencyRateFindUnique } = vi.hoisted(() => ({
  currencyRateFindUnique: vi.fn(),
}));

vi.mock('../prisma', () => ({
  prisma: {
    currencyRate: { findUnique: currencyRateFindUnique },
  },
}));

import { convertPrice, formatPrice, getUserCurrency } from '../currency';

beforeEach(() => {
  vi.clearAllMocks();
  currencyRateFindUnique.mockResolvedValue(null);
});

// ────────────────────────────────────────────────────────────────────────────
// convertPrice
// ────────────────────────────────────────────────────────────────────────────

describe('convertPrice', () => {
  it('returns same amount for identity conversion (no DB hit)', async () => {
    const result = await convertPrice(12345, 'EUR', 'EUR');
    expect(result).toBe(12345);
    expect(currencyRateFindUnique).not.toHaveBeenCalled();
  });

  it('uses direct rate when available', async () => {
    currencyRateFindUnique.mockResolvedValueOnce({ rate: 1.1 }); // EUR → USD
    const result = await convertPrice(10000, 'EUR', 'USD'); // 100.00 EUR
    expect(result).toBe(11000); // 110.00 USD
  });

  it('uses inverse rate when direct is missing', async () => {
    // First call (direct EUR → SEK) returns null
    currencyRateFindUnique.mockResolvedValueOnce(null);
    // Second call (inverse SEK → EUR) returns 0.09 (1 SEK = 0.09 EUR)
    currencyRateFindUnique.mockResolvedValueOnce({ rate: 0.09 });
    const result = await convertPrice(10000, 'EUR', 'SEK');
    // 10000 / 0.09 = 111111.11 → rounded to 111111
    expect(result).toBe(111111);
  });

  it('pivots via EUR when no direct or inverse rate exists', async () => {
    // direct SEK → USD: null
    currencyRateFindUnique.mockResolvedValueOnce(null);
    // inverse USD → SEK: null
    currencyRateFindUnique.mockResolvedValueOnce(null);
    // SEK → EUR: 0.09
    currencyRateFindUnique.mockResolvedValueOnce({ rate: 0.09 });
    // EUR → USD: 1.1
    currencyRateFindUnique.mockResolvedValueOnce({ rate: 1.1 });
    const result = await convertPrice(10000, 'SEK', 'USD');
    // 10000 * 0.09 * 1.1 = 990
    expect(result).toBe(990);
  });

  it('returns original amount when no conversion path exists', async () => {
    currencyRateFindUnique.mockResolvedValue(null);
    const result = await convertPrice(10000, 'XYZ', 'ABC');
    expect(result).toBe(10000);
  });

  it('handles inverse rate of 0 without dividing by zero', async () => {
    currencyRateFindUnique.mockResolvedValueOnce(null);
    currencyRateFindUnique.mockResolvedValueOnce({ rate: 0 });
    // Falls through to EUR pivot, both null → original
    currencyRateFindUnique.mockResolvedValueOnce(null);
    currencyRateFindUnique.mockResolvedValueOnce(null);
    const result = await convertPrice(5000, 'EUR', 'XYZ');
    expect(result).toBe(5000);
  });

  it('rounds converted amounts to whole cents', async () => {
    currencyRateFindUnique.mockResolvedValueOnce({ rate: 1.23456 });
    const result = await convertPrice(100, 'EUR', 'USD'); // 1.00 * 1.23456 = 1.23456
    expect(result).toBe(123); // rounded
  });
});

// ────────────────────────────────────────────────────────────────────────────
// formatPrice
// ────────────────────────────────────────────────────────────────────────────

describe('formatPrice', () => {
  it('formats USD amounts with 2 decimals', () => {
    const out = formatPrice(12345, 'USD', 'en-US');
    // Non-breaking space or regular space between symbol and number is fine;
    // just check the digits + currency
    expect(out).toMatch(/123\.45/);
    expect(out).toMatch(/\$/);
  });

  it('formats JPY (zero-decimal) amounts as whole units', () => {
    // 12345 cents → 12345 yen (zero-decimal means cents == yen)
    const out = formatPrice(12345, 'JPY', 'ja-JP');
    // Must not contain a decimal point or fractional digits
    expect(out).not.toMatch(/\./);
    expect(out).toMatch(/12,?345|12345/);
  });

  it('formats HUF (zero-decimal) amounts without decimals', () => {
    const out = formatPrice(50000, 'HUF', 'hu-HU');
    expect(out).not.toMatch(/\./);
  });

  it('lowercase currency codes are normalized', () => {
    const out = formatPrice(10000, 'eur', 'en');
    expect(out).toMatch(/100\.00/);
  });

  it('falls back to symbol + fixed string when Intl throws', () => {
    const out = formatPrice(10000, 'INVALID_CODE', 'en');
    // Fallback path: just a plain code + amount string, no throw
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// getUserCurrency
// ────────────────────────────────────────────────────────────────────────────

describe('getUserCurrency', () => {
  it('country code takes priority over locale', () => {
    // Locale says EUR (de), but country=GB should override to GBP
    expect(getUserCurrency('de', 'GB')).toBe('GBP');
  });

  it('EU country defaults to EUR', () => {
    expect(getUserCurrency('en', 'DE')).toBe('EUR');
    expect(getUserCurrency('en', 'FR')).toBe('EUR');
    expect(getUserCurrency('en', 'EE')).toBe('EUR');
  });

  it('uses direct locale map', () => {
    expect(getUserCurrency('sv')).toBe('SEK');
    expect(getUserCurrency('ja')).toBe('JPY');
    expect(getUserCurrency('pl')).toBe('PLN');
  });

  it('strips BCP-47 region tag for fallback lookup', () => {
    // en-CA not in map → strip to 'en' → USD
    expect(getUserCurrency('en-CA')).toBe('USD');
  });

  it('falls back to EUR for unknown locale + no country', () => {
    expect(getUserCurrency('xx-YY')).toBe('EUR');
  });

  it('country code is case-insensitive', () => {
    expect(getUserCurrency('en', 'se')).toBe('SEK');
    expect(getUserCurrency('en', 'gb')).toBe('GBP');
  });
});
