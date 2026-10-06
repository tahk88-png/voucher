import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { withIntl } from '@/test-utils/intl';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

import { Spinner } from '../spinner';
import { CashbackBadge } from '../cashback-badge';
import { VoucherCard } from '../voucher-card';

describe('ui primitives i18n', () => {
  it('renders English built-in text', () => {
    expect(renderToStaticMarkup(withIntl(<Spinner />))).toContain('Loading...');
    expect(renderToStaticMarkup(withIntl(<CashbackBadge creditPercentage={500} />))).toContain('5% cashback');
    const card = renderToStaticMarkup(
      withIntl(<VoucherCard title="Coffee" expiryDate="2026-01-15T12:00:00Z" onPrimaryAction={() => {}} />),
    );
    expect(card).toContain('Active');
    expect(card).toContain('Expires Jan 15, 2026');
    expect(card).toContain('Redeem');
  });

  it('renders Estonian built-in text', () => {
    expect(renderToStaticMarkup(withIntl(<Spinner />, 'et'))).toContain('Laadimine...');
    expect(renderToStaticMarkup(withIntl(<CashbackBadge creditPercentage={500} />, 'et'))).toContain(
      '5% raha tagasi',
    );
    const card = renderToStaticMarkup(
      withIntl(<VoucherCard title="Kohv" expiryDate="2026-01-15T12:00:00Z" status="expired" />, 'et'),
    );
    expect(card).toContain('Aegunud');
    expect(card).toContain('Aegub');
  });
});
