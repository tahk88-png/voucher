import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  getAndDeleteChallenge,
} from '@/lib/webauthn';

/**
 * POST — Generate registration options (user must be logged in)
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingPasskeys = await prisma.passkey.findMany({
      where: { userId: session.user.id },
      select: { credentialId: true, transports: true },
    });

    const options = await generateRegistrationOptions(
      session.user.id,
      session.user.email,
      existingPasskeys
    );

    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey registration options error:', error);
    return NextResponse.json({ error: 'Failed to generate registration options' }, { status: 500 });
  }
}

/**
 * PUT — Verify registration response and save passkey to DB
 */
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { response, friendlyName } = body;

    if (!response) {
      return NextResponse.json({ error: 'Missing response' }, { status: 400 });
    }

    const expectedChallenge = getAndDeleteChallenge(session.user.id);
    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    const verification = await verifyRegistrationResponse(response, expectedChallenge);

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

    await prisma.passkey.create({
      data: {
        userId: session.user.id,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: BigInt(credential.counter),
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
        transports: credential.transports ?? [],
        friendlyName: friendlyName || null,
      },
    });

    return NextResponse.json({ verified: true });
  } catch (error) {
    console.error('Passkey registration verify error:', error);
    return NextResponse.json({ error: 'Failed to verify registration' }, { status: 500 });
  }
}
