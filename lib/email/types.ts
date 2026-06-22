/**
 * Shared types for the email sender system.
 */

export type EmailCategory = 'transactional' | 'marketing' | 'auth' | 'system';

export type QueueEmailParams = {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  templateSlug?: string;
  templateData?: Record<string, unknown>;
  category?: EmailCategory;
  priority?: 'urgent' | 'normal' | 'low';
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
  provider?: 'resend' | 'smtp';
  scheduledAt?: Date;
  maxAttempts?: number;
};

export type DirectSendParams = {
  to: string;
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  category?: EmailCategory;
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
  templateSlug?: string;
};

export type EmailServiceResult = {
  success: boolean;
  messageId?: string;
  jobId?: string;
  providerId?: string;
  error?: string;
  suppressed?: boolean;
};
