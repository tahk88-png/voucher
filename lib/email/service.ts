/**
 * Core email service — the single entry point for all email sends.
 *
 * Two modes:
 * - queueEmail()      → inserts EmailJob for async processing (normal/low priority)
 * - sendEmailDirect()  → sends immediately via provider (urgent auth emails)
 *
 * Both check suppression list and log to EmailMessage.
 */

import { prisma } from '@/lib/prisma';
import { isEmailSuppressed } from './suppression';
import { sendWithFailover } from './providers/factory';
import { renderDbTemplate } from './template-renderer';
import type { QueueEmailParams, DirectSendParams, EmailServiceResult } from './types';

/**
 * Queue an email for async delivery via cron worker.
 * Used for: transactional receipts, marketing campaigns, system notifications.
 */
export async function queueEmail(params: QueueEmailParams): Promise<EmailServiceResult> {
  const to = params.to.toLowerCase().trim();

  // Check suppression before queueing
  const suppression = await isEmailSuppressed(to);
  if (suppression.suppressed) {
    // Log as suppressed
    await prisma.emailMessage.create({
      data: {
        from: params.from || process.env.RESEND_FROM_EMAIL || 'noreply@vouchr.app',
        to,
        subject: params.subject,
        templateSlug: params.templateSlug,
        category: params.category || 'transactional',
        tags: params.tags,
        metadata: (params.metadata ?? undefined) as object | undefined,
        status: 'suppressed',
        errorMessage: `Suppressed: ${suppression.reason}`,
      },
    }).catch(() => {}); // Never fail on logging

    return { success: false, suppressed: true, error: `Suppressed: ${suppression.reason}` };
  }

  // Create the job
  const job = await prisma.emailJob.create({
    data: {
      to,
      from: params.from,
      subject: params.subject,
      html: params.html,
      text: params.text,
      templateSlug: params.templateSlug,
      templateData: (params.templateData ?? undefined) as object | undefined,
      category: params.category || 'transactional',
      priority: params.priority || 'normal',
      tags: params.tags,
      metadata: (params.metadata ?? undefined) as object | undefined,
      provider: params.provider,
      maxAttempts: params.maxAttempts || 3,
      scheduledAt: params.scheduledAt || new Date(),
    },
  });

  return { success: true, jobId: job.id };
}

/**
 * Send an email immediately (bypasses queue).
 * Used for: OTP, magic links, password reset, email verification.
 */
export async function sendEmailDirect(params: DirectSendParams): Promise<EmailServiceResult> {
  const to = params.to.toLowerCase().trim();

  // Check suppression (except for auth category — always deliver)
  if (params.category !== 'auth') {
    const suppression = await isEmailSuppressed(to);
    if (suppression.suppressed) {
      await prisma.emailMessage.create({
        data: {
          from: params.from || process.env.RESEND_FROM_EMAIL || 'noreply@vouchr.app',
          to,
          subject: params.subject,
          templateSlug: params.templateSlug,
          category: params.category || 'transactional',
          tags: params.tags,
          metadata: (params.metadata ?? undefined) as object | undefined,
          status: 'suppressed',
          errorMessage: `Suppressed: ${suppression.reason}`,
        },
      }).catch(() => {});

      return { success: false, suppressed: true, error: `Suppressed: ${suppression.reason}` };
    }
  }

  // Resolve HTML from template if needed
  let html = params.html;
  let subject = params.subject;
  if (params.templateSlug && !html) {
    // Convert metadata to string values for template interpolation
    const templateVars: Record<string, string> = {};
    if (params.metadata) {
      for (const [key, value] of Object.entries(params.metadata)) {
        templateVars[key] = String(value ?? '');
      }
    }
    const rendered = await renderDbTemplate(params.templateSlug, templateVars);
    if (rendered) {
      html = rendered.html;
      subject = rendered.subject;
    }
  }

  const fromAddr = params.from || process.env.RESEND_FROM_EMAIL || 'noreply@vouchr.app';

  try {
    const result = await sendWithFailover({
      to,
      from: fromAddr,
      subject,
      html: html || undefined,
      text: params.text || undefined,
      replyTo: params.replyTo,
    });

    // Log success
    await prisma.emailMessage.create({
      data: {
        providerId: result.providerId,
        providerType: result.providerType,
        from: fromAddr,
        to,
        subject,
        templateSlug: params.templateSlug,
        category: params.category || 'transactional',
        tags: params.tags,
        metadata: (params.metadata ?? undefined) as object | undefined,
        status: 'sent',
        sentAt: new Date(),
      },
    }).catch(() => {});

    return {
      success: true,
      messageId: result.providerId,
      providerId: result.providerId,
    };
  } catch (error) {
    // Log failure
    await prisma.emailMessage.create({
      data: {
        from: fromAddr,
        to,
        subject,
        templateSlug: params.templateSlug,
        category: params.category || 'transactional',
        tags: params.tags,
        metadata: (params.metadata ?? undefined) as object | undefined,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    }).catch(() => {});

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Send failed',
    };
  }
}
