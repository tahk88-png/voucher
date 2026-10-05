import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

// lib/navigation also exports DB helpers; the footer must not need them.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import Footer from '../Footer';
import { withIntl } from '@/test-utils/intl';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import etMessages from '@/messages/et.json';

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

// Estonian as the app loads it (English overlaid with et.json). withIntl(node, 'et')
// loads et.json through a require() that vitest can't resolve.
function withEt(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="et" messages={deepMerge(enMessages as Messages, etMessages as Messages) as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}
import { localizeNavLinks, toPublicNavLinks } from '@/lib/navigation';

describe('Footer', () => {
  it('links to the public pages', () => {
    const html = renderToStaticMarkup(withIntl(<Footer />));
    for (const href of ['/campaigns', '/faq', '/contact', '/privacy', '/terms']) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('aria-label="Footer"');
  });

  it('renders in Estonian', () => {
    const html = renderToStaticMarkup(withEt(<Footer />));
    expect(html).toContain('Kampaaniad');
    expect(html).toContain('Valmistatud Euroopas.');
  });
});

describe('toPublicNavLinks', () => {
  it('replaces internal jargon from seeded navigation rows', () => {
    const links = toPublicNavLinks([
      { id: '1', label: 'Hub', href: '/hub' },
      { id: '2', label: 'Tenants', href: '/hub#tenants' },
      { id: '3', label: 'Campaigns', href: '/campaigns' },
    ]);
    expect(links.map((l) => l.label)).toEqual(['Explore', 'Merchants', 'Campaigns']);
  });

  it('translates standard labels and keeps custom ones', () => {
    const links = localizeNavLinks(
      toPublicNavLinks([
        { id: '1', label: 'Hub', href: '/hub' },
        { id: '2', label: 'Campaigns', href: '/campaigns' },
        { id: '3', label: 'Summer specials', href: '/p/summer' },
      ]),
      (key) => `t:${key}`,
    );
    expect(links.map((l) => l.label)).toEqual(['t:explore', 't:campaigns', 'Summer specials']);
  });
});
