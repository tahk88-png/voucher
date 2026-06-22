/**
 * SMTP email provider adapter.
 * Uses nodemailer (already in package.json).
 * Configured via SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS env vars.
 */

import type { EmailProvider, EmailSendParams, EmailSendResult, EmailProviderHealth } from './types';

export class SmtpProvider implements EmailProvider {
  readonly type = 'smtp';

  private async getTransporter() {
    const nodemailer = await import('nodemailer');
    return nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(params: EmailSendParams): Promise<EmailSendResult> {
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from: params.from || process.env.SMTP_FROM || 'noreply@vouchr.app',
      to: params.to,
      subject: params.subject,
      html: params.html || undefined,
      text: params.text || undefined,
      replyTo: params.replyTo || undefined,
      headers: params.headers || undefined,
    });

    return {
      providerId: info.messageId || 'smtp-unknown',
      providerType: 'smtp',
    };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!process.env.SMTP_HOST) {
      return { valid: false, error: 'SMTP_HOST not set' };
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return { valid: false, error: 'SMTP credentials not set' };
    }
    return { valid: true };
  }

  async testConnection(): Promise<EmailProviderHealth> {
    const start = Date.now();
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return { ok: true, latencyMs: Date.now() - start };
    } catch (err) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : 'SMTP connection failed',
      };
    }
  }
}
