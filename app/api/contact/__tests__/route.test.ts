import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// The contact form must never report success for a message that went
// nowhere, and must deliver to the configured support address.

const send = vi.fn();
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({ emails: { send } })),
}));
vi.mock('@/lib/fraud', () => ({
  checkIPRateLimit: vi.fn(async () => ({ allowed: true, remaining: 4 })),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { POST } from '../route';

const FORM = { name: 'Mari', email: 'mari@example.org', subject: 'Hello', message: 'Line 1\nLine 2' };

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  send.mockReset();
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
  vi.stubEnv('NEXTAUTH_URL', '');
  vi.stubEnv('CONTACT_EMAIL', '');
  vi.stubEnv('EMAIL_FROM', '');
  vi.stubEnv('RESEND_FROM_EMAIL', '');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/contact', () => {
  it('answers 503 instead of success when no e-mail provider is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(request(FORM));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Contact form is not configured' });
    expect(send).not.toHaveBeenCalled();
  });

  it('sends to the support address derived from the app URL', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    send.mockResolvedValue({ data: { id: 'email_1' }, error: null });
    const res = await POST(request(FORM));
    expect(res.status).toBe(200);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'support@app.example.com',
        from: 'noreply@app.example.com',
        reply_to: 'mari@example.org',
      }),
    );
  });

  it('uses CONTACT_EMAIL when set', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    vi.stubEnv('CONTACT_EMAIL', 'help@example.net');
    send.mockResolvedValue({ data: { id: 'email_2' }, error: null });
    await POST(request(FORM));
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: 'help@example.net' }));
  });

  it('reports a failure when Resend rejects the message', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    send.mockResolvedValue({ data: null, error: { message: 'domain not verified', name: 'validation_error' } });
    const res = await POST(request(FORM));
    expect(res.status).toBe(500);
  });

  it('rejects incomplete submissions', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    const res = await POST(request({ ...FORM, message: '' }));
    expect(res.status).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});
