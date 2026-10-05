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

// Estonian as the app loads it (English overlaid with et.json). withIntl(node, 'et')
// require()s '@/messages/et.json', which the test runner's alias doesn't resolve.
function withEt(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="et" messages={deepMerge(en as Messages, et as Messages) as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

const props = {
  id: 'purchase-1',
  voucherId: 'voucher-1',
  amount: 1500,
  currency: 'EUR',
  validTo: null,
  displayStatus: 'active' as const,
  merchantName: 'Kohvik Mari',
  title: 'Coffee for two',
  description: null,
  statusLabel: 'Published',
  statusVariant: 'success' as const,
  paidLabel: 'Paid',
  freeLabel: 'Free',
  formattedAmount: 'Paid: €15.00',
  formattedDate: null,
};

describe('VoucherCard', () => {
  it('renders the purchase with an English QR button', () => {
    const html = renderToStaticMarkup(withIntl(<VoucherCard {...props} />));
    expect(html).toContain('Kohvik Mari');
    expect(html).toContain('Paid: €15.00');
    expect(html).toContain('Show QR code');
  });

  it('renders the QR button in Estonian', () => {
    const html = renderToStaticMarkup(withEt(<VoucherCard {...props} />));
    expect(html).toContain('Näita QR-koodi');
    expect(html).not.toContain('Show QR code');
  });
});
