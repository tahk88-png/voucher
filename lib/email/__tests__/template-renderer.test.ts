/**
 * Unit tests for lib/email/template-renderer.ts.
 *
 * Covers:
 * - variable interpolation in subject + section content/text
 * - inactive template returns null from renderDbTemplate
 * - previewTemplate bypasses the status check
 * - regex-escape safety: interpolation replaces all occurrences globally
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

const { emailTemplateFindUnique, buildEmailHtml } = vi.hoisted(() => ({
  emailTemplateFindUnique: vi.fn(),
  buildEmailHtml: vi.fn(() => '<html></html>'),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailTemplate: { findUnique: emailTemplateFindUnique },
  },
}));

vi.mock('@/lib/email-builder', () => ({
  buildEmailHtml,
}));

import { renderDbTemplate, previewTemplate } from '../template-renderer';

beforeEach(() => {
  vi.clearAllMocks();
  buildEmailHtml.mockReturnValue('<html></html>');
});

describe('renderDbTemplate', () => {
  it('returns null when template does not exist', async () => {
    emailTemplateFindUnique.mockResolvedValue(null);
    const out = await renderDbTemplate('missing', {});
    expect(out).toBeNull();
    expect(buildEmailHtml).not.toHaveBeenCalled();
  });

  it('returns null for non-active template', async () => {
    emailTemplateFindUnique.mockResolvedValue({
      subject: 'Hi {{name}}',
      status: 'draft',
      sectionsJson: [],
    });
    const out = await renderDbTemplate('drafty', { name: 'X' });
    expect(out).toBeNull();
  });

  it('interpolates subject variables globally', async () => {
    emailTemplateFindUnique.mockResolvedValue({
      subject: '{{name}} — welcome, {{name}}!',
      status: 'active',
      sectionsJson: [],
    });

    const out = await renderDbTemplate('welcome', { name: 'Alice' });
    expect(out?.subject).toBe('Alice — welcome, Alice!');
  });

  it('interpolates content and text fields inside sections', async () => {
    emailTemplateFindUnique.mockResolvedValue({
      subject: 's',
      status: 'active',
      sectionsJson: [
        { type: 'p', content: 'Hi {{name}}' },
        { type: 'btn', text: 'Go to {{link}}' },
        { type: 'img' }, // no content/text — untouched
      ],
    });

    await renderDbTemplate('x', { name: 'Bob', link: 'dashboard' });

    const firstCall = buildEmailHtml.mock.calls[0] as unknown as [
      Array<Record<string, unknown>>,
      ...unknown[],
    ];
    const passedSections = firstCall[0];
    expect(passedSections[0].content).toBe('Hi Bob');
    expect(passedSections[1].text).toBe('Go to dashboard');
    expect(passedSections[2]).toEqual({ type: 'img' });
  });

  it('leaves unknown placeholders in place', async () => {
    emailTemplateFindUnique.mockResolvedValue({
      subject: '{{known}} / {{unknown}}',
      status: 'active',
      sectionsJson: [],
    });

    const out = await renderDbTemplate('x', { known: 'OK' });
    expect(out?.subject).toBe('OK / {{unknown}}');
  });
});

describe('previewTemplate', () => {
  it('renders drafts (does not filter by status)', async () => {
    emailTemplateFindUnique.mockResolvedValue({
      subject: 'Hi {{name}}',
      status: 'draft',
      sectionsJson: [{ type: 'p', content: 'Welcome {{name}}' }],
    });

    const out = await previewTemplate('tpl-id', { name: 'Preview' });

    expect(out).not.toBeNull();
    expect(out?.subject).toBe('Hi Preview');
    const firstCall = buildEmailHtml.mock.calls[0] as unknown as [
      Array<Record<string, unknown>>,
      ...unknown[],
    ];
    const passedSections = firstCall[0];
    expect(passedSections[0].content).toBe('Welcome Preview');
  });

  it('returns null when template does not exist', async () => {
    emailTemplateFindUnique.mockResolvedValue(null);
    const out = await previewTemplate('missing', {});
    expect(out).toBeNull();
  });
});
