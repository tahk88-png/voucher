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
    // Merchants in Estonia write their offers in Estonian.
    expect(getCampaignCategoryId({ name: 'Hommikukohv ja croissant' })).toBe('cafe');
    expect(getCampaignCategoryId({ name: 'Lõõgastav massaaž 60 min' })).toBe('beauty');
    expect(getCampaignCategoryId({ name: 'Kuukaart jõusaali' })).toBe('fitness');
    expect(getCampaignCategoryId({ name: 'Keraamika töötuba' })).toBe('workshops');
    expect(getCampaignCategoryId({ name: 'Kanuumatk Soomaal' })).toBe('outdoor');
    expect(getCampaignCategoryId({ name: 'Rabamatk giidiga' })).toBe('outdoor');
    // English keywords only match at a word start.
    expect(getCampaignCategoryId({ name: 'Rabamatk', description: 'NÄIDIS: see on näidispakkumine' })).toBe('outdoor');
    expect(getCampaignCategoryId({ name: 'Airport transport' })).toBe('other');
    expect(getCampaignCategoryId({ name: 'Day spa ritual' })).toBe('beauty');
    expect(isCampaignCategoryId('outdoor')).toBe(true);
    expect(isCampaignCategoryId('fashion')).toBe(false);
  });
});
