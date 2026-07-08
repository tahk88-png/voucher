import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    // IP rate limit: 5 per 15 minutes
    const ip = getClientIp(req);
    const ipCheck = rateLimit(`reset:ip:${ip}`, 5, 15 * 60 * 1000);
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

    // Email rate limit: 2 per 15 minutes
    const emailCheck = rateLimit(`reset:email:${normalizedEmail}`, 2, 15 * 60 * 1000);
    if (!emailCheck.allowed) {
      // Always return success to prevent email enumeration
      return NextResponse.json({ sent: true });
    }

    // Check user exists (silently succeed even if not, to prevent enumeration)
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true },
    });

    if (!user) {
      // Don't reveal whether user exists
      return NextResponse.json({ sent: true });
    }

    // Delete old reset tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { email: normalizedEmail, token: { startsWith: 'reset:' } },
    });

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.verificationToken.create({
      data: {
        email: normalizedEmail,
        token: `reset:${resetToken}`,
        expires,
      },
    });

    // Build reset URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send reset email
    try {
      const { sendEmail, isResendConfigured } = await import('@/lib/resend');
      if (isResendConfigured()) {
        await sendEmail({
          to: normalizedEmail,
          subject: 'Reset your GiftHub password',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #2D2721; margin-bottom: 8px;">Reset your password</h2>
              <p style="color: #6B5744; margin-bottom: 24px;">
                Hi${user.name ? ` ${user.name}` : ''},<br/>
                We received a request to reset your password. Click the button below to set a new one.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #cc785c; color: #fcfbf8; font-weight: 600; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              <p style="color: #6B5744; font-size: 14px;">This link expires in 30 minutes.</p>
              <p style="color: #6B5744; font-size: 14px;">If you didn&apos;t request this, you can safely ignore this email. Your password will not change.</p>
              <hr style="border: none; border-top: 1px solid rgba(139,115,85,0.15); margin: 24px 0;" />
              <p style="color: #9B8A78; font-size: 12px;">If the button doesn&apos;t work, copy this link:<br/>${resetUrl}</p>
            </div>
          `,
          text: `Reset your GiftHub password\n\nHi${user.name ? ` ${user.name}` : ''},\n\nWe received a request to reset your password. Visit this link to set a new one:\n\n${resetUrl}\n\nThis link expires in 30 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
          tags: [{ name: 'type', value: 'password-reset' }],
        });
      } else {
        logger.warn('[forgot-password] Resend not configured', { resetUrl });
      }
    } catch (emailErr) {
      logger.error('[forgot-password] Email failed', { error: emailErr instanceof Error ? emailErr.message : String(emailErr) });
    }

    return NextResponse.json({ sent: true });
  });
}
