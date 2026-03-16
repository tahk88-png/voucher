'use client';

import { useState, useCallback } from 'react';

export function usePasskey() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Start passkey registration (user must be logged in).
   * Returns true on success.
   */
  const startRegistration = useCallback(async (friendlyName?: string): Promise<boolean> => {
    setError(null);
    setIsLoading(true);
    try {
      const { startRegistration: browserStartRegistration } = await import(
        '@simplewebauthn/browser'
      );

      // 1. Get registration options from server
      const optionsRes = await fetch('/api/auth/passkey/register', { method: 'POST' });
      if (!optionsRes.ok) {
        throw new Error('Failed to get registration options');
      }
      const options = await optionsRes.json();

      // 2. Start WebAuthn ceremony in browser
      const attResp = await browserStartRegistration({ optionsJSON: options });

      // 3. Send response to server for verification
      const verifyRes = await fetch('/api/auth/passkey/register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attResp, friendlyName }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Registration failed');
      }

      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Passkey registration failed';
      // Don't show error if user cancelled
      if (message.includes('cancelled') || message.includes('canceled') || message.includes('AbortError')) {
        setIsLoading(false);
        return false;
      }
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Start passkey authentication (no login needed).
   * Returns { email, magicToken } on success for use with signIn("credentials").
   */
  const startAuthentication = useCallback(async (): Promise<{
    email: string;
    magicToken: string;
  } | null> => {
    setError(null);
    setIsLoading(true);
    try {
      const { startAuthentication: browserStartAuthentication } = await import(
        '@simplewebauthn/browser'
      );

      // 1. Get authentication options from server
      const optionsRes = await fetch('/api/auth/passkey/authenticate', { method: 'POST' });
      if (!optionsRes.ok) {
        throw new Error('Failed to get authentication options');
      }
      const options = await optionsRes.json();

      // 2. Start WebAuthn ceremony in browser
      const assertionResp = await browserStartAuthentication({ optionsJSON: options });

      // 3. Send response to server for verification
      const verifyRes = await fetch('/api/auth/passkey/authenticate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: assertionResp }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const data = await verifyRes.json();
      setIsLoading(false);
      return { email: data.email, magicToken: data.magicToken };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Passkey authentication failed';
      if (message.includes('cancelled') || message.includes('canceled') || message.includes('AbortError')) {
        setIsLoading(false);
        return null;
      }
      setError(message);
      setIsLoading(false);
      return null;
    }
  }, []);

  return { startRegistration, startAuthentication, isLoading, error };
}
