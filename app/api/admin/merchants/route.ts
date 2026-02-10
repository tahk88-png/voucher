import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/lib/error-tracking';
import { AccessControlError, accessErrorResponse, requirePlatformAdminProfile } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
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
  } catch (error) {
    if (error instanceof AccessControlError) {
      return accessErrorResponse(error);
    }
    if (error instanceof Error) {
      captureException(error, {
        context: 'admin_merchants_fetch',
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
