import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { withErrorHandler } from '@/lib/error-handler';

const PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug, 'merchant_admin');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, parseInt(searchParams.get('pageSize') || String(PAGE_SIZE), 10) || PAGE_SIZE)
    );
    const action = searchParams.get('action') || undefined;
    const actorId = searchParams.get('actorId') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;
    const resourceType = searchParams.get('resourceType') || undefined;

    const where: Prisma.AuditLogWhereInput = {
      merchantId: merchant.id,
      deleted: false,
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {}),
      ...(actorId ? { actorUserId: actorId } : {}),
      ...(resourceType ? { resourceType } : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
              ...(dateTo ? { lte: new Date(dateTo + 'T23:59:59.999Z') } : {}),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: { id: true, email: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Get distinct actions for filter dropdown
    const distinctActions = await prisma.auditLog.findMany({
      where: { merchantId: merchant.id, deleted: false },
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' },
    });

    return NextResponse.json({
      items: logs,
      total,
      page,
      pageSize,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      actions: distinctActions.map((a) => a.action),
    });
  });
}
