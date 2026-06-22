/**
 * Environment variable validation (Zod).
 *
 * Runtime contract for process.env. Imported by `instrumentation.ts` so the
 * server fails fast on boot when a required variable is missing or malformed.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   const url = env.DATABASE_URL;
 *
 * Notes:
 * - Server-only by convention. Do NOT import from client components;
 *   NEXT_PUBLIC_* reads go through process.env directly so Next.js can
 *   inline them at build.
 * - Optional vars are typed as `string | undefined` — check truthiness before
 *   use. Don't default them here unless the default is safe for prod.
 * - For one-off runtime checks (tests, scripts), call `validateEnv()` manually.
 */
import { z } from 'zod';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/** Marks a string as optional *and* empty-string-equivalent-to-undefined. */
const optionalString = () =>
  z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const urlString = () => z.string().url();

/** Secret strings must be meaningful — reject obvious placeholders. */
const secret = (minLen = 16) =>
  z
    .string()
    .min(minLen, `must be at least ${minLen} characters`)
    .refine(
      (v) => !/^change[_-]?me/i.test(v),
      'looks like a placeholder — replace with a real secret',
    );

// ────────────────────────────────────────────────────────────────────────────
// Schema
// ────────────────────────────────────────────────────────────────────────────

const schema = z.object({
  // ── Runtime ──────────────────────────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // ── App / URLs ───────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: urlString().default('http://localhost:3000'),
  NEXTAUTH_URL: urlString().default('http://localhost:3000'),
  PLATFORM_ROOT_DOMAIN: z.string().default('localhost:3000'),

  // ── Database ─────────────────────────────────────────────────────────────
  DATABASE_URL: z
    .string()
    .url('must be a valid postgresql:// URL')
    .refine((v) => v.startsWith('postgresql://'), 'must start with postgresql://'),

  // ── Auth ─────────────────────────────────────────────────────────────────
  AUTH_SECRET: secret(32),
  PLATFORM_ADMIN_EMAILS: z.string().default(''),

  // ── Redis (optional — falls back to in-memory) ───────────────────────────
  REDIS_URL: optionalString(),
  REDIS_DISABLED: optionalString(),
  REDIS_DISABLE: optionalString(),

  // ── Stripe (optional — checkout disabled if missing) ─────────────────────
  STRIPE_SECRET_KEY: optionalString(),
  STRIPE_WEBHOOK_SECRET: optionalString(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: optionalString(),
  STRIPE_SUBSCRIPTION_PRICE_ID: optionalString(),
  STRIPE_PRICE_ID_STARTER: optionalString(),
  STRIPE_PRICE_ID_PRO: optionalString(),
  STRIPE_PRICE_ID_SCALE: optionalString(),
  STRIPE_ALLOWED_PRICE_IDS: optionalString(),
  ALLOWED_CHECKOUT_REDIRECT_HOSTS: optionalString(),

  // ── Email: Resend (primary) ──────────────────────────────────────────────
  RESEND_API_KEY: optionalString(),
  RESEND_FROM_EMAIL: z.string().default('noreply@vouchr.app'),
  RESEND_WEBHOOK_SECRET: optionalString(),
  EMAIL_FROM: optionalString(),

  // ── Email: SMTP (fallback) ───────────────────────────────────────────────
  SMTP_HOST: optionalString(),
  SMTP_PORT: optionalString(),
  SMTP_USER: optionalString(),
  SMTP_PASSWORD: optionalString(),
  SMTP_PASS: optionalString(),
  SMTP_SECURE: optionalString(),
  SMTP_FROM: optionalString(),

  // ── OAuth providers (all optional) ───────────────────────────────────────
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),
  APPLE_CLIENT_ID: optionalString(),
  APPLE_CLIENT_SECRET: optionalString(),
  APPLE_ID: optionalString(),
  APPLE_SECRET: optionalString(),
  APPLE_TEAM_ID: optionalString(),
  APPLE_KEY_ID: optionalString(),
  APPLE_PRIVATE_KEY: optionalString(),
  FACEBOOK_CLIENT_ID: optionalString(),
  FACEBOOK_CLIENT_SECRET: optionalString(),

  // ── Cron / Webhooks ──────────────────────────────────────────────────────
  CRON_SECRET: optionalString(),
  COMMERCE_WEBHOOK_SECRET: optionalString(),

  // ── Observability ────────────────────────────────────────────────────────
  NEXT_PUBLIC_SENTRY_DSN: optionalString(),
  SENTRY_DSN: optionalString(),
  SENTRY_ENVIRONMENT: optionalString(),
  SENTRY_ORG: optionalString(),
  SENTRY_PROJECT: optionalString(),
  SENTRY_AUTH_TOKEN: optionalString(),
  METRICS_TOKEN: optionalString(),
  AXIOM_TOKEN: optionalString(),
  AXIOM_DATASET: z.string().default('voucher-logs'),

  // ── Analytics / Privacy ──────────────────────────────────────────────────
  IP_SALT: optionalString(),

  // ── Web Push (VAPID) ─────────────────────────────────────────────────────
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: optionalString(),
  VAPID_PRIVATE_KEY: optionalString(),
  VAPID_SUBJECT: z.string().default('mailto:admin@vouchr.app'),

  // ── Supabase (optional object storage) ───────────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: optionalString(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString(),
  SUPABASE_SERVICE_ROLE_KEY: optionalString(),

  // ── Pusher (optional real-time) ──────────────────────────────────────────
  NEXT_PUBLIC_PUSHER_KEY: optionalString(),
  NEXT_PUBLIC_PUSHER_CLUSTER: optionalString(),
  PUSHER_APP_ID: optionalString(),
  PUSHER_SECRET: optionalString(),

  // ── WebAuthn / Passkeys ──────────────────────────────────────────────────
  WEBAUTHN_RP_NAME: z.string().default('Vouchr'),
  WEBAUTHN_RP_ID: optionalString(),
  WEBAUTHN_ORIGIN: optionalString(),

  // ── AI (optional) ────────────────────────────────────────────────────────
  OPENAI_API_KEY: optionalString(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  AI_VIBE_LIMIT: optionalString(),
  AI_VIBE_WINDOW_HOURS: optionalString(),
  AI_AGENT_LIMIT: optionalString(),
  AI_AGENT_WINDOW_HOURS: optionalString(),

  // ── Misc / Dev conveniences ──────────────────────────────────────────────
  ENABLE_TEST_CREDENTIALS: optionalString(),
  NEXT_PUBLIC_ENABLE_ROLE_SWITCHER: optionalString(),
  CONTACT_EMAIL: optionalString(),
  NEXT_DIST_DIR: optionalString(),
  VERCEL_URL: optionalString(),
  PORT: optionalString(),

  // ── Test-only credentials (gated by ENABLE_TEST_CREDENTIALS=true) ────────
  // Read by lib/auth.ts when the credentials fallback is enabled. Must be
  // unset in production — guarded by `ENABLE_TEST_CREDENTIALS !== 'true'`
  // at the call site, not here.
  TEST_USER_EMAIL: optionalString(),
  TEST_USER_PASSWORD: optionalString(),
  TEST_ADMIN_EMAIL: optionalString(),
  TEST_ADMIN_PASSWORD: optionalString(),
  TEST_STAFF_EMAIL: optionalString(),
  TEST_STAFF_PASSWORD: optionalString(),
  TEST_TECH_ADMIN_EMAIL: optionalString(),
  TEST_TECH_ADMIN_PASSWORD: optionalString(),
  TEST_PLATFORM_ADMIN_EMAIL: optionalString(),
  TEST_PLATFORM_ADMIN_PASSWORD: optionalString(),
});

export type Env = z.infer<typeof schema>;

// ────────────────────────────────────────────────────────────────────────────
// Validator
// ────────────────────────────────────────────────────────────────────────────

let cached: Env | null = null;

/** Parse and validate process.env. Throws on critical failures. */
export function validateEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten();
    const messages = Object.entries(fieldErrors)
      .map(([key, errs]) => `  ${key}: ${(errs ?? []).join(', ')}`)
      .join('\n');

    // eslint-disable-next-line no-console
    console.error(
      `\n❌ Environment validation failed:\n${messages}\n\n` +
        `Fix by editing .env (copy from .env.example if missing).\n`,
    );
    throw new Error('Invalid environment variables');
  }

  cached = parsed.data;
  return parsed.data;
}

/**
 * Lazy-validated, typed env. Reads trigger validation on first access so
 * module import doesn't crash tooling that doesn't need env (e.g. Next build
 * analyzer). For early-boot validation use `validateEnv()` directly.
 */
export const env: Env = new Proxy({} as Env, {
  get(_, prop: string) {
    if (!cached) cached = validateEnv();
    return cached[prop as keyof Env];
  },
});
