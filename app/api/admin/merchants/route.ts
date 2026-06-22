import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { parseCursorParams, buildCursorQuery, buildCursorResult } from '@/lib/cursor-pagination';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.merchants.read');

    const { searchParams } = new URL(req.url);
    const { cursor, limit } = parseCursorParams(searchParams);
    const q = searchParams.get('q') ?? undefined;

    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { slug: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {};

    const paginationArgs = buildCursorQuery({ cursor, limit });
    const merchants = await prisma.merchant.findMany({
      where,
      include: {
        _count: {
          select: {
            vouchers: true,
            members: true,
            redemptions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...paginationArgs,
    });

    const result = buildCursorResult(merchants, limit, cursor);

    return NextResponse.json({
      merchants: result.data,
      nextCursor: result.nextCursor,
      prevCursor: result.prevCursor,
      hasMore: result.hasMore,
    });
  });
}
