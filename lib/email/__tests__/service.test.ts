/**
 * Unit tests for lib/email/service.ts — the central email entry point.
 *
 * All external deps (prisma, suppression, provider factory, template
 * renderer) are mocked. These tests cover the branching logic: suppression
 * short-circuit, auth-category bypass, template rendering, and failure paths.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// ────────────────────────────────────────────────────────────────────────────
// Mocks — hoisted so vi.mock factories can reference them (vi.mock is
// itself hoisted to the top of the file by the Vitest transform).
// ────────────────────────────────────────────────────────────────────────────

const {
  emailMessageCreate,
  emailJobCreate,
  isEmailSuppressed,
  sendWithFailover,
  renderDbTemplate,
} = vi.hoisted(() => ({
  emailMessageCreate: vi.fn(),
  emailJobCreate: vi.fn(),
  isEmailSuppressed: vi.fn(),
  sendWithFailover: vi.fn(),
  renderDbTemplate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailMessage: { create: emailMessageCreate },
    emailJob: { create: emailJobCreate },
  },
}));

vi.mock('../suppression', () => ({
  isEmailSuppressed,
}));

vi.mock('../providers/factory', () => ({
  sendWithFailover,
}));

vi.mock('../template-renderer', () => ({
  renderDbTemplate,
}));

// Import after mocks are registered.
import { queueEmail, sendEmailDirect } from '../service';

// ────────────────────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  isEmailSuppressed.mockResolvedValue({ suppressed: false });
  sendWithFailover.mockResolvedValue({
    providerId: 'provider-xyz',
    providerType: 'resend',
  });
  renderDbTemplate.mockResolvedValue(null);
  emailMessageCreate.mockResolvedValue({ id: 'msg-1' });
  emailJobCreate.mockResolvedValue({ id: 'job-1' });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ────────────────────────────────────────────────────────────────────────────
// queueEmail
// ────────────────────────────────────────────────────────────────────────────

describe('queueEmail', () => {
  it('creates an EmailJob with normalized recipient', async () => {
    const result = await queueEmail({
      to: '  Alice@Example.COM ',
      subject: 'Welcome',
      html: '<p>hi</p>',
    });

    expect(result).toEqual({ success: true, jobId: 'job-1' });
    expect(emailJobCreate).toHaveBeenCalledTimes(1);
    expect(emailJobCreate.mock.calls[0][0].data.to).toBe('alice@example.com');
    expect(emailJobCreate.mock.calls[0][0].data.category).toBe('transactional');
    expect(emailJobCreate.mock.calls[0][0].data.priority).toBe('normal');
    expect(emailJobCreate.mock.calls[0][0].data.maxAttempts).toBe(3);
  });

  it('respects explicit category, priority, and maxAttempts overrides', async () => {
    await queueEmail({
      to: 'b@x.com',
      subject: 's',
      html: 'h',
      category: 'marketing',
      priority: 'low',
      maxAttempts: 5,
    });

    const call = emailJobCreate.mock.calls[0][0].data;
    expect(call.category).toBe('marketing');
    expect(call.priority).toBe('low');
    expect(call.maxAttempts).toBe(5);
  });

  it('short-circuits and logs as suppressed when email is on the list', async () => {
    isEmailSuppressed.mockResolvedValue({
      suppressed: true,
      reason: 'hard_bounce',
    });

    const result = await queueEmail({
      to: 'bounced@example.com',
      subject: 's',
      html: 'h',
    });

    expect(result).toEqual({
      success: false,
      suppressed: true,
      error: 'Suppressed: hard_bounce',
    });
    // Must NOT enqueue a job
    expect(emailJobCreate).not.toHaveBeenCalled();
    // Must log as suppressed
    expect(emailMessageCreate).toHaveBeenCalledTimes(1);
    expect(emailMessageCreate.mock.calls[0][0].data.status).toBe('suppressed');
    expect(emailMessageCreate.mock.calls[0][0].data.to).toBe(
      'bounced@example.com',
    );
  });

  it('does not throw when suppressed-log DB write fails', async () => {
    isEmailSuppressed.mockResolvedValue({
      suppressed: true,
      reason: 'complaint',
    });
    emailMessageCreate.mockRejectedValue(new Error('db down'));

    const result = await queueEmail({
      to: 'c@x.com',
      subject: 's',
      html: 'h',
    });

    // The .catch(() => {}) in service.ts swallows logging errors — the
    // caller still gets a clean suppressed result.
    expect(result.suppressed).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// sendEmailDirect — happy paths
// ────────────────────────────────────────────────────────────────────────────

describe('sendEmailDirect', () => {
  it('sends via provider and logs success', async () => {
    const result = await sendEmailDirect({
      to: 'USER@example.com',
      subject: 'OTP',
      html: '<p>123456</p>',
      category: 'auth',
    });

    expect(result).toEqual({
      success: true,
      messageId: 'provider-xyz',
      providerId: 'provider-xyz',
    });
    expect(sendWithFailover).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        subject: 'OTP',
        html: '<p>123456</p>',
      }),
    );
    expect(emailMessageCreate).toHaveBeenCalledTimes(1);
    expect(emailMessageCreate.mock.calls[0][0].data.status).toBe('sent');
    expect(emailMessageCreate.mock.calls[0][0].data.providerId).toBe(
      'provider-xyz',
    );
  });

  it('bypasses suppression for auth category even when suppressed', async () => {
    isEmailSuppressed.mockResolvedValue({
      suppressed: true,
      reason: 'hard_bounce',
    });

    const result = await sendEmailDirect({
      to: 'bounced@example.com',
      subject: 'Reset password',
      html: '<p>token</p>',
      category: 'auth',
    });

    // Auth is delivered regardless of suppression status
    expect(result.success).toBe(true);
    expect(sendWithFailover).toHaveBeenCalled();
    // Suppression check should not be invoked at all for 'auth'
    expect(isEmailSuppressed).not.toHaveBeenCalled();
  });

  it('blocks non-auth sends when suppressed', async () => {
    isEmailSuppressed.mockResolvedValue({
      suppressed: true,
      reason: 'complaint',
    });

    const result = await sendEmailDirect({
      to: 'c@x.com',
      subject: 'Newsletter',
      html: '<p>marketing</p>',
      category: 'marketing',
    });

    expect(result).toEqual({
      success: false,
      suppressed: true,
      error: 'Suppressed: complaint',
    });
    expect(sendWithFailover).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// sendEmailDirect — template rendering + failure paths
// ────────────────────────────────────────────────────────────────────────────

describe('sendEmailDirect template rendering', () => {
  it('renders a DB template when templateSlug is provided and no html', async () => {
    renderDbTemplate.mockResolvedValue({
      subject: 'Hello Alice',
      html: '<p>rendered</p>',
    });

    const result = await sendEmailDirect({
      to: 'a@x.com',
      subject: 'fallback subject',
      templateSlug: 'welcome',
      metadata: { firstName: 'Alice', orderId: 42 },
      category: 'transactional',
    });

    expect(result.success).toBe(true);
    expect(renderDbTemplate).toHaveBeenCalledWith('welcome', {
      firstName: 'Alice',
      orderId: '42',
    });
    // Provider receives rendered HTML + rendered subject
    const providerCall = sendWithFailover.mock.calls[0][0];
    expect(providerCall.html).toBe('<p>rendered</p>');
    expect(providerCall.subject).toBe('Hello Alice');
  });

  it('uses fallback subject when template renderer returns null', async () => {
    renderDbTemplate.mockResolvedValue(null);

    await sendEmailDirect({
      to: 'a@x.com',
      subject: 'fallback subject',
      templateSlug: 'missing',
      category: 'transactional',
    });

    const providerCall = sendWithFailover.mock.calls[0][0];
    expect(providerCall.subject).toBe('fallback subject');
    // html was undefined — stays undefined
    expect(providerCall.html).toBeUndefined();
  });

  it('does not render template when html is already supplied', async () => {
    await sendEmailDirect({
      to: 'a@x.com',
      subject: 's',
      html: '<p>inline</p>',
      templateSlug: 'welcome',
      category: 'transactional',
    });

    expect(renderDbTemplate).not.toHaveBeenCalled();
  });
});

describe('sendEmailDirect failure path', () => {
  it('logs failure and returns error when provider throws', async () => {
    sendWithFailover.mockRejectedValue(new Error('provider 500'));

    const result = await sendEmailDirect({
      to: 'a@x.com',
      subject: 's',
      html: 'h',
      category: 'transactional',
    });

    expect(result).toEqual({ success: false, error: 'provider 500' });
    expect(emailMessageCreate).toHaveBeenCalledTimes(1);
    expect(emailMessageCreate.mock.calls[0][0].data.status).toBe('failed');
    expect(emailMessageCreate.mock.calls[0][0].data.errorMessage).toBe(
      'provider 500',
    );
  });
});
