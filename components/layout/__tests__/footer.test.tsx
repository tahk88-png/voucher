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
    const html = renderToStaticMarkup(withIntl(<Footer />, 'et'));
    expect(html).toContain('Kampaaniad');
    expect(html).toContain('Tehtud Euroopas.');
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
