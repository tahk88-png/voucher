/**
 * Resend webhook ingestion.
 *
 * Processes Resend delivery event webhooks, creates EmailEvent rows,
 * updates EmailMessage timestamps, and triggers suppression on hard
 * bounces and complaints.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { addSuppression } from './suppression';
import type { EmailEventType } from '@prisma/client';

// ---------------------------------------------------------------------------
// Resend webhook type mapping
// ---------------------------------------------------------------------------

const RESEND_EVENT_MAP: Record<string, EmailEventType> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'deferred',
  'email.complained': 'complained',
  'email.bounced': 'bounced',
  'email.opened': 'opened',
  'email.clicked': 'clicked',
};

/** Timestamp fields on EmailMessage that correspond to event types. */
const MESSAGE_TIMESTAMP_FIELDS: Partial<Record<EmailEventType, string>> = {
  delivered: 'deliveredAt',
  opened: 'openedAt',
  clicked: 'clickedAt',
  bounced: 'bouncedAt',
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Process a raw Resend webhook payload.
 *
 * - Maps the Resend event type to our `EmailEventType` enum.
 * - Looks up the `EmailMessage` by `providerId`.
 * - Creates an `EmailEvent` row.
 * - Updates the relevant timestamp on `EmailMessage`.
 * - On hard bounce: adds a suppression entry (`hard_bounce`).
 * - On complaint: adds a suppression entry (`complaint`).
 * - If no matching `EmailMessage` is found, logs a warning and skips.
 */
export async function processResendWebhook(payload: unknown): Promise<void> {
  const event = payload as {
    type?: string;
    created_at?: string;
    data?: {
      email_id?: string;
      to?: string[];
      from?: string;
      subject?: string;
      [key: string]: unknown;
    };
  };

  const resendType = event.type;
  if (!resendType) {
    logger.warn('Resend webhook: missing event type', { payload });
    return;
  }

  const eventType = RESEND_EVENT_MAP[resendType];
  if (!eventType) {
    logger.warn('Resend webhook: unknown event type', { type: resendType });
    return;
  }

  const emailId = event.data?.email_id;
  if (!emailId) {
    logger.warn('Resend webhook: missing email_id', { type: resendType });
    return;
  }

  const occurredAt = event.created_at
    ? new Date(event.created_at)
    : new Date();

  // Look up the EmailMessage by provider ID
  const message = await prisma.emailMessage.findFirst({
    where: { providerId: emailId },
    select: { id: true, to: true },
  });

  if (!message) {
    logger.warn('Resend webhook: no matching EmailMessage for providerId', {
      providerId: emailId,
      type: resendType,
    });
    return;
  }

  // Create the event row
  await prisma.emailEvent.create({
    data: {
      messageId: message.id,
      type: eventType,
      provider: 'resend',
      payload: JSON.parse(JSON.stringify(event.data ?? {})),
      occurredAt,
    },
  });

  // Update timestamp on the message
  const tsField = MESSAGE_TIMESTAMP_FIELDS[eventType];
  if (tsField) {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { [tsField]: occurredAt },
    });
  }

  // Update message status for terminal events
  if (eventType === 'delivered') {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: 'delivered' },
    });
  } else if (eventType === 'bounced') {
    await prisma.emailMessage.update({
      where: { id: message.id },
      data: { status: 'bounced' },
    });
  }

  // Suppression handling
  const recipientEmail = message.to;

  if (eventType === 'bounced') {
    // Resend bounces: check for hard vs soft in the payload
    const bounceType = (event.data as Record<string, unknown>)?.bounce_type;
    const isHardBounce = bounceType !== 'soft' && bounceType !== 'transient';

    if (isHardBounce) {
      await addSuppression({
        email: recipientEmail,
        reason: 'hard_bounce',
        source: 'webhook',
        notes: `Resend hard bounce for email_id=${emailId}`,
      });
    } else {
      // Soft bounce — add with 7-day expiration
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await addSuppression({
        email: recipientEmail,
        reason: 'soft_bounce',
        source: 'webhook',
        notes: `Resend soft bounce for email_id=${emailId}`,
        expiresAt,
      });
    }
  }

  if (eventType === 'complained') {
    await addSuppression({
      email: recipientEmail,
      reason: 'complaint',
      source: 'webhook',
      notes: `Resend complaint for email_id=${emailId}`,
    });
  }

  logger.info('Resend webhook processed', {
    type: resendType,
    eventType,
    emailId,
    messageId: message.id,
  });
}
