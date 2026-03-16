import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateTotpSecret,
  generateTotpUri,
  generateBackupCodes,
  hashBackupCode,
} from '@/lib/totp';

/**
 * POST /api/auth/totp/setup — Generate a TOTP secret and QR data for setup.
 * Returns the secret and otpauth URI (client generates QR code from the URI).
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if TOTP is already enabled
  const existing = await prisma.totpCredential.findUnique({
    where: { userId: session.user.id },
  });

  if (existing?.enabled) {
    return NextResponse.json(
      { error: '2FA is already enabled. Disable it first to reconfigure.' },
      { status: 400 }
    );
  }

  const secret = generateTotpSecret();
  const email = session.user.email || 'user@gifthub.com';
  const uri = generateTotpUri(secret, email);

  // Generate backup codes
  const backupCodes = generateBackupCodes();
  const hashedBackupCodes = backupCodes.map(hashBackupCode);

  // Upsert the TOTP credential (not yet enabled — awaiting verification)
  await prisma.totpCredential.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      secret,
      enabled: false,
      backupCodes: hashedBackupCodes,
    },
    update: {
      secret,
      enabled: false,
      backupCodes: hashedBackupCodes,
    },
  });

  return NextResponse.json({
    secret,
    uri,
    backupCodes, // Send plaintext backup codes only during setup
  });
}
