import { formatCurrency as formatCurrencyUtil } from './utils';
import { useLocale } from 'next-intl';

/**
 * Format currency with locale support
 */
export function formatCurrencyWithLocale(
  amount: number,
  currency: string,
  locale?: string
): string {
  const major = amount / 100;
  const localeCode = locale || 'en-US';
  
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency,
  }).format(major);
}

/**
 * Format date with locale support
 */
export function formatDateWithLocale(
  date: Date | string,
  locale?: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const localeCode = locale || 'en-US';
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(localeCode, defaultOptions).format(dateObj);
}

/**
 * Get locale-specific currency symbol
 */
export function getCurrencySymbol(currency: string, locale?: string): string {
  const localeCode = locale || 'en-US';
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(0)
    .replace(/\d/g, '')
    .trim();
}

/**
 * Map locale to currency formatting locale
 */
export function getCurrencyLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    et: 'et-EE',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    fi: 'fi-FI',
    sv: 'sv-SE',
    no: 'no-NO',
    da: 'da-DK',
    lv: 'lv-LV',
    lt: 'lt-LT',
    pl: 'pl-PL',
    uk: 'uk-UA',
  };
  
  return localeMap[locale] || 'en-US';
}
