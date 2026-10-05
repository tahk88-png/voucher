import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { withIntl } from '@/test-utils/intl';
import en from '@/messages/en.json';
import et from '@/messages/et.json';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

import { Spinner } from '../spinner';
import { CashbackBadge } from '../cashback-badge';
import { VoucherCard } from '../voucher-card';

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

// withIntl(node, 'et') require()s '@/messages/et.json', which the test runner's alias doesn't resolve.
function withEt(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="et" messages={deepMerge(en as Messages, et as Messages) as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

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
    expect(renderToStaticMarkup(withEt(<Spinner />))).toContain('Laadimine...');
    const card = renderToStaticMarkup(
      withEt(<VoucherCard title="Kohv" expiryDate="2026-01-15T12:00:00Z" status="expired" />),
    );
    expect(card).toContain('Aegunud');
    expect(card).toContain('Aegub');
  });
});
