'use client';

import { useState } from 'react';
import { Trophy, Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StreakCounter } from '@/components/gamification/streak-counter';
import { BadgeDisplay } from '@/components/gamification/badge-display';
import { getLevelProgress } from '@/lib/gamification-constants';
import { showError, showSuccess } from '@/lib/toast-helpers';
import { ATTAINABLE_BADGES } from '../_components/badges';

interface EarnedBadge {
  badgeType: string;
  tier: string | null;
  earnedAt: string;
}

interface AchievementsClientProps {
  badges: EarnedBadge[];
  streak: { currentDays: number; longestDays: number };
  checkedInToday: boolean;
  totalPoints: number;
  checkInPoints: number;
}

interface CheckinResponse {
  streak: { currentDays: number; longestDays: number };
  totalPoints: number;
  level: number;
  newBadges: Array<{ type: string }>;
}

export function AchievementsClient({
  badges: initialBadges,
  streak,
  checkedInToday,
  totalPoints,
  checkInPoints,
}: AchievementsClientProps) {
  const t = useTranslations('achievements');
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(checkedInToday);
  const [currentStreak, setCurrentStreak] = useState(streak);
  const [points, setPoints] = useState(totalPoints);
  const [badges, setBadges] = useState(initialBadges);
  const [error, setError] = useState<string | null>(null);

  const levelProgress = getLevelProgress(points);

  async function handleCheckin() {
    setCheckingIn(true);
    setError(null);
    try {
      const res = await fetch('/api/gamification/checkin', { method: 'POST' });
      const data = (await res.json().catch(() => null)) as (CheckinResponse & { error?: string }) | null;
      if (!res.ok || !data) {
        throw new Error(data?.error || t('checkInFailed'));
      }
      setCurrentStreak(data.streak);
      setPoints(data.totalPoints);
      setCheckedIn(true);
      const now = new Date().toISOString();
      if (data.newBadges.length > 0) {
        setBadges((prev) => {
          const have = new Set(prev.map((b) => b.badgeType));
          const added = data.newBadges
            .filter((b) => !have.has(b.type))
            .map((b) => ({ badgeType: b.type, tier: 'gold', earnedAt: now }));
          return [...added, ...prev];
        });
        for (const badge of data.newBadges) {
          showSuccess(t('newBadge', { name: t(`badges.${badge.type}.name` as never) }));
        }
      } else {
        showSuccess(t('checkInSaved'));
      }
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t('checkInFailed');
      setError(message);
      showError(message);
    } finally {
      setCheckingIn(false);
    }
  }

  const earnedCount = badges.filter((b) => ATTAINABLE_BADGES.some((a) => a.type === b.badgeType)).length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Trophy size={28} style={{ color: 'var(--primary)' }} aria-hidden="true" />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          {t('title')}
        </h1>
      </div>

      {/* Streak + check-in */}
      <div className="space-y-3">
        <StreakCounter
          currentDays={currentStreak.currentDays}
          level={levelProgress.level}
          levelProgress={levelProgress}
        />
        <button
          type="button"
          onClick={handleCheckin}
          disabled={checkingIn || checkedIn}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity disabled:opacity-60"
          style={{
            backgroundColor: checkedIn ? 'var(--muted)' : 'var(--primary)',
            color: checkedIn ? 'var(--text-secondary)' : 'var(--primary-foreground)',
          }}
        >
          {checkedIn ? t('checkedInToday') : checkingIn ? t('checkingIn') : t('checkIn')}
        </button>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { value: points.toLocaleString(), label: t('checkInPoints') },
          { value: String(levelProgress.level), label: t('level') },
          { value: `${earnedCount}/${ATTAINABLE_BADGES.length}`, label: t('badgesLabel') },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-3 sm:p-4 text-center min-w-0"
            style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {stat.value}
            </p>
            <p className="text-xs mt-1 break-words" style={{ color: 'var(--text-secondary)' }}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          {t('badgesLabel')}
        </h2>
        <BadgeDisplay badges={badges} showAll />
      </div>

      {/* How points work: only what the backend actually awards. */}
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          {t('howToEarn')}
        </h2>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('earnRuleCheckIn')}
          </span>
          <span
            className="text-sm font-medium px-2 py-0.5 rounded shrink-0"
            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            {t('pointsShort', { points: checkInPoints })}
          </span>
        </div>
        <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
          {t('pointsExplainer')}
        </p>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <Flame size={18} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            {t('longestStreak')}
          </span>
        </div>
        <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
          {currentStreak.longestDays}
        </p>
      </div>
    </div>
  );
}
