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

const offer = {
  id: 'cmp_2',
  name: 'Yoga class pass',
  merchantName: 'Studio',
  merchantLogoUrl: null,
  categoryLabel: 'Fitness & sport',
  marketLabel: 'EE / EUR',
  priceLabel: '€19.00',
  purchases: 0,
  discountLabel: '20% OFF',
  onSale: true,
};

describe('MarketingLanding honesty', () => {
  it('does not call listed campaigns "live" and flags ones that are not on sale', () => {
    const html = renderToStaticMarkup(
      <MarketingLanding
        featuredOffers={[offer, { ...offer, id: 'cmp_3', onSale: false }]}
        stats={{ merchantCount: 1, activeCampaignCount: 2, processedCents: 0 }}
      />
    );
    expect(html).not.toMatch(/live offers/i);
    expect(html).toContain('Showing 2 active campaigns');
    expect(html).toContain('1 on sale now');
    expect(html).toContain('Not on sale yet');
  });

  it('hides the discount badge on free offers', () => {
    const html = renderToStaticMarkup(
      <MarketingLanding featuredOffers={[{ ...offer, priceLabel: 'FREE', discountLabel: '50% OFF' }]} stats={null} />
    );
    expect(html).toContain('FREE');
    expect(html).not.toContain('50% OFF');
  });

  it('hides zero-valued stats instead of advertising them', () => {
    const html = renderToStaticMarkup(
      <MarketingLanding featuredOffers={[]} stats={{ merchantCount: 3, activeCampaignCount: 0, processedCents: 0 }} />
    );
    expect(html).not.toContain('Processed value');
    expect(html).not.toContain('Active campaigns');
    expect(html).toContain('Merchants');
  });

  it('makes no unverifiable claims and states the real language count', () => {
    const html = renderToStaticMarkup(<MarketingLanding featuredOffers={[]} stats={null} />);
    expect(html).not.toContain('99.9%');
    expect(html).not.toMatch(/GDPR compliant/i);
    expect(html).not.toMatch(/EU-hosted/i);
    expect(html).not.toContain('15 languages');
    expect(html).toContain('25 languages');
    // Prices come from the plan catalogue and use the currency formatter.
    expect(html).not.toMatch(/EUR \d/);
    expect(html).toContain('€19');
  });

  it('sends sign-up CTAs to registration, not the sign-in page', () => {
    const html = renderToStaticMarkup(<MarketingLanding featuredOffers={[]} stats={null} />);
    expect(html).toContain('href="/register"');
    expect(html).not.toContain('href="/login"');
  });

  it('links every category tile to the matching /campaigns filter', () => {
    const html = renderToStaticMarkup(<MarketingLanding featuredOffers={[]} stats={null} />);
    for (const id of ['cafe', 'beauty', 'fitness', 'events', 'workshops', 'family', 'travel', 'outdoor']) {
      expect(html).toContain(`href="/campaigns?category=${id}"`);
    }
    expect(html).toContain('Cafe &amp; bakery');
  });
});
