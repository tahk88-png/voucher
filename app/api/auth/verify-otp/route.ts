import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

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
        }).catch((err) => console.error('[verify-otp] Welcome email failed:', err));
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
  } catch (error) {
    console.error('[verify-otp]', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
