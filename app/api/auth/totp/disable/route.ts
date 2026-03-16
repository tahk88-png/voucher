import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { verifyTotpCode, verifyBackupCode } from '@/lib/totp';

/**
 * POST /api/auth/totp/disable — Disable 2FA (requires current TOTP code or backup code).
 * Body: { code: string }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { code } = body as { code?: string };

  if (!code || typeof code !== 'string') {
    return NextResponse.json(
      { error: 'A verification code is required' },
      { status: 400 }
    );
  }

  const credential = await prisma.totpCredential.findUnique({
    where: { userId: session.user.id },
  });

  if (!credential || !credential.enabled) {
    return NextResponse.json(
      { error: '2FA is not currently enabled' },
      { status: 400 }
    );
  }

  // Try TOTP code first (6-digit), then backup code (XXXX-XXXX format)
  const cleanCode = code.trim();
  let verified = false;

  if (/^\d{6}$/.test(cleanCode)) {
    verified = verifyTotpCode(credential.secret, cleanCode);
  } else {
    // Try as backup code
    const idx = verifyBackupCode(cleanCode, credential.backupCodes);
    if (idx >= 0) {
      verified = true;
    }
  }

  if (!verified) {
    return NextResponse.json(
      { error: 'Invalid code. Enter your current TOTP code or a backup code.' },
      { status: 400 }
    );
  }

  // Disable and remove TOTP credential
  await prisma.totpCredential.delete({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    success: true,
    message: 'Two-factor authentication has been disabled',
  });
}
