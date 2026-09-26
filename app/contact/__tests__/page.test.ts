import * as React from 'react';
import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';

// Vitest compiles JSX with the classic runtime (tsconfig has jsx: preserve,
// which is Next's job), so the page's JSX needs React in scope.
vi.stubGlobal('React', React);
afterAll(() => {
  vi.unstubAllGlobals();
});

// The form itself is a client component; only the address wiring is tested.
vi.mock('../contact-client', () => ({ default: () => null }));

import ContactPage, { dynamic } from '../page';

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderedEmail(): unknown {
  const element = ContactPage() as React.ReactElement<{ contactEmail: string }>;
  return element.props.contactEmail;
}

describe('/contact page', () => {
  it('renders per request, so the runtime configuration decides the address', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('shows support@<app host> by default', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    vi.stubEnv('CONTACT_EMAIL', '');
    expect(renderedEmail()).toBe('support@app.example.com');
  });

  it('shows CONTACT_EMAIL when set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
    vi.stubEnv('CONTACT_EMAIL', 'help@example.net');
    expect(renderedEmail()).toBe('help@example.net');
  });
});
