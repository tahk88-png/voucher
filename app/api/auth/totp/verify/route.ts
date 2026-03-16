import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTotpCode } from '@/lib/totp';

/**
 * POST /api/auth/totp/verify — Verify a TOTP code and enable 2FA.
 * Body: { code: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { code } = body as { code?: string };

  if (!code || typeof code !== 'string' || code.length !== 6) {
    return NextResponse.json(
      { error: 'A 6-digit code is required' },
      { status: 400 }
    );
  }

  const credential = await prisma.totpCredential.findUnique({
    where: { userId: session.user.id },
  });

  if (!credential) {
    return NextResponse.json(
      { error: 'No TOTP setup found. Please start the setup process first.' },
      { status: 400 }
    );
  }

  if (credential.enabled) {
    return NextResponse.json(
      { error: '2FA is already enabled' },
      { status: 400 }
    );
  }

  // Verify the code against the stored secret
  const isValid = verifyTotpCode(credential.secret, code);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid code. Please check your authenticator app and try again.' },
      { status: 400 }
    );
  }

  // Enable 2FA
  await prisma.totpCredential.update({
    where: { userId: session.user.id },
    data: { enabled: true },
  });

  return NextResponse.json({
    success: true,
    message: 'Two-factor authentication has been enabled',
  });
}
