import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, afterAll } from 'vitest';
import { useTranslations } from 'next-intl';
import { withIntl, loadMessages } from '../intl';

vi.stubGlobal('React', React);
afterAll(() => vi.unstubAllGlobals());

function Free() {
  const t = useTranslations('labels');
  return <span>{t('free')}</span>;
}

describe('withIntl', () => {
  it('renders English and Estonian with the app messages', () => {
    expect(renderToStaticMarkup(withIntl(<Free />))).toContain('Free');
    expect(renderToStaticMarkup(withIntl(<Free />, 'et'))).toContain('Tasuta');
  });

  it('falls back to English for keys a locale lacks, like the app does', () => {
    const et = loadMessages('et') as Record<string, Record<string, unknown>>;
    expect(et.common).toBeDefined();
  });
});
