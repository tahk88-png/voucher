/**
 * Resend webhook endpoint.
 *
 * Always returns 200 to prevent Resend from retrying.
 * Optionally verifies webhook signature via HMAC if RESEND_WEBHOOK_SECRET is set.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processResendWebhook } from '@/lib/email/webhook-handler';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Signature verification (optional)
// ---------------------------------------------------------------------------

function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('RESEND_WEBHOOK_SECRET not set in production — rejecting webhook');
      return false;
    }
    return true; // Allow unverified in dev/test
  }

  if (!signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected),
  );
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let rawBody: string;

  try {
    rawBody = await req.text();
  } catch {
    logger.warn('Resend webhook: failed to read request body');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Verify signature if secret is configured
  const signature = req.headers.get('resend-signature')
    ?? req.headers.get('x-resend-signature');

  if (process.env.RESEND_WEBHOOK_SECRET && !verifySignature(rawBody, signature)) {
    logger.warn('Resend webhook: invalid signature');
    // Still return 200 to avoid retries, but skip processing
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Parse and process
  try {
    const payload = JSON.parse(rawBody);
    await processResendWebhook(payload);
  } catch (error) {
    // Log but never fail — always return 200
    logger.error('Resend webhook processing error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
