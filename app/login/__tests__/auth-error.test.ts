import { describe, it, expect } from 'vitest';
import { authErrorKey } from '../auth-error';

describe('authErrorKey', () => {
  it('maps a failed credentials sign-in to the wrong-password message', () => {
    expect(authErrorKey('CredentialsSignin')).toBe('errorCredentialsSignin');
  });
  it('maps any other NextAuth error to a generic message', () => {
    expect(authErrorKey('Configuration')).toBe('errorAuthGeneric');
    expect(authErrorKey('OAuthCallbackError')).toBe('errorAuthGeneric');
  });
  it('shows nothing without an error', () => {
    expect(authErrorKey(null)).toBeNull();
  });
});
