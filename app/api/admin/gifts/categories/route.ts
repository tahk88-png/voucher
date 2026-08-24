import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  sortOrder: z.number().int().min(0).default(0),
});

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.read');

    const categories = await prisma.giftCategory.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ categories });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.manage');

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const category = await prisma.giftCategory.create({ data: parsed.data });
    return NextResponse.json(category, { status: 201 });
  });
}
