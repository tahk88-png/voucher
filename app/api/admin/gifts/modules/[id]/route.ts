import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateModuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(500).nullable().optional(),
  type: z.enum(['TRENDING', 'SEASONAL', 'PERSONA_BASED', 'BUDGET_RANGE', 'AI_CURATED', 'SPONSORED', 'EDITORIAL']).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  config: z.record(z.unknown()).nullable().optional(),
  productIds: z.array(z.string()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission('manage_flags');
    const { id } = await params;

    const mod = await prisma.giftFeedModule.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, title: true, priceCents: true, mediaUrl: true, isActive: true },
            },
          },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!mod) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    return NextResponse.json(mod);
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission('manage_flags');
    const { id } = await params;

    const body = await req.json();
    const parsed = updateModuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { productIds, config, ...data } = parsed.data;

    const mod = await prisma.$transaction(async (tx) => {
      // Replace items if productIds provided
      if (productIds !== undefined) {
        await tx.giftFeedItem.deleteMany({ where: { moduleId: id } });
        if (productIds.length > 0) {
          await tx.giftFeedItem.createMany({
            data: productIds.map((productId, i) => ({
              moduleId: id,
              productId,
              priority: productIds.length - i,
            })),
          });
        }
      }

      return tx.giftFeedModule.update({
        where: { id },
        data: {
          ...data,
          ...(config !== undefined ? { config: config ? JSON.stringify(config) : null } : {}),
        },
        include: {
          items: {
            include: { product: { select: { id: true, title: true } } },
            orderBy: { priority: 'desc' },
          },
        },
      });
    });

    return NextResponse.json(mod);
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withErrorHandler(async () => {
    await requireAdminPermission('manage_flags');
    const { id } = await params;

    await prisma.$transaction([
      prisma.giftFeedItem.deleteMany({ where: { moduleId: id } }),
      prisma.giftFeedModule.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  });
}
