'use client';

import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { CONSENT_CHANGE_EVENT, type ConsentChoice } from '@/components/cookie-consent-banner';

/**
 * Renders Vercel Analytics only after the visitor has opted in to analytics.
 *
 * The consent cookie is httpOnly, so the choice is read from
 * GET /api/cookie-consent on mount, and the banner broadcasts
 * CONSENT_CHANGE_EVENT when the visitor decides — so accepting turns
 * analytics on immediately, without a reload. Until then nothing loads.
 */
export function ConsentGatedAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/cookie-consent')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.consent?.analytics === true) setAllowed(true);
      })
      .catch(() => {});

    const onChange = (e: Event) => {
      const choice = (e as CustomEvent<ConsentChoice>).detail;
      setAllowed(choice?.analytics === true);
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
    };
  }, []);

  return allowed ? <Analytics /> : null;
}
