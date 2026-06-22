/**
 * Pure gamification constants & level math (client-safe).
 *
 * Split out of lib/gamification.ts so client components (e.g.
 * components/gamification/badge-display.tsx) can import the badge
 * catalog and level helpers without dragging prisma (→ fs) into the
 * browser bundle. The prisma-backed award/streak functions stay in
 * lib/gamification.ts.
 */

// ── Points System ──
export const POINTS = {
  redemption: 10,
  review: 15,
  referral: 25,
  purchase: 20,
  daily_login: 5,
} as const;

// ── Level Thresholds ──
// Level N requires LEVEL_THRESHOLDS[N-1] total points
const LEVEL_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2500, 4000, 6000, 10000,
  15000, 21000, 28000, 36000, 45000, 55000, 66000, 78000, 91000, 105000,
  120000, 136000, 153000, 171000, 190000, 210000, 231000, 253000, 276000, 300000,
  325000, 351000, 378000, 406000, 435000, 465000, 496000, 528000, 561000, 595000,
  630000, 666000, 703000, 741000, 780000, 820000, 861000, 903000, 946000, 990000,
];

export function calculateLevel(totalPoints: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getLevelProgress(totalPoints: number): {
  level: number;
  currentPoints: number;
  nextLevelPoints: number;
  progress: number;
} {
  const level = calculateLevel(totalPoints);
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] || currentThreshold + 100000;
  const progress = Math.min(
    ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100,
    100
  );

  return {
    level,
    currentPoints: totalPoints - currentThreshold,
    nextLevelPoints: nextThreshold - currentThreshold,
    progress,
  };
}

// ── Badge Definitions ──
export interface BadgeDefinition {
  type: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  condition: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    type: 'first_purchase',
    name: 'First Purchase',
    description: 'Made your first voucher purchase',
    icon: 'ShoppingBag',
    condition: 'purchases >= 1',
  },
  {
    type: 'first_redemption',
    name: 'First Redemption',
    description: 'Redeemed your first voucher',
    icon: 'Ticket',
    condition: 'redemptions >= 1',
  },
  {
    type: '5_referrals',
    name: 'Connector',
    description: 'Referred 5 friends',
    icon: 'Users',
    condition: 'referrals >= 5',
  },
  {
    type: '10_referrals',
    name: 'Influencer',
    description: 'Referred 10 friends',
    icon: 'Users',
    condition: 'referrals >= 10',
  },
  {
    type: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Maintained a 7-day streak',
    icon: 'Flame',
    condition: 'streak >= 7',
  },
  {
    type: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintained a 30-day streak',
    icon: 'Flame',
    condition: 'streak >= 30',
  },
  {
    type: 'review_writer',
    name: 'Review Writer',
    description: 'Wrote your first review',
    icon: 'Star',
    condition: 'reviews >= 1',
  },
  {
    type: 'big_spender',
    name: 'Big Spender',
    description: 'Spent over 10,000 in total purchases',
    icon: 'Zap',
    condition: 'totalSpent >= 1000000',
  },
  {
    type: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined within the first year',
    icon: 'Trophy',
    condition: 'earlyAdopter',
  },
  {
    type: 'social_sharer',
    name: 'Social Sharer',
    description: 'Shared a voucher on social media',
    icon: 'Heart',
    condition: 'shares >= 1',
  },
];
