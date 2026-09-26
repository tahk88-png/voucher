/**
 * Public origin of this deployment, and the addresses derived from it.
 *
 * Domains are configuration, never code. Every absolute URL, default sender
 * and support address comes from NEXT_PUBLIC_APP_URL (NEXTAUTH_URL as a
 * fallback) or from its own explicit env override. Nothing here may fall back
 * to a hardcoded public domain: a stray default sends mail "from", and points
 * users at, a domain the owner does not control.
 *
 * Values are read on every call. Call these inside request handlers, never at
 * module scope — `next build` evaluates modules with NODE_ENV=production and
 * no deployment config, where getAppUrl() throws by design.
 */

const DEV_APP_URL = 'http://localhost:3000';

/** Origin the app is served from: scheme://host[:port], no trailing slash. */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      throw new Error(
        `NEXT_PUBLIC_APP_URL / NEXTAUTH_URL must be an absolute URL such as https://app.example.com (got "${configured}")`,
      );
    }
  }
  if (process.env.NODE_ENV !== 'production') return DEV_APP_URL;
  throw new Error(
    'NEXT_PUBLIC_APP_URL is not set. Set it to the public URL of this deployment (e.g. https://app.example.com).',
  );
}

/** Hostname of the app URL, without port — the domain derived addresses use. */
export function getAppHost(): string {
  return new URL(getAppUrl()).hostname;
}

/** Default sender for platform email: RESEND_FROM_EMAIL, else noreply@<app host>. */
export function getSenderEmail(): string {
  return process.env.RESEND_FROM_EMAIL || `noreply@${getAppHost()}`;
}

/**
 * Sender for scheduled reports: EMAIL_FROM, then RESEND_FROM_EMAIL (an address
 * the owner has already verified), else reports@<app host>.
 */
export function getReportsSenderEmail(): string {
  return process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || `reports@${getAppHost()}`;
}

/** Support address shown to users and sent contact-form mail: CONTACT_EMAIL, else support@<app host>. */
export function getContactEmail(): string {
  return process.env.CONTACT_EMAIL || `support@${getAppHost()}`;
}
