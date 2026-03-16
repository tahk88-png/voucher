'use client';

import {
  Trophy,
  Flame,
  Heart,
  Star,
  Zap,
  Users,
  ShoppingBag,
  Ticket,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import { BADGES, type BadgeDefinition } from '@/lib/gamification';

const ICON_MAP: Record<string, LucideIcon> = {
  Trophy,
  Flame,
  Heart,
  Star,
  Zap,
  Users,
  ShoppingBag,
  Ticket,
};

interface EarnedBadge {
  badgeType: string;
  tier?: string | null;
  earnedAt: string | Date;
}

interface BadgeDisplayProps {
  badges: EarnedBadge[];
  showAll?: boolean;
}

export function BadgeDisplay({ badges, showAll = false }: BadgeDisplayProps) {
  const earnedSet = new Set(badges.map((b) => b.badgeType));
  const displayBadges = showAll ? BADGES : BADGES.filter((b) => earnedSet.has(b.type));

  if (displayBadges.length === 0 && !showAll) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        No badges earned yet.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {displayBadges.map((badge) => {
        const earned = earnedSet.has(badge.type);
        const earnedData = badges.find((b) => b.badgeType === badge.type);
        return (
          <BadgeIcon
            key={badge.type}
            badge={badge}
            earned={earned}
            earnedAt={earnedData?.earnedAt}
          />
        );
      })}
    </div>
  );
}

function BadgeIcon({
  badge,
  earned,
  earnedAt,
}: {
  badge: BadgeDefinition;
  earned: boolean;
  earnedAt?: string | Date;
}) {
  const Icon = earned ? (ICON_MAP[badge.icon] || Star) : Lock;

  return (
    <div className="group relative" title={`${badge.name}: ${badge.description}`}>
      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center transition-transform ${
          earned ? 'hover:scale-110' : ''
        }`}
        style={{
          backgroundColor: earned ? 'var(--primary)' : 'var(--muted)',
          opacity: earned ? 1 : 0.4,
        }}
      >
        <Icon
          size={24}
          style={{
            color: earned ? 'var(--primary-foreground)' : 'var(--text-secondary)',
          }}
        />
      </div>

      {/* Tooltip */}
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
        style={{
          backgroundColor: 'var(--text)',
          color: 'var(--background)',
        }}
      >
        <p className="font-medium">{badge.name}</p>
        <p className="mt-0.5 opacity-80">{badge.description}</p>
        {earned && earnedAt && (
          <p className="mt-0.5 opacity-60">
            Earned{' '}
            {new Date(earnedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
      </div>
    </div>
  );
}
