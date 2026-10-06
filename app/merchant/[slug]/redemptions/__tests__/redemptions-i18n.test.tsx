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

import ConfirmRedemptionButton from '../confirm-button';
import ExportRedemptionsButton from '../export-button';
import ScannerPage from '../../scanner/page';
import { withIntl } from '@/test-utils/intl';

describe('merchant redemptions and scanner i18n', () => {
  it('renders English labels', () => {
    expect(renderToStaticMarkup(withIntl(<ConfirmRedemptionButton redemptionId="r1" merchantSlug="cafe" />))).toContain(
      'Confirm Redemption',
    );
    expect(renderToStaticMarkup(withIntl(<ExportRedemptionsButton merchantSlug="cafe" />))).toContain('Export CSV');
    const scanner = renderToStaticMarkup(withIntl(<ScannerPage />));
    expect(scanner).toContain('Scan vouchers, gift cards, and tickets');
    expect(scanner).toContain('aria-label="Code to scan"');
  });

  it('renders Estonian labels', () => {
    expect(
      renderToStaticMarkup(withIntl(<ConfirmRedemptionButton redemptionId="r1" merchantSlug="cafe" />, 'et')),
    ).toContain('Kinnita lunastus');
    expect(renderToStaticMarkup(withIntl(<ExportRedemptionsButton merchantSlug="cafe" />, 'et'))).toContain('Ekspordi CSV');
    const scanner = renderToStaticMarkup(withIntl(<ScannerPage />, 'et'));
    expect(scanner).toContain('Skanni kuponge, kinkekaarte ja pileteid');
    expect(scanner).toContain('Sisesta kood');
  });
});
