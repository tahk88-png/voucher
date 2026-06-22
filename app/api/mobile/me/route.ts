import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMobileToken } from '@/lib/mobile-auth';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

// GET /api/mobile/me — current user profile (bearer-authed).
export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    const userId = await verifyMobileToken(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, image: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      memberSince: user.createdAt.toISOString(),
    });
  });
}
