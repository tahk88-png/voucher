import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { withIntl } from '@/test-utils/intl';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

import { AIGiftWizard } from '../ai-gift-wizard';
import { GiftFeedSection } from '../gift-feed-section';

const item = {
  id: 'p1',
  title: 'Spa day',
  description: 'Relax',
  priceCents: 5000,
  currency: 'EUR',
  merchantName: 'Spa',
  categoryName: 'Wellness',
  mediaUrl: null,
  merchantSlug: 'spa',
  categorySlug: 'wellness',
  tags: [] as string[],
  affiliateUrl: null,
  isFeatured: true,
};

describe('gifts components i18n', () => {
  it('renders the AI gift finder in English and Estonian', () => {
    const en = renderToStaticMarkup(withIntl(<AIGiftWizard />));
    expect(en).toContain('AI Gift Finder');
    expect(en).toContain('Who is the gift for?');
    expect(en).toContain('Partner');

    const et = renderToStaticMarkup(withIntl(<AIGiftWizard />, 'et'));
    expect(et).toContain('Kellele kingitus on mõeldud?');
    expect(et).toContain('Elukaaslane');
  });

  it('renders a feed section with gift cards in English and Estonian', () => {
    const el = (
      <GiftFeedSection title="Popular" items={[item]} viewAllHref="/gifts?x=1" />
    );
    const en = renderToStaticMarkup(withIntl(el));
    expect(en).toContain('View all');
    expect(en).toContain('Featured');

    const et = renderToStaticMarkup(withIntl(el, 'et'));
    expect(et).toContain('Vaata kõiki');
    expect(et).toContain('Esiletõstetud');
  });
});
