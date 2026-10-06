import { BADGES, type BadgeDefinition } from '@/lib/gamification-constants';

/**
 * Badges a user can actually earn today. `social_sharer` is defined in the
 * catalog but nothing awards it (lib/gamification.ts hard-codes it to false),
 * so it is not shown as a goal.
 */
const UNAWARDED_BADGES = new Set(['social_sharer']);

export const ATTAINABLE_BADGES: BadgeDefinition[] = BADGES.filter((b) => !UNAWARDED_BADGES.has(b.type));

/** Earned badges first (catalog order), then the locked ones (catalog order). */
export function orderBadgesForDisplay(earnedTypes: Iterable<string>): Array<BadgeDefinition & { earned: boolean }> {
  const earned = new Set(earnedTypes);
  const withState = ATTAINABLE_BADGES.map((b) => ({ ...b, earned: earned.has(b.type) }));
  return [...withState.filter((b) => b.earned), ...withState.filter((b) => !b.earned)];
}
