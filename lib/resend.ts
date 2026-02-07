import { Resend } from 'resend';

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

  return { id: result.data?.id || '' };
}

/**
 * Check if Resend is configured
 */
export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
