import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'use-intl';

export const locales = ['en', 'et', 'es', 'fr', 'de', 'fi', 'sv', 'no', 'da', 'lv', 'lt', 'pl', 'uk', 'it', 'ru'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
  try {
    const requestedLocale = await requestLocale;
    const locale = (requestedLocale ?? 'en') as string;
    if (!locales.includes(locale as Locale)) notFound();

    const base = (await import('./messages/en.json')).default as Record<string, unknown>;
    const loc = (await import(`./messages/${locale}.json`)).default as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...loc };
    for (const k of Object.keys(base)) {
      if (!(k in merged)) merged[k] = base[k];
    }

    return {
      locale,
      messages: merged as AbstractIntlMessages,
      timeZone: 'UTC',
    };
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[i18n getRequestConfig]', err);
    }
    throw err;
  }
});
