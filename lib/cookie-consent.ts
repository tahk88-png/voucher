/**
 * Cookie Consent — server-side store + helpers.
 *
 * GDPR: No tracking cookies set before user gives explicit consent.
 * Consent stored in DB (CookieConsent model) and mirrored to a
 * first-party cookie (`cookie_consent`) for quick middleware checks.
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export type ConsentCategories = {
  necessary: boolean;   // Always true — cannot be declined
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const CONSENT_COOKIE_NAME = 'cookie_consent';
const CONSENT_COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

/**
 * Read consent from the first-party cookie (fast, no DB).
 * Returns null if user hasn't consented yet → show banner.
 */
export async function getConsentFromCookie(): Promise<ConsentCategories | null> {
  const jar = await cookies();
  const raw = jar.get(CONSENT_COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
      preferences: !!parsed.preferences,
    };
  } catch {
    return null;
  }
}

/**
 * Check if analytics tracking is allowed (use in Sentry/analytics init).
 */
export async function isAnalyticsAllowed(): Promise<boolean> {
  const consent = await getConsentFromCookie();
  return consent?.analytics === true;
}

/**
 * Save consent to DB and set the mirror cookie.
 */
export async function saveConsent(opts: {
  consent: Omit<ConsentCategories, 'necessary'>;
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const { consent, sessionId, userId, ipAddress, userAgent } = opts;

  // Upsert in DB
  await prisma.cookieConsent.create({
    data: {
      sessionId,
      userId,
      necessary: true,
      analytics: consent.analytics,
      marketing: consent.marketing,
      preferences: consent.preferences,
      ipAddress,
      userAgent,
    },
  });

  // Set mirror cookie for fast middleware reads
  const jar = await cookies();
  jar.set(CONSENT_COOKIE_NAME, JSON.stringify({
    analytics: consent.analytics,
    marketing: consent.marketing,
    preferences: consent.preferences,
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: CONSENT_COOKIE_MAX_AGE,
    path: '/',
  });
}

/**
 * Decline all optional cookies (only necessary stays).
 */
export async function declineAllConsent(opts: {
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  return saveConsent({
    ...opts,
    consent: { analytics: false, marketing: false, preferences: false },
  });
}

/**
 * Accept all cookies.
 */
export async function acceptAllConsent(opts: {
  sessionId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  return saveConsent({
    ...opts,
    consent: { analytics: true, marketing: true, preferences: true },
  });
}
