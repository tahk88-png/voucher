import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEnv } from '@/lib/env';

// Unit tests for the env-variable Zod schema. Pure: no DB, no network,
// runs in the default suite (not gated by VITEST_INCLUDE_INTEGRATION).
//
// These tests exercise `validateEnv()` directly with a fabricated
// `raw` object so they don't pollute the global process.env.

// Cast to ProcessEnv: validateEnv()'s signature wants the strict
// `string | undefined` index signature, but our literals are statically
// typed as `string`. The runtime shape is identical.
const VALID_BASE: NodeJS.ProcessEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  AUTH_SECRET: 'a'.repeat(32),
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

describe('validateEnv', () => {
  // Quiet console.error noise from the failure paths — Zod prints a
  // pretty error block by design but we don't want it cluttering test
  // output for tests that *expect* failure.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('happy path', () => {
    it('accepts a minimal valid env', () => {
      expect(() => validateEnv(VALID_BASE)).not.toThrow();
    });

    it('returns parsed values with declared types', () => {
      const env = validateEnv(VALID_BASE);
      expect(env.DATABASE_URL).toBe(VALID_BASE.DATABASE_URL);
      expect(env.AUTH_SECRET).toBe(VALID_BASE.AUTH_SECRET);
      expect(env.NODE_ENV).toBe('production');
    });

    it('applies defaults when optional vars are missing', () => {
      const env = validateEnv(VALID_BASE);
      expect(env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
      expect(env.RESEND_FROM_EMAIL).toBe('noreply@vouchr.app');
      expect(env.AXIOM_DATASET).toBe('voucher-logs');
      expect(env.OPENAI_MODEL).toBe('gpt-4o-mini');
      expect(env.WEBAUTHN_RP_NAME).toBe('Vouchr');
      expect(env.VAPID_SUBJECT).toBe('mailto:admin@vouchr.app');
    });

    it('keeps optional fields undefined when not provided', () => {
      const env = validateEnv(VALID_BASE);
      expect(env.STRIPE_SECRET_KEY).toBeUndefined();
      expect(env.RESEND_API_KEY).toBeUndefined();
      expect(env.CRON_SECRET).toBeUndefined();
    });
  });

  describe('AUTH_SECRET refinement', () => {
    it('rejects placeholder "change_me_..." secrets', () => {
      expect(() =>
        validateEnv({
          ...VALID_BASE,
          AUTH_SECRET: 'change_me_min_32_chars_long_secret_key_here',
        }),
      ).toThrow(/Invalid environment variables/);
    });

    it('rejects "changeme..." case-insensitive', () => {
      expect(() =>
        validateEnv({
          ...VALID_BASE,
          AUTH_SECRET: 'CHANGEME_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        }),
      ).toThrow();
    });

    it('rejects "change-me-..." variant', () => {
      expect(() =>
        validateEnv({
          ...VALID_BASE,
          AUTH_SECRET: 'change-me-' + 'x'.repeat(30),
        }),
      ).toThrow();
    });

    it('rejects secrets shorter than 32 chars', () => {
      expect(() =>
        validateEnv({ ...VALID_BASE, AUTH_SECRET: 'short' }),
      ).toThrow();
    });
  });

  describe('DATABASE_URL refinement', () => {
    it('rejects non-URL strings', () => {
      expect(() =>
        validateEnv({ ...VALID_BASE, DATABASE_URL: 'not-a-url' }),
      ).toThrow();
    });

    it('rejects mysql:// (must be postgresql)', () => {
      // The thrown Error is generic ("Invalid environment variables");
      // per-field "must start with postgresql://" goes to console.error.
      // Verify both: throw + the right field flagged in stderr.
      let captured = '';
      vi.spyOn(console, 'error').mockImplementation((msg) => {
        captured += String(msg);
      });
      expect(() =>
        validateEnv({ ...VALID_BASE, DATABASE_URL: 'mysql://u:p@host/db' }),
      ).toThrow();
      expect(captured).toMatch(/DATABASE_URL/);
      expect(captured).toMatch(/postgresql/);
    });

    it('accepts postgresql:// with full connection string', () => {
      const url = 'postgresql://u:p@h:5432/d?connection_limit=20';
      const env = validateEnv({ ...VALID_BASE, DATABASE_URL: url });
      expect(env.DATABASE_URL).toBe(url);
    });
  });

  describe('NODE_ENV', () => {
    it('defaults to development when missing', () => {
      const { NODE_ENV: _, ...withoutNodeEnv } = VALID_BASE;
      // Rest-spread of NodeJS.ProcessEnv mangles the optional `TZ` field
      // type — cast back to satisfy the parameter shape.
      const env = validateEnv(withoutNodeEnv as NodeJS.ProcessEnv);
      expect(env.NODE_ENV).toBe('development');
    });

    it('rejects unknown values like "staging"', () => {
      expect(() =>
        // Cast: NODE_ENV is typed as the enum literal union, but we
        // deliberately want to test the runtime rejection of a foreign
        // value, so widen here.
        validateEnv({ ...VALID_BASE, NODE_ENV: 'staging' as unknown as 'production' }),
      ).toThrow();
    });
  });

  describe('TEST_* credentials (added in this wave)', () => {
    it('passes through TEST_* values when set', () => {
      const env = validateEnv({
        ...VALID_BASE,
        ENABLE_TEST_CREDENTIALS: 'true',
        TEST_USER_EMAIL: 'test@example.com',
        TEST_USER_PASSWORD: 'test123',
        TEST_PLATFORM_ADMIN_EMAIL: 'platform@local',
      });
      expect(env.TEST_USER_EMAIL).toBe('test@example.com');
      expect(env.TEST_USER_PASSWORD).toBe('test123');
      expect(env.TEST_PLATFORM_ADMIN_EMAIL).toBe('platform@local');
    });

    it('treats empty string as undefined (matches optionalString helper)', () => {
      const env = validateEnv({
        ...VALID_BASE,
        TEST_USER_EMAIL: '',
      });
      expect(env.TEST_USER_EMAIL).toBeUndefined();
    });
  });

  describe('error reporting', () => {
    it('reports every offending field at once (not just the first)', () => {
      let captured = '';
      vi.spyOn(console, 'error').mockImplementation((msg) => {
        captured += String(msg);
      });
      expect(() =>
        validateEnv({
          NODE_ENV: 'production',
          DATABASE_URL: 'not-a-url',
          AUTH_SECRET: 'too-short',
          NEXT_PUBLIC_APP_URL: 'also-not-a-url',
        } as NodeJS.ProcessEnv),
      ).toThrow();
      // Should call out each offending field by name, not just one of them.
      expect(captured).toMatch(/DATABASE_URL/);
      expect(captured).toMatch(/AUTH_SECRET/);
      expect(captured).toMatch(/NEXT_PUBLIC_APP_URL/);
    });
  });
});
