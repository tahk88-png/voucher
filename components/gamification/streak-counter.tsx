'use client';

import { Flame } from 'lucide-react';

interface StreakCounterProps {
  currentDays: number;
  level: number;
  levelProgress: {
    currentPoints: number;
    nextLevelPoints: number;
    progress: number;
  };
}

export function StreakCounter({ currentDays, level, levelProgress }: StreakCounterProps) {
  const isMilestone = currentDays === 7 || currentDays === 30 || currentDays === 100;

  return (
    <div
      className="rounded-xl p-5"
      style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isMilestone ? 'animate-bounce' : ''
          }`}
          style={{
            backgroundColor: currentDays > 0 ? 'var(--primary)' : 'var(--muted)',
          }}
        >
          <Flame
            size={24}
            style={{
              color: currentDays > 0 ? 'var(--primary-foreground)' : 'var(--text-secondary)',
            }}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
              {currentDays}
            </span>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              day streak
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--primary)',
                color: 'var(--primary-foreground)',
              }}
            >
              Level {level}
            </span>
            <div className="flex-1 h-1.5 rounded-full" style={{ backgroundColor: 'var(--muted)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  backgroundColor: 'var(--primary)',
                  width: `${levelProgress.progress}%`,
                }}
              />
            </div>
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {levelProgress.currentPoints}/{levelProgress.nextLevelPoints}
            </span>
          </div>
        </div>
      </div>

      {isMilestone && (
        <div
          className="mt-3 text-sm text-center font-medium rounded-lg py-2"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          {currentDays}-day streak milestone reached!
        </div>
      )}
    </div>
  );
}
