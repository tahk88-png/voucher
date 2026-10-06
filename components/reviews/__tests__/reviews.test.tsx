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

vi.mock('next/navigation', () => ({
  usePathname: () => '/campaigns/c1',
}));

import { ReviewForm } from '../review-form';
import { ReviewList } from '../review-list';
import { StarRating } from '../star-rating';

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

describe('StarRating', () => {
  it('labels each star with a pluralised count', () => {
    const html = renderToStaticMarkup(withIntl(<StarRating rating={3} />));
    expect(html).toContain('aria-label="1 star"');
    expect(html).toContain('aria-label="5 stars"');
  });

  it('renders Estonian labels', () => {
    const html = renderToStaticMarkup(withEt(<StarRating rating={3} />));
    expect(html).toContain('aria-label="1 täht"');
    expect(html).toContain('aria-label="5 tähte"');
  });
});

describe('ReviewForm', () => {
  it('renders the form in English', () => {
    const html = renderToStaticMarkup(withIntl(<ReviewForm campaignId="c1" />));
    expect(html).toContain('Write a Review');
    expect(html).toContain('Title (optional)');
    expect(html).toContain('placeholder="Share your experience..."');
    expect(html).toContain('Submit Review');
  });

  it('renders the form in Estonian', () => {
    const html = renderToStaticMarkup(withEt(<ReviewForm campaignId="c1" />));
    expect(html).toContain('Kirjuta arvustus');
    expect(html).toContain('Pealkiri (valikuline)');
    expect(html).toContain('Saada arvustus');
    expect(html).not.toContain('Submit Review');
  });
});

describe('ReviewList', () => {
  it('asks signed-out visitors to sign in before reviewing', () => {
    const html = renderToStaticMarkup(withIntl(<ReviewList campaignId="c1" signedIn={false} />));
    expect(html).toContain('Sign in to write a review');
    expect(html).toContain('href="/login?callbackUrl=%2Fcampaigns%2Fc1"');
  });

  it('renders Estonian text', () => {
    const html = renderToStaticMarkup(withEt(<ReviewList campaignId="c1" signedIn={false} />));
    expect(html).toContain('Arvustuse kirjutamiseks logi sisse');
  });
});
