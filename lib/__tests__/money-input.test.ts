import { describe, it, expect } from 'vitest';
import {
  parseMoneyToMinor,
  parsePercentToBasisPoints,
  minorToInputString,
  basisPointsToInputString,
  normalizeCurrency,
  endOfLocalDay,
  startOfLocalDay,
  toDatetimeLocalValue,
} from '../money-input';

describe('parseMoneyToMinor', () => {
  it('parses dot decimals', () => {
    expect(parseMoneyToMinor('4.50')).toEqual({ ok: true, value: 450 });
    expect(parseMoneyToMinor('4.5')).toEqual({ ok: true, value: 450 });
    expect(parseMoneyToMinor('0.35')).toEqual({ ok: true, value: 35 });
  });

  it('parses comma decimals', () => {
    expect(parseMoneyToMinor('4,50')).toEqual({ ok: true, value: 450 });
    expect(parseMoneyToMinor('19,99')).toEqual({ ok: true, value: 1999 });
  });

  it('is exact for values that are inexact in floating point', () => {
    expect(parseMoneyToMinor('4.35')).toEqual({ ok: true, value: 435 });
    expect(parseMoneyToMinor('1.15')).toEqual({ ok: true, value: 115 });
  });

  it('parses whole numbers and strips currency symbols and spaces', () => {
    expect(parseMoneyToMinor('7')).toEqual({ ok: true, value: 700 });
    expect(parseMoneyToMinor(' €7 ')).toEqual({ ok: true, value: 700 });
    expect(parseMoneyToMinor('1 234,50')).toEqual({ ok: true, value: 123450 });
  });

  it('handles thousands separators', () => {
    expect(parseMoneyToMinor('1.234,50')).toEqual({ ok: true, value: 123450 });
    expect(parseMoneyToMinor('1,234.50')).toEqual({ ok: true, value: 123450 });
    expect(parseMoneyToMinor('1.000.000')).toEqual({ ok: true, value: 100000000 });
  });

  it('returns null for empty input', () => {
    expect(parseMoneyToMinor('')).toEqual({ ok: true, value: null });
    expect(parseMoneyToMinor('   ')).toEqual({ ok: true, value: null });
  });

  it('rejects negatives', () => {
    const r = parseMoneyToMinor('-5');
    expect(r.ok).toBe(false);
  });

  it('rejects too many decimals', () => {
    const r = parseMoneyToMinor('4.505');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/2 decimal places/);
  });

  it('rejects garbage', () => {
    expect(parseMoneyToMinor('abc').ok).toBe(false);
    expect(parseMoneyToMinor('4,5,0').ok).toBe(false);
    expect(parseMoneyToMinor('1.2.3').ok).toBe(false);
  });

  it('uses whole units for zero-decimal currencies', () => {
    expect(parseMoneyToMinor('500', 'JPY')).toEqual({ ok: true, value: 500 });
    expect(parseMoneyToMinor('500.5', 'JPY').ok).toBe(false);
  });
});

describe('parsePercentToBasisPoints', () => {
  it('parses percent with dot or comma', () => {
    expect(parsePercentToBasisPoints('5')).toEqual({ ok: true, value: 500 });
    expect(parsePercentToBasisPoints('12.5')).toEqual({ ok: true, value: 1250 });
    expect(parsePercentToBasisPoints('12,5')).toEqual({ ok: true, value: 1250 });
    expect(parsePercentToBasisPoints('7.25%')).toEqual({ ok: true, value: 725 });
  });

  it('returns null for empty input', () => {
    expect(parsePercentToBasisPoints('')).toEqual({ ok: true, value: null });
  });

  it('rejects negatives, >100% and too many decimals', () => {
    expect(parsePercentToBasisPoints('-1').ok).toBe(false);
    expect(parsePercentToBasisPoints('100.01').ok).toBe(false);
    expect(parsePercentToBasisPoints('100')).toEqual({ ok: true, value: 10000 });
    expect(parsePercentToBasisPoints('1.255').ok).toBe(false);
  });
});

describe('formatting helpers', () => {
  it('round-trips minor units to input strings', () => {
    expect(minorToInputString(450)).toBe('4.50');
    expect(minorToInputString(null)).toBe('');
    expect(minorToInputString(500, 'JPY')).toBe('500');
    expect(basisPointsToInputString(1250)).toBe('12.5');
    expect(basisPointsToInputString(500)).toBe('5');
  });

  it('normalises currency codes', () => {
    expect(normalizeCurrency('eur')).toBe('EUR');
    expect(normalizeCurrency('xyz')).toBe('EUR');
    expect(normalizeCurrency(undefined, 'GBP')).toBe('GBP');
  });

  it('builds local day boundaries and datetime-local values', () => {
    const end = endOfLocalDay('2026-09-30');
    expect([end.getFullYear(), end.getMonth(), end.getDate(), end.getHours(), end.getMinutes()]).toEqual([
      2026, 8, 30, 23, 59,
    ]);
    const start = startOfLocalDay('2026-09-30');
    expect(start.getHours()).toBe(0);
    expect(toDatetimeLocalValue(new Date(2026, 0, 2, 3, 4))).toBe('2026-01-02T03:04');
  });
});
