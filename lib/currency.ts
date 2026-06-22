import { prisma } from './prisma';

// Pure constants/formatting live in currency-constants.ts (client-safe).
// Re-exported here so existing server-side importers keep working.
export {
  SUPPORTED_CURRENCIES,
  CURRENCY_SYMBOLS,
  formatPrice,
  getUserCurrency,
  type SupportedCurrency,
} from './currency-constants';

import { SUPPORTED_CURRENCIES, type SupportedCurrency } from './currency-constants';

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
