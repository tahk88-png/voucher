export type CampaignCategory = {
  id: string;
  /** Display label — the single source for every category label in the UI. */
  label: string;
  keywords: string[];
};

export const campaignCategories: CampaignCategory[] = [
  {
    id: 'cafe',
    label: 'Cafe & bakery',
    keywords: ['coffee', 'cafe', 'bakery', 'brunch', 'espresso'],
  },
  {
    id: 'beauty',
    label: 'Beauty & wellness',
    keywords: ['salon', 'spa', 'beauty', 'wellness', 'massage', 'skincare'],
  },
  {
    id: 'fitness',
    label: 'Fitness & sport',
    keywords: ['gym', 'fitness', 'yoga', 'pilates', 'sport', 'training'],
  },
  {
    id: 'events',
    label: 'Events & tickets',
    keywords: ['event', 'concert', 'festival', 'ticket', 'show'],
  },
  {
    id: 'workshops',
    label: 'Workshops & classes',
    keywords: ['workshop', 'class', 'course', 'training', 'masterclass'],
  },
  {
    id: 'family',
    label: 'Family & kids',
    keywords: ['kids', 'family', 'children', 'play', 'birthday'],
  },
  {
    id: 'travel',
    label: 'Travel & stays',
    keywords: ['hotel', 'stay', 'travel', 'trip', 'tour', 'resort'],
  },
  {
    id: 'outdoor',
    label: 'Outdoor & adventure',
    keywords: ['outdoor', 'hike', 'trail', 'camp', 'adventure'],
  },
];

export const fallbackCampaignCategory: CampaignCategory = {
  id: 'other',
  label: 'Other',
  keywords: [],
};

/** Every category a campaign can be filed under, including the fallback. */
export const allCampaignCategories: CampaignCategory[] = [...campaignCategories, fallbackCampaignCategory];

export function isCampaignCategoryId(id: string | null | undefined): boolean {
  return !!id && allCampaignCategories.some((category) => category.id === id);
}

export function getCampaignCategoryLabel(id: string): string {
  return allCampaignCategories.find((category) => category.id === id)?.label ?? fallbackCampaignCategory.label;
}

export function getCampaignCategoryId(input: {
  name: string;
  description?: string | null;
}) {
  const text = `${input.name} ${input.description || ''}`.toLowerCase();
  for (const category of campaignCategories) {
    if (category.keywords.some((keyword) => text.includes(keyword))) {
      return category.id;
    }
  }
  return fallbackCampaignCategory.id;
}
