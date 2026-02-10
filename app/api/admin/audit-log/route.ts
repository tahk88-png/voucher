import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { captureException } from '@/lib/error-tracking';
import { AccessControlError, accessErrorResponse, requirePlatformAdminProfile } from '@/lib/access-control';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requirePlatformAdminProfile();

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const action = searchParams.get('action');
    const merchantId = searchParams.get('merchantId');

    const where: {
      action?: string;
      merchantId?: string;
    } = {};
    if (action) {
      where.action = action;
    }
    if (merchantId) {
      where.merchantId = merchantId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          merchant: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    if (error instanceof AccessControlError) {
      return accessErrorResponse(error);
    }
    if (error instanceof Error) {
      captureException(error, {
        context: 'admin_audit_log_fetch',
      });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
