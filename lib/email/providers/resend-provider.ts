/**
 * Resend email provider adapter.
 * Wraps the existing lib/resend.ts singleton.
 */

import type { EmailProvider, EmailSendParams, EmailSendResult, EmailProviderHealth } from './types';
import { isResendConfigured } from '@/lib/resend';

export class ResendProvider implements EmailProvider {
  readonly type = 'resend';

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    if (!isResendConfigured()) {
      throw new Error('Resend API key not configured');
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const sendParams: Record<string, unknown> = {
      from: params.from || process.env.RESEND_FROM_EMAIL || 'noreply@vouchr.app',
      to: params.to,
      subject: params.subject,
    };
    if (params.html) sendParams.html = params.html;
    if (params.text) sendParams.text = params.text;
    if (params.replyTo) sendParams.reply_to = params.replyTo;
    if (params.tags) sendParams.tags = params.tags;
    if (params.headers) sendParams.headers = params.headers;

    const result = await resend.emails.send(sendParams as unknown as Parameters<typeof resend.emails.send>[0]);

    if (result.error) {
      throw new Error(result.error.message || 'Resend send failed');
    }

    return {
      providerId: result.data?.id || 'unknown',
      providerType: 'resend',
    };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!process.env.RESEND_API_KEY) {
      return { valid: false, error: 'RESEND_API_KEY not set' };
    }
    return { valid: true };
  }

  async testConnection(): Promise<EmailProviderHealth> {
    const start = Date.now();
    try {
      if (!isResendConfigured()) {
        return { ok: false, latencyMs: 0, error: 'Resend not configured' };
      }

      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.domains.list();
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'Connection failed',
      };
    }
  }
}
