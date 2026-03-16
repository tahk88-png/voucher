import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';
import { BADGES, getLevelProgress } from '@/lib/gamification';

export async function GET() {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    return NextResponse.json({
      badges,
      streak: {
        currentDays: streak?.currentDays ?? 0,
        longestDays: streak?.longestDays ?? 0,
        lastActiveDate: streak?.lastActiveDate,
      },
      level: levelProgress.level,
      totalPoints,
      levelProgress,
      allBadges: BADGES,
    });
  });
}
