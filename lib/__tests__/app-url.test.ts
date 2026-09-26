import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAppUrl,
  getAppHost,
  getSenderEmail,
  getReportsSenderEmail,
  getContactEmail,
} from '@/lib/app-url';

// Regression tests for the single source of truth for public URLs and
// addresses. The code once hardcoded domains the owner does not control as
// fallbacks (see FOREIGN_DOMAIN); everything must now derive from
// configuration. Pure: no DB, no network.

const VARS = [
  'NEXT_PUBLIC_APP_URL',
  'NEXTAUTH_URL',
  'RESEND_FROM_EMAIL',
  'EMAIL_FROM',
  'CONTACT_EMAIL',
] as const;

// Domains that appeared as hardcoded fallbacks before; none may ever come back.
const FOREIGN_DOMAIN = /vouchr\.app|gifthub\.(app|ee|eu|com)|vouchers\.app|voucherplatform\.com/;

beforeEach(() => {
  // Empty string is "unset" for every helper (same as optionalString in
  // lib/env.ts); stubbing guarantees the ambient shell env can't leak in.
  for (const name of VARS) vi.stubEnv(name, '');
  vi.stubEnv('NODE_ENV', 'test');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getAppUrl', () => {
  it('returns the origin of NEXT_PUBLIC_APP_URL without path or trailing slash', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com/some/path/');
    expect(getAppUrl()).toBe('https://app.example.com');
  });

  it('keeps a non-default port', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:4000');
    expect(getAppUrl()).toBe('http://localhost:4000');
  });

  it('prefers NEXT_PUBLIC_APP_URL over NEXTAUTH_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    vi.stubEnv('NEXTAUTH_URL', 'https://auth.example.org');
    expect(getAppUrl()).toBe('https://app.example.com');
  });

  it('falls back to NEXTAUTH_URL when NEXT_PUBLIC_APP_URL is unset', () => {
    vi.stubEnv('NEXTAUTH_URL', 'https://auth.example.org');
    expect(getAppUrl()).toBe('https://auth.example.org');
  });

  it('uses localhost outside production when nothing is configured', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(getAppUrl()).toBe('http://localhost:3000');
  });

  it('throws in production when nothing is configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => getAppUrl()).toThrow(/NEXT_PUBLIC_APP_URL is not set/);
  });

  it('throws a descriptive error for a value that is not an absolute URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'app.example.com');
    expect(() => getAppUrl()).toThrow(/must be an absolute URL.*app\.example\.com/);
  });
});

describe('getAppHost', () => {
  it('is the hostname of the app URL, without port', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com:8443');
    expect(getAppHost()).toBe('app.example.com');
  });
});

describe('getSenderEmail', () => {
  it('derives noreply@<app host> from NEXT_PUBLIC_APP_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    expect(getSenderEmail()).toBe('noreply@app.example.com');
  });

  it('lets RESEND_FROM_EMAIL override the derived address', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    vi.stubEnv('RESEND_FROM_EMAIL', 'hello@example.org');
    expect(getSenderEmail()).toBe('hello@example.org');
  });

  it('throws rather than invent a sender in production with no config', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => getSenderEmail()).toThrow(/NEXT_PUBLIC_APP_URL is not set/);
  });

  it('needs no app URL when RESEND_FROM_EMAIL is set, even in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('RESEND_FROM_EMAIL', 'hello@example.org');
    expect(getSenderEmail()).toBe('hello@example.org');
  });
});

describe('getReportsSenderEmail', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
  });

  it('derives reports@<app host> when no sender is configured', () => {
    expect(getReportsSenderEmail()).toBe('reports@app.example.com');
  });

  it('falls back to RESEND_FROM_EMAIL before deriving', () => {
    vi.stubEnv('RESEND_FROM_EMAIL', 'hello@example.org');
    expect(getReportsSenderEmail()).toBe('hello@example.org');
  });

  it('lets EMAIL_FROM win over everything', () => {
    vi.stubEnv('RESEND_FROM_EMAIL', 'hello@example.org');
    vi.stubEnv('EMAIL_FROM', 'reports@example.net');
    expect(getReportsSenderEmail()).toBe('reports@example.net');
  });
});

describe('getContactEmail', () => {
  it('derives support@<app host> from NEXT_PUBLIC_APP_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    expect(getContactEmail()).toBe('support@app.example.com');
  });

  it('lets CONTACT_EMAIL override the derived address', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    vi.stubEnv('CONTACT_EMAIL', 'help@example.org');
    expect(getContactEmail()).toBe('help@example.org');
  });
});

describe('no hardcoded foreign domain', () => {
  const configs: Array<{ label: string; env: Partial<Record<(typeof VARS)[number] | 'NODE_ENV', string>> }> = [
    { label: 'development, nothing set', env: { NODE_ENV: 'development' } },
    { label: 'test, nothing set', env: {} },
    { label: 'production, app URL only', env: { NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://app.example.com' } },
    { label: 'production, NEXTAUTH_URL only', env: { NODE_ENV: 'production', NEXTAUTH_URL: 'https://example.org' } },
  ];

  for (const { label, env } of configs) {
    it(`derives every value from config (${label})`, () => {
      for (const [name, value] of Object.entries(env)) vi.stubEnv(name, value);
      const host = getAppHost();
      expect(getAppUrl()).not.toMatch(FOREIGN_DOMAIN);
      for (const email of [getSenderEmail(), getReportsSenderEmail(), getContactEmail()]) {
        expect(email).not.toMatch(FOREIGN_DOMAIN);
        expect(email.endsWith(`@${host}`)).toBe(true);
      }
    });
  }
});
