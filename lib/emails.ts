import { sendEmail, isResendConfigured } from './resend';
import React from 'react';
import {
  VoucherPurchaseReceipt,
  voucherPurchaseReceiptText,
} from '@/templates/emails/voucher-purchase-receipt';
import {
  VoucherDelivery,
  voucherDeliveryText,
} from '@/templates/emails/voucher-delivery';
import {
  CreditEarned,
  creditEarnedText,
} from '@/templates/emails/credit-earned';
import {
  CreditUnlocked,
  creditUnlockedText,
} from '@/templates/emails/credit-unlocked';
import {
  CreditExpiryWarning,
  creditExpiryWarningText,
} from '@/templates/emails/credit-expiry-warning';
import TicketConfirmationEmail from '@/templates/emails/ticket-confirmation';
import {
  MerchantAnnouncementEmail,
  merchantAnnouncementText,
} from '@/templates/emails/merchant-announcement';
import {
  WeeklyCampaignDigestEmail,
  weeklyCampaignDigestText,
} from '@/templates/emails/weekly-campaign-digest';
import {
  RedemptionConfirmation,
  redemptionConfirmationText,
} from '@/templates/emails/redemption-confirmation';
import {
  VoucherExpiryReminder,
  voucherExpiryReminderText,
} from '@/templates/emails/voucher-expiry-reminder';
import {
  WelcomeEmail,
  welcomeEmailText,
} from '@/templates/emails/welcome';

// Dynamic import for react-dom/server to avoid client-side bundling
let renderToString: typeof import('react-dom/server').renderToString;
if (typeof window === 'undefined') {
  renderToString = require('react-dom/server').renderToString;
}

/**
 * Send voucher purchase receipt email
 */
export async function sendVoucherPurchaseReceipt(params: {
  to: string;
  merchantName: string;
  voucherCode: string;
  amount: number;
  currency: string;
  voucherUrl: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping purchase receipt email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(
    React.createElement(VoucherPurchaseReceipt, params)
  );
  const text = voucherPurchaseReceiptText(params);

  await sendEmail({
    to: params.to,
    subject: `Receipt: Your ${params.merchantName} voucher`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'purchase_receipt' }],
  });
}

/**
 * Send voucher delivery email
 */
export async function sendVoucherDelivery(params: {
  to: string;
  merchantName: string;
  voucherCode: string;
  value: string;
  validUntil: string;
  voucherUrl: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping voucher delivery email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(VoucherDelivery, params));
  const text = voucherDeliveryText(params);

  await sendEmail({
    to: params.to,
    subject: `Your ${params.merchantName} voucher is ready!`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'voucher_delivery' }],
  });
}

/**
 * Send credit earned email
 */
export async function sendCreditEarned(params: {
  to: string;
  merchantName: string;
  creditAmount: string;
  currency: string;
  totalBalance: string;
  walletUrl: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping credit earned email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(CreditEarned, params));
  const text = creditEarnedText(params);

  await sendEmail({
    to: params.to,
    subject: `You earned ${params.currency} ${params.creditAmount} credit from ${params.merchantName}`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'credit_earned' }],
  });
}

/**
 * Send credit unlocked email
 */
export async function sendCreditUnlocked(params: {
  to: string;
  merchantName: string;
  creditAmount: string;
  currency: string;
  totalBalance: string;
  walletUrl: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping credit unlocked email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(CreditUnlocked, params));
  const text = creditUnlockedText(params);

  await sendEmail({
    to: params.to,
    subject: `Your ${params.merchantName} credit is now available!`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'credit_unlocked' }],
  });
}

/**
 * Send credit expiry warning email
 */
export async function sendCreditExpiryWarning(params: {
  to: string;
  merchantName: string;
  creditAmount: string;
  currency: string;
  daysUntilExpiry: number;
  walletUrl: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping credit expiry warning email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(CreditExpiryWarning, params));
  const text = creditExpiryWarningText(params);

  await sendEmail({
    to: params.to,
    subject: `Credit expiry warning: ${params.merchantName} credit expires in ${params.daysUntilExpiry} ${params.daysUntilExpiry === 1 ? 'day' : 'days'}`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'credit_expiry_warning' }],
  });
}

/**
 * Send ticket confirmation email
 */
export async function sendTicketConfirmation(params: {
  to: string;
  eventName: string;
  ticketNumber: string;
  eventDate: string;
  location?: string;
  attendeeName?: string;
  ticketUrl: string;
  merchantName: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping ticket confirmation email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(TicketConfirmationEmail, params));
  const text = `
Your Ticket Confirmation

Thank you for your purchase! Your ticket for ${params.eventName} is confirmed.

Ticket Number: ${params.ticketNumber}
Event: ${params.eventName}
Date & Time: ${new Date(params.eventDate).toLocaleString()}
${params.location ? `Location: ${params.location}` : ''}
${params.attendeeName ? `Attendee: ${params.attendeeName}` : ''}

View your ticket: ${params.ticketUrl}

This is your ticket confirmation. Please bring this email or show your ticket QR code at the event entrance.

Organized by ${params.merchantName}
  `.trim();

  await sendEmail({
    to: params.to,
    subject: `Your ticket for ${params.eventName}`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'ticket_confirmation' }],
  });
}

