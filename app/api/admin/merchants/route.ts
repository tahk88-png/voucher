import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/lib/error-tracking';
import { isPlatformAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isPlatformAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const merchants = await prisma.merchant.findMany({
      include: {
        _count: {
          select: {
            vouchers: true,
            members: true,
            redemptions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(merchants);
  } catch (error) {
    if (error instanceof Error) {
      captureException(error, {
        context: 'admin_merchants_fetch',
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
