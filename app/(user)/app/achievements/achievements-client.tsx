'use client';

import { Trophy, Flame, Star, Zap, ShoppingBag, Ticket, Users, Heart, Lock } from 'lucide-react';
import { StreakCounter } from '@/components/gamification/streak-counter';
import { BadgeDisplay } from '@/components/gamification/badge-display';
import type { BadgeDefinition } from '@/lib/gamification-constants';
import { useState } from 'react';

interface AchievementsClientProps {
  badges: Array<{ badgeType: string; tier: string | null; earnedAt: string }>;
  streak: { currentDays: number; longestDays: number };
  totalPoints: number;
  level: number;
  levelProgress: { currentPoints: number; nextLevelPoints: number; progress: number };
  allBadges: BadgeDefinition[];
  pointsConfig: Record<string, number>;
}

export function AchievementsClient({
  badges,
  streak,
  totalPoints,
  level,
  levelProgress,
  allBadges,
  pointsConfig,
}: AchievementsClientProps) {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(streak.currentDays);
  const [currentLevel, setCurrentLevel] = useState(level);
  const [currentPoints, setCurrentPoints] = useState(totalPoints);
  const [currentLevelProgress, setCurrentLevelProgress] = useState(levelProgress);

  async function handleCheckin() {
    setCheckingIn(true);
    try {
      const res = await fetch('/api/gamification/checkin', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCurrentStreak(data.streak.currentDays);
        setCurrentLevel(data.level);
        setCurrentPoints(data.totalPoints);
        setCheckedIn(true);
      }
    } catch {
      // silent
    } finally {
      setCheckingIn(false);
    }
  }

  const earnedCount = badges.length;
  const totalCount = allBadges.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy size={28} style={{ color: 'var(--primary)' }} />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
          Achievements
        </h1>
      </div>

      {/* Streak + Check-in */}
      <div className="space-y-3">
        <StreakCounter
          currentDays={currentStreak}
          level={currentLevel}
          levelProgress={currentLevelProgress}
        />
        <button
          onClick={handleCheckin}
          disabled={checkingIn || checkedIn}
          className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-opacity disabled:opacity-50"
          style={{
            backgroundColor: checkedIn ? 'var(--muted)' : 'var(--primary)',
            color: checkedIn ? 'var(--text-secondary)' : 'var(--primary-foreground)',
          }}
        >
          {checkedIn ? 'Checked in today' : checkingIn ? 'Checking in...' : 'Daily Check-in'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {currentPoints.toLocaleString()}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Total Points
          </p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {currentLevel}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Level
          </p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
            {earnedCount}/{totalCount}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            Badges
          </p>
        </div>
      </div>

      {/* All Badges */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          Badges
        </h2>
        <BadgeDisplay badges={badges} showAll />
      </div>

      {/* Points Guide */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          How to Earn Points
        </h2>
        <div className="space-y-2">
          {Object.entries(pointsConfig).map(([action, pts]) => (
            <div key={action} className="flex items-center justify-between">
              <span className="text-sm capitalize" style={{ color: 'var(--text-secondary)' }}>
                {action.replace(/_/g, ' ')}
              </span>
              <span
                className="text-sm font-medium px-2 py-0.5 rounded"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                +{pts} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Longest Streak */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Flame size={18} style={{ color: 'var(--primary)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Longest Streak
          </span>
        </div>
        <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
          {streak.longestDays} days
        </p>
      </div>
    </div>
  );
}
