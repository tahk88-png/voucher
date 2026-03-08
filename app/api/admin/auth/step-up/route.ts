/**
 * POST /api/admin/auth/step-up
 *
 * Step-up re-authentication endpoint.
 * Verifies the admin's password and issues a single-use, short-lived
 * step-up token that can be sent via X-Admin-Step-Up-Token header
 * to authorize destructive admin actions.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPassword } from '@/lib/passwords';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { rateLimitDistributed } from '@/lib/rate-limit';
import { requireAdminProfile } from '@/lib/admin/guards';
import { generateStepUpToken, STEP_UP_TTL_SECONDS } from '@/lib/admin/step-up';
import { logger } from '@/lib/logger';

const stepUpSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: Request) {
  return withErrorHandler(async () => {
    // 1. Require admin session
    const admin = await requireAdminProfile();

    // 2. Rate limit: 5 attempts per 5 minutes per user
    const rateLimitKey = `admin:stepup:${admin.userId}`;
    const rl = await rateLimitDistributed(rateLimitKey, 5, 5 * 60 * 1000);

    if (!rl.allowed) {
      logger.warn('Step-up rate limit exceeded', {
        userId: admin.userId,
        email: admin.email,
      });

      return NextResponse.json(
        {
          error: 'Too many step-up attempts. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }

    // 3. Parse and validate body
    const body = await request.json();
    const { password } = stepUpSchema.parse(body);

    // 4. Look up the user's password hash
    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      logger.warn('Step-up failed: no password hash on record', {
        userId: admin.userId,
        email: admin.email,
      });

      return NextResponse.json(
        {
          error: 'Password authentication is not configured for this account.',
          code: 'NO_PASSWORD',
        },
        { status: 400 },
      );
    }

    // 5. Verify password
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      logger.warn('Step-up failed: incorrect password', {
        userId: admin.userId,
        email: admin.email,
      });

      return NextResponse.json(
        {
          error: 'Incorrect password.',
          code: 'INVALID_PASSWORD',
        },
        { status: 401 },
      );
    }

    // 6. Generate step-up token
    const token = await generateStepUpToken(admin.userId);

    logger.info('Step-up token issued', {
      userId: admin.userId,
      email: admin.email,
    });

    // 7. Return token
    return NextResponse.json({
      token,
      expiresIn: STEP_UP_TTL_SECONDS,
    });
  });
}
