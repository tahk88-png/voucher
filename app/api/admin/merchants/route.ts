import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.merchants.read');

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
    const q = searchParams.get('q') ?? undefined;

    const where = q ? {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { slug: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {};

    const [merchants, total] = await Promise.all([
      prisma.merchant.findMany({
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.merchant.count({ where }),
    ]);

    return NextResponse.json({
      merchants,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });
}
