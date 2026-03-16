import { prisma } from './prisma';

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

// ── Check and Award Badges ──
export async function checkAndAwardBadges(userId: string): Promise<BadgeDefinition[]> {
  // Gather user stats
  const [
    purchaseCount,
    redemptionCount,
    referralCount,
    reviewCount,
    streak,
    user,
    totalSpent,
  ] = await Promise.all([
    prisma.voucherPurchase.count({ where: { userId, status: 'paid' } }),
    prisma.redemption.count({ where: { userId } }),
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.review.count({ where: { userId, status: 'published' } }),
    prisma.userStreak.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.voucherPurchase.aggregate({
      where: { userId, status: 'paid' },
      _sum: { amount: true },
    }),
  ]);

  const currentStreak = streak?.longestDays ?? 0;
  const spent = totalSpent._sum.amount ?? 0;
  const earlyAdopterCutoff = new Date('2028-01-01');
  const isEarlyAdopter = user ? user.createdAt < earlyAdopterCutoff : false;

  // Evaluate each badge
  const stats: Record<string, boolean> = {
    first_purchase: purchaseCount >= 1,
    first_redemption: redemptionCount >= 1,
    '5_referrals': referralCount >= 5,
    '10_referrals': referralCount >= 10,
    streak_7: currentStreak >= 7,
    streak_30: currentStreak >= 30,
    review_writer: reviewCount >= 1,
    big_spender: spent >= 1000000, // 10,000 in minor units
    early_adopter: isEarlyAdopter,
    social_sharer: false, // Tracked elsewhere; awarded via explicit call
  };

  // Get already earned badges
  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeType: true },
  });
  const earnedSet = new Set(earnedBadges.map((b) => b.badgeType));

  // Award new badges
  const newlyEarned: BadgeDefinition[] = [];

  for (const badge of BADGES) {
    if (earnedSet.has(badge.type)) continue;
    if (!stats[badge.type]) continue;

    await prisma.userBadge.create({
      data: {
        userId,
        badgeType: badge.type,
        tier: 'gold',
      },
    });

    newlyEarned.push(badge);
  }

  return newlyEarned;
}

// ── Update Streak ──
export async function updateStreak(userId: string): Promise<{
  currentDays: number;
  longestDays: number;
  totalPoints: number;
  level: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.userStreak.findUnique({ where: { userId } });

  if (!streak) {
    const created = await prisma.userStreak.create({
      data: {
        userId,
        currentDays: 1,
        longestDays: 1,
        lastActiveDate: today,
        totalPoints: POINTS.daily_login,
        level: 1,
      },
    });
    return created;
  }

  const lastActive = streak.lastActiveDate
    ? new Date(streak.lastActiveDate)
    : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  // Already checked in today
  if (lastActive && lastActive.getTime() === today.getTime()) {
    return streak;
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isConsecutive = lastActive && lastActive.getTime() === yesterday.getTime();
  const newCurrentDays = isConsecutive ? streak.currentDays + 1 : 1;
  const newLongestDays = Math.max(streak.longestDays, newCurrentDays);
  const newTotalPoints = streak.totalPoints + POINTS.daily_login;
  const newLevel = calculateLevel(newTotalPoints);

  const updated = await prisma.userStreak.update({
    where: { userId },
    data: {
      currentDays: newCurrentDays,
      longestDays: newLongestDays,
      lastActiveDate: today,
      totalPoints: newTotalPoints,
      level: newLevel,
    },
  });

  return updated;
}

// ── Award Points ──
export async function awardPoints(
  userId: string,
  action: keyof typeof POINTS
): Promise<{ totalPoints: number; level: number }> {
  const points = POINTS[action];

  const streak = await prisma.userStreak.upsert({
    where: { userId },
    create: {
      userId,
      currentDays: 0,
      longestDays: 0,
      totalPoints: points,
      level: 1,
    },
    update: {
      totalPoints: { increment: points },
    },
  });

  const newLevel = calculateLevel(streak.totalPoints);
  if (newLevel !== streak.level) {
    await prisma.userStreak.update({
      where: { userId },
      data: { level: newLevel },
    });
  }

  return { totalPoints: streak.totalPoints, level: newLevel };
}
