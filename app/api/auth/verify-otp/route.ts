import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { rateLimitDistributed } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

    const [ipLimit, emailLimit] = await Promise.all([
      rateLimitDistributed(`otp_verify:ip:${ip}`, 10, 15 * 60 * 1000, 'otp_verify_ip'),
      rateLimitDistributed(`otp_verify:email:${normalizedEmail}`, 5, 15 * 60 * 1000, 'otp_verify_email'),
    ]);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      const resetAt = Math.max(ipLimit.resetAt, emailLimit.resetAt);
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)) } },
      );
    }

    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: normalizedEmail,
        token: otp.trim(),
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    // Delete the token (one-time use)
    await prisma.verificationToken.delete({ where: { id: tokenRecord.id } });

    // Check if user already exists (for welcome email logic)
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    const isNewUser = !existingUser;

    // Ensure user exists in DB
    await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: { emailVerified: new Date() },
      create: {
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0],
        emailVerified: new Date(),
      },
    });

    // Send welcome email to new users (fire-and-forget)
    if (isNewUser) {
      import('@/lib/emails').then(({ sendWelcomeEmail }) => {
        sendWelcomeEmail({
          to: normalizedEmail,
          name: normalizedEmail.split('@')[0],
        }).catch((err) => logger.error('[verify-otp] Welcome email failed', { error: err instanceof Error ? err.message : String(err) }));
      });
    }

    // Return a magic token for the credentials provider
    // We create a short-lived verification token they can use with signIn('credentials')
    const magicToken = crypto.randomUUID();
    const magicExpires = new Date(Date.now() + 60 * 1000); // 1 minute

    await prisma.verificationToken.create({
      data: {
        email: normalizedEmail,
        token: `magic:${magicToken}`,
        expires: magicExpires,
      },
    });

    return NextResponse.json({ verified: true, email: normalizedEmail, magicToken });
  });
}
