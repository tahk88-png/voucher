export type CampaignCategory = {
  id: string;
  /** Display label — the single source for every category label in the UI. */
  label: string;
  /**
   * English words, matched at the start of a word ("spa" must not match
   * "näidispakkumine", "sport" must not match "transport").
   */
  keywords: string[];
  /** Estonian stems, matched anywhere: Estonian builds compounds ("hommikukohv", "rabamatk"). */
  stems: string[];
};

export const campaignCategories: CampaignCategory[] = [
  {
    id: 'cafe',
    label: 'Cafe & bakery',
    keywords: ['coffee', 'cafe', 'bakery', 'brunch', 'espresso', 'restaurant'],
    stems: ['kohv', 'pagari', 'kondiitri', 'restoran', 'lõuna', 'õhtusöök'],
  },
  {
    id: 'beauty',
    label: 'Beauty & wellness',
    keywords: ['salon', 'spa', 'beauty', 'wellness', 'massage', 'skincare'],
    stems: ['salong', 'massaaž', 'näohooldus', 'maniküür', 'juuksur'],
  },
  {
    id: 'fitness',
    label: 'Fitness & sport',
    keywords: ['gym', 'fitness', 'yoga', 'pilates', 'sport', 'training'],
    stems: ['jõusaal', 'jooga', 'treening', 'padel', 'tennis'],
  },
  {
    id: 'events',
    label: 'Events & tickets',
    keywords: ['event', 'concert', 'festival', 'ticket', 'show'],
    stems: ['kontser', 'etendus', 'teater', 'kino', 'üritus'],
  },
  {
    id: 'workshops',
    label: 'Workshops & classes',
    keywords: ['workshop', 'class', 'course', 'training', 'masterclass'],
    stems: ['töötuba', 'koolitus', 'kursus', 'meistriklass'],
  },
  {
    id: 'family',
    label: 'Family & kids',
    keywords: ['kids', 'family', 'children', 'play', 'birthday'],
    stems: ['laste', 'perepilet', 'perele', 'sünnipäev'],
  },
  {
    id: 'travel',
    label: 'Travel & stays',
    keywords: ['hotel', 'stay', 'travel', 'trip', 'tour', 'resort'],
    stems: ['hotell', 'majutus', 'puhkus', 'reis'],
  },
  {
    id: 'outdoor',
    label: 'Outdoor & adventure',
    keywords: ['outdoor', 'hike', 'trail', 'camp', 'adventure'],
    stems: ['matk', 'seiklus', 'kanuu', 'loodus'],
  },
];

export const fallbackCampaignCategory: CampaignCategory = {
  id: 'other',
  label: 'Other',
  keywords: [],
  stems: [],
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
    if (
      category.keywords.some((keyword) => startsWord(text, keyword)) ||
      category.stems.some((stem) => text.includes(stem))
    ) {
      return category.id;
    }
  }
  return fallbackCampaignCategory.id;
}

function startsWord(text: string, word: string): boolean {
  let index = text.indexOf(word);
  while (index !== -1) {
    if (index === 0 || !/\p{L}/u.test(text[index - 1])) return true;
    index = text.indexOf(word, index + 1);
  }
  return false;
}
