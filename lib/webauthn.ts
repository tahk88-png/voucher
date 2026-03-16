import {
  generateRegistrationOptions as genRegOpts,
  verifyRegistrationResponse as verifyRegResp,
  generateAuthenticationOptions as genAuthOpts,
  verifyAuthenticationResponse as verifyAuthResp,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/server/script/deps';

// ── Relying Party config ──

export const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'GiftHub';

function getRpId(): string {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  const url = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
}

export const RP_ID = getRpId();

function getOrigin(): string {
  if (process.env.WEBAUTHN_ORIGIN) return process.env.WEBAUTHN_ORIGIN;
  return process.env.NEXTAUTH_URL || 'http://localhost:3000';
}

export const ORIGIN = getOrigin();

// ── Challenge store (in-memory with 5-min TTL) ──

const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();
const CHALLENGE_TTL = 5 * 60 * 1000; // 5 minutes

export function storeChallenge(userId: string, challenge: string): void {
  challengeStore.set(userId, { challenge, expiresAt: Date.now() + CHALLENGE_TTL });
}

export function getAndDeleteChallenge(userId: string): string | null {
  const entry = challengeStore.get(userId);
  if (!entry) return null;
  challengeStore.delete(userId);
  if (Date.now() > entry.expiresAt) return null;
  return entry.challenge;
}

// Periodic cleanup of expired challenges
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of challengeStore) {
    if (now > entry.expiresAt) challengeStore.delete(key);
  }
}, 60_000);

// ── Registration ──

export interface ExistingPasskey {
  credentialId: string;
  transports?: string[];
}

export async function generateRegistrationOptions(
  userId: string,
  userEmail: string,
  existingPasskeys: ExistingPasskey[]
) {
  const options = await genRegOpts({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: userEmail,
    userID: new TextEncoder().encode(userId),
    attestationType: 'none',
    excludeCredentials: existingPasskeys.map((pk) => ({
      id: pk.credentialId,
      transports: (pk.transports ?? []) as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  storeChallenge(userId, options.challenge);
  return options;
}

export async function verifyRegistrationResponse(
  response: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<VerifiedRegistrationResponse> {
  return verifyRegResp({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
  });
}

// ── Authentication ──

export interface UserPasskey {
  credentialId: string;
  transports?: string[];
}

export async function generateAuthenticationOptions(userPasskeys?: UserPasskey[]) {
  const options = await genAuthOpts({
    rpID: RP_ID,
    allowCredentials: userPasskeys?.map((pk) => ({
      id: pk.credentialId,
      transports: (pk.transports ?? []) as AuthenticatorTransportFuture[],
    })),
    userVerification: 'preferred',
  });

  // For authentication, store challenge keyed by the challenge itself
  // (since we don't know the user yet)
  storeChallenge(`auth:${options.challenge}`, options.challenge);
  return options;
}

export async function verifyAuthenticationResponse(
  response: AuthenticationResponseJSON,
  passkey: { credentialId: string; publicKey: string; counter: bigint },
  expectedChallenge: string
): Promise<VerifiedAuthenticationResponse> {
  return verifyAuthResp({
    response,
    expectedChallenge,
    expectedOrigin: ORIGIN,
    expectedRPID: RP_ID,
    credential: {
      id: passkey.credentialId,
      publicKey: Buffer.from(passkey.publicKey, 'base64url'),
      counter: Number(passkey.counter),
    },
  });
}
