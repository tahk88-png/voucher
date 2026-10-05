import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';

// Vitest compiles JSX with the classic runtime, so components need React in scope.
vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  useParams: () => ({ slug: 'cafe' }),
}));

import DomainManager from '../domain-manager';
import PayoutActions from '../payouts/payout-actions';
import NotificationPreferencesForm from '../notifications/notifications-form';
import { MERCHANT_NOTIFICATION_CATEGORIES } from '@/lib/merchant-notifications';
import { withIntl } from '@/test-utils/intl';

const domains = [
  {
    id: 'd_1',
    domain: 'shop.example.com',
    status: 'pending',
    verificationToken: 'tok123',
    verifiedAt: null,
  },
];

describe('merchant settings i18n', () => {
  it('renders the domain manager in English with raw DNS record', () => {
    const html = renderToStaticMarkup(withIntl(<DomainManager merchantSlug="cafe" initialDomains={domains} />));
    expect(html).toContain('Custom domains');
    expect(html).toContain('Status: pending');
    expect(html).toContain('vouchr-verification=tok123');
    expect(html).toContain('Verify');
  });

  it('renders the domain manager in Estonian', () => {
    const html = renderToStaticMarkup(
      withIntl(<DomainManager merchantSlug="cafe" initialDomains={domains} />, 'et'),
    );
    expect(html).toContain('Kohandatud domeenid');
    expect(html).toContain('Olek: ootel');
  });

  it('renders payout actions in both locales', () => {
    const en = renderToStaticMarkup(withIntl(<PayoutActions slug="cafe" hasAccount={false} payoutsEnabled={false} />));
    expect(en).toContain('Set up payouts with Stripe');
    const et = renderToStaticMarkup(
      withIntl(<PayoutActions slug="cafe" hasAccount payoutsEnabled />, 'et'),
    );
    expect(et).toContain('Ava Stripe&#x27;i töölaud');
    expect(et).toContain('Katkesta ühendus');
  });

  it('translates notification categories by key', () => {
    const props = {
      merchantSlug: 'cafe',
      categories: MERCHANT_NOTIFICATION_CATEGORIES.map((c) => ({ ...c })),
      initialPreferences: {},
    };
    const en = renderToStaticMarkup(withIntl(<NotificationPreferencesForm {...props} />));
    for (const c of MERCHANT_NOTIFICATION_CATEGORIES) expect(en).toContain(c.label.replace('&', '&amp;'));
    const et = renderToStaticMarkup(withIntl(<NotificationPreferencesForm {...props} />, 'et'));
    expect(et).toContain('Uued tellimused ja lunastused');
    expect(et).toContain('Salvesta eelistused');
  });
});
