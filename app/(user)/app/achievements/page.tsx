import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { BADGES, getLevelProgress, POINTS } from '@/lib/gamification';
import { AchievementsClient } from './achievements-client';

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const [badges, streak] = await Promise.all([
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      orderBy: { earnedAt: 'desc' },
    }),
    prisma.userStreak.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const totalPoints = streak?.totalPoints ?? 0;
  const levelProgress = getLevelProgress(totalPoints);

  return (
    <AchievementsClient
      badges={badges.map((b) => ({
        badgeType: b.badgeType,
        tier: b.tier,
        earnedAt: b.earnedAt.toISOString(),
      }))}
      streak={{
        currentDays: streak?.currentDays ?? 0,
        longestDays: streak?.longestDays ?? 0,
      }}
      totalPoints={totalPoints}
      level={levelProgress.level}
      levelProgress={{
        currentPoints: levelProgress.currentPoints,
        nextLevelPoints: levelProgress.nextLevelPoints,
        progress: levelProgress.progress,
      }}
      allBadges={BADGES}
      pointsConfig={POINTS}
    />
  );
}
