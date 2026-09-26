import { describe, it, expect, vi, afterEach } from 'vitest';

// robots.txt and sitemap.xml must use the runtime NEXT_PUBLIC_APP_URL. The
// Docker image is built without it, so a build-time render would advertise
// http://localhost:3000 to crawlers.

vi.mock('@/lib/prisma', () => ({
  prisma: {
    campaign: { findMany: vi.fn(async () => []) },
    merchant: { findMany: vi.fn(async () => [{ slug: 'coffee-house', updatedAt: new Date('2026-01-01') }]) },
    voucher: { findMany: vi.fn(async () => []) },
  },
}));

import robots, { dynamic as robotsDynamic } from '../robots';
import sitemap, { dynamic as sitemapDynamic } from '../sitemap';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('robots.txt', () => {
  it('is rendered per request', () => {
    expect(robotsDynamic).toBe('force-dynamic');
  });

  it('points at the sitemap on the configured host', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    expect(robots().sitemap).toBe('https://app.example.com/sitemap.xml');
  });
});

describe('sitemap.xml', () => {
  it('is rendered per request', () => {
    expect(sitemapDynamic).toBe('force-dynamic');
  });

  it('lists URLs on the configured host, including database entries', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    const urls = (await sitemap()).map((entry) => entry.url);
    expect(urls).toContain('https://app.example.com/');
    expect(urls.some((url) => url.includes('coffee-house'))).toBe(true);
    expect(urls.every((url) => url.startsWith('https://app.example.com/'))).toBe(true);
  });
});
