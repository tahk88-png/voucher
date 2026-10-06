import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { withIntl } from '@/test-utils/intl';

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
    expect(html).toContain('Kategooria: Kohvikud ja pagarid');
    expect(html).toContain('Max 50 €');
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
