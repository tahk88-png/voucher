/**
 * AI Gift Engine — generates gift recommendations, bundles, and copy using
 * only existing GiftProduct IDs (no hallucinated products).
 */

import { prisma } from '@/lib/prisma';

interface GiftRecommendationInput {
  recipientType: string;
  budget: number;
  occasion: string;
  tone?: 'playful' | 'premium' | 'corporate';
  language?: string;
  limit?: number;
}

interface GiftBundle {
  title: string;
  description: string;
  products: {
    id: string;
    title: string;
    priceCents: number;
    reason: string;
  }[];
  totalCents: number;
}

interface GiftSuggestion {
  productId: string;
  title: string;
  priceCents: number;
  reason: string;
  score: number;
}

/**
 * Generate personalized gift suggestions based on criteria.
 * Uses rule-based matching against existing products (no LLM calls).
 */
export async function generateGiftSuggestions(
  input: GiftRecommendationInput
): Promise<GiftSuggestion[]> {
  const limit = input.limit || 10;
  const budgetCents = input.budget;

  // Find matching persona
  const persona = await prisma.giftPersona.findFirst({
    where: {
      OR: [
        { slug: { contains: input.recipientType.toLowerCase().replace(/\s+/g, '-') } },
        { tags: { hasSome: input.recipientType.toLowerCase().split(/[\s,]+/) } },
      ],
      isActive: true,
    },
  });

  // Find matching occasion
  const occasion = await prisma.giftOccasion.findFirst({
    where: {
      OR: [
        { slug: { contains: input.occasion.toLowerCase().replace(/\s+/g, '-') } },
        { name: { contains: input.occasion, mode: 'insensitive' } },
      ],
      isActive: true,
    },
  });

  // Build query
  const where: Record<string, unknown> = {
    isActive: true,
    priceCents: { lte: Math.round(budgetCents * 1.1) }, // 10% margin
  };

  if (persona) {
    where.personas = { some: { personaId: persona.id } };
  }
  if (occasion) {
    where.occasions = { some: { occasionId: occasion.id } };
  }

  const products = await prisma.giftProduct.findMany({
    where: where as Parameters<typeof prisma.giftProduct.findMany>[0]['where'],
    include: {
      category: { select: { name: true } },
      occasions: { include: { occasion: { select: { name: true } } } },
      personas: { include: { persona: { select: { name: true } } } },
    },
    orderBy: [{ engagementScore: 'desc' }, { purchaseCount: 'desc' }],
    take: limit * 2,
  });

  // Score and rank
  return products
    .map((p) => {
      let score = 0.5;
      const reasons: string[] = [];

      // Budget fit
      if (p.priceCents <= budgetCents) {
        score += 0.2;
        reasons.push(`Within budget`);
      }

      // Persona match
      if (persona && p.personas.some((pp) => pp.personaId === persona.id)) {
        score += 0.3;
        reasons.push(`Great for ${persona.name}`);
      }

      // Occasion match
      if (occasion && p.occasions.some((po) => po.occasionId === occasion.id)) {
        score += 0.2;
        reasons.push(`Perfect for ${occasion.name}`);
      }

      // Popularity
      if (p.purchaseCount > 10) {
        score += 0.1;
        reasons.push(`Popular choice`);
      }

      // Featured
      if (p.isFeatured) {
        score += 0.1;
        reasons.push(`Featured product`);
      }

      return {
        productId: p.id,
        title: p.title,
        priceCents: p.priceCents,
        reason: reasons.join(' - ') || 'Good match',
        score: Math.min(score, 1),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Generate a gift bundle (a curated set of products under a total budget).
 */
export async function generateGiftBundle(
  title: string,
  budgetCents: number,
  categorySlug?: string,
  maxItems: number = 3
): Promise<GiftBundle | null> {
  const where: Record<string, unknown> = {
    isActive: true,
    priceCents: { lte: Math.round(budgetCents * 0.6) }, // each item < 60% of total
  };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  const candidates = await prisma.giftProduct.findMany({
    where: where as Parameters<typeof prisma.giftProduct.findMany>[0]['where'],
    orderBy: [{ engagementScore: 'desc' }, { purchaseCount: 'desc' }],
    take: 20,
  });

  if (candidates.length === 0) return null;

  // Greedy bundle packing
  const bundle: typeof candidates = [];
  let totalCents = 0;

  // Sort by value (engagement per cent)
  const sorted = [...candidates].sort(
    (a, b) => b.engagementScore / Math.max(b.priceCents, 1) - a.engagementScore / Math.max(a.priceCents, 1)
  );

  for (const product of sorted) {
    if (bundle.length >= maxItems) break;
    if (totalCents + product.priceCents <= budgetCents) {
      bundle.push(product);
      totalCents += product.priceCents;
    }
  }

  if (bundle.length === 0) return null;

  return {
    title,
    description: `A curated selection of ${bundle.length} gifts, perfectly matched`,
    products: bundle.map((p) => ({
      id: p.id,
      title: p.title,
      priceCents: p.priceCents,
      reason: p.isFeatured ? 'Featured pick' : 'Top rated',
    })),
    totalCents,
  };
}

/**
 * Generate upsell/add-on suggestions for a given product.
 */
export async function generateUpsellSuggestions(
  productId: string,
  limit: number = 3
): Promise<GiftSuggestion[]> {
  const product = await prisma.giftProduct.findUnique({
    where: { id: productId },
    include: {
      category: true,
      occasions: { select: { occasionId: true } },
      personas: { select: { personaId: true } },
    },
  });

  if (!product) return [];

  // Find complementary products: same occasion/persona, different category, lower price
  const related = await prisma.giftProduct.findMany({
    where: {
      isActive: true,
      id: { not: productId },
      categoryId: { not: product.categoryId },
      priceCents: { lte: Math.round(product.priceCents * 0.5) }, // cheaper add-ons
      OR: [
        { occasions: { some: { occasionId: { in: product.occasions.map((o) => o.occasionId) } } } },
        { personas: { some: { personaId: { in: product.personas.map((p) => p.personaId) } } } },
      ],
    },
    orderBy: { engagementScore: 'desc' },
    take: limit,
  });

  return related.map((p) => ({
    productId: p.id,
    title: p.title,
    priceCents: p.priceCents,
    reason: 'Pairs well',
    score: 0.7,
  }));
}

/**
 * Auto-generate a seasonal collection based on active occasions and trending products.
 */
export async function generateSeasonalCollection(
  occasionSlug: string,
  limit: number = 10
): Promise<{ title: string; products: { id: string; title: string; priceCents: number }[] }> {
  const occasion = await prisma.giftOccasion.findUnique({
    where: { slug: occasionSlug },
  });

  if (!occasion) {
    return { title: 'Gift Collection', products: [] };
  }

  const products = await prisma.giftProduct.findMany({
    where: {
      isActive: true,
      occasions: { some: { occasionId: occasion.id } },
    },
    orderBy: [{ isFeatured: 'desc' }, { engagementScore: 'desc' }],
    take: limit,
  });

  return {
    title: `Top ${occasion.name} Gifts`,
    products: products.map((p) => ({
      id: p.id,
      title: p.title,
      priceCents: p.priceCents,
    })),
  };
}
