import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  return withErrorHandler(async () => {
    const { productId } = await params;

    const product = await prisma.giftProduct.findUnique({
      where: { id: productId, isActive: true },
      include: {
        merchant: { select: { id: true, name: true, slug: true, brandLogoUrl: true } },
        category: { select: { id: true, name: true, slug: true, icon: true, color: true } },
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
      personas: product.personas.map((p) => p.persona),
    });
  });
}
