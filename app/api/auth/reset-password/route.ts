import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwords';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimit } from '@/lib/rate-limit';
import { getClientIp } from '@/lib/get-client-ip';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    // IP rate limit: 10 per 15 minutes
    const ip = getClientIp(req);
    const ipCheck = rateLimit(`resetVerify:ip:${ip}`, 10, 15 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find valid reset token
    const tokenRecord = await prisma.verificationToken.findFirst({
      where: {
        email: normalizedEmail,
        token: `reset:${token}`,
        expires: { gt: new Date() },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // Hash the new password
    const passwordHash = await hashPassword(password);

    // Update user password and delete token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { email: normalizedEmail },
        data: { passwordHash },
      }),
      prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      }),
      // Delete any other reset tokens for this email
      prisma.verificationToken.deleteMany({
        where: { email: normalizedEmail, token: { startsWith: 'reset:' } },
      }),
    ]);

    return NextResponse.json({ success: true });
  });
}
