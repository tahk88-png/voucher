import { describe, it, expect, afterEach, vi } from 'vitest';
import { getTenantBaseUrl } from '@/lib/tenant-url';

// Tenant links used to force https:// for any root domain but "localhost",
// so a plain-http setup (e.g. lvh.me:3000) linked to hosts serving no TLS.

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getTenantBaseUrl', () => {
  it('uses the scheme of the app URL for subdomain links', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    vi.stubEnv('PLATFORM_ROOT_DOMAIN', 'lvh.me:3000');
    expect(getTenantBaseUrl({ slug: 'cafe' })).toBe('http://cafe.lvh.me:3000');
  });

  it('uses https when the platform is served over https', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    vi.stubEnv('PLATFORM_ROOT_DOMAIN', 'example.com');
    expect(getTenantBaseUrl({ slug: 'cafe' })).toBe('https://cafe.example.com');
    expect(getTenantBaseUrl({ slug: 'cafe' }, { domain: 'shop.cafe.test' })).toBe('https://shop.cafe.test');
  });

  it('tolerates a root domain configured with a scheme', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    vi.stubEnv('PLATFORM_ROOT_DOMAIN', 'https://example.com/');
    expect(getTenantBaseUrl({ slug: 'cafe' })).toBe('https://cafe.example.com');
  });
});
