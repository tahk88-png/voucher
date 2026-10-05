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
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import etMessages from '@/messages/et.json';

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

// Estonian as the app loads it (English overlaid with et.json). withIntl(node, 'et')
// loads et.json through a require() that vitest can't resolve.
function withEt(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="et" messages={deepMerge(enMessages as Messages, etMessages as Messages) as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

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
    const html = renderToStaticMarkup(withEt(<LegalEntityDetails entity={getLegalEntity()} />));
    expect(html).toContain('Registrikood');
    expect(html).toContain('[ettevõtte nimi lisatakse]');
  });
});
