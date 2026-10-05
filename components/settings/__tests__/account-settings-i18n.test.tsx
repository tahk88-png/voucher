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

import EditProfileForm from '@/components/edit-profile-form';
import ChangePasswordForm from '@/components/change-password-form';
import DeleteAccountDialog from '@/components/delete-account-dialog';
import { PasskeyManager } from '@/components/settings/passkey-manager';
import { apiErrorText } from '@/components/settings/api-error-text';

// withIntl(node, 'et') loads et.json through a require() that vitest can't
// resolve, so the Estonian render builds the provider here (English overlaid
// with Estonian, as i18n.ts does for the namespace these components use).
function withEstonian(node: React.ReactNode) {
  const messages = { ...en, accountSecurity: { ...en.accountSecurity, ...et.accountSecurity } };
  return (
    <NextIntlClientProvider locale="et" messages={messages as never} timeZone="UTC">
      {node}
    </NextIntlClientProvider>
  );
}

describe('account settings forms', () => {
  it('render in English', () => {
    const html = renderToStaticMarkup(
      withIntl(
        <>
          <EditProfileForm initialName="Mari" email="mari@example.com" />
          <ChangePasswordForm hasPassword />
          <DeleteAccountDialog />
          <PasskeyManager />
        </>,
      ),
    );
    expect(html).toContain('Email cannot be changed');
    expect(html).toContain('Current password');
    expect(html).toContain('Change password');
    expect(html).toContain('Delete account');
    expect(html).toContain('Add passkey');
  });

  it('render in Estonian', () => {
    const html = renderToStaticMarkup(
      withEstonian(
        <>
          <EditProfileForm initialName="Mari" email="mari@example.com" />
          <ChangePasswordForm hasPassword={false} />
          <DeleteAccountDialog />
          <PasskeyManager />
        </>,
      ),
    );
    expect(html).toContain('E-posti aadressi ei saa muuta');
    expect(html).toContain('Määra parool');
    expect(html).toContain('Kustuta konto');
    expect(html).toContain('Lisa pääsuvõti');
    expect(html).not.toContain('Email cannot be changed');
  });
});

describe('apiErrorText', () => {
  const t = (key: string) => `t:${key}`;

  it('translates known API errors', () => {
    expect(apiErrorText(t, 'Current password is incorrect', 'fallback')).toBe('t:apiErrors.currentPasswordIncorrect');
  });

  it('shows unknown API errors as sent and falls back when there is none', () => {
    expect(apiErrorText(t, 'Something odd', 'fallback')).toBe('Something odd');
    expect(apiErrorText(t, undefined, 'fallback')).toBe('fallback');
    expect(apiErrorText(t, '', 'fallback')).toBe('fallback');
  });
});
