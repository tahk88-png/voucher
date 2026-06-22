import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createOccasionSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
  seasonalityWeight: z.number().min(0).max(5).default(1),
  activeMonths: z.array(z.number().int().min(1).max(12)).optional(),
});

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    const occasions = await prisma.giftOccasion.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ occasions });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.manage');

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    const parsed = createOccasionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const occasion = await prisma.giftOccasion.create({
      data: {
        ...parsed.data,
        activeMonths: parsed.data.activeMonths || [],
      },
    });
    return NextResponse.json(occasion, { status: 201 });
  });
}
