/**
 * Unit tests for lib/email/providers/factory.ts — failover logic.
 *
 * Covers:
 * - DB config → primary provider selection
 * - env-based fallback when no DB row exists
 * - sendWithFailover: primary success, primary fail + fallback success,
 *   both fail (original error surfaced), no fallback configured.
 * - throws when no provider is configured at all
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { findFirst, findMany, resendSend, smtpSend } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  resendSend: vi.fn(),
  smtpSend: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailProviderConfig: { findFirst, findMany },
  },
}));

vi.mock('../providers/resend-provider', () => ({
  ResendProvider: class {
    send = resendSend;
  },
}));
vi.mock('../providers/smtp-provider', () => ({
  SmtpProvider: class {
    send = smtpSend;
  },
}));

// Import under test
import {
  createEmailProvider,
  getPrimaryProvider,
  getFallbackProvider,
  sendWithFailover,
} from '../providers/factory';

const origEnv = { ...process.env };

beforeEach(() => {
  vi.clearAllMocks();
  findFirst.mockResolvedValue(null);
  findMany.mockResolvedValue([]);
  resendSend.mockResolvedValue({ providerId: 'r-1', providerType: 'resend' });
  smtpSend.mockResolvedValue({ providerId: 's-1', providerType: 'smtp' });
});

afterEach(() => {
  process.env = { ...origEnv };
});

describe('createEmailProvider', () => {
  it('returns cached instance on second call for same type', () => {
    const a = createEmailProvider('resend');
    const b = createEmailProvider('resend');
    expect(a).toBe(b);
  });
});

describe('getPrimaryProvider', () => {
  it('uses DB config when available', async () => {
    findFirst.mockResolvedValue({ provider: 'smtp', isActive: true, isPrimary: true });
    const p = await getPrimaryProvider();
    await p.send({ to: 't', from: 'f', subject: 's' });
    expect(smtpSend).toHaveBeenCalled();
  });

  it('falls back to RESEND_API_KEY env when no DB config', async () => {
    process.env.RESEND_API_KEY = 're_abc';
    delete process.env.SMTP_HOST;
    const p = await getPrimaryProvider();
    await p.send({ to: 't', from: 'f', subject: 's' });
    expect(resendSend).toHaveBeenCalled();
  });

  it('falls back to SMTP_HOST env when Resend is not configured', async () => {
    delete process.env.RESEND_API_KEY;
    process.env.SMTP_HOST = 'smtp.x.com';
    const p = await getPrimaryProvider();
    await p.send({ to: 't', from: 'f', subject: 's' });
    expect(smtpSend).toHaveBeenCalled();
  });

  it('throws when no provider is configured', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    await expect(getPrimaryProvider()).rejects.toThrow(/No email provider/);
  });

  it('tolerates DB errors and falls through to env detection', async () => {
    findFirst.mockRejectedValue(new Error('db down'));
    process.env.RESEND_API_KEY = 're_abc';
    const p = await getPrimaryProvider();
    await p.send({ to: 't', from: 'f', subject: 's' });
    expect(resendSend).toHaveBeenCalled();
  });
});

describe('getFallbackProvider', () => {
  it('returns next DB-configured provider', async () => {
    findMany.mockResolvedValue([{ provider: 'smtp' }]);
    const p = await getFallbackProvider();
    expect(p).not.toBeNull();
    await p!.send({ to: 't', from: 'f', subject: 's' });
    expect(smtpSend).toHaveBeenCalled();
  });

  it('returns SMTP fallback when Resend + SMTP both in env', async () => {
    process.env.RESEND_API_KEY = 're_abc';
    process.env.SMTP_HOST = 'smtp.x.com';
    const p = await getFallbackProvider();
    expect(p).not.toBeNull();
    await p!.send({ to: 't', from: 'f', subject: 's' });
    expect(smtpSend).toHaveBeenCalled();
  });

  it('returns null when no fallback is available', async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_HOST;
    const p = await getFallbackProvider();
    expect(p).toBeNull();
  });
});

describe('sendWithFailover', () => {
  it('short-circuits on primary success', async () => {
    process.env.RESEND_API_KEY = 're_abc';
    process.env.SMTP_HOST = 'smtp.x.com';

    const res = await sendWithFailover({
      to: 'a@b.com',
      from: 'f@x.com',
      subject: 's',
      html: 'h',
    });

    expect(res.providerType).toBe('resend');
    expect(resendSend).toHaveBeenCalledTimes(1);
    expect(smtpSend).not.toHaveBeenCalled();
  });

  it('falls over to secondary on primary failure', async () => {
    process.env.RESEND_API_KEY = 're_abc';
    process.env.SMTP_HOST = 'smtp.x.com';
    resendSend.mockRejectedValueOnce(new Error('resend 500'));

    const res = await sendWithFailover({
      to: 'a@b.com',
      from: 'f@x.com',
      subject: 's',
      html: 'h',
    });

    expect(res.providerType).toBe('smtp');
    expect(resendSend).toHaveBeenCalled();
    expect(smtpSend).toHaveBeenCalled();
  });

  it('surfaces the PRIMARY error when fallback also fails', async () => {
    process.env.RESEND_API_KEY = 're_abc';
    process.env.SMTP_HOST = 'smtp.x.com';
    resendSend.mockRejectedValueOnce(new Error('resend 500'));
    smtpSend.mockRejectedValueOnce(new Error('smtp auth'));

    await expect(
      sendWithFailover({ to: 'a', from: 'b', subject: 's' }),
    ).rejects.toThrow('resend 500');
  });

  it('re-throws primary error when no fallback is configured', async () => {
    process.env.RESEND_API_KEY = 're_abc';
    delete process.env.SMTP_HOST;
    resendSend.mockRejectedValueOnce(new Error('resend 500'));

    await expect(
      sendWithFailover({ to: 'a', from: 'b', subject: 's' }),
    ).rejects.toThrow('resend 500');
  });
});
