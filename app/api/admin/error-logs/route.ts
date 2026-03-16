import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.ops.health');

    const url = new URL(req.url);
    const level = url.searchParams.get('level') ?? 'error'; // error | warning | info
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') ?? '50', 10) || 50, 1), 200);
    const skip = (page - 1) * limit;

    // Build filter based on level
    const actionFilters: { action: { contains: string } }[] = [];
    if (level === 'error') {
      actionFilters.push({ action: { contains: 'error' } }, { action: { contains: 'Error' } });
    } else if (level === 'warning') {
      actionFilters.push(
        { action: { contains: 'warn' } },
        { action: { contains: 'Warn' } },
        { action: { contains: 'fail' } },
        { action: { contains: 'Fail' } },
      );
    }
    // For 'info', return all audit logs

    const where = actionFilters.length > 0 ? { OR: actionFilters } : {};

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          reason: true,
          actorUserId: true,
          ipAddress: true,
          userAgent: true,
          payloadJson: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const entries = logs.map((log) => {
      const payload = log.payloadJson as Record<string, unknown> | null;
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString(),
        level: log.action.toLowerCase().includes('error')
          ? 'error'
          : log.action.toLowerCase().includes('warn') || log.action.toLowerCase().includes('fail')
            ? 'warning'
            : 'info',
        action: log.action,
        endpoint: (payload?.path as string) ?? log.resourceType ?? null,
        message: (payload?.message as string) ?? log.reason ?? log.action,
        stackTrace: (payload?.stack as string) ?? null,
        userId: log.actorUserId,
        ipAddress: log.ipAddress ?? null,
        userAgent: log.userAgent ?? null,
        statusCode: payload?.statusCode ?? null,
      };
    });

    return NextResponse.json({
      entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });
}
