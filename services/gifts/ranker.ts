/**
 * Smart Gift Feed Ranker — combines personalization, seasonality, and diversity
 * into a final ranked feed.
 */

import { prisma } from '@/lib/prisma';
import { computePersonalizationScores, computeDiversityPenalty } from './personalization';
import { getOccasionSeasonalityScore, isLastMinuteWindow } from './seasonality';

interface FeedOptions {
  userId?: string;
  categorySlug?: string;
  occasionSlug?: string;
  personaSlug?: string;
  budgetMin?: number;
  budgetMax?: number;
  moduleType?: string;
  cursor?: string;
  limit?: number;
  language?: string;
}

interface RankedProduct {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  mediaUrl: string | null;
  mediaUrls: string[];
  merchantId: string;
  merchantName: string;
  merchantSlug: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  affiliateUrl: string | null;
  isFeatured: boolean;
  stock: number | null;
  score: number;
  feedModule?: string;
}

interface FeedResult {
  items: RankedProduct[];
  nextCursor: string | null;
  modules: { id: string; title: string; type: string; items: RankedProduct[] }[];
}

const WEIGHTS = {
  personaMatch: 0.30,
  occasionMatch: 0.20,
  budgetMatch: 0.15,
  engagementScore: 0.15,
  seasonality: 0.10,
  merchantPriority: 0.05,
  exploration: 0.05,
};

