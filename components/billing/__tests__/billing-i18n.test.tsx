import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { withIntl } from '@/test-utils/intl';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

import PlanSelector from '../plan-selector';
import PaywallModal from '../paywall-modal';

describe('billing components i18n', () => {
  it('renders the plan selector in English and Estonian', () => {
    const el = (
      <PlanSelector slug="demo" currentTier="starter" billingState="trial" hasStripeCustomer={false} billingAvailable={false} />
    );
    const html = renderToStaticMarkup(withIntl(el));
    expect(html).toContain('500 vouchers/month');
    expect(html).toContain('Current plan (free trial)');
    expect(html).toContain('Plan changes aren&#x27;t available online right now.');
    const htmlEt = renderToStaticMarkup(withIntl(el, 'et'));
    expect(htmlEt).toContain('500 kupongi kuus');
    expect(htmlEt).toContain('Praegune plaan (tasuta prooviperiood)');
  });

  it('renders the paywall usage line in English and Estonian', () => {
    const el = (
      <PaywallModal
        open
        onClose={() => {}}
        slug="demo"
        message="Limit reached"
        currentTier="starter"
        requiredPlan="pro"
        limit={{ key: 'activeCampaigns', current: 3, max: 3 }}
      />
    );
    const html = renderToStaticMarkup(withIntl(el));
    expect(html).toContain('<span class="font-semibold">3</span> / 3 used');
    expect(html).toContain('active campaigns');
    const htmlEt = renderToStaticMarkup(withIntl(el, 'et'));
    expect(htmlEt).toContain('3 kasutatud');
    expect(htmlEt).toContain('aktiivsed kampaaniad');
  });
});
