import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { withIntl } from '@/test-utils/intl';
import LoginError from '../error';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

describe('login error page', () => {
  it('shows the fallback message in English', () => {
    const html = renderToStaticMarkup(withIntl(<LoginError error={new Error('')} reset={() => {}} />));
    expect(html).toContain('Something went wrong');
    expect(html).toContain('An unexpected error occurred.');
  });

  it('shows the error message when there is one', () => {
    const html = renderToStaticMarkup(withIntl(<LoginError error={new Error('Boom')} reset={() => {}} />));
    expect(html).toContain('Boom');
  });

  it('renders in Estonian', () => {
    const html = renderToStaticMarkup(withIntl(<LoginError error={new Error('')} reset={() => {}} />, 'et'));
    expect(html).toContain('Midagi läks valesti');
    expect(html).toContain('Proovi uuesti');
  });
});
