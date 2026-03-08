import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateGiftProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(2000).optional(),
  priceCents: z.number().int().positive().optional(),
  mediaUrl: z.string().url().nullable().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  categoryId: z.string().optional(),
  occasionIds: z.array(z.string()).optional(),
  personaIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).max(20).optional(),
  affiliateUrl: z.string().url().nullable().optional(),
  stock: z.number().int().min(0).nullable().optional(),
  isFeatured: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug);

    const product = await prisma.giftProduct.findFirst({
      where: { id, merchantId: merchant.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        occasions: { include: { occasion: { select: { id: true, name: true, slug: true } } } },
        personas: { include: { persona: { select: { id: true, name: true, slug: true } } } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      occasions: product.occasions.map((o) => o.occasion),
      personas: product.personas.map((pe) => pe.persona),
    });
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug);

    // Verify ownership
    const existing = await prisma.giftProduct.findFirst({
      where: { id, merchantId: merchant.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateGiftProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { occasionIds, personaIds, ...data } = parsed.data;

    const product = await prisma.$transaction(async (tx) => {
      // Update occasion relations if provided
      if (occasionIds !== undefined) {
        await tx.giftProductOccasion.deleteMany({ where: { productId: id } });
        if (occasionIds.length > 0) {
          await tx.giftProductOccasion.createMany({
            data: occasionIds.map((occasionId) => ({ productId: id, occasionId })),
          });
        }
      }

      // Update persona relations if provided
      if (personaIds !== undefined) {
        await tx.giftProductPersona.deleteMany({ where: { productId: id } });
        if (personaIds.length > 0) {
          await tx.giftProductPersona.createMany({
            data: personaIds.map((personaId) => ({ productId: id, personaId })),
          });
        }
      }

      return tx.giftProduct.update({
        where: { id },
        data: data as Parameters<typeof tx.giftProduct.update>[0]['data'],
        include: {
          category: { select: { id: true, name: true, slug: true } },
          occasions: { include: { occasion: { select: { id: true, name: true, slug: true } } } },
          personas: { include: { persona: { select: { id: true, name: true, slug: true } } } },
        },
      });
    });

    return NextResponse.json({
      ...product,
      occasions: product.occasions.map((o) => o.occasion),
      personas: product.personas.map((pe) => pe.persona),
    });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  return withErrorHandler(async () => {
    const { slug, id } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug);

    const existing = await prisma.giftProduct.findFirst({
      where: { id, merchantId: merchant.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Soft-delete by deactivating
    await prisma.giftProduct.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ ok: true });
  });
}
