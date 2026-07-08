import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getClientIp } from '@/lib/get-client-ip';
import { z } from 'zod';
import {
  trackEvent,
  hashIP,
  detectDevice,
  detectBrowser,
  getCountryFromHeaders,
} from '@/lib/analytics';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiter (per-process)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Periodically clean up stale entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(key);
    }
  }, 60_000);
}

const trackSchema = z.object({
  type: z.string().min(1).max(100),
  page: z.string().max(2048).optional(),
  referrer: z.string().max(2048).optional(),
  metadata: z.record(z.unknown()).optional(),
  duration: z.number().int().nonnegative().optional(),
  sessionId: z.string().max(128).optional(),
  merchantId: z.string().max(128).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = trackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await auth();
    const userId = session?.user?.id ?? null;
    const ip = getClientIp(req);
    const rateLimitKey = userId ?? ip;

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const ua = req.headers.get('user-agent');
    const data = parsed.data;

    await trackEvent(data.type, {
      userId: userId ?? undefined,
      merchantId: data.merchantId,
      sessionId: data.sessionId,
      page: data.page,
      referrer: data.referrer,
      metadata: data.metadata,
      country: getCountryFromHeaders(req.headers) ?? undefined,
      device: detectDevice(ua),
      browser: detectBrowser(ua),
      ipHash: hashIP(ip),
      duration: data.duration,
    });

    return NextResponse.json({ tracked: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
