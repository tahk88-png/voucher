import { prisma } from './prisma';
import { POINTS, calculateLevel, BADGES, type BadgeDefinition } from './gamification-constants';

// Pure constants/level math live in gamification-constants.ts (client-safe).
// Re-exported here so existing server-side importers keep working.
export {
  POINTS,
  calculateLevel,
  getLevelProgress,
  BADGES,
  type BadgeDefinition,
} from './gamification-constants';

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
    prisma.redemption.count({ where: { redeemedByUserId: userId } }),
    prisma.referral.count({ where: { referrerUserId: userId } }),
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
