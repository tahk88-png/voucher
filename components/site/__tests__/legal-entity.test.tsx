import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

import { LegalEntityDetails, getLegalEntity } from '../legal-entity';
import { withIntl } from '@/test-utils/intl';
describe('LegalEntityDetails', () => {
  it('shows clearly marked placeholders instead of an invented operator', () => {
    vi.stubEnv('LEGAL_ENTITY_NAME', '');
    vi.stubEnv('LEGAL_ENTITY_ADDRESS', '');
    vi.stubEnv('LEGAL_REGISTRY_CODE', '');
    const html = renderToStaticMarkup(withIntl(<LegalEntityDetails entity={getLegalEntity()} />));
    expect(html).toContain('[company name to be added]');
    expect(html).toContain('[registered address to be added]');
    expect(html).toContain('[registry code to be added]');
  });

  it('shows the configured operator', () => {
    vi.stubEnv('LEGAL_ENTITY_NAME', 'Example OÜ');
    vi.stubEnv('LEGAL_ENTITY_ADDRESS', 'Some street 1, Tallinn');
    vi.stubEnv('LEGAL_REGISTRY_CODE', '12345678');
    const html = renderToStaticMarkup(withIntl(<LegalEntityDetails entity={getLegalEntity()} />));
    expect(html).toContain('Example OÜ');
    expect(html).toContain('12345678');
    expect(html).not.toContain('to be added');
  });

  it('renders in Estonian', () => {
    vi.stubEnv('LEGAL_ENTITY_NAME', '');
    vi.stubEnv('LEGAL_ENTITY_ADDRESS', '');
    vi.stubEnv('LEGAL_REGISTRY_CODE', '');
    const html = renderToStaticMarkup(withIntl(<LegalEntityDetails entity={getLegalEntity()} />, 'et'));
    expect(html).toContain('Registrikood');
    expect(html).toContain('[ettevõtte nimi lisatakse hiljem]');
  });
});
