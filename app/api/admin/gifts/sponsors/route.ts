import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSponsorSchema = z.object({
  merchantId: z.string().min(1),
  productId: z.string().min(1),
  bidCents: z.number().int().positive(),
  dailyBudgetCents: z.number().int().positive(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  targetPersonas: z.array(z.string()).optional(),
  targetOccasions: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.manage');

    const status = req.nextUrl.searchParams.get('status');
    const where: Record<string, unknown> = {};
    if (status === 'active') {
      where.isActive = true;
      where.startAt = { lte: new Date() };
      where.endAt = { gte: new Date() };
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const placements = await prisma.sponsoredGiftPlacement.findMany({
      where: where as Parameters<typeof prisma.sponsoredGiftPlacement.findMany>[0]['where'],
      include: {
        merchant: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ placements });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.manage');

    const body = await req.json();
    const parsed = createSponsorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const placement = await prisma.sponsoredGiftPlacement.create({
      data: {
        ...parsed.data,
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        targetPersonas: parsed.data.targetPersonas || [],
        targetOccasions: parsed.data.targetOccasions || [],
      },
      include: {
        merchant: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(placement, { status: 201 });
  });
}
