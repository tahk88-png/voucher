import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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
    const body = await req.json();
    const parsed = pageviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
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
