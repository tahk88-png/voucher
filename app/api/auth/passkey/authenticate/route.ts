import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  getAndDeleteChallenge,
} from '@/lib/webauthn';
import { randomBytes } from 'crypto';

/**
 * POST — Generate authentication options (no auth needed)
 */
export async function POST() {
  try {
    // Discoverable credentials: no need to specify allowCredentials
    const options = await generateAuthenticationOptions();
    return NextResponse.json(options);
  } catch (error) {
    console.error('Passkey auth options error:', error);
    return NextResponse.json({ error: 'Failed to generate authentication options' }, { status: 500 });
  }
}

/**
 * PUT — Verify authentication response, find user, create magic token
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { response } = body;

    if (!response) {
      return NextResponse.json({ error: 'Missing response' }, { status: 400 });
    }

    // Find the passkey by credential ID from the response
    const credentialId = response.id;
    const passkey = await prisma.passkey.findUnique({
      where: { credentialId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    if (!passkey) {
      return NextResponse.json({ error: 'Passkey not found' }, { status: 400 });
    }

    // Retrieve the challenge we stored (keyed by auth:<challenge>)
    // The challenge is in the clientDataJSON, but we need to check all auth challenges
    const expectedChallenge = getAndDeleteChallenge(`auth:${response.response.clientDataJSON ? extractChallengeFromResponse(response) : ''}`);

    // Fallback: try extracting challenge from the response directly
    let challenge = expectedChallenge;
    if (!challenge) {
      // The challenge is base64url-encoded in clientDataJSON
      const clientData = JSON.parse(
        Buffer.from(response.response.clientDataJSON, 'base64url').toString('utf-8')
      );
      challenge = getAndDeleteChallenge(`auth:${clientData.challenge}`);
    }

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expired or not found' }, { status: 400 });
    }

    const verification = await verifyAuthenticationResponse(
      response,
      {
        credentialId: passkey.credentialId,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
      },
      challenge
    );

    if (!verification.verified) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
    }

    // Update counter and lastUsedAt
    await prisma.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: BigInt(verification.authenticationInfo.newCounter),
        lastUsedAt: new Date(),
      },
    });

    // Create a magic token for signIn("credentials")
    const magicToken = randomBytes(32).toString('hex');
    await prisma.verificationToken.create({
      data: {
        email: passkey.user.email,
        token: `magic:${magicToken}`,
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      },
    });

    return NextResponse.json({
      verified: true,
      email: passkey.user.email,
      magicToken,
    });
  } catch (error) {
    console.error('Passkey auth verify error:', error);
    return NextResponse.json({ error: 'Failed to verify authentication' }, { status: 500 });
  }
}

/** Helper to extract challenge from WebAuthn response (best-effort) */
function extractChallengeFromResponse(response: { response?: { clientDataJSON?: string } }): string {
  try {
    if (!response.response?.clientDataJSON) return '';
    const clientData = JSON.parse(
      Buffer.from(response.response.clientDataJSON, 'base64url').toString('utf-8')
    );
    return clientData.challenge || '';
  } catch {
    return '';
  }
}
