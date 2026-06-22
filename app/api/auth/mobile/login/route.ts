import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/passwords';
import { signMobileToken } from '@/lib/mobile-auth';
import { checkIPRateLimit } from '@/lib/fraud';
import { getClientIp } from '@/lib/request';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * POST /api/auth/mobile/login — credentials login for the native apps.
 * Returns a bearer JWT (see lib/mobile-auth) the app stores in SecureStore.
 */
export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    // Throttle brute-force: 10 attempts/hour per IP.
    const ip = getClientIp(req);
    const rl = await checkIPRateLimit(ip, 60, 10);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
    }

    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    const email = parsed.data.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, passwordHash: true },
    });

    // Constant-ish response: don't reveal whether the email exists.
    if (!user?.passwordHash || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = await signMobileToken(user.id);

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name },
    });
  });
}
