import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';

// Vitest compiles JSX with the classic runtime (tsconfig has jsx: preserve,
// which is Next's job), so the component's JSX needs React in scope.
vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

import MarketingLanding from '../marketing-landing';

// What a fresh deployment's landing page receives: a reachable, empty database.
const emptyStats = { merchantCount: 0, activeCampaignCount: 0, processedCents: 0 };

describe('MarketingLanding campaigns section', () => {
  it('shows an honest empty state instead of invented deals when nothing is live', () => {
    const html = renderToStaticMarkup(<MarketingLanding featuredOffers={[]} stats={emptyStats} />);

    expect(html).toContain('No live campaigns right now');
    expect(html).toContain('View All Campaigns');
    // The old fallback rendered sample deals with made-up counts, and a button
    // reading "View All 1343 Campaigns" next to stat tiles that said 0.
    expect(html).not.toMatch(/View All [\d,]+ Campaigns/);
    expect(html).not.toMatch(/\b\d[\d,]* campaigns\b/);
    expect(html).not.toMatch(/\b\d[\d,]* active</);
    expect(html).not.toContain('20% off Pizza');
    expect(html).not.toContain('Summer Sale 50%');
  });

  it('shows the same honest empty state when the database is unreachable', () => {
    const html = renderToStaticMarkup(<MarketingLanding featuredOffers={[]} stats={null} />);

    expect(html).toContain('No live campaigns right now');
    expect(html).not.toMatch(/\b\d[\d,]* campaigns\b/);
  });

  it('renders real offers and no empty state when campaigns are live', () => {
    const html = renderToStaticMarkup(
      <MarketingLanding
        featuredOffers={[
          {
            id: 'cmp_1',
            name: 'Two coffees for one',
            merchantName: 'Corner Cafe',
            merchantLogoUrl: null,
            categoryLabel: 'Cafe & Bakery',
            marketLabel: 'EE / EUR',
            priceLabel: 'FREE',
            purchases: 3,
            discountLabel: '50% OFF',
          },
        ]}
        stats={{ merchantCount: 1, activeCampaignCount: 1, processedCents: 0 }}
      />
    );

    expect(html).toContain('Two coffees for one');
    expect(html).toContain('href="/campaigns/cmp_1"');
    expect(html).toContain('View All Campaigns');
    expect(html).not.toContain('No live campaigns right now');
  });
});
