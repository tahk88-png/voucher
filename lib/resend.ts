import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set. Add it to your .env file.');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

// Lazy initialization - only creates client when first used
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = getResendClient();
  }
  return resendInstance;
}

export const resend = new Proxy({} as Resend, {
  get(_, prop) {
    const instance = getResend();
    const value = instance[prop as keyof Resend];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/**
 * Send transactional email via Resend
 */
export async function sendEmail(params: {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}): Promise<{ id: string }> {
  if (process.env.NODE_ENV === 'test') {
    return { id: 'test-email' };
  }

  const from = params.from || process.env.RESEND_FROM_EMAIL || 'noreply@vouchr.app';
  
  const result = await resend.emails.send({
    from,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html,
    text: params.text || '',
    reply_to: params.replyTo,
    tags: params.tags,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }

  const messageId = result.data?.id || '';
  const recipientStr = Array.isArray(params.to) ? params.to[0] : params.to;

  // Synchronous logging — ensures webhook can find the message record
  try {
    await prisma.emailMessage.create({
      data: {
        providerId: messageId,
        providerType: 'resend',
        from,
        to: recipientStr,
        subject: params.subject,
        category: 'transactional',
        tags: params.tags ? { tags: params.tags } : undefined,
        status: 'sent',
        sentAt: new Date(),
      },
    });
  } catch {
    // Log failure but don't block the send response
    logger.error('[resend] Failed to log EmailMessage', { messageId });
  }

  return { id: messageId };
}

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
