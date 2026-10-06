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
}));

import CampaignForm, { CREDIT_LABEL, PRICE_LABEL, parseErrorKind } from '../campaign-form';
import CampaignsListClient from '../campaigns-list-client';
import { withIntl } from '@/test-utils/intl';
import { parseMoneyToMinor, parsePercentToBasisPoints } from '@/lib/money-input';
const campaign = {
  id: 'cmp_1',
  name: 'Autumn brunch',
  type: 'weekly',
  status: 'active',
  startDate: '2026-10-01T09:00:00.000Z',
  endDate: '2026-10-31T21:00:00.000Z',
  price: 1500,
  vouchers: 3,
  purchases: 2,
  paidPurchases: 2,
  revenue: 3000,
};

describe('CampaignForm translations', () => {
  it('renders English labels', () => {
    const html = renderToStaticMarkup(withIntl(<CampaignForm merchantSlug="cafe" currency="EUR" />));
    expect(html).toContain('Basic information');
    expect(html).toContain('Price in EUR (leave empty for free vouchers)');
    expect(html).toContain('Runs once between the start and end date, while stock lasts.');
    expect(html).toContain('Create campaign');
  });

  it('renders Estonian labels', () => {
    const html = renderToStaticMarkup(withIntl(<CampaignForm merchantSlug="cafe" currency="EUR" />, 'et'));
    expect(html).toContain('Põhiandmed');
    expect(html).toContain('Loo kampaania');
    expect(html).not.toContain('Basic information');
  });

  it('recognises every money-input error so it can be translated', () => {
    const priceErrors = ['-1', 'abc', '4.555', '9'.repeat(20)].map((raw) => {
      const res = parseMoneyToMinor(raw, 'EUR', PRICE_LABEL);
      return res.ok ? null : parseErrorKind(res.error, PRICE_LABEL)?.kind;
    });
    expect(priceErrors).toEqual(['negative', 'invalid', 'decimals', 'tooLarge']);

    const wholeNumber = parseMoneyToMinor('4.5', 'JPY', PRICE_LABEL);
    expect(wholeNumber.ok ? null : parseErrorKind(wholeNumber.error, PRICE_LABEL)?.kind).toBe('wholeNumber');

    const tooHigh = parsePercentToBasisPoints('101', CREDIT_LABEL);
    expect(tooHigh.ok ? null : parseErrorKind(tooHigh.error, CREDIT_LABEL)).toEqual({ kind: 'tooHigh', decimals: 0 });

    const decimals = parsePercentToBasisPoints('2.555', CREDIT_LABEL);
    expect(decimals.ok ? null : parseErrorKind(decimals.error, CREDIT_LABEL)).toEqual({ kind: 'decimals', decimals: 2 });
  });
});

describe('CampaignsListClient translations', () => {
  it('renders English list labels', () => {
    const html = renderToStaticMarkup(
      withIntl(<CampaignsListClient campaigns={[campaign]} merchantSlug="cafe" currency="EUR" canCreate />),
    );
    expect(html).toContain('Weekly campaign');
    expect(html).toContain('Paid purchases');
    expect(html).toContain('Autumn brunch');
  });

  it('renders the Estonian empty state', () => {
    const html = renderToStaticMarkup(
      withIntl(<CampaignsListClient campaigns={[]} merchantSlug="cafe" currency="EUR" canCreate />, 'et'),
    );
    expect(html).toContain('Kampaaniaid veel pole');
    expect(html).toContain('Loo oma esimene kampaania');
  });
});
