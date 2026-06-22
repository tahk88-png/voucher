/**
 * Email system constants.
 */

export const DEFAULT_SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@vouchr.app';
export const DEFAULT_SENDER_NAME = 'Vouchr';

export const EMAIL_CATEGORIES = ['transactional', 'marketing', 'auth', 'system'] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
