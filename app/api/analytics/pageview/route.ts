import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAnalyticsAllowed } from '@/lib/cookie-consent';
import { getClientIp } from '@/lib/get-client-ip';
import { rateLimit } from '@/lib/rate-limit';
import { z } from 'zod';
import {
  trackPageView,
  detectDevice,
  getCountryFromHeaders,
} from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const pageviewSchema = z.object({
  path: z.string().min(1).max(2048),
  referrer: z.string().max(2048).optional(),
  duration: z.number().int().nonnegative().optional(),
  sessionId: z.string().max(128).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Public, unauthenticated, and each call writes a row: cap it per IP.
    const limit = rateLimit(`analytics_pageview:${getClientIp(req)}`, 120, 60_000, 'analytics_pageview');
    if (!limit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } },
      );
    }

    const body = await req.json();
    const parsed = pageviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // GDPR: record nothing unless the visitor opted in to analytics in the
    // cookie banner. Answered with 200 so callers need no special handling.
    if (!(await isAnalyticsAllowed())) {
      return NextResponse.json({ tracked: false, reason: 'no_consent' });
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;
    const ua = req.headers.get('user-agent');
    const data = parsed.data;

    await trackPageView(data.path, {
      userId: userId ?? undefined,
      sessionId: data.sessionId,
      referrer: data.referrer,
      country: getCountryFromHeaders(req.headers) ?? undefined,
      device: detectDevice(ua),
      duration: data.duration,
    });

    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
