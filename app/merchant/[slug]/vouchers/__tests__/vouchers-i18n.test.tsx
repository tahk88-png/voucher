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

import VouchersListClient from '../vouchers-list-client';
import BulkImportPage from '../bulk-import/page';
import NewVoucherPage from '../new/page';
import { valueErrorKind, PERCENT_LABEL, AMOUNT_LABEL } from '../voucher-i18n';
import { NextIntlClientProvider } from 'next-intl';
import { withIntl } from '@/test-utils/intl';
import { parseMoneyToMinor, parsePercentToBasisPoints } from '@/lib/money-input';
import en from '@/messages/en.json';
import et from '@/messages/et.json';

type Messages = Record<string, unknown>;
function deepMerge(base: Messages, override: Messages): Messages {
  const out: Messages = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = out[key];
    out[key] =
      current && typeof current === 'object' && value && typeof value === 'object' && !Array.isArray(value)
        ? deepMerge(current as Messages, value as Messages)
        : value;
  }
  return out;
}

// Estonian as the app loads it (English overlaid with et.json).
function withEstonian(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="et" messages={deepMerge(en as Messages, et as Messages) as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

const vouchers = [
  {
    id: 'v_1',
    status: 'published',
    type: 'percentage',
    value: 1500,
    currency: 'EUR',
    validFrom: '2026-10-01T00:00:00.000Z',
    validTo: '2026-12-31T00:00:00.000Z',
    usageLimitTotal: 100,
    designJson: null,
    codePrefix: 'SPRING',
    _count: { redemptions: 4 },
  },
  {
    id: 'v_2',
    status: 'draft',
    type: 'credit_amount',
    value: 1000,
    currency: 'EUR',
    validFrom: '2026-10-01T00:00:00.000Z',
    validTo: '2026-12-31T00:00:00.000Z',
    usageLimitTotal: null,
    designJson: JSON.stringify({ headline: 'Welcome credit' }),
    codePrefix: null,
    _count: { redemptions: 0 },
  },
];

describe('VouchersListClient translations', () => {
  it('renders English labels', () => {
    const html = renderToStaticMarkup(withIntl(<VouchersListClient vouchers={vouchers} merchantSlug="cafe" />));
    expect(html).toContain('Search by headline, code prefix, or ID');
    expect(html).toContain('15% off');
    expect(html).toContain('Percentage off');
    expect(html).toContain('Welcome credit');
    expect(html).toContain('Usage: 0 - Unlimited');
  });

  it('renders Estonian labels', () => {
    const html = renderToStaticMarkup(withEstonian(<VouchersListClient vouchers={vouchers} merchantSlug="cafe" />));
    expect(html).toContain('Otsi pealkirja, koodi eesliite või ID järgi');
    expect(html).toContain('Kasutus: 0 – piiramatu');
    expect(html).not.toContain('Clear filters');
    expect(html).not.toContain('Search by headline');
  });

  it('renders the empty state in Estonian', () => {
    const html = renderToStaticMarkup(withEstonian(<VouchersListClient vouchers={[]} merchantSlug="cafe" />));
    expect(html).toContain('Kuponge veel pole');
  });
});

describe('Voucher forms translations', () => {
  it('renders the new voucher form in English and Estonian', () => {
    const enHtml = renderToStaticMarkup(withIntl(<NewVoucherPage />));
    expect(enHtml).toContain('Step 1 of 2');
    expect(enHtml).toContain('Type the percentage, e.g. 15 or 12,5.');

    const etHtml = renderToStaticMarkup(withEstonian(<NewVoucherPage />));
    expect(etHtml).toContain('Samm 1/2');
    expect(etHtml).toContain('Sisesta protsent, nt 15 või 12,5.');
  });

  it('renders the bulk import page in English and Estonian', () => {
    const enHtml = renderToStaticMarkup(withIntl(<BulkImportPage />));
    expect(enHtml).toContain('Import vouchers from a spreadsheet');
    expect(enHtml).toContain('<code class="font-mono text-[var(--text)]">valid_from</code> (required)');

    const etHtml = renderToStaticMarkup(withEstonian(<BulkImportPage />));
    expect(etHtml).toContain('Impordi kupongid tabelist');
    expect(etHtml).toContain('(kohustuslik)');
  });

  it('recognises every money-input error so it can be translated', () => {
    const valueErrors = ['-1', 'abc', '4.555', '9'.repeat(20)].map((raw) => {
      const res = parseMoneyToMinor(raw, 'EUR', AMOUNT_LABEL);
      return res.ok ? null : valueErrorKind(res.error, AMOUNT_LABEL)?.kind;
    });
    expect(valueErrors).toEqual(['negative', 'invalid', 'decimals', 'tooLarge']);

    const wholeNumber = parseMoneyToMinor('4.5', 'JPY', AMOUNT_LABEL);
    expect(wholeNumber.ok ? null : valueErrorKind(wholeNumber.error, AMOUNT_LABEL)?.kind).toBe('wholeNumber');

    const tooHigh = parsePercentToBasisPoints('101', PERCENT_LABEL);
    expect(tooHigh.ok ? null : valueErrorKind(tooHigh.error, PERCENT_LABEL)).toEqual({ kind: 'tooHigh', decimals: 0 });
  });
});
