/**
 * Personalization engine — scores products based on user profile & interaction history.
 */

import type { GiftProduct, UserGiftProfile, UserGiftInteraction } from '@prisma/client';

interface PersonalizationInput {
  profile: UserGiftProfile | null;
  interactions: UserGiftInteraction[];
  product: GiftProduct & {
    occasions: { occasionId: string }[];
    personas: { personaId: string }[];
  };
}

interface PersonalizationScores {
  personaMatch: number;
  occasionMatch: number;
  budgetMatch: number;
  engagementScore: number;
}

export function computePersonalizationScores(input: PersonalizationInput): PersonalizationScores {
  const { profile, interactions, product } = input;

  // Cold start: no profile → return neutral scores
  if (!profile) {
    return {
      personaMatch: 0.5,
      occasionMatch: 0.5,
      budgetMatch: 0.5,
      engagementScore: product.engagementScore > 0 ? Math.min(product.engagementScore / 100, 1) : 0.3,
    };
  }

  // ── Persona match ──
  const productPersonaIds = new Set(product.personas.map((p) => p.personaId));
  const preferredPersonas = profile.preferredPersonas || [];
  let personaMatch = 0;
  if (preferredPersonas.length > 0 && productPersonaIds.size > 0) {
    const overlap = preferredPersonas.filter((p) => productPersonaIds.has(p)).length;
    personaMatch = overlap / Math.max(preferredPersonas.length, 1);
  } else {
    personaMatch = 0.3; // no data → neutral
  }

  // ── Occasion match ──
  const productOccasionIds = new Set(product.occasions.map((o) => o.occasionId));
  const preferredOccasions = profile.preferredOccasions || [];
  let occasionMatch = 0;
  if (preferredOccasions.length > 0 && productOccasionIds.size > 0) {
    const overlap = preferredOccasions.filter((o) => productOccasionIds.has(o)).length;
    occasionMatch = overlap / Math.max(preferredOccasions.length, 1);
  } else {
    occasionMatch = 0.3;
  }

  // ── Budget match ──
  const budgetMin = profile.budgetMin ?? 0;
  const budgetMax = profile.budgetMax ?? Infinity;
  let budgetMatch = 0;
  if (product.priceCents >= budgetMin && product.priceCents <= budgetMax) {
    budgetMatch = 1.0;
  } else {
    // Partial match — how far outside range
    const midBudget = (budgetMin + (budgetMax === Infinity ? budgetMin * 3 : budgetMax)) / 2;
    const distance = Math.abs(product.priceCents - midBudget);
    const range = Math.max(budgetMax === Infinity ? midBudget : budgetMax - budgetMin, 1);
    budgetMatch = Math.max(0, 1 - distance / range);
  }

  // ── Engagement score ──
  // Based on user's past interactions with this product or similar
  const productInteractions = interactions.filter((i) => i.productId === product.id);
  let engagementScore = product.engagementScore > 0 ? Math.min(product.engagementScore / 100, 1) : 0.2;

  if (productInteractions.length > 0) {
    // User has already interacted — boost or suppress based on type
    const hasPurchased = productInteractions.some((i) => i.interactionType === 'PURCHASE');
    const hasSaved = productInteractions.some((i) => i.interactionType === 'SAVE');
    if (hasPurchased) {
      engagementScore *= 0.3; // Already bought — lower priority
    } else if (hasSaved) {
      engagementScore *= 1.5; // Saved but not bought — boost
    }
  }

  return {
    personaMatch: Math.min(personaMatch, 1),
    occasionMatch: Math.min(occasionMatch, 1),
    budgetMatch: Math.min(budgetMatch, 1),
    engagementScore: Math.min(engagementScore, 1),
  };
}

/**
 * Compute diversity penalty — products from same category/merchant get penalized
 * if they appear close together in the feed.
 */
export function computeDiversityPenalty(
  product: { categoryId: string; merchantId: string },
  recentCategoryIds: string[],
  recentMerchantIds: string[]
): number {
  let penalty = 0;

  // Count recent appearances of same category
  const categoryCount = recentCategoryIds.filter((c) => c === product.categoryId).length;
  penalty += categoryCount * 0.15;

  // Count recent appearances of same merchant
  const merchantCount = recentMerchantIds.filter((m) => m === product.merchantId).length;
  penalty += merchantCount * 0.2;

  return Math.min(penalty, 0.6); // Cap penalty at 60%
}
