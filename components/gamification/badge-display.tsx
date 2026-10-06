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
import { useLocale, useTranslations } from 'next-intl';
import { orderBadgesForDisplay } from '@/app/(user)/app/_components/badges';

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
  /** Also list the badges not earned yet (as locked). */
  showAll?: boolean;
}

/**
 * Badge grid with visible, translated names. Earned badges come first; locked
 * ones keep their own icon (dimmed, with a lock) so they are distinguishable.
 */
export function BadgeDisplay({ badges, showAll = false }: BadgeDisplayProps) {
  const t = useTranslations('achievements');
  const locale = useLocale();
  const earnedAtByType = new Map(badges.map((b) => [b.badgeType, b.earnedAt]));
  const ordered = orderBadgesForDisplay(earnedAtByType.keys());
  const displayBadges = showAll ? ordered : ordered.filter((b) => b.earned);

  if (displayBadges.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {t('noBadgesYet')}
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {displayBadges.map((badge) => {
        const Icon = ICON_MAP[badge.icon] || Star;
        const name = t(`badges.${badge.type}.name` as never);
        const description = t(`badges.${badge.type}.description` as never);
        const earnedAt = earnedAtByType.get(badge.type);
        return (
          <li
            key={badge.type}
            className="flex flex-col items-center text-center gap-2 rounded-xl p-3"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              opacity: badge.earned ? 1 : 0.7,
            }}
          >
            <div
              className="relative w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: badge.earned ? 'var(--primary)' : 'var(--muted)' }}
            >
              <Icon
                size={22}
                aria-hidden="true"
                style={{ color: badge.earned ? 'var(--primary-foreground)' : 'var(--text-secondary)' }}
              />
              {!badge.earned && (
                <span
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <Lock size={11} aria-hidden="true" style={{ color: 'var(--text-secondary)' }} />
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text)' }}>
                {name}
              </p>
              <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                {description}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-secondary)' }}>
                {badge.earned && earnedAt
                  ? t('earnedOn', {
                      date: new Date(earnedAt).toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }),
                    })
                  : t('locked')}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
