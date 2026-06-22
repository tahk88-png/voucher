import { prisma } from './prisma';

/**
 * Per-member merchant notification category catalog.
 *
 * Each category represents one trigger stream the merchant team might
 * want email for. Defaults are opinionated: critical operational
 * streams are on by default, marketing-style digests are off so we
 * don't surprise new merchants with noise.
 *
 * When wiring a new merchant-facing notification, call
 * `shouldNotifyMember(merchantId, userId, categoryKey)` at send time
 * rather than checking the field directly — it handles the "no row"
 * and "missing key" cases consistently.
 */
export interface MerchantNotificationCategory {
  key: string;
  label: string;
  description: string;
  /** Default for new members when they haven't explicitly toggled. */
  defaultEnabled: boolean;
  /** If true, a user can never opt out (e.g. legal/security). */
  required?: boolean;
}

export const MERCHANT_NOTIFICATION_CATEGORIES: MerchantNotificationCategory[] = [
  {
    key: 'orders',
    label: 'New orders & redemptions',
    description: 'Email when a voucher is purchased, redeemed, or gifted.',
    defaultEnabled: true,
  },
  {
    key: 'payouts',
    label: 'Payouts',
    description: 'Stripe payout arrivals, failures, and holds.',
    defaultEnabled: true,
  },
  {
    key: 'fraud_alerts',
    label: 'Fraud & security alerts',
    description:
      'Unusual redemption patterns, chargebacks, team login anomalies. Cannot be disabled.',
    defaultEnabled: true,
    required: true,
  },
  {
    key: 'campaign_updates',
    label: 'Campaign lifecycle',
    description: 'Campaign published, expiring in 7 days, ended.',
    defaultEnabled: true,
  },
  {
    key: 'weekly_digest',
    label: 'Weekly performance digest',
    description: 'Monday recap of last week\u2019s revenue, redemptions, and top vouchers.',
    defaultEnabled: false,
  },
  {
    key: 'product_updates',
    label: 'Product news from Vouchr',
    description: 'New features, roadmap, occasional tips. No more than 1/month.',
    defaultEnabled: false,
  },
];

export type NotificationPrefs = Record<string, boolean>;

/**
 * Normalize whatever JSON is stored on MerchantMember.notificationPrefs
 * into a plain `{ key: boolean }` map without trusting user input.
 */
export function parsePrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: NotificationPrefs = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value === 'boolean') out[key] = value;
  }
  return out;
}

/**
 * Merge stored prefs with defaults so the UI always has a complete
 * picture, and required categories are forced on.
 */
export function resolvePrefs(raw: unknown): NotificationPrefs {
  const stored = parsePrefs(raw);
  const resolved: NotificationPrefs = {};
  for (const cat of MERCHANT_NOTIFICATION_CATEGORIES) {
    if (cat.required) {
      resolved[cat.key] = true;
      continue;
    }
    resolved[cat.key] =
      typeof stored[cat.key] === 'boolean' ? stored[cat.key] : cat.defaultEnabled;
  }
  return resolved;
}

/**
 * Point-of-send check: should this merchant team member get an email
 * for category `categoryKey`? Returns false if the user isn't a member
 * of the merchant (defensive — caller already has context but we
 * don't want a missing row to accidentally broadcast).
 */
export async function shouldNotifyMember(
  merchantId: string,
  userId: string,
  categoryKey: string,
): Promise<boolean> {
  const cat = MERCHANT_NOTIFICATION_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return false;
  if (cat.required) return true;

  const member = await prisma.merchantMember.findUnique({
    where: { merchantId_userId: { merchantId, userId } },
    select: { notificationPrefs: true },
  });
  if (!member) return false;

  const stored = parsePrefs(member.notificationPrefs);
  return typeof stored[categoryKey] === 'boolean' ? stored[categoryKey] : cat.defaultEnabled;
}

/**
 * Fan-out helper: which members of this merchant should be emailed
 * for the given category? Filters out opted-out members and anyone
 * without an email address.
 */
export async function getMembersToNotify(
  merchantId: string,
  categoryKey: string,
): Promise<Array<{ userId: string; email: string; name: string | null }>> {
  const cat = MERCHANT_NOTIFICATION_CATEGORIES.find((c) => c.key === categoryKey);
  if (!cat) return [];

  const members = await prisma.merchantMember.findMany({
    where: { merchantId },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return members
    .filter((m) => {
      if (cat.required) return true;
      const stored = parsePrefs(m.notificationPrefs);
      const enabled =
        typeof stored[categoryKey] === 'boolean' ? stored[categoryKey] : cat.defaultEnabled;
      return enabled;
    })
    .filter((m): m is typeof m & { user: { email: string } } => !!m.user.email)
    .map((m) => ({ userId: m.user.id, email: m.user.email, name: m.user.name }));
}
