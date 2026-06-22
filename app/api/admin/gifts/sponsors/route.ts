import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createSponsorSchema = z.object({
  sponsorName: z.string().min(1),
  merchantId: z.string().optional(),
  budgetCents: z.number().int().positive(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  targetCategories: z.array(z.string()).optional(),
  targetOccasions: z.array(z.string()).optional(),
  priority: z.number().int().min(0).optional(),
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
      where,
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

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    const parsed = createSponsorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const placement = await prisma.sponsoredGiftPlacement.create({
      data: {
        sponsorName: parsed.data.sponsorName,
        merchantId: parsed.data.merchantId,
        budgetCents: parsed.data.budgetCents,
        startAt: new Date(parsed.data.startAt),
        endAt: new Date(parsed.data.endAt),
        targetCategories: parsed.data.targetCategories || [],
        targetOccasions: parsed.data.targetOccasions || [],
        priority: parsed.data.priority ?? 0,
      },
      include: {
        merchant: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json(placement, { status: 201 });
  });
}
