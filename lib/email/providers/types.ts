/**
 * Email provider abstraction layer.
 *
 * Supports switching providers, fallback, and per-environment config.
 * Current: Resend (primary) + SMTP (fallback).
 * Future: SendGrid, Postmark, AWS SES via same interface.
 */

export interface EmailSendParams {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  providerId: string;
  providerType: string;
}

export interface EmailProviderHealth {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface EmailProvider {
  readonly type: string;

  /** Send a single email. */
  send(params: EmailSendParams): Promise<EmailSendResult>;

  /** Validate that the provider config is correct. */
  validateConfig(): Promise<{ valid: boolean; error?: string }>;

  /** Test the provider connection (health check). */
  testConnection(): Promise<EmailProviderHealth>;
}
