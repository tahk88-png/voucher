/**
 * Human-readable labels for audit log entries (client-safe).
 * Actions are stored as "resource.verb" or "snake_case" strings.
 */

const ACTION_LABELS: Record<string, string> = {
  'voucher.created': 'Voucher created',
  'voucher.updated': 'Voucher updated',
  'voucher.published': 'Voucher published',
  'vouchers.generated': 'Vouchers generated',
  'campaign.created': 'Campaign created',
  'campaign.updated': 'Campaign updated',
  'member.invited': 'Team member invited',
  'member.removed': 'Team member removed',
  'member.role_changed': 'Team member role changed',
  'api_key.created': 'API key created',
  'api_key.revoked': 'API key revoked',
};

export function formatAuditAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  const words = action
    .replace(/[._]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim()
    .toLowerCase();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : action;
}

const RESOURCE_KEYS: Array<[string, string]> = [
  ['voucherId', 'Voucher'],
  ['campaignId', 'Campaign'],
  ['giftCardId', 'Gift card'],
  ['eventId', 'Event'],
  ['memberId', 'Team member'],
  ['apiKeyId', 'API key'],
  ['webhookId', 'Webhook'],
  ['merchantId', 'Merchant'],
  ['userId', 'User'],
];

/**
 * Resource for an entry: the explicit resourceType/resourceId columns, or
 * (for older entries that only logged a payload) the first known *Id key.
 */
export function describeAuditResource(entry: {
  resourceType?: string | null;
  resourceId?: string | null;
  payloadJson?: unknown;
}): { label: string; id: string | null; name: string | null } | null {
  let payload: Record<string, unknown> | null = null;
  if (entry.payloadJson && typeof entry.payloadJson === 'object') {
    payload = entry.payloadJson as Record<string, unknown>;
  } else if (typeof entry.payloadJson === 'string') {
    try {
      const parsed = JSON.parse(entry.payloadJson);
      if (parsed && typeof parsed === 'object') payload = parsed as Record<string, unknown>;
    } catch {
      payload = null;
    }
  }
  const name =
    payload && typeof payload.name === 'string'
      ? payload.name
      : payload && typeof payload.headline === 'string' && payload.headline
        ? payload.headline
        : null;

  if (entry.resourceType) {
    const t = entry.resourceType.replace(/[._]+/g, ' ');
    return { label: t.charAt(0).toUpperCase() + t.slice(1), id: entry.resourceId ?? null, name };
  }
  if (!payload) return null;
  for (const [key, label] of RESOURCE_KEYS) {
    const v = payload[key];
    if (typeof v === 'string' && v) return { label, id: v, name };
  }
  return null;
}
