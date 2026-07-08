import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Cryptographically secure 6-digit OTP
function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    // IP-based rate limit: 5 requests per 5 minutes (distributed via Redis)
    const ip = getClientIp(req);
    const ipCheck = await rateLimitDistributed(`otp:ip:${ip}`, 5, 5 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((ipCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    const normalizedEmail = email.trim().toLowerCase();

    // Email-based rate limit: 3 requests per 15 minutes
    const emailCheck = await rateLimitDistributed(`otp:email:${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { error: 'Code already sent. Check your email or wait a few minutes.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((emailCheck.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Delete any existing tokens for this email
    await prisma.verificationToken.deleteMany({ where: { email: normalizedEmail } });

    // Create new OTP token (6-digit code stored as token)
    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.verificationToken.create({
      data: {
        email: normalizedEmail,
        token: otp,
        expires,
      },
    });

    // Send OTP via email
    try {
      const { sendEmail, isResendConfigured } = await import('@/lib/resend');
      if (isResendConfigured()) {
        await sendEmail({
          to: normalizedEmail,
          subject: 'Your GiftHub sign-in code',
          html: `
            <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #2D2721; margin-bottom: 8px;">Your sign-in code</h2>
              <p style="color: #6B5744; margin-bottom: 24px;">Enter this code to sign in to GiftHub. It expires in 10 minutes.</p>
              <div style="background: #f6e1d7; border: 2px solid #cc785c; border-radius: 12px; padding: 24px; text-align: center;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2D2721;">${otp}</span>
              </div>
              <p style="color: #6B5744; margin-top: 24px; font-size: 14px;">If you didn&apos;t request this, you can safely ignore this email.</p>
            </div>
          `,
          text: `Your GiftHub sign-in code is: ${otp}\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
          tags: [{ name: 'type', value: 'otp' }],
        });
      } else {
        logger.warn('[send-otp] Resend not configured, OTP not emailed');
      }
    } catch (emailErr) {
      logger.error('[send-otp] Email failed', { error: emailErr instanceof Error ? emailErr.message : String(emailErr) });
    }

    return NextResponse.json({ sent: true });
  });
}
