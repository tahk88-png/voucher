import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/passwords';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { allowed } = await rateLimitDistributed(`register:${ip}`, 5, 300);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existing) {
      // Don't leak whether account exists — return generic success
      return NextResponse.json({ ok: true });
    }

    const passwordHash = await hashPassword(password);

    await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        emailVerified: null, // They'll verify via OTP on first login
      },
    });

    // Send OTP for email verification (fire-and-forget)
    try {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      await prisma.verificationToken.create({
        data: {
          email: normalizedEmail,
          token: otp,
          expires: new Date(Date.now() + 10 * 60 * 1000),
        },
      });
      import('@/lib/emails').then(({ sendOTPEmail }) => {
        sendOTPEmail({ to: normalizedEmail, otp }).catch(() => {});
      });
    } catch {
      // Non-critical — user can request OTP again on login
    }

    return NextResponse.json({ ok: true });
  });
}
