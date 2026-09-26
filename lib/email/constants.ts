/**
 * Email system constants.
 */

// The default sender address is configuration, not a constant — see
// getSenderEmail() in lib/app-url.ts.
export const DEFAULT_SENDER_NAME = 'Vouchr';

export const EMAIL_CATEGORIES = ['transactional', 'marketing', 'auth', 'system'] as const;
export type EmailCategory = (typeof EMAIL_CATEGORIES)[number];
