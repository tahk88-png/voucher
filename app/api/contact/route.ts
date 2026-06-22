import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkIPRateLimit } from '@/lib/fraud';
import { getClientIp } from '@/lib/request';
import { logger } from '@/lib/logger';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  subject: z.string().min(1).max(300),
  message: z.string().min(1).max(5000),
});

export async function POST(request: NextRequest) {
  // 5 submissions per hour per IP — blocks spam without requiring auth.
  const ip = getClientIp(request);
  const rateLimit = await checkIPRateLimit(ip, 60, 5);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    const { name, email, subject, message } = parsed.data;

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      await resend.emails.send({
        from: process.env.EMAIL_FROM || 'noreply@voucherplatform.com',
        to: process.env.CONTACT_EMAIL || 'support@voucherplatform.com',
        reply_to: email,
        subject: `[Contact Form] ${escapeHtml(subject)}`,
        html: `
          <h2>Contact Form Submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <hr />
          <p>${escapeHtml(message).replace(/\n/g, '<br />')}</p>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Contact form error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
