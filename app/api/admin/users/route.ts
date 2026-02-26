import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdminProfile } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requirePlatformAdminProfile();

    const url = new URL(req.url);
    const search = url.searchParams.get('q')?.trim() || '';
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = 50;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
          image: true,
          _count: {
            select: {
              voucherPurchases: true,
              redemptions: true,
              merchantMembers: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandler(async () => {
    await requirePlatformAdminProfile();

    const { userId, action, value } = await req.json();
    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'ban':
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'disabled' },
        });
        // Clear sessions
        await prisma.session.deleteMany({ where: { userId } });
        break;

      case 'unban':
        await prisma.user.update({
          where: { id: userId },
          data: { status: 'active' },
        });
        break;

      case 'reset_password':
        await prisma.user.update({
          where: { id: userId },
          data: { passwordHash: null },
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, action, userId });
  });
}
