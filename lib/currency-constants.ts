/**
 * Pure currency constants & formatting helpers (client-safe).
 *
 * Split out of lib/currency.ts so client components (e.g.
 * components/currency-selector.tsx) can import the supported-currency
 * list and formatting without dragging prisma (→ fs) into the browser
 * bundle. The prisma-backed rate functions stay in lib/currency.ts.
 */

export const SUPPORTED_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'TRY', 'JPY',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  PLN: 'zł', CZK: 'Kč', HUF: 'Ft', RON: 'lei', TRY: '₺', JPY: '¥',
};

const LOCALE_CURRENCY_MAP: Record<string, SupportedCurrency> = {
  en: 'USD', 'en-GB': 'GBP', 'en-US': 'USD', de: 'EUR', fr: 'EUR', es: 'EUR',
  it: 'EUR', nl: 'EUR', pt: 'EUR', et: 'EUR', fi: 'EUR', sv: 'SEK',
  nb: 'NOK', no: 'NOK', da: 'DKK', pl: 'PLN', cs: 'CZK', hu: 'HUF',
  ro: 'RON', tr: 'TRY', ja: 'JPY', ru: 'EUR',
};

/** Format a price in cents for display */
export function formatPrice(amountCents: number, currency: string, locale?: string): string {
  const zeroDecimalCurrencies = ['JPY', 'HUF'];
  const isZeroDecimal = zeroDecimalCurrencies.includes(currency.toUpperCase());
  const amount = isZeroDecimal ? amountCents : amountCents / 100;

  try {
    return new Intl.NumberFormat(locale || 'en', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: isZeroDecimal ? 0 : 2,
      maximumFractionDigits: isZeroDecimal ? 0 : 2,
    }).format(amount);
  } catch {
    const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || currency;
    return `${symbol}${amount.toFixed(isZeroDecimal ? 0 : 2)}`;
  }
}

/** Determine user's preferred currency from locale/country */
export function getUserCurrency(locale: string, country?: string): SupportedCurrency {
  // Country code takes priority
  if (country) {
    const countryMap: Record<string, SupportedCurrency> = {
      US: 'USD', GB: 'GBP', SE: 'SEK', NO: 'NOK', DK: 'DKK',
      PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', TR: 'TRY', JP: 'JPY',
    };
    if (countryMap[country.toUpperCase()]) return countryMap[country.toUpperCase()];
    // Most EU countries
    const euCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'EE', 'LT', 'LV', 'SK', 'SI', 'MT', 'CY', 'LU', 'GR', 'HR'];
    if (euCountries.includes(country.toUpperCase())) return 'EUR';
  }

  return LOCALE_CURRENCY_MAP[locale] || LOCALE_CURRENCY_MAP[locale.split('-')[0]] || 'EUR';
}
