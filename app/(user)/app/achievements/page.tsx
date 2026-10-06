import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getLevelProgress, POINTS } from '@/lib/gamification';
import { AchievementsClient } from './achievements-client';

/** Same day boundary as updateStreak() in lib/gamification.ts (server-local midnight). */
function isSameServerDay(a: Date, b: Date): boolean {
  const da = new Date(a);
  const db = new Date(b);
  da.setHours(0, 0, 0, 0);
  db.setHours(0, 0, 0, 0);
  return da.getTime() === db.getTime();
}

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
      checkedInToday={Boolean(streak?.lastActiveDate && isSameServerDay(streak.lastActiveDate, new Date()))}
      totalPoints={totalPoints}
      // The only points actually awarded today are for the daily check-in
      // (awardPoints() for purchases/reviews/referrals is not called anywhere).
      checkInPoints={POINTS.daily_login}
    />
  );
}
