import * as React from 'react';
import { NextIntlClientProvider } from 'next-intl';
import en from '@/messages/en.json';

type Messages = Record<string, unknown>;

function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      current && typeof current === 'object' && value && typeof value === 'object' && !Array.isArray(value)
        ? deepMerge(current as Messages, value as Messages)
        : value;
  }
  return out;
}

/** Messages as the app loads them (i18n.ts): English, overlaid with the locale's own. */
export function loadMessages(locale = 'en'): Messages {
  if (locale === 'en') return en as Messages;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const localized = require(`@/messages/${locale}.json`) as Messages;
  return deepMerge(en as Messages, localized);
}

/**
 * Wraps a component under test in the next-intl provider, so components that
 * call useTranslations() render with real messages:
 *   renderToStaticMarkup(withIntl(<Footer />))
 *   renderToStaticMarkup(withIntl(<Footer />, 'et'))
 */
export function withIntl(node: React.ReactNode, locale = 'en'): React.ReactElement {
  return React.createElement(NextIntlClientProvider, {
    locale,
    messages: loadMessages(locale) as never,
    timeZone: 'UTC',
    children: node,
  });
}
