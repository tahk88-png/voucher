import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { AccessControlError, accessErrorResponse, requirePlatformAdminProfile } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    await requirePlatformAdminProfile();

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
  });
}
