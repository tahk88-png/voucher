import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['SEASONAL', 'TRENDING', 'AI_CURATED', 'PARTNER', 'CORPORATE', 'LAST_MINUTE']),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  config: z.record(z.unknown()).optional(),
  productIds: z.array(z.string()).optional(),
});

export async function GET(_req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.manage');

    const modules = await prisma.giftFeedModule.findMany({
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true, priceCents: true, isActive: true } },
          },
          orderBy: { priority: 'desc' },
        },
        _count: { select: { items: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ modules });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    await requireAdminPermission('admin.flags.manage');

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    const parsed = createModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { productIds, config, ...data } = parsed.data;

    const createData: Prisma.GiftFeedModuleCreateInput = {
      title: data.title,
      type: data.type,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
      configJson: config ? JSON.stringify(config) : Prisma.JsonNull,
      items: productIds?.length
        ? {
            create: productIds.map((productId, i) => ({
              productId,
              priority: productIds.length - i,
            })),
          }
        : undefined,
    };

    const mod = await prisma.giftFeedModule.create({
      data: createData,
      include: {
        items: {
          include: { product: { select: { id: true, title: true } } },
        },
      },
    });

    return NextResponse.json(mod, { status: 201 });
  });
}
