/**
 * Unit tests for the pure helpers in lib/gamification.ts.
 *
 * calculateLevel / getLevelProgress are used everywhere (achievements
 * page, streak cron, awardPoints). The badge/streak DB code is
 * exercised by integration tests; here we pin the math.
 */

import { describe, it, expect } from 'vitest';
import { calculateLevel, getLevelProgress, POINTS, BADGES } from '../gamification';

describe('calculateLevel', () => {
  it('returns level 1 at 0 points', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it('returns level 1 just below level-2 threshold (100 pts)', () => {
    expect(calculateLevel(99)).toBe(1);
  });

  it('returns level 2 at the level-2 threshold', () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it('steps up at each explicit threshold', () => {
    expect(calculateLevel(300)).toBe(3);
    expect(calculateLevel(600)).toBe(4);
    expect(calculateLevel(1000)).toBe(5);
  });

  it('saturates at level 50 past the last threshold', () => {
    expect(calculateLevel(990_000)).toBe(50);
    expect(calculateLevel(10_000_000)).toBe(50);
  });

  it('is monotonically non-decreasing', () => {
    let last = 0;
    for (let pts = 0; pts <= 10_000; pts += 137) {
      const lvl = calculateLevel(pts);
      expect(lvl).toBeGreaterThanOrEqual(last);
      last = lvl;
    }
  });
});

describe('getLevelProgress', () => {
  it('reports progress=0 at the exact threshold of the current level', () => {
    // 100 pts = exactly level 2's threshold → 0% toward level 3
    const p = getLevelProgress(100);
    expect(p.level).toBe(2);
    expect(p.currentPoints).toBe(0);
    expect(p.progress).toBe(0);
  });

  it('computes fractional progress between thresholds', () => {
    // Level 2 threshold = 100, level 3 = 300. At 200, we're halfway.
    const p = getLevelProgress(200);
    expect(p.level).toBe(2);
    expect(p.currentPoints).toBe(100);
    expect(p.nextLevelPoints).toBe(200);
    expect(p.progress).toBeCloseTo(50, 0);
  });

  it('caps progress at 100 past the max threshold', () => {
    const p = getLevelProgress(10_000_000);
    expect(p.progress).toBe(100);
  });
});

describe('POINTS constants', () => {
  it('keeps every action on a sane positive integer', () => {
    for (const [key, value] of Object.entries(POINTS)) {
      expect(Number.isInteger(value), `${key} must be integer`).toBe(true);
      expect(value, `${key} must be positive`).toBeGreaterThan(0);
    }
  });
});

describe('BADGES catalog', () => {
  it('has unique badge types', () => {
    const types = BADGES.map((b) => b.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it('every badge has a non-empty name/description/icon', () => {
    for (const b of BADGES) {
      expect(b.name.length).toBeGreaterThan(0);
      expect(b.description.length).toBeGreaterThan(0);
      expect(b.icon.length).toBeGreaterThan(0);
    }
  });
});
