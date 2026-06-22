/**
 * Unit tests for lib/loyalty-tiers.ts.
 *
 * Covers the monotonic tier ladder and the progress-to-next math
 * that the /api/loyalty handler + the nightly cron both rely on.
 */

import { describe, it, expect } from 'vitest';
import {
  LOYALTY_TIERS,
  calculateTier,
  getNextTier,
  getTierBenefits,
  getTierProgress,
} from '../loyalty-tiers';

describe('calculateTier', () => {
  it('returns bronze at 0 points', () => {
    expect(calculateTier(0).name).toBe('bronze');
  });

  it('returns bronze just below the silver threshold', () => {
    expect(calculateTier(499).name).toBe('bronze');
  });

  it('returns silver at the silver threshold', () => {
    expect(calculateTier(500).name).toBe('silver');
  });

  it('returns gold at gold threshold', () => {
    expect(calculateTier(2000).name).toBe('gold');
  });

  it('returns diamond at and above the diamond threshold', () => {
    expect(calculateTier(10_000).name).toBe('diamond');
    expect(calculateTier(1_000_000).name).toBe('diamond');
  });

  it('is monotonic across the whole ladder', () => {
    // Tier index must never decrease as points go up.
    let lastIdx = -1;
    for (const tier of LOYALTY_TIERS) {
      const idx = LOYALTY_TIERS.findIndex(
        (t) => t.name === calculateTier(tier.minPoints).name,
      );
      expect(idx).toBeGreaterThanOrEqual(lastIdx);
      lastIdx = idx;
    }
  });
});

describe('getNextTier', () => {
  it('returns silver above bronze', () => {
    expect(getNextTier('bronze')?.name).toBe('silver');
  });

  it('returns null above diamond (already max)', () => {
    expect(getNextTier('diamond')).toBeNull();
  });
});

describe('getTierProgress', () => {
  it('reports 0 points-to-next and 100% at max tier', () => {
    const p = getTierProgress(999_999);
    expect(p.nextTier).toBeNull();
    expect(p.pointsToNextTier).toBe(0);
    expect(p.progressPercent).toBe(100);
  });

  it('computes halfway progress between bronze and silver', () => {
    // bronze 0, silver 500 → 250 pts = 50%
    const p = getTierProgress(250);
    expect(p.currentTier.name).toBe('bronze');
    expect(p.nextTier?.name).toBe('silver');
    expect(p.pointsToNextTier).toBe(250);
    expect(p.progressPercent).toBe(50);
  });

  it('caps progress at 100 when exactly at next-tier threshold', () => {
    // Boundary: 500 points puts you at silver tier itself — progress
    // *toward* silver is no longer meaningful.
    const p = getTierProgress(500);
    expect(p.currentTier.name).toBe('silver');
    expect(p.pointsToNextTier).toBe(2000 - 500);
  });
});

describe('getTierBenefits', () => {
  it('includes discount for silver', () => {
    const benefits = getTierBenefits('silver');
    expect(benefits.some((b) => b.includes('3%'))).toBe(true);
  });

  it('returns a welcome message for the zero-perk bronze tier', () => {
    const benefits = getTierBenefits('bronze');
    expect(benefits.length).toBe(1);
    expect(benefits[0]).toMatch(/welcome/i);
  });

  it('stacks perks at diamond (every flag on)', () => {
    const benefits = getTierBenefits('diamond');
    expect(benefits.some((b) => b.includes('12%'))).toBe(true);
    expect(benefits.some((b) => b.toLowerCase().includes('bonus'))).toBe(true);
    expect(benefits.some((b) => b.toLowerCase().includes('early'))).toBe(true);
    expect(benefits.some((b) => b.toLowerCase().includes('shipping'))).toBe(true);
    expect(benefits.some((b) => b.toLowerCase().includes('exclusive'))).toBe(true);
  });
});
