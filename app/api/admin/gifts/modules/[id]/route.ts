import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireAdminPermission } from '@/lib/admin/guards';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateModuleSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['SEASONAL', 'TRENDING', 'AI_CURATED', 'PARTNER', 'CORPORATE', 'LAST_MINUTE']).optional(),
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
    await requireAdminPermission('admin.flags.manage');
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
    await requireAdminPermission('admin.flags.manage');
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
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

      const updateData: Prisma.GiftFeedModuleUpdateInput = {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(config !== undefined ? { configJson: config ? JSON.stringify(config) : Prisma.JsonNull } : {}),
      };

      return tx.giftFeedModule.update({
        where: { id },
        data: updateData,
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
    await requireAdminPermission('admin.flags.manage');
    const { id } = await params;

    await prisma.$transaction([
      prisma.giftFeedItem.deleteMany({ where: { moduleId: id } }),
      prisma.giftFeedModule.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  });
}
