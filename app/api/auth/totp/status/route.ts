import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/auth/totp/status — Whether two-factor authentication is enabled.
 * Read-only: unlike POST /setup it never generates or rotates a secret.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const credential = await prisma.totpCredential.findUnique({
    where: { userId: session.user.id },
    select: { enabled: true },
  });

  return NextResponse.json(
    { enabled: credential?.enabled ?? false },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