export async function generateFeed(options: FeedOptions): Promise<FeedResult> {
  const limit = Math.min(options.limit || 20, 50);
  const skip = options.cursor ? 1 : 0;

  // ── Load user context ──
  let profile = null;
  let interactions: Awaited<ReturnType<typeof prisma.userGiftInteraction.findMany>> = [];
  if (options.userId) {
    [profile, interactions] = await Promise.all([
      prisma.userGiftProfile.findUnique({ where: { userId: options.userId } }),
      prisma.userGiftInteraction.findMany({
        where: { userId: options.userId, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);
  }

  // ── Build product query ──
  const where: Record<string, unknown> = { isActive: true };
  if (options.categorySlug) {
    where.category = { slug: options.categorySlug };
  }
  if (options.occasionSlug) {
    where.occasions = { some: { occasion: { slug: options.occasionSlug } } };
  }
  if (options.personaSlug) {
    where.personas = { some: { persona: { slug: options.personaSlug } } };
  }
  if (options.budgetMin != null || options.budgetMax != null) {
    where.priceCents = {};
    if (options.budgetMin != null) (where.priceCents as Record<string, number>).gte = options.budgetMin;
    if (options.budgetMax != null) (where.priceCents as Record<string, number>).lte = options.budgetMax;
  }

  // ── Load products + occasions for seasonality ──
  const products = await prisma.giftProduct.findMany({
    where: where as any,
    include: {
      merchant: { select: { id: true, name: true, slug: true } },
      category: { select: { id: true, name: true, slug: true } },
      occasions: {
        include: { occasion: { select: { id: true, slug: true, seasonalityWeight: true, activeMonths: true } } },
      },
      personas: { select: { personaId: true } },
    },
    take: limit * 3, // fetch extra for ranking diversity
    ...(options.cursor ? { cursor: { id: options.cursor }, skip } : {}),
    orderBy: [{ isFeatured: 'desc' }, { engagementScore: 'desc' }, { createdAt: 'desc' }],
  });

  // ── Score each product ──
  const scored: (RankedProduct & { _raw: typeof products[0] })[] = [];

  for (const product of products) {
    const pScores = computePersonalizationScores({
      profile,
      interactions,
      product: product as Parameters<typeof computePersonalizationScores>[0]['product'],
    });

    // Seasonality: best occasion score
    let seasonalityScore = 0.3;
    for (const po of product.occasions) {
      const occ = po.occasion;
      const s = getOccasionSeasonalityScore(occ.slug, occ.seasonalityWeight, occ.activeMonths);
      seasonalityScore = Math.max(seasonalityScore, Math.min(s / 2.5, 1)); // normalize to 0-1
    }

    // Merchant priority (featured products get boost)
    const merchantPriority = product.isFeatured ? 1.0 : 0.3;

    // Exploration factor (random element to surface new products)
    const exploration = Math.random() * 0.4 + 0.3;

    // Weighted score
    let score =
      WEIGHTS.personaMatch * pScores.personaMatch +
      WEIGHTS.occasionMatch * pScores.occasionMatch +
      WEIGHTS.budgetMatch * pScores.budgetMatch +
      WEIGHTS.engagementScore * pScores.engagementScore +
      WEIGHTS.seasonality * seasonalityScore +
      WEIGHTS.merchantPriority * merchantPriority +
      WEIGHTS.exploration * exploration;

    // Last-minute boost
    if (isLastMinuteWindow()) {
      const hasExperienceTag = product.tags.some((t) =>
        ['experience', 'digital', 'instant', 'gift-card'].includes(t.toLowerCase())
      );
      if (hasExperienceTag) score *= 1.3;
    }

    scored.push({
      id: product.id,
      title: product.title,
      description: product.description,
      priceCents: product.priceCents,
      currency: product.currency,
      mediaUrl: product.mediaUrl,
      mediaUrls: product.mediaUrls,
      merchantId: product.merchant.id,
      merchantName: product.merchant.name,
      merchantSlug: product.merchant.slug,
      categoryId: product.category.id,
      categoryName: product.category.name,
      categorySlug: product.category.slug,
      tags: product.tags,
      affiliateUrl: product.affiliateUrl,
      isFeatured: product.isFeatured,
      stock: product.stock,
      score,
      _raw: product,
    });
  }

  // ── Sort by score ──
  scored.sort((a, b) => b.score - a.score);

  // ── Apply diversity ──
  const finalItems: RankedProduct[] = [];
  const recentCats: string[] = [];
  const recentMerchants: string[] = [];

  for (const item of scored) {
    if (finalItems.length >= limit) break;

    const penalty = computeDiversityPenalty(
      { categoryId: item.categoryId, merchantId: item.merchantId },
      recentCats.slice(-5),
      recentMerchants.slice(-3)
    );

    if (penalty < 0.5 || finalItems.length < 3) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _raw, ...clean } = item;
      clean.score *= 1 - penalty;
      finalItems.push(clean);
      recentCats.push(item.categoryId);
      recentMerchants.push(item.merchantId);
    }
  }

  // ── Load active modules ──
  const modules = await prisma.giftFeedModule.findMany({
    where: { isActive: true },
    include: {
      items: {
        include: {
          product: {
            include: {
              merchant: { select: { id: true, name: true, slug: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        orderBy: { priority: 'desc' },
        take: 10,
      },
    },
    orderBy: { sortOrder: 'asc' },
  });

  const moduleResults = modules.map((mod) => ({
    id: mod.id,
    title: mod.title,
    type: mod.type,
    items: mod.items
      .filter((i) => i.product)
      .map((i) => ({
        id: i.product!.id,
        title: i.customTitle || i.product!.title,
        description: i.customDescription || i.product!.description,
        priceCents: i.product!.priceCents,
        currency: i.product!.currency,
        mediaUrl: i.product!.mediaUrl,
        mediaUrls: i.product!.mediaUrls,
        merchantId: i.product!.merchant.id,
        merchantName: i.product!.merchant.name,
        merchantSlug: i.product!.merchant.slug,
        categoryId: i.product!.category.id,
        categoryName: i.product!.category.name,
        categorySlug: i.product!.category.slug,
        tags: i.product!.tags,
        affiliateUrl: i.product!.affiliateUrl,
        isFeatured: i.product!.isFeatured,
        stock: i.product!.stock,
        score: i.priority,
        feedModule: mod.title,
      })),
  }));

  const lastItem = finalItems[finalItems.length - 1];
  const nextCursor = finalItems.length === limit && lastItem ? lastItem.id : null;

  return { items: finalItems, nextCursor, modules: moduleResults };
}