/**
 * Send member invite email
 */
export async function sendMemberInviteEmail(params: {
  to: string;
  merchantName: string;
  role: 'merchant_admin' | 'merchant_staff';
  inviterName: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping member invite email');
    return;
  }

  const roleLabel = params.role === 'merchant_admin' ? 'Admin' : 'Staff';
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/merchant/${params.merchantName.toLowerCase().replace(/\s+/g, '-')}/dashboard`;

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #18181b;">You've been invited to ${params.merchantName}</h1>
        <p>Hi there,</p>
        <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.merchantName}</strong> as a <strong>${roleLabel}</strong>.</p>
        <p>You can now access the merchant dashboard and manage vouchers, campaigns, and redemptions.</p>
        <p style="margin: 30px 0;">
          <a href="${dashboardUrl}" style="background-color: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          If you have any questions, please contact ${params.inviterName}.
        </p>
      </body>
    </html>
  `;

  const text = `
You've been invited to ${params.merchantName}

Hi there,

${params.inviterName} has invited you to join ${params.merchantName} as a ${roleLabel}.

You can now access the merchant dashboard and manage vouchers, campaigns, and redemptions.

Go to Dashboard: ${dashboardUrl}

If you have any questions, please contact ${params.inviterName}.
  `.trim();

  await sendEmail({
    to: params.to,
    subject: `You've been invited to ${params.merchantName}`,
    html,
    text,
    tags: [{ name: 'type', value: 'member_invite' }],
  });
}

/**
 * Send merchant announcement email (campaign/voucher)
 */
export async function sendMerchantAnnouncement(params: {
  to: string;
  merchantName: string;
  title: string;
  body: string;
  ctaUrl: string;
  type: 'voucher_published' | 'campaign_started';
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping merchant announcement email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(MerchantAnnouncementEmail, params));
  const text = merchantAnnouncementText(params);

  await sendEmail({
    to: params.to,
    subject: params.title,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'merchant_announcement' }],
  });
}

/**
 * Send redemption confirmation email to user
 */
export async function sendRedemptionConfirmation(params: {
  to: string;
  merchantName: string;
  voucherName: string;
  redeemedAt: string;
  voucherUrl: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping redemption confirmation email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(RedemptionConfirmation, params));
  const text = redemptionConfirmationText(params);

  await sendEmail({
    to: params.to,
    subject: `Voucher redeemed at ${params.merchantName}`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'redemption_confirmation' }],
  });
}

/**
 * Send weekly campaign digest email
 */
export async function sendWeeklyCampaignDigest(params: {
  to: string;
  title: string;
  intro: string;
  items: Array<{
    name: string;
    merchantName: string;
    url: string;
    dateRange: string;
    promoted?: boolean;
  }>;
  footer: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping weekly campaign digest');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(WeeklyCampaignDigestEmail, params));
  const text = weeklyCampaignDigestText(params);

  await sendEmail({
    to: params.to,
    subject: params.title,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'weekly_campaign_digest' }],
  });
}

/**
 * Send voucher expiry reminder email
 */
export async function sendVoucherExpiryReminder(params: {
  to: string;
  merchantName: string;
  voucherName: string;
  daysUntilExpiry: number;
  voucherUrl: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping voucher expiry reminder');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }
  const html = renderToString(React.createElement(VoucherExpiryReminder, params));
  const text = voucherExpiryReminderText(params);

  const urgencyText = params.daysUntilExpiry === 1
    ? 'expires tomorrow'
    : `expires in ${params.daysUntilExpiry} days`;

  await sendEmail({
    to: params.to,
    subject: `Your ${params.merchantName} voucher ${urgencyText}`,
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'voucher_expiry_reminder' }],
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<void> {
  if (!isResendConfigured()) {
    console.warn('[Email] Resend not configured, skipping welcome email');
    return;
  }

  if (!renderToString) {
    renderToString = require('react-dom/server').renderToString;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const loginUrl = `${baseUrl}/login`;

  const html = renderToString(React.createElement(WelcomeEmail, { name: params.name, loginUrl }));
  const text = welcomeEmailText({ name: params.name, loginUrl });

  await sendEmail({
    to: params.to,
    subject: 'Welcome to GiftHub! 🎁',
    html: `<!DOCTYPE html><html><body>${html}</body></html>`,
    text,
    tags: [{ name: 'type', value: 'welcome' }],
  });
}
