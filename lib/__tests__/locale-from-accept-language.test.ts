import { describe, it, expect } from 'vitest';
import { localeFromAcceptLanguage } from '@/lib/locale-config';

describe('localeFromAcceptLanguage', () => {
  it('picks the first supported language in preference order', () => {
    expect(localeFromAcceptLanguage('et-EE,et;q=0.9,en-US;q=0.8,en;q=0.7')).toBe('et');
    expect(localeFromAcceptLanguage('en-GB,en;q=0.9,et;q=0.8')).toBe('en');
    expect(localeFromAcceptLanguage('xx-YY,de;q=0.5')).toBe('de');
  });

  it('respects quality values rather than header order', () => {
    expect(localeFromAcceptLanguage('en;q=0.4,fi;q=0.9')).toBe('fi');
  });

  it('maps Norwegian Bokmål/Nynorsk to our Norwegian locale', () => {
    expect(localeFromAcceptLanguage('nb-NO,nb;q=0.9')).toBe('no');
    expect(localeFromAcceptLanguage('nn')).toBe('no');
  });

  it('returns null when nothing is supported or the header is missing', () => {
    expect(localeFromAcceptLanguage('xx,yy;q=0.5,*;q=0.1')).toBeNull();
    expect(localeFromAcceptLanguage('')).toBeNull();
    expect(localeFromAcceptLanguage(null)).toBeNull();
    expect(localeFromAcceptLanguage('et;q=0')).toBeNull();
  });
});
