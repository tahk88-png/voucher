import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withErrorHandler } from '@/lib/error-handler';
import { updateStreak, checkAndAwardBadges } from '@/lib/gamification';

export async function POST() {
  return withErrorHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const streakResult = await updateStreak(session.user.id);
    const newBadges = await checkAndAwardBadges(session.user.id);

    return NextResponse.json({
      streak: {
        currentDays: streakResult.currentDays,
        longestDays: streakResult.longestDays,
      },
      totalPoints: streakResult.totalPoints,
      level: streakResult.level,
      newBadges: newBadges.map((b) => ({
        type: b.type,
        name: b.name,
        description: b.description,
        icon: b.icon,
      })),
    });
  });
}
