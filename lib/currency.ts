import { prisma } from './prisma';

export const SUPPORTED_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'TRY', 'JPY',
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '\u20AC', USD: '$', GBP: '\u00A3', SEK: 'kr', NOK: 'kr', DKK: 'kr',
  PLN: 'z\u0142', CZK: 'K\u010D', HUF: 'Ft', RON: 'lei', TRY: '\u20BA', JPY: '\u00A5',
};

const LOCALE_CURRENCY_MAP: Record<string, SupportedCurrency> = {
  en: 'USD', 'en-GB': 'GBP', 'en-US': 'USD', de: 'EUR', fr: 'EUR', es: 'EUR',
  it: 'EUR', nl: 'EUR', pt: 'EUR', et: 'EUR', fi: 'EUR', sv: 'SEK',
  nb: 'NOK', no: 'NOK', da: 'DKK', pl: 'PLN', cs: 'CZK', hu: 'HUF',
  ro: 'RON', tr: 'TRY', ja: 'JPY', ru: 'EUR',
};

/** Convert price in cents from one currency to another using DB rates */
export async function convertPrice(
  amountCents: number,
  fromCurrency: string,
  toCurrency: string,
): Promise<number> {
  if (fromCurrency === toCurrency) return amountCents;

  // Try direct rate
  let rate = await prisma.currencyRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
  });

  if (rate) return Math.round(amountCents * rate.rate);

  // Try inverse
  rate = await prisma.currencyRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: toCurrency, toCurrency: fromCurrency } },
  });

  if (rate && rate.rate !== 0) return Math.round(amountCents / rate.rate);

  // Try via EUR pivot
  const toEur = await prisma.currencyRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency, toCurrency: 'EUR' } },
  });
  const fromEur = await prisma.currencyRate.findUnique({
    where: { fromCurrency_toCurrency: { fromCurrency: 'EUR', toCurrency } },
  });

  if (toEur && fromEur) {
    return Math.round(amountCents * toEur.rate * fromEur.rate);
  }

  // No rate found, return original
  return amountCents;
}

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

/** Fetch latest ECB rates and update DB */
export async function refreshRates(): Promise<number> {
  const res = await fetch('https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml');
  if (!res.ok) throw new Error(`ECB API error: ${res.status}`);

  const xml = await res.text();
  // Parse rates from XML: <Cube currency="USD" rate="1.0876"/>
  const rateRegex = /currency='([A-Z]+)'\s+rate='([\d.]+)'/g;
  let match;
  let count = 0;

  while ((match = rateRegex.exec(xml)) !== null) {
    const [, currency, rateStr] = match;
    const rate = parseFloat(rateStr);
    if (!SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)) continue;

    // EUR -> X
    await prisma.currencyRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency: 'EUR', toCurrency: currency } },
      update: { rate, fetchedAt: new Date() },
      create: { fromCurrency: 'EUR', toCurrency: currency, rate, source: 'ecb' },
    });

    // X -> EUR (inverse)
    await prisma.currencyRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency: currency, toCurrency: 'EUR' } },
      update: { rate: 1 / rate, fetchedAt: new Date() },
      create: { fromCurrency: currency, toCurrency: 'EUR', rate: 1 / rate, source: 'ecb' },
    });

    count++;
  }

  return count;
}
