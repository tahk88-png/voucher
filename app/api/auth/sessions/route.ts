import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/sessions — List active sessions for the current user.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: {
      userId: session.user.id,
      expires: { gt: new Date() },
    },
    orderBy: { lastActiveAt: 'desc' },
    select: {
      id: true,
      deviceInfo: true,
      ipAddress: true,
      userAgent: true,
      lastActiveAt: true,
      createdAt: true,
      expires: true,
      sessionToken: true,
    },
  });

  // Determine which session is "current" by matching token
  // We'll pass a flag but never expose the actual token
  const mapped = sessions.map((s) => ({
    id: s.id,
    deviceInfo: s.deviceInfo || parseUserAgent(s.userAgent),
    ipAddress: s.ipAddress || 'Unknown',
    lastActiveAt: s.lastActiveAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    expiresAt: s.expires.toISOString(),
    isCurrent: false, // JWT sessions don't have a persistent session token to compare
  }));

  return NextResponse.json({ sessions: mapped });
}

/**
 * DELETE /api/auth/sessions — Revoke a session by ID, or all other sessions.
 * Body: { sessionId: string } or { revokeAll: true }
 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { sessionId, revokeAll } = body as {
    sessionId?: string;
    revokeAll?: boolean;
  };

  if (revokeAll) {
    // Delete all sessions for this user
    const result = await prisma.session.deleteMany({
      where: { userId: session.user.id },
    });
    return NextResponse.json({
      success: true,
      message: `Revoked ${result.count} session(s)`,
    });
  }

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId or revokeAll is required' },
      { status: 400 }
    );
  }

  // Verify the session belongs to this user
  const targetSession = await prisma.session.findFirst({
    where: { id: sessionId, userId: session.user.id },
  });

  if (!targetSession) {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    );
  }

  await prisma.session.delete({ where: { id: sessionId } });

  return NextResponse.json({ success: true, message: 'Session revoked' });
}

/**
 * Parse a user-agent string into a human-friendly device description.
 */
function parseUserAgent(ua: string | null | undefined): string {
  if (!ua) return 'Unknown device';

  let browser = 'Unknown browser';
  let os = 'Unknown OS';

  // Browser detection
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera';

  // OS detection
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}
