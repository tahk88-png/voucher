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
import { NextIntlClientProvider } from 'next-intl';
import { withIntl } from '@/test-utils/intl';
import en from '@/messages/en.json';
import et from '@/messages/et.json';
import { toCampaignCardData, type CampaignCardSource } from '@/lib/campaign-presentation';

function source(overrides: Partial<CampaignCardSource> & { vouchers?: number; purchases?: number } = {}) {
  const { vouchers = 1, purchases = 0, ...rest } = overrides;
  return {
    id: 'cmp_2',
    name: 'Yoga class pass',
    description: 'yoga for beginners',
    price: 1900,
    discountRules: { type: 'percentage', value: 2000 },
    merchant: { name: 'Studio', slug: 'studio', city: 'Tallinn', defaultCurrency: 'EUR', brandLogoUrl: null },
    _count: { purchases, vouchers },
    ...rest,
  };
}

// What a fresh deployment's landing page receives: a reachable, empty database.
const emptyStats = { merchantCount: 0, activeCampaignCount: 0, processedCents: 0 };

describe('MarketingLanding campaigns section', () => {
  it('shows an honest empty state instead of invented deals when nothing is live', () => {
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[]} stats={emptyStats} />));

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
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[]} stats={null} />));

    expect(html).toContain('No live campaigns right now');
    expect(html).not.toMatch(/\b\d[\d,]* campaigns\b/);
  });

  it('renders real offers and no empty state when campaigns are live', () => {
    const html = renderToStaticMarkup(withIntl(<MarketingLanding
        featuredOffers={[
          toCampaignCardData(
            source({ id: 'cmp_1', name: 'Two coffees for one', price: null, discountRules: { type: 'percentage', value: 5000 }, purchases: 3 })
          ),
        ]}
        stats={{ merchantCount: 1, activeCampaignCount: 1, processedCents: 0 }}
      />));

    expect(html).toContain('Two coffees for one');
    expect(html).toContain('href="/campaigns/cmp_1"');
    expect(html).toContain('View All Campaigns');
    expect(html).not.toContain('No live campaigns right now');
  });
});

const offer = toCampaignCardData(source());

describe('MarketingLanding honesty', () => {
  it('does not call listed campaigns "live" and flags ones that are not on sale', () => {
    const html = renderToStaticMarkup(withIntl(<MarketingLanding
        featuredOffers={[offer, { ...offer, id: 'cmp_3', onSale: false }]}
        stats={{ merchantCount: 1, activeCampaignCount: 2, processedCents: 0 }}
      />));
    expect(html).not.toMatch(/live offers/i);
    expect(html).toContain('Showing 2 active campaigns');
    expect(html).toContain('1 on sale now');
    expect(html).toContain('Not on sale yet');
  });

  it('shows a free offer\'s discount as its value, not as "Free" next to a discount badge', () => {
    const free = toCampaignCardData(source({ price: null, discountRules: { type: 'percentage', value: 5000 } }));
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[free]} stats={null} />));
    expect(html).toContain('50% off');
    expect(html).not.toContain('−50%');
    expect(html).not.toContain('>Free<');
  });

  it('labels demo merchants\' offers as samples and drops the text marker from titles', () => {
    const demo = toCampaignCardData(
      source({
        name: 'NÄIDIS · Joogatund',
        merchant: { name: 'Stuudio (näidis)', slug: 'demo-stuudio', city: 'Tartu', defaultCurrency: 'EUR', brandLogoUrl: null },
      })
    );
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[demo]} stats={null} />));
    expect(html).toContain('>Joogatund<');
    expect(html).toContain('>Demo<');
    expect(html).toContain('Sample offer · not for sale');
    expect(html).not.toContain('NÄIDIS ·');
  });

  it('hides zero-valued stats instead of advertising them', () => {
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[]} stats={{ merchantCount: 3, activeCampaignCount: 0, processedCents: 0 }} />));
    expect(html).not.toContain('Processed value');
    expect(html).not.toContain('Active campaigns');
    expect(html).toContain('Merchants');
  });

  it('makes no unverifiable claims and states the real language count', () => {
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[]} stats={null} />));
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
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[]} stats={null} />));
    expect(html).toContain('href="/register"');
    expect(html).not.toContain('href="/login"');
  });

  it('links every category tile to the matching /campaigns filter', () => {
    const html = renderToStaticMarkup(withIntl(<MarketingLanding featuredOffers={[]} stats={null} />));
    for (const id of ['cafe', 'beauty', 'fitness', 'events', 'workshops', 'family', 'travel', 'outdoor']) {
      expect(html).toContain(`href="/campaigns?category=${id}"`);
    }
    expect(html).toContain('Cafe &amp; bakery');
  });
});

type Messages = Record<string, unknown>;
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      current && typeof current === 'object' && value && typeof value === 'object'
        ? deepMerge(current as Messages, value as Messages)
        : value;
  }
  return out;
}

// Estonian as the app loads it (English overlaid with et.json). withIntl(node, 'et')
// require()s '@/messages/et.json', which the test runner's alias doesn't resolve.
function withEt(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="et" messages={deepMerge(en as Messages, et as Messages) as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

describe('MarketingLanding in Estonian', () => {
  it('renders the landing copy, plan features and category tiles in Estonian', () => {
    const html = renderToStaticMarkup(
      withEt(
        <MarketingLanding
          featuredOffers={[offer, { ...offer, id: 'cmp_3', onSale: false }]}
          stats={{ merchantCount: 3, activeCampaignCount: 2, processedCents: 0 }}
        />
      )
    );
    expect(html).toContain('Vaata kõiki kampaaniaid');
    expect(html).toContain('Kuvatakse 2 aktiivset kampaaniat — neist 1 on praegu müügil.');
    expect(html).toContain('Kohvikud ja pagarid');
    expect(html).toContain('5000 kupongi kuus');
    expect(html).toContain('Saadaval 25 keeles');
    expect(html).toContain('Kaupmehed');
    expect(html).not.toContain('View All Campaigns');
    expect(html).not.toContain('No live campaigns right now');
  });

  it('shows the Estonian empty state when nothing is live', () => {
    const html = renderToStaticMarkup(withEt(<MarketingLanding featuredOffers={[]} stats={null} />));
    expect(html).toContain('Praegu pole aktiivseid kampaaniaid');
    expect(html).toContain('href="/register"');
  });
});
