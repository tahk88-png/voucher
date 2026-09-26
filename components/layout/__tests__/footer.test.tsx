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
import { toPublicNavLinks } from '@/lib/navigation';

describe('Footer', () => {
  it('links to the public pages', () => {
    const html = renderToStaticMarkup(<Footer />);
    for (const href of ['/campaigns', '/faq', '/contact', '/privacy', '/terms']) {
      expect(html).toContain(`href="${href}"`);
    }
    expect(html).toContain('aria-label="Footer"');
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
});
