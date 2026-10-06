import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// The sign-in code endpoint must never claim a code was sent when no e-mail
// could be delivered: the user would wait for a message that never arrives.

const tokenCreate = vi.fn();
const tokenDeleteMany = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    verificationToken: {
      create: (...args: unknown[]) => tokenCreate(...args),
      deleteMany: (...args: unknown[]) => tokenDeleteMany(...args),
    },
  },
}));
vi.mock('@/lib/rate-limit', () => ({
  rateLimitDistributed: vi.fn(async () => ({ allowed: true, resetAt: Date.now() })),
}));
vi.mock('@/lib/error-handler', () => ({
  withErrorHandler: (fn: () => Promise<Response>) => fn(),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));
const sendEmail = vi.fn();
vi.mock('@/lib/resend', () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
  isResendConfigured: () => Boolean(process.env.RESEND_API_KEY),
}));

import { POST } from '../route';

function request(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth/send-otp', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  tokenCreate.mockReset();
  tokenDeleteMany.mockReset();
  sendEmail.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/auth/send-otp', () => {
  it('answers 503 and stores no code when no e-mail provider is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    const res = await POST(request({ email: 'mari@example.org' }));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/use your password/);
    expect(tokenCreate).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('answers 503 and discards the code when sending fails', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    sendEmail.mockRejectedValue(new Error('Resend error: domain not verified'));
    const res = await POST(request({ email: 'mari@example.org' }));
    expect(res.status).toBe(503);
    // Once before creating the code, once to discard it after the failure.
    expect(tokenDeleteMany).toHaveBeenCalledTimes(2);
  });

  it('reports sent only after the e-mail was handed to the provider', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test');
    sendEmail.mockResolvedValue({ id: 'email_1' });
    const res = await POST(request({ email: 'Mari@Example.org ' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sent: true });
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'mari@example.org' }));
  });
});
