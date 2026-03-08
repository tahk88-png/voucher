/**
 * Seasonality engine — boosts occasion/module scores based on current date.
 */

const SEASON_WINDOWS: Record<string, { months: number[]; peakMonth: number; baseWeight: number }> = {
  christmas: { months: [11, 12], peakMonth: 12, baseWeight: 2.5 },
  valentines: { months: [1, 2], peakMonth: 2, baseWeight: 2.0 },
  mothers_day: { months: [4, 5], peakMonth: 5, baseWeight: 1.8 },
  fathers_day: { months: [5, 6], peakMonth: 6, baseWeight: 1.6 },
  graduation: { months: [5, 6], peakMonth: 6, baseWeight: 1.5 },
  back_to_school: { months: [8, 9], peakMonth: 9, baseWeight: 1.3 },
  black_friday: { months: [11], peakMonth: 11, baseWeight: 2.0 },
  easter: { months: [3, 4], peakMonth: 4, baseWeight: 1.2 },
};

export function getCurrentSeasonBoosts(): Record<string, number> {
  const month = new Date().getMonth() + 1; // 1-12
  const boosts: Record<string, number> = {};

  for (const [season, config] of Object.entries(SEASON_WINDOWS)) {
    if (config.months.includes(month)) {
      const isPeak = month === config.peakMonth;
      boosts[season] = isPeak ? config.baseWeight : config.baseWeight * 0.6;
    }
  }

  return boosts;
}

export function getOccasionSeasonalityScore(
  occasionSlug: string,
  occasionBaseWeight: number,
  activeMonths: number[]
): number {
  const month = new Date().getMonth() + 1;

  // If occasion has specific months, check if we're in window
  if (activeMonths.length > 0) {
    if (!activeMonths.includes(month)) return 0.1; // out of season
    return occasionBaseWeight * 1.5; // in season
  }

  // Year-round occasions (birthday, corporate) get flat base weight
  return occasionBaseWeight;
}

export function isLastMinuteWindow(): boolean {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Christmas last-minute: Dec 20-24
  if (month === 12 && day >= 20 && day <= 24) return true;
  // Valentine's last-minute: Feb 12-14
  if (month === 2 && day >= 12 && day <= 14) return true;

  return false;
}

export function getDaysUntilNextOccasion(occasionSlug: string): number | null {
  const now = new Date();
  const year = now.getFullYear();

  const fixedDates: Record<string, { month: number; day: number }> = {
    christmas: { month: 12, day: 25 },
    valentines: { month: 2, day: 14 },
    new_year: { month: 1, day: 1 },
  };

  const fixedDate = fixedDates[occasionSlug];
  if (!fixedDate) return null;

  let target = new Date(year, fixedDate.month - 1, fixedDate.day);
  if (target < now) {
    target = new Date(year + 1, fixedDate.month - 1, fixedDate.day);
  }

  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
