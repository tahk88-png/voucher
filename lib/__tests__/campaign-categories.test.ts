import { describe, it, expect } from 'vitest';
import {
  allCampaignCategories,
  getCampaignCategoryId,
  getCampaignCategoryLabel,
  isCampaignCategoryId,
} from '@/lib/campaign-categories';

describe('campaign categories', () => {
  it('gives every category, including the fallback, a single display label', () => {
    const ids = allCampaignCategories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const category of allCampaignCategories) {
      expect(category.label.length).toBeGreaterThan(0);
      expect(getCampaignCategoryLabel(category.id)).toBe(category.label);
    }
    expect(getCampaignCategoryLabel('unknown')).toBe('Other');
  });

  it('derives the category from name/description keywords', () => {
    expect(getCampaignCategoryId({ name: 'Two espresso for one' })).toBe('cafe');
    expect(getCampaignCategoryId({ name: 'Mystery box' })).toBe('other');
    expect(isCampaignCategoryId('outdoor')).toBe(true);
    expect(isCampaignCategoryId('fashion')).toBe(false);
  });
});
