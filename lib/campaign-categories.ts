export type CampaignCategory = {
  id: string;
  keywords: string[];
};

export const campaignCategories: CampaignCategory[] = [
  {
    id: 'cafe',
    keywords: ['coffee', 'cafe', 'bakery', 'brunch', 'espresso'],
  },
  {
    id: 'beauty',
    keywords: ['salon', 'spa', 'beauty', 'wellness', 'massage', 'skincare'],
  },
  {
    id: 'fitness',
    keywords: ['gym', 'fitness', 'yoga', 'pilates', 'sport', 'training'],
  },
  {
    id: 'events',
    keywords: ['event', 'concert', 'festival', 'ticket', 'show'],
  },
  {
    id: 'workshops',
    keywords: ['workshop', 'class', 'course', 'training', 'masterclass'],
  },
  {
    id: 'family',
    keywords: ['kids', 'family', 'children', 'play', 'birthday'],
  },
  {
    id: 'travel',
    keywords: ['hotel', 'stay', 'travel', 'trip', 'tour', 'resort'],
  },
  {
    id: 'outdoor',
    keywords: ['outdoor', 'hike', 'trail', 'camp', 'adventure'],
  },
];

export const fallbackCampaignCategory: CampaignCategory = {
  id: 'other',
  keywords: [],
};

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
