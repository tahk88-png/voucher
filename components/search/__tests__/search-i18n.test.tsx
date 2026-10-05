import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { withIntl as withIntlEn } from '@/test-utils/intl';
import en from '@/messages/en.json';
import et from '@/messages/et.json';

type Messages = Record<string, unknown>;
function merge(base: Messages, over: Messages): Messages {
  const out: Messages = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const cur = out[k];
    out[k] = cur && typeof cur === 'object' && v && typeof v === 'object' ? merge(cur as Messages, v as Messages) : v;
  }
  return out;
}

// withIntl(node, 'et') loads messages with a runtime require that vitest cannot
// resolve through the @/ alias, so Estonian is provided here directly.
function withIntl(node: React.ReactNode, locale = 'en'): React.ReactElement {
  if (locale === 'en') return withIntlEn(node);
  return (
    <NextIntlClientProvider locale="et" messages={merge(en as Messages, et as Messages) as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

// Vitest compiles JSX with the classic runtime, so React must be in scope.
vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

import { SearchResults } from '../search-results';
import { SearchFiltersPanel, type SearchFilters } from '../search-filters';

const filters: SearchFilters = { category: 'cafe', type: 'percentage', sort: 'popular', minDiscount: 10, maxPrice: 5000 };

function results(locale = 'en', query = 'coffee') {
  return renderToStaticMarkup(
    withIntl(
      <SearchResults
        results={[]}
        total={1}
        page={1}
        totalPages={0}
        loading={false}
        query={query}
        filters={filters}
        onPageChange={() => {}}
        onRemoveFilter={() => {}}
      />,
      locale,
    ),
  );
}

describe('search components i18n', () => {
  it('renders the result count, query and filter chips in English', () => {
    const html = results();
    expect(html).toContain('<span class="font-semibold text-[var(--text)]">1</span> result for “');
    expect(html).toContain('coffee');
    expect(html).toContain('Category: Cafe &amp; bakery');
    expect(html).toContain('Sort: Most popular');
    expect(html).toContain('Max €50');
    expect(html).toContain('No results found');
  });

  it('renders in Estonian', () => {
    const html = results('et');
    expect(html).toContain('tulemus päringule');
    expect(html).toContain('Tulemusi ei leitud');
  });

  it('renders the filters panel in both languages', () => {
    const noop = () => {};
    const en = renderToStaticMarkup(withIntl(<SearchFiltersPanel filters={filters} onChange={noop} onClear={noop} />));
    expect(en).toContain('Clear all');
    expect(en).toContain('All categories');
    expect(en).toContain('Newest first');
    const et = renderToStaticMarkup(withIntl(<SearchFiltersPanel filters={filters} onChange={noop} onClear={noop} />, 'et'));
    expect(et).toContain('Tühjenda kõik');
    expect(et).toContain('Uuemad eespool');
  });
});
