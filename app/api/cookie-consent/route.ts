import { NextRequest, NextResponse } from 'next/server';
import { saveConsent, getConsentFromCookie } from '@/lib/cookie-consent';
import { auth } from '@/lib/auth';
import { getClientIp } from '@/lib/get-client-ip';
import { z } from 'zod';

const consentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  preferences: z.boolean(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const consent = consentSchema.parse(body);
    const session = await auth();
    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') || undefined;

    // Use session cookie as fallback session identifier
    const sessionId =
      req.cookies.get('authjs.session-token')?.value ||
      req.cookies.get('next-auth.session-token')?.value ||
      crypto.randomUUID();

    await saveConsent({
      consent,
      sessionId,
      userId: session?.user?.id,
      ipAddress: ip === 'unknown' ? undefined : ip,
      userAgent: ua,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid consent data' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  const consent = await getConsentFromCookie();
  return NextResponse.json({ consent });
}
