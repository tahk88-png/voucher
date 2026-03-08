import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { requireMerchantProfileAccessBySlug } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createGiftProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  priceCents: z.number().int().positive(),
  currency: z.string().default('EUR'),
  mediaUrl: z.string().url().optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  categoryId: z.string().min(1),
  occasionIds: z.array(z.string()).optional(),
  personaIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).max(20).optional(),
  affiliateUrl: z.string().url().optional(),
  stock: z.number().int().min(0).optional(),
  isFeatured: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug);

    const products = await prisma.giftProduct.findMany({
      where: { merchantId: merchant.id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        occasions: { include: { occasion: { select: { id: true, name: true, slug: true } } } },
        personas: { include: { persona: { select: { id: true, name: true, slug: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = products.map((p) => ({
      ...p,
      occasions: p.occasions.map((o) => o.occasion),
      personas: p.personas.map((pe) => pe.persona),
    }));

    return NextResponse.json({ products: formatted });
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return withErrorHandler(async () => {
    const { slug } = await params;
    const { merchant } = await requireMerchantProfileAccessBySlug(slug);

    const body = await req.json();
    const parsed = createGiftProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { occasionIds, personaIds, tags, ...data } = parsed.data;

    const product = await prisma.giftProduct.create({
      data: {
        ...data,
        merchantId: merchant.id,
        tags: tags || [],
        mediaUrls: data.mediaUrls || [],
        occasions: occasionIds?.length
          ? { create: occasionIds.map((id) => ({ occasionId: id })) }
          : undefined,
        personas: personaIds?.length
          ? { create: personaIds.map((id) => ({ personaId: id })) }
          : undefined,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        occasions: { include: { occasion: { select: { id: true, name: true, slug: true } } } },
        personas: { include: { persona: { select: { id: true, name: true, slug: true } } } },
      },
    });

    return NextResponse.json({
      ...product,
      occasions: product.occasions.map((o) => o.occasion),
      personas: product.personas.map((pe) => pe.persona),
    }, { status: 201 });
  });
}
