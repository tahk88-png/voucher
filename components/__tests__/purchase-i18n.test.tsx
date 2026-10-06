import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { withIntl } from '@/test-utils/intl';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

import BnplSelector from '../bnpl-selector';
import QRDownload from '../qr-download';
import { QRCodePanel } from '../qr-code-panel';

describe('purchase components i18n', () => {
  it('renders the installment selector in English and Estonian', () => {
    const el = <BnplSelector totalCents={12000} currency="EUR" onSelect={() => {}} />;
    const html = renderToStaticMarkup(withIntl(el));
    expect(html).toContain('Pay in installments');
    expect(html).toContain('3x (0% interest)');
    expect(html).toContain('6 monthly payments');
    const htmlEt = renderToStaticMarkup(withIntl(el, 'et'));
    expect(htmlEt).toContain('Maksa osamaksetena');
    expect(htmlEt).toContain('6 kuumakset');
  });

  it('renders the QR download button and QR panel in Estonian', () => {
    expect(renderToStaticMarkup(withIntl(<QRDownload qrCodeDataUrl="data:x" />))).toContain('Download QR');
    expect(renderToStaticMarkup(withIntl(<QRDownload qrCodeDataUrl="data:x" />, 'et'))).toContain('Laadi QR alla');
    const panelEt = renderToStaticMarkup(withIntl(<QRCodePanel expiryDate="2026-10-05T12:00:00Z" />, 'et'));
    expect(panelEt).toContain('QR-kood ilmub siia');
    expect(panelEt).toContain('Kood uueneb iga 30 sekundi järel');
  });
});
