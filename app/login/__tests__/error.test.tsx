import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { withIntl } from '@/test-utils/intl';
import en from '@/messages/en.json';
import et from '@/messages/et.json';
import LoginError from '../error';

vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

// withIntl(node, 'et') require()s '@/messages/et.json', which the test runner's
// alias doesn't resolve, so the Estonian render gets its messages directly
// (authPages is fully translated in et.json).
function withEstonian(node: React.ReactNode) {
  return (
    <NextIntlClientProvider locale="et" messages={{ ...en, authPages: et.authPages } as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

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
    const html = renderToStaticMarkup(withEstonian(<LoginError error={new Error('')} reset={() => {}} />));
    expect(html).toContain('Midagi läks valesti');
    expect(html).toContain('Proovi uuesti');
  });
});
